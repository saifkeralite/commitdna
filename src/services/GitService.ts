import * as vscode from "vscode";
import { GitExtension, GitAPI, Repository, GitConfigKey } from "../types/git";
import { CommitReviewPanel } from "../ui/CommitReviewPanel";
import { GitConfig } from "../utils/gitConfig";

export class GitService implements vscode.Disposable {
    private readonly disposables: vscode.Disposable[] = [];
    private readonly previousCommits = new Map<string, string | undefined>();
    private readonly previousIndexChanges = new Map<string, string[]>();
    private readonly monitoredRepositories = new Set<string>();

    constructor(private readonly context: vscode.ExtensionContext) {}

    private async getGitConfig(
        repository: Repository,
        key: GitConfigKey
    ): Promise<string | undefined> {
        try {
            const { execFile } = await import("child_process");
            const { promisify } = await import("util");

            const exec = promisify(execFile);

            const { stdout } = await exec("git", ["config", "--get", key], {
                cwd: repository.rootUri.fsPath,
            });

            return stdout.trim();
        } catch (error) {
            console.error(`[commitDNA] Unable to read ${key}`, error);

            return undefined;
        }
    }

    private async getGitUser(repository: Repository): Promise<{
        name: string;
        email: string;
    }> {
        const name = await this.getGitConfig(repository, "user.name");

        const email = await this.getGitConfig(repository, "user.email");

        return {
            name: name ?? "Unknown",
            email: email ?? "Unknown",
        };
    }

    /**
     * Initializes commitDNA.
     */
    public async initialize(): Promise<void> {
        const extension =
            vscode.extensions.getExtension<GitExtension>("vscode.git");

        if (!extension) {
            vscode.window.showWarningMessage(
                "commitDNA: Built-in Git extension not found."
            );
            return;
        }

        if (!extension.isActive) {
            await extension.activate();
        }

        const git: GitAPI = extension.exports.getAPI(1);

        if (!git.repositories.length) {
            vscode.window.showInformationMessage(
                "commitDNA: No Git repositories detected."
            );
            return;
        }

        for (const repository of git.repositories) {
            this.monitorRepository(repository);
        }

        /**
         * Monitor repositories added after startup.
         */
        if (git.onDidOpenRepository) {
            this.disposables.push(
                git.onDidOpenRepository((repository: Repository) => {
                    this.monitorRepository(repository);
                })
            );
        }

        /**
         * Cleanup removed repositories.
         */
        if (git.onDidCloseRepository) {
            this.disposables.push(
                git.onDidCloseRepository((repository: Repository) => {
                    const repositoryPath = repository.rootUri.fsPath;

                    this.previousCommits.delete(repositoryPath);

                    this.monitoredRepositories.delete(repositoryPath);
                    this.previousIndexChanges.delete(repositoryPath);
                })
            );
        }
    }

    /**
     * Monitor a repository.
     */
    private monitorRepository(repository: Repository): void {
        const repositoryPath = repository.rootUri.fsPath;

        if (this.monitoredRepositories.has(repositoryPath)) {
            return;
        }

        this.monitoredRepositories.add(repositoryPath);

        this.previousCommits.set(repositoryPath, repository.state.HEAD?.commit);
        this.previousIndexChanges.set(
            repositoryPath,
            repository.state.indexChanges.map((change) => change.uri.toString())
        );

        const disposable = repository.state.onDidChange(async () => {
            try {
                await this.handleRepositoryChange(repository);
            } catch (error) {
                console.error("[commitDNA]", error);
            }
        });

        this.disposables.push(disposable);
    }

    /**
     * Handles all repository changes.
     */
    private async handleRepositoryChange(
        repository: Repository
    ): Promise<void> {
        const repositoryPath = repository.rootUri.fsPath;

        const previousCommit = this.previousCommits.get(repositoryPath);

        const currentCommit = repository.state.HEAD?.commit;

        // ======================================================
        // NEW: Detect newly staged files
        // ======================================================

        const previousIndex =
            this.previousIndexChanges.get(repositoryPath) ?? [];

        const currentIndex = repository.state.indexChanges.map((change) =>
            change.uri.toString()
        );

        const newlyStaged = currentIndex.filter(
            (file) => !previousIndex.includes(file)
        );

        // NEW: Save current staged files for the next comparison
        this.previousIndexChanges.set(repositoryPath, currentIndex);

        // NEW: Show popup only when new files are staged
        if (newlyStaged.length > 0) {
            const gitUser = await this.getGitUser(repository);

            const action = await vscode.window.showInformationMessage(
                `commitDNA • ${newlyStaged.length} file(s) staged by ${gitUser.name}`,
                "Review",
                "Dismiss"
            );

            if (action === "Review") {
                CommitReviewPanel.show(
                    this.context.extensionUri,
                    {
                        Author: gitUser.name,

                        Email: gitUser.email,

                        repositoryName:
                            repository.rootUri.path.split("/").pop() ??
                            "Unknown",

                        branchName: repository.state.HEAD?.name ?? "Unknown",

                        commitHash: currentCommit ?? "No commit yet",

                        repositoryPath: repository.rootUri.fsPath,
                    },
                    async (name, email) => {
                        await GitConfig.updateLocalUser(
                            repository,
                            name,
                            email
                        );

                        vscode.window.showInformationMessage(
                            "Git configuration updated."
                        );
                    }
                );
            }
        }

        /**
         * Commit detected
         */
        if (
            previousCommit &&
            currentCommit &&
            previousCommit !== currentCommit
        ) {
            this.previousCommits.set(repositoryPath, currentCommit);

            const gitUser = await this.getGitUser(repository);

            const action = await vscode.window.showInformationMessage(
                `commitDNA • Commit by ${gitUser.name}, Email: ${gitUser.email}`,
                "Review",
                "Dismiss"
            );

            if (action === "Review") {
                CommitReviewPanel.show(
                    this.context.extensionUri,
                    {
                        Author: gitUser.name,

                        Email: gitUser.email,

                        repositoryName:
                            repository.rootUri.path.split("/").pop() ??
                            "Unknown",

                        branchName: repository.state.HEAD?.name ?? "Unknown",

                        commitHash: currentCommit ?? "No commit yet",

                        repositoryPath: repository.rootUri.fsPath,
                    },
                    async (name, email) => {
                        await GitConfig.updateLocalUser(
                            repository,
                            name,
                            email
                        );

                        vscode.window.showInformationMessage(
                            "Git configuration updated."
                        );
                    }
                );
            }

            return;
        }

        this.previousCommits.set(repositoryPath, currentCommit);
    }

    public dispose(): void {
        vscode.Disposable.from(...this.disposables).dispose();
    }
}
