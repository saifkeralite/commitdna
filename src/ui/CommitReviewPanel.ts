import * as vscode from "vscode";
import { CommitReviewData } from "../types/git";

export class CommitReviewPanel {
    private static currentPanel: CommitReviewPanel | undefined;

    private readonly panel: vscode.WebviewPanel;
    private readonly extensionUri: vscode.Uri;
    private readonly disposables: vscode.Disposable[] = [];
    private repositoryPath = "";
    private onSave: (name: string, email: string) => Promise<void>;

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

    public static show(
        extensionUri: vscode.Uri,
        data: CommitReviewData,
        onSave: (name: string, email: string) => Promise<void>
    ): void {
        const column = vscode.ViewColumn.Beside;

        if (CommitReviewPanel.currentPanel) {
            CommitReviewPanel.currentPanel.panel.reveal(column);

            CommitReviewPanel.currentPanel.onSave = onSave;

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
            data,
            onSave
        );
    }

    private constructor(
        panel: vscode.WebviewPanel,
        extensionUri: vscode.Uri,
        data: CommitReviewData,
        onSave: (name: string, email: string) => Promise<void>
    ) {
        this.panel = panel;
        this.extensionUri = extensionUri;
        this.onSave = onSave;
        this.update(data);

        this.panel.onDidDispose(() => this.dispose(), null, this.disposables);

        this.panel.webview.onDidReceiveMessage(
            async (message) => {
                if (
                    typeof message !== "object" ||
                    message === null ||
                    Array.isArray(message)
                ) {
                    return;
                }

                if (typeof message.command !== "string") {
                    return;
                }

                switch (message.command) {
                    case "copyCommit": {
                        if (typeof message.value !== "string") {
                            return;
                        }

                        await vscode.env.clipboard.writeText(message.value);

                        vscode.window.showInformationMessage(
                            "Commit hash copied."
                        );

                        break;
                    }

                    case "openRepository": {
                        if (!this.repositoryPath) {
                            return;
                        }

                        const repositoryUri = vscode.Uri.file(
                            this.repositoryPath
                        );

                        await vscode.commands.executeCommand(
                            "revealFileInOS",
                            repositoryUri
                        );

                        break;
                    }
                    case "saveGitConfig": {
                        if (typeof message.name !== "string") {
                            return;
                        }

                        if (typeof message.email !== "string") {
                            return;
                        }

                        await this.onSave(
                            message.name.trim(),
                            message.email.trim()
                        );

                        vscode.window.showInformationMessage(
                            "Git configuration updated."
                        );

                        break;
                    }

                    default:
                        return;
                }
            },
            null,
            this.disposables
        );
    }

    private update(data: CommitReviewData): void {
        // Store it only inside the extension.
        this.repositoryPath = data.repositoryPath;

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
        base-uri 'none';
        form-action 'none';
        object-src 'none';
        frame-src 'none';
        connect-src 'none';
        img-src 'none';
        font-src 'none';
        style-src 'nonce-${nonce}';
        script-src 'nonce-${nonce}';
    "
>
<style nonce="${nonce}">

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
    .textbox{

    width:100%;

    box-sizing:border-box;

    padding:10px;

    border-radius:6px;

    border:1px solid #444;

    background:#1e1e1e;

    color:white;

    margin-bottom:16px;

    outline:none;

}

.textbox:focus{

    border-color:#0078d4;

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

<input
    id="authorInput"
    class="textbox"
    maxlength="100"
    spellcheck="false"
    autocomplete="off"
    value="${this.escapeHtml(data.Author)}"
/>

  <div class="label">
    Email
</div>

<input
    id="emailInput"
    class="textbox"
    maxlength="100"
    spellcheck="false"
    autocomplete="off"
    value="${this.escapeHtml(data.Email)}"
/>
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
    id="copyCommitButton"
    class="primary"
>
    Copy Commit
</button>

<button
    id="openRepositoryButton"
    class="secondary"
>
    Open Repository
</button>
<button
    id="saveButton"
    class="primary"
>
    Save
</button>

<script nonce="${nonce}">
const vscode = Object.freeze(acquireVsCodeApi());

document
.getElementById("saveButton")
.addEventListener("click",()=>{

    const name =
        document
        .getElementById("authorInput")
        .value
        .trim();

    const email =
        document
        .getElementById("emailInput")
        .value
        .trim();

    if(name.length===0){

        return;

    }

    if(email.length===0){

        return;

    }

    vscode.postMessage({

        command:"saveGitConfig",


        name,

        email

    });

});
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
