import * as vscode from "vscode";
import { CommitReviewData } from "../types/git";

export class CommitReviewPanel {
    private static currentPanel: CommitReviewPanel | undefined;

    private readonly panel: vscode.WebviewPanel;
    private readonly extensionUri: vscode.Uri;
    private readonly disposables: vscode.Disposable[] = [];
    private getNonce(): string {
        const chars =
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

        let nonce = "";

        for (let i = 0; i < 32; i++) {
            nonce += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        return nonce;
    }
    private escapeHtml(value: string): string {
        return value
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    public static show(extensionUri: vscode.Uri, data: CommitReviewData): void {
        const column = vscode.ViewColumn.Beside;

        if (CommitReviewPanel.currentPanel) {
            CommitReviewPanel.currentPanel.panel.reveal(column);

            CommitReviewPanel.currentPanel.update(data);

            return;
        }

        const panel = vscode.window.createWebviewPanel(
            "commitDNACommitReview",
            "commitDNA Review",
            column,
            {
                enableScripts: true,
                retainContextWhenHidden: false,
            }
        );

        CommitReviewPanel.currentPanel = new CommitReviewPanel(
            panel,
            extensionUri,
            data
        );
    }

    private constructor(
        panel: vscode.WebviewPanel,
        extensionUri: vscode.Uri,
        data: CommitReviewData
    ) {
        this.panel = panel;
        this.extensionUri = extensionUri;

        this.update(data);

        this.panel.onDidDispose(() => this.dispose(), null, this.disposables);

        this.panel.webview.onDidReceiveMessage(
            async (message) => {
                if (typeof message !== "object" || message === null) {
                    return;
                }

                if (typeof message.command !== "string") {
                    return;
                }

                if (typeof message.value !== "string") {
                    return;
                }

                switch (message.command) {
                    case "copyCommit":
                        await vscode.env.clipboard.writeText(message.value);

                        vscode.window.showInformationMessage(
                            "Commit hash copied."
                        );

                        break;

                    case "openRepository":
                        vscode.commands.executeCommand(
                            "revealFileInOS",
                            vscode.Uri.file(message.value)
                        );

                        break;
                }
            },
            null,
            this.disposables
        );
    }

    private update(data: CommitReviewData): void {
        this.panel.webview.html = this.getHtml(data);
    }

    private getHtml(data: CommitReviewData): string {
        const nonce = this.getNonce();
        return `
<!DOCTYPE html>
<html lang="en">

<head>

<meta charset="UTF-8">

<meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
/>

<meta
    http-equiv="Content-Security-Policy"
    content="
        default-src 'none';
        style-src 'unsafe-inline';
        script-src 'nonce-${nonce}';
    "
>
<style>

:root{
    color-scheme: dark;
}

body{
    font-family:
        "Segoe UI",
        sans-serif;

    padding:24px;
    color:#d4d4d4;
    background:#1e1e1e;
}

.card{

    background:#252526;

    border:1px solid #333;

    border-radius:12px;

    padding:20px;

    margin-bottom:16px;
}

.title{

    font-size:22px;

    font-weight:600;

    margin-bottom:24px;
}

.label{

    color:#888;

    font-size:12px;

    text-transform:uppercase;

    margin-bottom:4px;
}

.value{

    font-size:14px;

    margin-bottom:16px;

    word-break:break-word;
}

.success{

    color:#4CAF50;
}

button{

    border:none;

    border-radius:8px;

    padding:10px 18px;

    cursor:pointer;

    margin-right:8px;
}

.primary{

    background:#0078d4;

    color:white;
}

.secondary{

    background:#333;

    color:white;
}

</style>

</head>

<body>

<div class="title">
🚀 commitDNA Review
</div>

<div class="card">

    <div class="label">
        Repository
    </div>

    <div class="value">${this.escapeHtml(data.repositoryName)}
    </div>
 <div class="label">
        Author
    </div>

    <div class="value">
    ${this.escapeHtml(data.Author)}
    </div>

    <div class="label">
        Email
    </div>

    <div class="value">
         ${this.escapeHtml(data.Email)}
    </div>
    <div class="label">
        Branch
    </div>

    <div class="value success">
    ${this.escapeHtml(data.branchName)}
    </div>

    <div class="label">
        Commit
    </div>

    <div class="value">
       ${this.escapeHtml(data.commitHash)}
    </div>
    
   

</div>

<button
    class="primary"
    onclick="copyCommit()"
>
    Copy Commit
</button>


<script nonce="${nonce}">

const vscode = acquireVsCodeApi();

function copyCommit(){

    vscode.postMessage({

        command:"copyCommit"

    });

}

function openRepository(){

    vscode.postMessage({

        command:"openRepository"

    });

}

</script>

</body>

</html>
`;
    }

    public dispose(): void {
        CommitReviewPanel.currentPanel = undefined;

        this.panel.dispose();

        while (this.disposables.length) {
            const item = this.disposables.pop();

            item?.dispose();
        }
    }
}
