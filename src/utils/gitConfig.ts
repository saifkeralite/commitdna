import { execFile } from "child_process";
import { promisify } from "util";
import * as fs from "fs";
import * as path from "path";

import * as vscode from "vscode";

import { Repository, GitConfigKey } from "../types/git";

const exec = promisify(execFile);

export class GitConfig {
    /**
     * Only these keys can ever be modified.
     */
    private static readonly ALLOWED_KEYS = new Set<GitConfigKey>([
        "user.name",
        "user.email",
    ]);

    /**
     * Prevent multiple updates from running simultaneously.
     */
    private static readonly updating = new Set<string>();

    /**
     * Ensure the repository is valid.
     */
    private static async validateRepository(
        repository: Repository
    ): Promise<void> {
        const { stdout } = await exec(
            "git",
            ["rev-parse", "--is-inside-work-tree"],
            {
                cwd: repository.rootUri.fsPath,
                windowsHide: true,
                timeout: 5000,
            }
        );

        if (stdout.trim() !== "true") {
            throw new Error("Invalid Git repository.");
        }
    }

    /**
     * Validate config key.
     */
    private static validateKey(key: GitConfigKey): void {
        if (!this.ALLOWED_KEYS.has(key)) {
            throw new Error("Unsupported Git configuration key.");
        }
    }

    /**
     * Validate config value.
     */
    private static validateValue(key: GitConfigKey, value: string): string {
        const trimmed = value.trim();

        if (!trimmed) {
            throw new Error(`${key} cannot be empty.`);
        }

        if (trimmed.length > 100) {
            throw new Error(`${key} is too long.`);
        }

        // Reject control characters.
        if (/[\x00-\x1F\x7F]/.test(trimmed)) {
            throw new Error("Invalid characters detected.");
        }

        if (key === "user.email") {
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
                throw new Error("Invalid email address.");
            }
        }

        if (key === "user.name") {
            if (!/^[\p{L}\p{N} .,'_-]+$/u.test(trimmed)) {
                throw new Error("Invalid user name.");
            }
        }

        return trimmed;
    }

    /**
     * Read a local Git config.
     */
    static async getLocalConfig(
        repository: Repository,
        key: GitConfigKey
    ): Promise<string | undefined> {
        this.validateKey(key);

        await this.validateRepository(repository);

        try {
            const { stdout } = await exec(
                "git",
                ["config", "--local", "--get", key],
                {
                    cwd: repository.rootUri.fsPath,
                    windowsHide: true,
                    timeout: 5000,
                    maxBuffer: 1024 * 10,
                }
            );

            return stdout.trim() || undefined;
        } catch {
            return undefined;
        }
    }

    /**
     * Update a local Git config.
     */
    static async setLocalConfig(
        repository: Repository,
        key: GitConfigKey,
        value: string
    ): Promise<void> {
        const repositoryId = repository.rootUri.fsPath;

        if (this.updating.has(repositoryId)) {
            return;
        }

        this.updating.add(repositoryId);

        try {
            this.validateKey(key);

            await this.validateRepository(repository);

            const validatedValue = this.validateValue(key, value);

            await exec("git", ["config", "--local", key, validatedValue], {
                cwd: repository.rootUri.fsPath,
                windowsHide: true,
                timeout: 5000,
                maxBuffer: 1024 * 10,
            });

            // Verify the value was actually written.
            const saved = await this.getLocalConfig(repository, key);

            if (saved !== validatedValue) {
                throw new Error("Git configuration verification failed.");
            }
        } catch (error) {
            console.error("[commitDNA]", error);

            vscode.window.showErrorMessage(`Unable to update ${key}.`);

            throw error;
        } finally {
            this.updating.delete(repositoryId);
        }
    }

    /**
     * Read local Git user.
     */
    static async getLocalUser(repository: Repository) {
        const [name, email] = await Promise.all([
            this.getLocalConfig(repository, "user.name"),
            this.getLocalConfig(repository, "user.email"),
        ]);

        return {
            name: name ?? "Unknown",
            email: email ?? "Unknown",
        };
    }

    /**
     * Update local Git user.
     */
    static async updateLocalUser(
        repository: Repository,
        name: string,
        email: string
    ): Promise<void> {
        await this.setLocalConfig(repository, "user.name", name);

        await this.setLocalConfig(repository, "user.email", email);
    }
}
