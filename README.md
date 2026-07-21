# commitDNA

**commitDNA** helps you verify your Git identity immediately after every commit. It displays the Git author, email, branch, and commit information so you can quickly confirm you're committing with the correct Git configuration before pushing changes to a remote repository.

---

## ✨ Features

- 🪪 Displays the configured Git **author** and **email** after every commit.
- 🌿 Shows the current **branch**.
- 🔖 Displays the latest **commit hash**.
- 📂 Shows the current **repository**.
- 📋 Copy the latest commit hash with a single click.
- 📁 Open the repository directly from the review panel.
- 🚀 Lightweight and runs locally.
- 🔒 No telemetry or external network requests.

---

## 📸 Preview

Example:

```markdown
![Commit Review](images/screenshot.png)
```

---

## 🚀 Getting Started

1. Install **commitDNA** from the Visual Studio Code Marketplace.
2. Open any Git repository.
3. Make a commit using Visual Studio Code.
4. commitDNA automatically displays your Git identity and commit details.
5. Click **Review** to open the detailed commit review panel.

---

## 📋 Commit Review

commitDNA displays:

- Repository Name
- Git Author
- Git Email
- Current Branch
- Commit Hash

This helps ensure commits are created with the correct Git identity before they are pushed to a remote repository.

---

## 🔒 Privacy

commitDNA is designed to run entirely on your local machine.

- No telemetry
- No analytics
- No external API calls
- No collection or transmission of your Git data

commitDNA does not intentionally send your repository information, commit hashes, author name, email address, or any other Git metadata to external servers. All processing is performed locally within Visual Studio Code.

commitDNA is an open-source project. You are encouraged to review the source code, report security concerns, and verify how the extension works. Any future changes that affect privacy or data handling will be clearly documented in the release notes.

## ⚙️ Requirements

- Visual Studio Code **1.125.0** or later
- Built-in Git extension enabled
- A Git repository

---

## ⚙️ Extension Settings

commitDNA currently does not contribute any custom settings.

---

## 🐞 Known Issues

None currently.

If you encounter any issues, please open an issue on the GitHub repository.

---

## 📦 Release Notes

### 0.0.1

Initial release.

Features:

- Automatic commit detection
- Git author and email review
- Repository information
- Branch information
- Commit hash display
- Commit review webview
- Copy commit hash
- Open repository shortcut

---

## 🤝 Contributing

Contributions, feature requests, and bug reports are welcome.

If you'd like to improve commitDNA, feel free to submit an issue or pull request.

---

## 📄 License

This project is licensed under the MIT License.

---

**Made with ❤️ for Git users and Visual Studio Code developers.**
