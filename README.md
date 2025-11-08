# CommitCraft - Gemini Powered Commit Messages

Generate meaningful commit messages that actually explain what your code does, powered by Google's Gemini AI.

## ✨ Features

### Core Features
- **🤖 Smart Commit Messages** - Understands your code changes, not just file names
- **📝 Multiple Styles** - Choose from brief, standard, or detailed messages
- **🎯 Conventional Commits** - Automatically follows conventional commit format
- **💡 Explanation Mode** - Learn why the message was generated
- **📊 Confidence Scoring** - Know when to review carefully
- **🎨 Context Aware** - Detects frameworks, languages, and patterns

### What Makes CommitCraft Different
- **Actually understands code changes** - Not just "Updated file.js"
- **Learns from your commit style** - Analyzes your recent commits
- **Educational** - Shows reasoning behind each suggestion
- **Zero config** - Works out of the box (just add API key)

## 🚀 Installation

### From VSIX (Current)
1. Download the `.vsix` file from releases
2. In VS Code: `Extensions` → `...` → `Install from VSIX`
3. Select the downloaded file

### From Marketplace (Coming Soon)
```
ext install commitcraft
```

## 🔧 Setup

1. **Get a Gemini API Key**
   - Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a new API key (it's free!)
   
2. **Configure CommitCraft**
   - Open VS Code Settings (`Cmd/Ctrl + ,`)
   - Search for "CommitCraft"
   - Paste your API key

3. **Start Using**
   - Stage your changes
   - Press `Ctrl+Shift+G` (Windows/Linux) or `Cmd+Shift+G` (Mac)
   - Select your preferred message
   - Commit!

## 📖 Usage

### Basic Generation
```
1. Make your code changes
2. Stage files (git add)
3. Press Ctrl+Shift+G
4. Pick from 3 suggestions
5. Message is applied to commit box
```

### With Explanation
```
1. Open Command Palette (Ctrl+Shift+P)
2. Run "CommitCraft: Generate with Explanation"
3. See WHY each message was suggested
4. Learn to write better commits
```

## ⚙️ Configuration

| Setting | Description | Default |
|---------|-------------|---------|
| `geminiApiKey` | Your Gemini API key | - |
| `model` | Gemini model (`gemini-1.5-flash` or `gemini-1.5-pro`) | `gemini-1.5-flash` |
| `conventionalCommits` | Use conventional commit format | `true` |
| `includeEmoji` | Add emoji to commits | `false` |
| `messageStyle` | Default style (brief/standard/detailed) | `standard` |

## 🎯 Examples

### Before CommitCraft
```
- "Updated files"
- "Fixed bug"  
- "Changes"
```

### After CommitCraft
```
- "fix: handle null response in payment validation"
- "feat: add retry logic for failed Lightning Network payments"
- "refactor: extract webhook handler to separate module for better testability"
```

### With Explanation
```
Message: "fix: prevent race condition in order status updates"
Reasoning: "The diff shows adding a mutex lock around the order status 
update logic, which prevents multiple concurrent updates from causing 
inconsistent state. This is a bug fix for a concurrency issue."
Confidence: 92%
```

## 🤝 Contributing

Contributions welcome! This is an open-source project.

1. Fork the repository
2. Create your feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - See LICENSE file for details

## 🙏 Credits

Built with:
- Google Gemini AI
- Simple Git
- VS Code Extension API

## 🐛 Known Issues

- First generation might be slow (model initialization)
- Large diffs (>8000 chars) are truncated
- Requires internet connection

## 📮 Support

- [Report Issues](https://github.com/mastersam07/commitcraft/issues)
- [Feature Requests](https://github.com/mastersam07/commitcraft/discussions)

---

**Made with ❤️ for developers who care about commit history**