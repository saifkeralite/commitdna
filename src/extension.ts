import * as vscode from "vscode";
import { GitService } from "./services/GitService";

let gitService: GitService | undefined;

/**
 * Called when the extension is activated.
 */
export async function activate(
    context: vscode.ExtensionContext
): Promise<void> {
    try {
        gitService = new GitService(context);

        await gitService.initialize();

        context.subscriptions.push(gitService);

        vscode.window.setStatusBarMessage(
            "$(git-branch) commitDNA Ready",
            3000
        );
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);

        vscode.window.showErrorMessage(
            `commitDNA failed to initialize.\n${message}`
        );
    }
}

/**
 * Called when VS Code deactivates the extension.
 */
export function deactivate(): void {
    gitService?.dispose();
}
