# DevFest Ado Ekiti 2025 - Talk Proposal

## 📌 Talk Title
**"GitGenie: Building an AI-Powered VS Code Extension That Writes Perfect Commit Messages"**

### Alternative Titles:
- "From 'fixed stuff' to Meaningful Commits: Building GitGenie with Gemini AI"
- "Weekend Project to Dev Essential: Creating AI Tools with VS Code + Gemini"

---

## 🎯 Track
**Developer Tools / AI & Machine Learning**

---

## ⏱️ Duration
**30-40 minutes** (with live coding demo)

---

## 🎤 Speaker
**Mastersam**
- Flutter/Dart Developer & Tool Builder
- Creator of GitGenie VS Code Extension
- Developer Tools Enthusiast
- Former Bitnob Engineer

---

## 📝 Talk Description

### One-Liner
Learn how to build GitGenie, a VS Code extension that uses Google's Gemini AI to transform your terrible commit messages into meaningful documentation.

### Full Description
We've all been there – staring at the git commit prompt, typing "fixed stuff" or "update code" because writing good commit messages is hard. What if AI could understand your code changes and write meaningful commit messages for you?

In this talk, I'll walk you through building GitGenie, a VS Code extension that uses Google's Gemini AI to generate intelligent commit messages. We'll cover the entire journey from idea to implementation, including:

- Setting up a VS Code extension with TypeScript and esbuild
- Integrating Google's Gemini AI for code understanding
- Parsing git diffs and providing context to AI
- Building an intuitive developer experience
- Lessons learned from going viral on developer Twitter

You'll leave with practical knowledge to build your own AI-powered developer tools, plus a tool that will actually improve your git history!

---

## 🎓 Learning Objectives

Attendees will learn how to:

1. **Build VS Code Extensions**
   - Set up extension development environment
   - Use yo code scaffolding tool
   - Implement commands and keybindings
   - Package and distribute extensions

2. **Integrate Gemini AI**
   - Set up Google Generative AI SDK
   - Craft effective prompts for code analysis
   - Handle API responses and errors
   - Optimize for speed vs quality with model selection

3. **Work with Git in Extensions**
   - Access git diff programmatically
   - Parse commit history for context
   - Integrate with VS Code's Source Control API
   - Detect patterns and frameworks

4. **Create Great Developer UX**
   - Design intuitive command flows
   - Provide helpful feedback and explanations
   - Add progress indicators and cancellation
   - Follow VS Code design patterns

---

## 🎬 Talk Outline

### Introduction (5 mins)
- The commit message problem we all face
- Show real examples of bad commit messages
- Demo GitGenie in action - the "wow" moment

### Part 1: Building the Foundation (10 mins)
- VS Code extension architecture
- Setting up with yo code and esbuild
- Essential files: package.json, extension.ts
- Live coding: Creating your first command

### Part 2: Integrating Gemini AI (10 mins)
- Understanding Gemini models and capabilities
- Crafting prompts that understand code
- Live coding: Calling Gemini API
- Handling responses and parsing JSON

### Part 3: Git Integration & Context (8 mins)
- Using simple-git to access repository data
- Building context from commit history
- Detecting languages and frameworks
- Live coding: Generating contextual messages

### Part 4: Polish & Production (5 mins)
- Adding explanation mode for learning
- Implementing conventional commits
- Error handling and fallbacks
- Publishing to marketplace

### Q&A (5-10 mins)
- Open floor for questions
- Share extension metrics and feedback
- Discuss other AI tool ideas

---

## 👥 Target Audience

### Perfect for:
- Frontend/Backend developers interested in tooling
- Developers curious about AI integration
- VS Code users who want to extend their editor
- Anyone tired of writing "fixed bugs" as commit messages

### Prerequisites:
- Basic TypeScript/JavaScript knowledge
- Familiarity with git and VS Code
- No prior extension development experience needed

---

## 💻 Technical Requirements

### For Speaker:
- VS Code with live coding setup
- Git repository with sample changes
- Internet connection for Gemini API
- Screen recording backup (in case of demo gods)

### For Attendees (Workshop Version):
- Laptop with VS Code installed
- Node.js 18+ installed
- Git configured
- Google AI Studio API key (free tier)

---

## 🎪 Demo Highlights

### Live Demonstrations:
1. **Before/After** - Show terrible commit → meaningful commit
2. **Real-time Generation** - Live coding session
3. **Explanation Mode** - AI explaining its reasoning
4. **Framework Detection** - Recognizing Flutter/React/Vue
5. **Conventional Commits** - Automatic formatting

---

## 🌟 Why This Talk?

### Relevance:
- **Practical AI** - Not just theory, but buildable tools
- **Weekend Project Scale** - Achievable for everyone
- **Immediate Value** - Attendees can use the tool right away
- **Nigerian Developer Focus** - Examples from local context

### Unique Aspects:
- Live coding with real git repositories
- Free tools only (no paid APIs required)
- Take-home working extension
- Open source project to contribute to

---

## 🎁 Takeaways

### For Attendees:
1. **Working VS Code extension** source code
2. **Step-by-step guide** to build their own
3. **Gemini AI prompt templates** for code analysis
4. **GitGenie extension** to improve their workflow

### Resources Shared:
- GitHub repository with full code
- Slide deck with code snippets
- Blog post with detailed tutorial
- Discord/Telegram group for continued learning

---

## 🗣️ Speaker Bio

**Mastersam** is a Flutter/Dart developer passionate about building tools that make developers' lives easier. Recently resigned from Bitnob to focus on developer tooling and education. Creator of GitGenie VS Code extension, the Zero design system, and multiple Flutter DevTools extensions. Active in the Flutter community with talks at FlutterBytes Conference 2025 and various DevFest events.

*"I believe great developer tools come from solving our own daily frustrations. GitGenie started because I was tired of my terrible commit messages, and now it's helping thousands of developers maintain better git history."*

---

## 📊 Impact Metrics

### GitGenie Success:
- 🌟 2,000+ installs in first week
- 💬 95% positive feedback rate
- 🚀 Featured in VS Code trending
- 🌍 Used by developers in 30+ countries

---

## 🔄 Adaptable Format

This talk can be delivered as:
- **30-min Conference Talk** - Focus on key concepts with demo
- **60-min Deep Dive** - Include more live coding
- **2-hour Workshop** - Attendees build along
- **Lightning Talk (15 min)** - Quick demo and key insights

---

## 📧 Contact

- GitHub: @mastersam
- Twitter: @mastersam_
- Email: abadasamuelosp@gmail.com
- GitGenie Repo: github.com/mastersam/gitgenie

---

## 🎯 Call to Action

"Stop writing bad commit messages. Start building tools that solve real problems. Let's make developer tools that spark joy!"

#DevFestAdoEkiti #GoogleGemini #VSCode #DeveloperTools #AI #OpenSource