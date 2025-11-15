# Building GitGenie: An AI-Powered VS Code Extension Workshop

> Transform "fixed stuff" into meaningful commits using Google's Gemini AI

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Part 1: Project Setup](#part-1-project-setup)
3. [Part 2: Extension Foundation](#part-2-extension-foundation)
4. [Part 3: Git Service](#part-3-git-service)
5. [Part 4: AI Commit Message Generator](#part-4-ai-commit-message-generator)
6. [Part 5: Main Extension Logic](#part-5-main-extension-logic)
7. [Part 6: Configuration & Commands](#part-6-configuration--commands)
8. [Part 7: Build System](#part-7-build-system)
9. [Part 8: Testing & Debugging](#part-8-testing--debugging)
10. [Part 9: Publishing](#part-9-publishing)

---

## Prerequisites

Before starting, ensure you have:

- **Node.js** 18+ installed
- **VS Code** installed
- **Git** configured
- **Google AI Studio API Key** (free tier) - Get it at https://makersuite.google.com/app/apikey
- Basic TypeScript/JavaScript knowledge
- Familiarity with git and VS Code

### Check Your Environment

```bash
node --version  # Should be 18+
npm --version   # Should be 8+
git --version   # Any recent version
code --version  # VS Code CLI
```

---

## Part 1: Project Setup

### Step 1: Install Yeoman and VS Code Extension Generator

```bash
npm install -g yo generator-code
```

This gives us the scaffolding tool for VS Code extensions.

### Step 2: Generate Extension Scaffold

```bash
yo code
```

When prompted, select:
- **What type of extension?** → New Extension (TypeScript)
- **Extension name?** → gitgenie
- **Identifier?** → gitgenie
- **Description?** → Your AI-powered commit message genie
- **Initialize git repository?** → Yes
- **Bundle with webpack?** → No (we'll use esbuild)
- **Package manager?** → npm

### Step 3: Navigate to Project Directory

```bash
cd gitgenie
```

### Step 4: Install Dependencies

```bash
npm install @google/genai simple-git
npm install --save-dev esbuild npm-run-all
```

**What we installed:**
- `@google/genai` - Google's Gemini AI SDK
- `simple-git` - Git operations in Node.js
- `esbuild` - Fast JavaScript bundler
- `npm-run-all` - Run multiple npm scripts in parallel

---

## Part 2: Extension Foundation

### Understanding package.json

The `package.json` is your extension's manifest. It defines:
- Commands users can run
- Settings users can configure
- When your extension activates
- Keybindings and menus

### Step 1: Update Basic Info

Open `package.json` and update the basic information:

```json
{
  "name": "gitgenie",
  "displayName": "GitGenie",
  "description": "Your AI-powered commit message genie - rub the lamp, get perfect commits!",
  "version": "0.0.1",
  "publisher": "your-publisher-name",
  "icon": "icon.png"
}
```

### Step 2: Define Commands

Add commands users can execute. Under the `contributes` section:

```json
"contributes": {
  "commands": [
    {
      "command": "gitgenie.generateMessage",
      "title": "Generate Commit Message",
      "category": "GitGenie",
      "icon": "$(wand)"
    },
    {
      "command": "gitgenie.generateWithExplanation",
      "title": "Generate Commit Message with Explanation",
      "category": "GitGenie",
      "icon": "$(lightbulb)"
    }
  ]
}
```

**What this does:** Creates two commands that will appear in the Command Palette (Ctrl+Shift+P).

### Step 3: Add Keybindings

Still in the `contributes` section, add keybindings:

```json
"keybindings": [
  {
    "command": "gitgenie.generateMessage",
    "key": "ctrl+shift+g",
    "mac": "cmd+shift+g",
    "when": "scmProvider == git"
  }
]
```

**What this does:** Allows users to press Ctrl+Shift+G (Cmd+Shift+G on Mac) to trigger our command.

### Step 4: Add to Source Control Menu

Add a button to the Git panel:

```json
"menus": {
  "scm/title": [
    {
      "command": "gitgenie.generateMessage",
      "group": "navigation",
      "when": "scmProvider == git"
    }
  ]
}
```

**What this does:** Adds a magic wand button to the Source Control panel header.

### Step 5: Define Settings

Add configuration options users can customize:

```json
"configuration": {
  "title": "GitGenie",
  "properties": {
    "gitgenie.geminiApiKey": {
      "type": "string",
      "default": "",
      "description": "Your Gemini API key",
      "order": 0
    },
    "gitgenie.model": {
      "type": "string",
      "enum": [
        "gemini-2.0-flash",
        "gemini-2.5-flash",
        "gemini-2.5-flash-lite",
        "gemini-2.5-pro"
      ],
      "default": "gemini-2.0-flash",
      "description": "Which Gemini model to use",
      "order": 1
    },
    "gitgenie.conventionalCommits": {
      "type": "boolean",
      "default": true,
      "description": "Use conventional commit format (feat:, fix:, etc.)",
      "order": 2
    },
    "gitgenie.includeEmoji": {
      "type": "boolean",
      "default": false,
      "description": "Include emoji in commit messages",
      "order": 3
    }
  }
}
```

**What this does:** Creates settings that appear in VS Code Settings UI under "GitGenie".

### Step 6: Update Build Scripts

Replace the `scripts` section:

```json
"scripts": {
  "vscode:prepublish": "npm run package",
  "compile": "npm run check-types && npm run lint && node esbuild.js",
  "watch": "npm-run-all -p watch:*",
  "watch:esbuild": "node esbuild.js --watch",
  "watch:tsc": "tsc --noEmit --watch --project tsconfig.json",
  "package": "npm run check-types && npm run lint && node esbuild.js --production",
  "check-types": "tsc --noEmit",
  "lint": "eslint src"
}
```

### Step 7: Configure TypeScript

Update `tsconfig.json`:

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "target": "ES2020",
    "outDir": "out",
    "lib": ["ES2020"],
    "sourceMap": true,
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "exclude": ["node_modules", ".vscode-test", "test"]
}
```

**What this does:** Configures TypeScript compiler for modern JavaScript with strict type checking.

### Step 8: Create esbuild Configuration

Create `esbuild.js` in the root directory:

```javascript
const esbuild = require("esbuild");

const production = process.argv.includes("--production");
const watch = process.argv.includes("--watch");

const esbuildProblemMatcherPlugin = {
  name: "esbuild-problem-matcher",
  setup(build) {
    build.onStart(() => {
      console.log("[watch] build started");
    });
    build.onEnd((result) => {
      result.errors.forEach(({ text, location }) => {
        console.error(`✘ [ERROR] ${text}`);
        if (location) {
          console.error(`    ${location.file}:${location.line}:${location.column}:`);
        }
      });
      console.log("[watch] build finished");
    });
  },
};

async function main() {
  const ctx = await esbuild.context({
    entryPoints: ["src/extension.ts"],
    bundle: true,
    format: "cjs",
    minify: production,
    sourcemap: !production,
    sourcesContent: false,
    platform: "node",
    outfile: "dist/extension.js",
    external: ["vscode"],
    logLevel: "silent",
    plugins: [esbuildProblemMatcherPlugin],
  });

  if (watch) {
    await ctx.watch();
  } else {
    await ctx.rebuild();
    await ctx.dispose();
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
```

**What this does:** Bundles all our TypeScript files into a single JavaScript file for better performance.

---

## Part 3: Git Service

Now let's build the service that interacts with Git. We'll create `src/gitService.ts`.

### Understanding What We Need

Our Git service needs to:
1. Get the diff of staged changes
2. Fetch recent commit messages (to learn style)
3. Detect what languages and frameworks are being used
4. Extract branch information (for issue numbers)

### Step 1: Create the File and Imports

Create `src/gitService.ts` and add imports:

```typescript
import * as simpleGit from 'simple-git';
import * as path from 'path';
import * as fs from 'fs';
```

**Why these imports:**
- `simpleGit` - Interact with Git
- `path` - Handle file paths
- `fs` - File system operations

### Step 2: Define TypeScript Interfaces

Add interfaces to define our data structures:

```typescript
export interface FileContext {
    primaryLanguage: string;
    frameworks: string[];
    fileTypes: string[];
    hasTests: boolean;
    hasDocs: boolean;
}

export interface BranchInfo {
    name: string;
    issueNumber?: string;
}

export interface GitStatus {
    hasChanges: boolean;
    staged: string[];
    modified: string[];
    created: string[];
}
```

**What these represent:**
- `FileContext` - Information about the files being changed
- `BranchInfo` - Current branch and extracted issue number
- `GitStatus` - Current state of the repository

### Step 3: Create the GitService Class

Start the class:

```typescript
export class GitService {
    // Methods will go here
}
```

### Step 4: Implement getStagedDiff Method

This gets the changes that are staged for commit:

```typescript
async getStagedDiff(repoPath: string): Promise<string | null> {
    const git = simpleGit.simpleGit(repoPath);

    try {
        // Get staged changes
        const diff = await git.diff(['--cached']);

        // If no staged changes, try all changes
        if (!diff || diff.trim().length === 0) {
            const status = await git.status();
            if (status.modified.length > 0 || status.created.length > 0) {
                return await git.diff();
            }
            return null;
        }

        return diff;
    } catch (error) {
        console.error('Error getting git diff:', error);
        return null;
    }
}
```

**What this does:**
- First tries to get staged changes (`git diff --cached`)
- Falls back to all changes if nothing is staged
- Returns null if no changes found

### Step 5: Implement getRecentCommits Method

This learns from your commit history:

```typescript
async getRecentCommits(repoPath: string, count: number = 10): Promise<string[]> {
    const git = simpleGit.simpleGit(repoPath);

    try {
        const log = await git.log({
            maxCount: count,
            format: {
                message: '%s',
            }
        });

        return log.all
            .map(commit => commit.message)
            .filter(msg => msg && msg.trim().length > 0);
    } catch (error) {
        console.error('Error getting commit history:', error);
        return [];
    }
}
```

**What this does:**
- Fetches last 10 commits
- Extracts just the message (not author, date, etc.)
- Filters out empty messages

### Step 6: Implement getFileContext Method

This detects languages and frameworks:

```typescript
async getFileContext(repoPath: string): Promise<FileContext> {
    const git = simpleGit.simpleGit(repoPath);

    try {
        const status = await git.status();

        // Get all changed files
        const changedFiles = [
            ...status.modified,
            ...status.created,
            ...status.staged,
            ...status.renamed.map(r => r.to),
        ].filter((v, i, a) => a.indexOf(v) === i); // Remove duplicates

        // Extract file extensions
        const extensions = changedFiles.map(file =>
            path.extname(file).toLowerCase()
        );
        const uniqueExtensions = [...new Set(extensions)];

        // Map extensions to languages
        const languageMap: Record<string, string> = {
            '.ts': 'TypeScript',
            '.tsx': 'TypeScript React',
            '.js': 'JavaScript',
            '.jsx': 'JavaScript React',
            '.py': 'Python',
            '.dart': 'Dart',
            '.go': 'Go',
            '.rs': 'Rust',
            // Add more as needed
        };

        // Find primary language
        let primaryLanguage = 'Unknown';
        for (const ext of uniqueExtensions) {
            if (languageMap[ext]) {
                primaryLanguage = languageMap[ext];
                break;
            }
        }

        // Detect frameworks
        const frameworks: string[] = [];

        if (changedFiles.some(f => f.endsWith('.dart') || f.includes('pubspec'))) {
            frameworks.push('Flutter');
        }
        if (changedFiles.some(f => f.endsWith('.tsx') || f.endsWith('.jsx'))) {
            frameworks.push('React');
        }
        if (changedFiles.some(f => f.endsWith('.vue'))) {
            frameworks.push('Vue');
        }

        // Check for test files
        const hasTests = changedFiles.some(f =>
            f.includes('test') ||
            f.includes('spec') ||
            f.includes('__tests__')
        );

        // Check for documentation
        const hasDocs = changedFiles.some(f =>
            f.endsWith('.md') ||
            f.includes('README') ||
            f.includes('docs/')
        );

        return {
            primaryLanguage,
            frameworks: [...new Set(frameworks)],
            fileTypes: uniqueExtensions,
            hasTests,
            hasDocs
        };
    } catch (error) {
        console.error('Error getting file context:', error);
        return {
            primaryLanguage: 'Unknown',
            frameworks: [],
            fileTypes: [],
            hasTests: false,
            hasDocs: false
        };
    }
}
```

**What this does:**
- Analyzes changed files to detect language (TypeScript, Python, etc.)
- Detects frameworks (React, Flutter, Vue, etc.)
- Checks if tests or docs are included

### Step 7: Implement getBranchInfo Method

This extracts issue numbers from branch names:

```typescript
async getBranchInfo(repoPath: string): Promise<BranchInfo> {
    const git = simpleGit.simpleGit(repoPath);

    try {
        const branch = await git.branch();
        const branchName = branch.current;

        // Common branch naming patterns
        const patterns = [
            /(\d+)/,                    // Just numbers
            /issue[- ](\d+)/i,          // issue-123
            /feature\/(\d+)/i,          // feature/123
            /bug\/(\d+)/i,              // bug/123
            /([A-Z]+-\d+)/,             // JIRA-123
        ];

        let issueNumber: string | undefined;
        for (const pattern of patterns) {
            const match = branchName.match(pattern);
            if (match) {
                issueNumber = match[1];
                break;
            }
        }

        return {
            name: branchName,
            issueNumber
        };
    } catch (error) {
        console.error('Error getting branch info:', error);
        return {
            name: 'unknown'
        };
    }
}
```

**What this does:**
- Gets current branch name
- Tries to extract issue number using regex patterns
- Supports common formats like `feature/123`, `issue-456`, `PROJ-789`

### Your Complete Git Service Should Look Like:

<details>
<summary>Click to expand full gitService.ts</summary>

```typescript
import * as simpleGit from 'simple-git';
import * as path from 'path';
import * as fs from 'fs';

export interface FileContext {
    primaryLanguage: string;
    frameworks: string[];
    fileTypes: string[];
    hasTests: boolean;
    hasDocs: boolean;
}

export interface BranchInfo {
    name: string;
    issueNumber?: string;
}

export interface GitStatus {
    hasChanges: boolean;
    staged: string[];
    modified: string[];
    created: string[];
}

export class GitService {
    async getStagedDiff(repoPath: string): Promise<string | null> {
        const git = simpleGit.simpleGit(repoPath);

        try {
            const diff = await git.diff(['--cached']);

            if (!diff || diff.trim().length === 0) {
                const status = await git.status();
                if (status.modified.length > 0 || status.created.length > 0 || status.deleted.length > 0) {
                    const allDiff = await git.diff();
                    if (allDiff && allDiff.trim().length > 0) {
                        console.log('No staged changes, using all changes');
                        return allDiff;
                    }
                }
                return null;
            }

            return diff;
        } catch (error) {
            console.error('Error getting git diff:', error);
            return null;
        }
    }

    async getStatus(repoPath: string): Promise<GitStatus> {
        const git = simpleGit.simpleGit(repoPath);

        try {
            const status = await git.status();
            return {
                hasChanges: status.files.length > 0,
                staged: status.staged,
                modified: status.modified,
                created: status.created
            };
        } catch (error) {
            console.error('Error getting git status:', error);
            return {
                hasChanges: false,
                staged: [],
                modified: [],
                created: []
            };
        }
    }

    async getRecentCommits(repoPath: string, count: number = 10): Promise<string[]> {
        const git = simpleGit.simpleGit(repoPath);

        try {
            const log = await git.log({
                maxCount: count,
                format: {
                    message: '%s',
                }
            });

            return log.all.map(commit => commit.message).filter(msg => msg && msg.trim().length > 0);
        } catch (error) {
            console.error('Error getting commit history:', error);
            return [];
        }
    }

    async getFileContext(repoPath: string): Promise<FileContext> {
        const git = simpleGit.simpleGit(repoPath);

        try {
            const status = await git.status();
            const changedFiles = [
                ...status.modified,
                ...status.created,
                ...status.staged,
                ...status.renamed.map(r => r.to),
            ].filter((v, i, a) => a.indexOf(v) === i);

            const extensions = changedFiles.map(file => path.extname(file).toLowerCase());
            const uniqueExtensions = [...new Set(extensions)];

            const languageMap: Record<string, string> = {
                '.ts': 'TypeScript',
                '.tsx': 'TypeScript React',
                '.js': 'JavaScript',
                '.jsx': 'JavaScript React',
                '.py': 'Python',
                '.dart': 'Dart',
                '.swift': 'Swift',
                '.kt': 'Kotlin',
                '.java': 'Java',
                '.go': 'Go',
                '.rs': 'Rust',
                '.cpp': 'C++',
                '.c': 'C',
                '.cs': 'C#',
                '.rb': 'Ruby',
                '.php': 'PHP',
                '.vue': 'Vue',
                '.svelte': 'Svelte',
            };

            let primaryLanguage = 'Unknown';
            for (const ext of uniqueExtensions) {
                if (languageMap[ext]) {
                    primaryLanguage = languageMap[ext];
                    break;
                }
            }

            const frameworks: string[] = [];

            if (changedFiles.some(f => f.endsWith('.dart') || f.includes('pubspec'))) {
                frameworks.push('Flutter');
            }
            if (changedFiles.some(f => f.endsWith('.tsx') || f.endsWith('.jsx') || f.includes('react'))) {
                frameworks.push('React');
            }
            if (changedFiles.some(f => f.endsWith('.vue'))) {
                frameworks.push('Vue');
            }
            if (changedFiles.some(f => f.includes('.component.ts') || f.includes('.module.ts') || f.includes('angular'))) {
                frameworks.push('Angular');
            }
            if (changedFiles.some(f => f.includes('pages/') || f.includes('app/') || f.includes('next.config'))) {
                frameworks.push('Next.js');
            }

            const hasTests = changedFiles.some(f =>
                f.includes('test') ||
                f.includes('spec') ||
                f.includes('__tests__') ||
                f.endsWith('.test.ts') ||
                f.endsWith('.spec.ts')
            );

            const hasDocs = changedFiles.some(f =>
                f.endsWith('.md') ||
                f.endsWith('.mdx') ||
                f.includes('README') ||
                f.includes('docs/')
            );

            return {
                primaryLanguage,
                frameworks: [...new Set(frameworks)],
                fileTypes: uniqueExtensions,
                hasTests,
                hasDocs
            };
        } catch (error) {
            console.error('Error getting file context:', error);
            return {
                primaryLanguage: 'Unknown',
                frameworks: [],
                fileTypes: [],
                hasTests: false,
                hasDocs: false
            };
        }
    }

    async getBranchInfo(repoPath: string): Promise<BranchInfo> {
        const git = simpleGit.simpleGit(repoPath);

        try {
            const branch = await git.branch();
            const branchName = branch.current;

            const patterns = [
                /(\d+)/,
                /issue[- ](\d+)/i,
                /feature\/(\d+)/i,
                /bug\/(\d+)/i,
                /fix\/(\d+)/i,
                /([A-Z]+-\d+)/,
            ];

            let issueNumber: string | undefined;
            for (const pattern of patterns) {
                const match = branchName.match(pattern);
                if (match) {
                    issueNumber = match[1];
                    break;
                }
            }

            return {
                name: branchName,
                issueNumber
            };
        } catch (error) {
            console.error('Error getting branch info:', error);
            return {
                name: 'unknown'
            };
        }
    }
}
```

</details>

---

## Part 4: AI Commit Message Generator

Now let's build the AI-powered message generator. Create `src/commitMessageGenerator.ts`.

### Understanding the AI Flow

1. Take the git diff + context
2. Build a smart prompt for Gemini
3. Call Gemini API
4. Parse the JSON response
5. Return 3 suggestions (brief, standard, detailed)

### Step 1: Create File and Imports

```typescript
import { GoogleGenAI } from '@google/genai';
import * as vscode from 'vscode';
import { FileContext, BranchInfo } from './gitService';
```

**Why these imports:**
- `GoogleGenAI` - Gemini AI client
- `vscode` - VS Code API for settings and output
- Our interfaces from GitService

### Step 2: Define Result Interfaces

```typescript
export interface CommitSuggestion {
    message: string;
    style: 'brief' | 'standard' | 'detailed';
    reasoning: string;
}

export interface GenerationResult {
    suggestions: CommitSuggestion[];
    confidence: number;
    patterns: string[];
    splitSuggestion?: {
        shouldSplit: boolean;
        reasoning: string;
    };
}
```

**What these represent:**
- `CommitSuggestion` - A single commit message option
- `GenerationResult` - Complete response with 3 suggestions + metadata

### Step 3: Create the Generator Class

```typescript
export class CommitMessageGenerator {
    private outputChannel: vscode.OutputChannel;

    constructor(outputChannel: vscode.OutputChannel) {
        this.outputChannel = outputChannel;
    }
}
```

### Step 4: Implement the Main generateMessage Method

This is the entry point:

```typescript
async generateMessage(
    diff: string,
    recentCommits: string[],
    fileContext: FileContext,
    branchInfo: BranchInfo,
    apiKey: string
): Promise<GenerationResult> {
    // Get user settings
    const config = vscode.workspace.getConfiguration('gitgenie');
    const useConventional = config.get<boolean>('conventionalCommits', true);
    const includeEmoji = config.get<boolean>('includeEmoji', false);
    const modelName = config.get<string>('model', 'gemini-2.0-flash');

    // Initialize Gemini client
    const client = new GoogleGenAI({ apiKey: apiKey });

    // Build the prompt (we'll implement this next)
    const prompt = this.buildPrompt(
        diff,
        recentCommits,
        fileContext,
        branchInfo,
        useConventional,
        includeEmoji
    );

    this.outputChannel.appendLine(`Using model: ${modelName}`);

    try {
        // Call Gemini API
        const result = await client.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 1024,
            }
        });

        const text = result.text || '';

        // Parse the response (we'll implement this next)
        const parsed = this.parseResponse(text);

        return parsed;
    } catch (error) {
        this.outputChannel.appendLine(`Error: ${error}`);
        return this.generateFallback(diff, fileContext);
    }
}
```

**What this does:**
- Gets user preferences from settings
- Initializes Gemini client with API key
- Calls the API with appropriate parameters
- Falls back to simple messages on error

### Step 5: Implement buildPrompt Method

This creates the AI prompt:

```typescript
private buildPrompt(
    diff: string,
    recentCommits: string[],
    fileContext: FileContext,
    branchInfo: BranchInfo,
    useConventional: boolean,
    includeEmoji: boolean
): string {
    // Add conventional commits guide if enabled
    const conventionalTypes = useConventional ? `
Use Conventional Commits format:
- feat: New feature
- fix: Bug fix
- docs: Documentation
- style: Formatting
- refactor: Code restructuring
- perf: Performance
- test: Tests
- chore: Maintenance
` : '';

    // Add emoji guide if enabled
    const emojiGuide = includeEmoji ? `
Include ONE emoji at start:
✨ feat | 🐛 fix | 📝 docs | 💄 style | ♻️ refactor | ⚡ perf | ✅ test
` : '';

    // Add branch context if we found an issue number
    const branchContext = branchInfo.issueNumber ? `
Branch indicates issue: #${branchInfo.issueNumber}
` : '';

    // Show recent commits to learn style
    const recentCommitsContext = recentCommits.length > 0 ? `
Recent commits (learn the style):
${recentCommits.slice(0, 5).map(c => `- ${c}`).join('\n')}
` : '';

    // Truncate diff if too long (API has limits)
    const maxDiffLength = 8000;
    const truncatedDiff = diff.length > maxDiffLength
        ? diff.substring(0, maxDiffLength) + '\n... (truncated)'
        : diff;

    // Build the complete prompt
    return `You are an expert at writing git commit messages.

Context:
- Language: ${fileContext.primaryLanguage}
- Frameworks: ${fileContext.frameworks.join(', ') || 'none'}
- Files: ${fileContext.fileTypes.join(', ')}
- Tests: ${fileContext.hasTests ? 'yes' : 'no'}
- Docs: ${fileContext.hasDocs ? 'yes' : 'no'}
- Branch: ${branchInfo.name}
${branchContext}

${recentCommitsContext}

${conventionalTypes}
${emojiGuide}

Analyze this diff and generate 3 commit messages:

DIFF:
\`\`\`diff
${truncatedDiff}
\`\`\`

Respond with JSON:
{
  "suggestions": [
    {
      "message": "brief message",
      "style": "brief",
      "reasoning": "why this message"
    },
    {
      "message": "standard message",
      "style": "standard",
      "reasoning": "detailed explanation"
    },
    {
      "message": "detailed message\\n\\nWith body",
      "style": "detailed",
      "reasoning": "full analysis"
    }
  ],
  "confidence": 0.85,
  "patterns": ["new feature", "validation"]
}

Focus on WHAT the code does, not just file names.
Respond with ONLY valid JSON.`;
}
```

**What this does:**
- Builds a context-rich prompt with all the information
- Includes user preferences (conventional commits, emojis)
- Shows recent commits so AI learns your style
- Asks for 3 different message styles
- Requests structured JSON response

### Step 6: Implement parseResponse Method

This extracts the JSON from AI response:

```typescript
private parseResponse(text: string): GenerationResult {
    try {
        // Remove markdown code blocks if present
        const cleanedText = text
            .replace(/```json\n?/g, '')
            .replace(/```\n?/g, '')
            .trim();

        // Find JSON object
        const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);

            // Validate structure
            if (parsed.suggestions && Array.isArray(parsed.suggestions)) {
                return {
                    suggestions: parsed.suggestions.map((s: any) => ({
                        message: s.message || 'Update code',
                        style: s.style || 'standard',
                        reasoning: s.reasoning || 'Changes detected'
                    })),
                    confidence: parsed.confidence || 0.5,
                    patterns: parsed.patterns || []
                };
            }
        }
    } catch (error) {
        this.outputChannel.appendLine(`Parse error: ${error}`);
    }

    // Return fallback if parsing fails
    return this.generateFallback('', {} as FileContext);
}
```

**What this does:**
- Strips markdown formatting from response
- Extracts JSON using regex
- Validates the structure
- Provides defaults if fields are missing

### Step 7: Implement generateFallback Method

This creates simple messages when AI fails:

```typescript
private generateFallback(diff: string, fileContext: FileContext): GenerationResult {
    let baseMessage = 'Update code';

    // Try to be a bit smarter based on context
    if (fileContext.hasTests) {
        baseMessage = 'Update tests';
    } else if (fileContext.hasDocs) {
        baseMessage = 'Update documentation';
    } else if (fileContext.primaryLanguage !== 'Unknown') {
        baseMessage = `Update ${fileContext.primaryLanguage} code`;
    }

    return {
        suggestions: [
            {
                message: baseMessage,
                style: 'brief',
                reasoning: 'Fallback - AI unavailable'
            },
            {
                message: `${baseMessage} with improvements`,
                style: 'standard',
                reasoning: 'Fallback - AI unavailable'
            },
            {
                message: `${baseMessage}\n\nMultiple changes detected`,
                style: 'detailed',
                reasoning: 'Fallback - AI unavailable'
            }
        ],
        confidence: 0.3,
        patterns: ['fallback']
    };
}
```

**What this does:**
- Provides basic messages when API fails
- Uses context to make slightly better guesses
- Always returns 3 options to keep UI consistent

### Step 8: Implement detectSplitSuggestion Method (Bonus Feature)

This warns when commits should be split:

```typescript
private detectSplitSuggestion(
    diff: string,
    result: GenerationResult
): { shouldSplit: boolean; reasoning: string } | null {
    const patterns = result.patterns || [];

    // Check for mixed concerns
    const hasMixedConcerns =
        (patterns.includes('new feature') && patterns.includes('bug fix')) ||
        (patterns.includes('refactoring') && patterns.includes('new feature'));

    if (hasMixedConcerns) {
        return {
            shouldSplit: true,
            reasoning: 'Consider splitting - unrelated changes detected'
        };
    }

    // Check for too many files
    const files = diff.match(/\+\+\+ b\/([^\n]+)/g);
    if (files && files.length > 10) {
        return {
            shouldSplit: true,
            reasoning: `Large commit - ${files.length} files changed`
        };
    }

    return null;
}
```

**What this does:**
- Detects when you're mixing different types of changes
- Warns about commits that touch too many files
- Encourages atomic commits (one logical change per commit)

### Your Complete Commit Message Generator Should Look Like:

<details>
<summary>Click to expand full commitMessageGenerator.ts</summary>

```typescript
import { GoogleGenAI } from '@google/genai';
import * as vscode from 'vscode';
import { FileContext, BranchInfo } from './gitService';

export interface CommitSuggestion {
    message: string;
    style: 'brief' | 'standard' | 'detailed';
    reasoning: string;
}

export interface GenerationResult {
    suggestions: CommitSuggestion[];
    confidence: number;
    patterns: string[];
    splitSuggestion?: {
        shouldSplit: boolean;
        reasoning: string;
    };
}

export class CommitMessageGenerator {
    private outputChannel: vscode.OutputChannel;

    constructor(outputChannel: vscode.OutputChannel) {
        this.outputChannel = outputChannel;
    }

    async generateMessage(
        diff: string,
        recentCommits: string[],
        fileContext: FileContext,
        branchInfo: BranchInfo,
        apiKey: string
    ): Promise<GenerationResult> {
        const config = vscode.workspace.getConfiguration('gitgenie');
        const useConventional = config.get<boolean>('conventionalCommits', true);
        const includeEmoji = config.get<boolean>('includeEmoji', false);
        const modelName = config.get<string>('model', 'gemini-2.0-flash');

        const client = new GoogleGenAI({ apiKey: apiKey });

        const prompt = this.buildPrompt(diff, recentCommits, fileContext, branchInfo, useConventional, includeEmoji);

        this.outputChannel.appendLine(`Using model: ${modelName}`);
        this.outputChannel.appendLine(`Diff size: ${diff.length} characters`);

        try {
            const result = await client.models.generateContent({
                model: modelName,
                contents: prompt,
                config: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 1024,
                }
            });

            const text = result.text || '';
            this.outputChannel.appendLine(`Response: ${text.length} characters`);

            const parsed = this.parseResponse(text);

            const splitSuggestion = this.detectSplitSuggestion(diff, parsed);
            if (splitSuggestion) {
                parsed.splitSuggestion = splitSuggestion;
            }

            return parsed;
        } catch (error) {
            this.outputChannel.appendLine(`Error: ${error}`);
            return this.generateFallback(diff, fileContext);
        }
    }

    private buildPrompt(
        diff: string,
        recentCommits: string[],
        fileContext: FileContext,
        branchInfo: BranchInfo,
        useConventional: boolean,
        includeEmoji: boolean
    ): string {
        const conventionalTypes = useConventional ? `
Use Conventional Commits format. Choose the appropriate type:
- feat: New feature
- fix: Bug fix
- docs: Documentation only changes
- style: Code formatting
- refactor: Code restructuring
- perf: Performance improvements
- test: Adding tests
- build: Build system changes
- ci: CI configuration
- chore: Other changes
` : '';

        const emojiGuide = includeEmoji ? `
Include ONE appropriate emoji at start:
✨ feat | 🐛 fix | 📝 docs | 💄 style | ♻️ refactor | ⚡ perf | ✅ test
` : '';

        const branchContext = branchInfo.issueNumber ? `
Branch indicates issue: #${branchInfo.issueNumber}
` : '';

        const recentCommitsContext = recentCommits.length > 0 ? `
Recent commits (learn the style):
${recentCommits.slice(0, 5).map(c => `- ${c}`).join('\n')}
` : '';

        const maxDiffLength = 8000;
        const truncatedDiff = diff.length > maxDiffLength
            ? diff.substring(0, maxDiffLength) + '\n... (diff truncated)'
            : diff;

        return `You are an expert at writing clear git commit messages.

Context:
- Language: ${fileContext.primaryLanguage}
- Frameworks: ${fileContext.frameworks.join(', ') || 'none'}
- Files: ${fileContext.fileTypes.join(', ')}
- Tests: ${fileContext.hasTests ? 'included' : 'not included'}
- Docs: ${fileContext.hasDocs ? 'updated' : 'not updated'}
- Branch: ${branchInfo.name}
${branchContext}

${recentCommitsContext}

${conventionalTypes}
${emojiGuide}

Analyze this diff and generate 3 commit message suggestions:

DIFF:
\`\`\`diff
${truncatedDiff}
\`\`\`

Respond with JSON:
{
  "suggestions": [
    {
      "message": "brief message",
      "style": "brief",
      "reasoning": "explanation"
    },
    {
      "message": "standard message",
      "style": "standard",
      "reasoning": "detailed explanation"
    },
    {
      "message": "detailed message\\n\\nWith body",
      "style": "detailed",
      "reasoning": "comprehensive analysis"
    }
  ],
  "confidence": 0.85,
  "patterns": ["validation", "new feature"]
}

Focus on WHAT the code does, not just file names.
Respond with ONLY valid JSON.`;
    }

    private parseResponse(text: string): GenerationResult {
        try {
            const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);

            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);

                if (parsed.suggestions && Array.isArray(parsed.suggestions)) {
                    return {
                        suggestions: parsed.suggestions.map((s: any) => ({
                            message: s.message || 'Update code',
                            style: s.style || 'standard',
                            reasoning: s.reasoning || 'Changes detected'
                        })),
                        confidence: parsed.confidence || 0.5,
                        patterns: parsed.patterns || []
                    };
                }
            }
        } catch (error) {
            this.outputChannel.appendLine(`Parse error: ${error}`);
        }

        return this.generateFallback('', {} as FileContext);
    }

    private generateFallback(diff: string, fileContext: FileContext): GenerationResult {
        let baseMessage = 'Update code';

        if (fileContext.hasTests) {
            baseMessage = 'Update tests';
        } else if (fileContext.hasDocs) {
            baseMessage = 'Update documentation';
        } else if (fileContext.primaryLanguage !== 'Unknown') {
            baseMessage = `Update ${fileContext.primaryLanguage} code`;
        }

        return {
            suggestions: [
                {
                    message: baseMessage,
                    style: 'brief',
                    reasoning: 'Fallback - AI unavailable'
                },
                {
                    message: `${baseMessage} with improvements`,
                    style: 'standard',
                    reasoning: 'Fallback - AI unavailable'
                },
                {
                    message: `${baseMessage}\n\nMultiple changes detected`,
                    style: 'detailed',
                    reasoning: 'Fallback - AI unavailable'
                }
            ],
            confidence: 0.3,
            patterns: ['fallback']
        };
    }

    private detectSplitSuggestion(diff: string, result: GenerationResult): { shouldSplit: boolean; reasoning: string } | null {
        const patterns = result.patterns || [];
        const hasMixedConcerns =
            (patterns.includes('new feature') && patterns.includes('bug fix')) ||
            (patterns.includes('refactoring') && patterns.includes('new feature'));

        if (hasMixedConcerns) {
            return {
                shouldSplit: true,
                reasoning: 'Consider splitting - unrelated changes detected'
            };
        }

        const files = diff.match(/\+\+\+ b\/([^\n]+)/g);
        if (files && files.length > 10) {
            return {
                shouldSplit: true,
                reasoning: `Large commit - ${files.length} files changed`
            };
        }

        return null;
    }
}
```

</details>

---

## Part 5: Main Extension Logic

Now let's wire everything together in `src/extension.ts`.

### Understanding Extension Lifecycle

VS Code extensions have two key functions:
- `activate()` - Called when extension starts
- `deactivate()` - Called when extension stops

### Step 1: Set Up Imports

Replace the content of `src/extension.ts` with:

```typescript
import * as vscode from 'vscode';
import { CommitMessageGenerator } from './commitMessageGenerator';
import { GitService } from './gitService';

let outputChannel: vscode.OutputChannel;
```

### Step 2: Implement activate Function

This runs when the extension starts:

```typescript
export function activate(context: vscode.ExtensionContext) {
    // Create output channel for logging
    outputChannel = vscode.window.createOutputChannel('GitGenie');
    outputChannel.appendLine('GitGenie activated');

    // Create our service instances
    const gitService = new GitService();
    const generator = new CommitMessageGenerator(outputChannel);

    // We'll register commands next...
}
```

**What this does:**
- Creates an output channel (for logs)
- Initializes our Git and AI services

### Step 3: Register Commands

Add command registration inside `activate`:

```typescript
// Register the main generate command
const generateCommand = vscode.commands.registerCommand(
    'gitgenie.generateMessage',
    async () => {
        await generateCommitMessage(gitService, generator, false);
    }
);

// Register the explain command
const generateWithExplanationCommand = vscode.commands.registerCommand(
    'gitgenie.generateWithExplanation',
    async () => {
        await generateCommitMessage(gitService, generator, true);
    }
);
```

**What this does:**
- Registers our two commands with VS Code
- Both call the same function with different flags

### Step 4: Create Status Bar Item

Add this to `activate`:

```typescript
// Create status bar item
const statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    100
);
statusBarItem.text = "$(sparkle) GitGenie";
statusBarItem.tooltip = "Generate commit message (Ctrl+Shift+G)";
statusBarItem.command = 'gitgenie.generateMessage';
statusBarItem.show();
```

**What this does:**
- Adds a clickable "GitGenie" button to status bar
- Uses the sparkle icon
- Clicking it triggers commit generation

### Step 5: Add to Subscriptions

Still in `activate`, track resources:

```typescript
context.subscriptions.push(
    generateCommand,
    generateWithExplanationCommand,
    statusBarItem,
    outputChannel
);
```

**What this does:**
- Tells VS Code to clean up these resources when extension deactivates

### Step 6: Show Welcome Message

Add welcome for first-time users:

```typescript
// Show welcome message on first use
const hasShownWelcome = context.globalState.get('gitgenie.welcomeShown');
if (!hasShownWelcome) {
    showWelcomeMessage(context);
}
```

### Step 7: Implement generateCommitMessage Function

Now implement the main logic function (outside of `activate`):

```typescript
async function generateCommitMessage(
    gitService: GitService,
    generator: CommitMessageGenerator,
    showExplanation: boolean
) {
    try {
        // Step 1: Check for API key
        const config = vscode.workspace.getConfiguration('gitgenie');
        const apiKey = config.get<string>('geminiApiKey');

        if (!apiKey) {
            const result = await vscode.window.showErrorMessage(
                'Gemini API key not configured.',
                'Open Settings',
                'Get API Key'
            );

            if (result === 'Open Settings') {
                vscode.commands.executeCommand(
                    'workbench.action.openSettings',
                    'gitgenie.geminiApiKey'
                );
            } else if (result === 'Get API Key') {
                vscode.env.openExternal(
                    vscode.Uri.parse('https://makersuite.google.com/app/apikey')
                );
            }
            return;
        }

        // Step 2: Check for workspace
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            vscode.window.showErrorMessage('No workspace folder open');
            return;
        }

        // Step 3: Show progress and gather data
        await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: 'GitGenie',
                cancellable: true
            },
            async (progress, token) => {
                // Get the diff
                progress.report({ increment: 20, message: 'Analyzing changes...' });
                const diff = await gitService.getStagedDiff(workspaceFolder.uri.fsPath);

                if (!diff) {
                    vscode.window.showInformationMessage(
                        'No changes found. Stage your changes first.'
                    );
                    return;
                }

                // Get commit history
                progress.report({ increment: 20, message: 'Learning from history...' });
                const recentCommits = await gitService.getRecentCommits(
                    workspaceFolder.uri.fsPath,
                    10
                );

                // Get file context
                progress.report({ increment: 20, message: 'Analyzing context...' });
                const fileContext = await gitService.getFileContext(workspaceFolder.uri.fsPath);
                const branchInfo = await gitService.getBranchInfo(workspaceFolder.uri.fsPath);

                // Generate messages
                progress.report({ increment: 20, message: 'Generating messages...' });
                const result = await generator.generateMessage(
                    diff,
                    recentCommits,
                    fileContext,
                    branchInfo,
                    apiKey
                );

                progress.report({ increment: 20, message: 'Done!' });

                // Show results (we'll implement this next)
                // ...
            }
        );
    } catch (error) {
        vscode.window.showErrorMessage(
            `Failed to generate: ${error instanceof Error ? error.message : String(error)}`
        );
    }
}
```

**What this does:**
- Validates API key is configured
- Shows progress notification
- Gathers all context (diff, history, file info)
- Calls AI to generate messages
- Handles errors gracefully

### Step 8: Show Results to User

Inside the `withProgress` callback, after getting the result, add:

```typescript
// Show results
if (showExplanation) {
    // Show with reasoning
    const items = result.suggestions.map(s => ({
        label: s.message,
        description: `$(${getStyleIcon(s.style)}) ${s.style}`,
        detail: `💡 ${s.reasoning}`,
        suggestion: s
    }));

    const picked = await vscode.window.showQuickPick(items, {
        placeHolder: 'Select a commit message',
        matchOnDetail: true
    });

    if (picked) {
        await applyCommitMessage(picked.suggestion.message);
    }
} else {
    // Show without reasoning
    const picked = await vscode.window.showQuickPick(
        result.suggestions.map(s => ({
            label: s.message,
            description: `$(${getStyleIcon(s.style)}) ${s.style}`
        })),
        {
            placeHolder: 'Select a commit message'
        }
    );

    if (picked) {
        await applyCommitMessage(picked.label);
    }
}
```

**What this does:**
- Shows quick pick menu with 3 options
- Optionally includes AI reasoning
- Applies selected message

### Step 9: Implement Helper Functions

Add these helper functions after `generateCommitMessage`:

```typescript
function getStyleIcon(style: string): string {
    switch (style) {
        case 'brief': return 'dash';
        case 'standard': return 'check';
        case 'detailed': return 'checklist';
        default: return 'circle';
    }
}

async function applyCommitMessage(message: string) {
    // Get Git extension API
    const gitExtension = vscode.extensions.getExtension('vscode.git')?.exports;
    const api = gitExtension?.getAPI(1);

    if (api && api.repositories.length > 0) {
        // Apply to git input box
        const repo = api.repositories[0];
        repo.inputBox.value = message;

        // Show the Source Control panel
        await vscode.commands.executeCommand('workbench.view.scm');

        // Ask if user wants to commit now
        vscode.window.showInformationMessage(
            'Commit message applied!',
            'Commit Now'
        ).then(selection => {
            if (selection === 'Commit Now') {
                vscode.commands.executeCommand('git.commit');
            }
        });
    } else {
        // Fallback: copy to clipboard
        await vscode.env.clipboard.writeText(message);
        vscode.window.showInformationMessage('Message copied to clipboard!');
    }
}

function showWelcomeMessage(context: vscode.ExtensionContext) {
    vscode.window.showInformationMessage(
        'Welcome to GitGenie! Press Ctrl+Shift+G to generate commit messages',
        'Open Settings',
        'Get API Key'
    ).then(selection => {
        if (selection === 'Open Settings') {
            vscode.commands.executeCommand('workbench.action.openSettings', 'gitgenie');
        } else if (selection === 'Get API Key') {
            vscode.env.openExternal(vscode.Uri.parse('https://makersuite.google.com/app/apikey'));
        }
    });

    context.globalState.update('gitgenie.welcomeShown', true);
}
```

**What these do:**
- `getStyleIcon` - Returns icon for each message style
- `applyCommitMessage` - Puts message in git input box
- `showWelcomeMessage` - First-run experience

### Step 10: Implement deactivate Function

```typescript
export function deactivate() {
    if (outputChannel) {
        outputChannel.dispose();
    }
}
```

**What this does:**
- Cleans up resources when extension stops

### Your Complete extension.ts Should Look Like:

<details>
<summary>Click to expand full extension.ts</summary>

```typescript
import * as vscode from 'vscode';
import { CommitMessageGenerator } from './commitMessageGenerator';
import { GitService } from './gitService';

let outputChannel: vscode.OutputChannel;

export function activate(context: vscode.ExtensionContext) {
    outputChannel = vscode.window.createOutputChannel('GitGenie');

    console.log('GitGenie is now active!');
    outputChannel.appendLine('GitGenie activated');

    const gitService = new GitService();
    const generator = new CommitMessageGenerator(outputChannel);

    const generateCommand = vscode.commands.registerCommand(
        'gitgenie.generateMessage',
        async () => {
            await generateCommitMessage(gitService, generator, false);
        }
    );

    const generateWithExplanationCommand = vscode.commands.registerCommand(
        'gitgenie.generateWithExplanation',
        async () => {
            await generateCommitMessage(gitService, generator, true);
        }
    );

    const statusBarItem = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Left,
        100
    );
    statusBarItem.text = "$(sparkle) GitGenie";
    statusBarItem.tooltip = "Generate commit message (Ctrl+Shift+G)";
    statusBarItem.command = 'gitgenie.generateMessage';
    statusBarItem.show();

    context.subscriptions.push(
        generateCommand,
        generateWithExplanationCommand,
        statusBarItem,
        outputChannel
    );

    const hasShownWelcome = context.globalState.get('gitgenie.welcomeShown');
    if (!hasShownWelcome) {
        showWelcomeMessage(context);
    }
}

async function generateCommitMessage(
    gitService: GitService,
    generator: CommitMessageGenerator,
    showExplanation: boolean
) {
    try {
        const config = vscode.workspace.getConfiguration('gitgenie');
        const apiKey = config.get<string>('geminiApiKey');

        if (!apiKey) {
            const result = await vscode.window.showErrorMessage(
                'Gemini API key not configured.',
                'Open Settings',
                'Get API Key'
            );
            if (result === 'Open Settings') {
                vscode.commands.executeCommand('workbench.action.openSettings', 'gitgenie.geminiApiKey');
            } else if (result === 'Get API Key') {
                vscode.env.openExternal(vscode.Uri.parse('https://makersuite.google.com/app/apikey'));
            }
            return;
        }

        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            vscode.window.showErrorMessage('No workspace folder open');
            return;
        }

        await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: 'GitGenie',
                cancellable: true
            },
            async (progress, token) => {
                progress.report({ increment: 20, message: 'Analyzing changes...' });

                const diff = await gitService.getStagedDiff(workspaceFolder.uri.fsPath);

                if (!diff) {
                    vscode.window.showInformationMessage('No staged changes found. Stage your changes first.');
                    return;
                }

                if (token.isCancellationRequested) {
                    return;
                }

                progress.report({ increment: 20, message: 'Learning from history...' });
                const recentCommits = await gitService.getRecentCommits(workspaceFolder.uri.fsPath, 10);

                progress.report({ increment: 20, message: 'Analyzing context...' });
                const fileContext = await gitService.getFileContext(workspaceFolder.uri.fsPath);
                const branchInfo = await gitService.getBranchInfo(workspaceFolder.uri.fsPath);

                if (token.isCancellationRequested) {
                    return;
                }

                progress.report({ increment: 20, message: 'Generating messages...' });

                const result = await generator.generateMessage(
                    diff,
                    recentCommits,
                    fileContext,
                    branchInfo,
                    apiKey
                );

                progress.report({ increment: 20, message: 'Done!' });

                if (showExplanation) {
                    const items = result.suggestions.map(s => ({
                        label: s.message,
                        description: `$(${getStyleIcon(s.style)}) ${s.style}`,
                        detail: `💡 ${s.reasoning}`,
                        suggestion: s
                    }));

                    const picked = await vscode.window.showQuickPick(items, {
                        placeHolder: 'Select a commit message',
                        matchOnDetail: true
                    });

                    if (picked) {
                        await applyCommitMessage(picked.suggestion.message);
                    }
                } else {
                    const picked = await vscode.window.showQuickPick(
                        result.suggestions.map(s => ({
                            label: s.message,
                            description: `$(${getStyleIcon(s.style)}) ${s.style}`
                        })),
                        {
                            placeHolder: 'Select a commit message'
                        }
                    );

                    if (picked) {
                        await applyCommitMessage(picked.label);
                    }
                }
            }
        );
    } catch (error) {
        outputChannel.appendLine(`Error: ${error}`);
        console.error('Error generating commit message:', error);
        vscode.window.showErrorMessage(`Failed to generate: ${error instanceof Error ? error.message : String(error)}`);
    }
}

function getStyleIcon(style: string): string {
    switch (style) {
        case 'brief': return 'dash';
        case 'standard': return 'check';
        case 'detailed': return 'checklist';
        default: return 'circle';
    }
}

async function applyCommitMessage(message: string) {
    const gitExtension = vscode.extensions.getExtension('vscode.git')?.exports;
    const api = gitExtension?.getAPI(1);

    if (api && api.repositories.length > 0) {
        const repo = api.repositories[0];
        repo.inputBox.value = message;

        await vscode.commands.executeCommand('workbench.view.scm');

        vscode.window.showInformationMessage(
            'Commit message applied!',
            'Commit Now'
        ).then(selection => {
            if (selection === 'Commit Now') {
                vscode.commands.executeCommand('git.commit');
            }
        });
    } else {
        await vscode.env.clipboard.writeText(message);
        vscode.window.showInformationMessage('Message copied to clipboard!');
    }
}

function showWelcomeMessage(context: vscode.ExtensionContext) {
    vscode.window.showInformationMessage(
        'Welcome to GitGenie! Press Ctrl+Shift+G to generate AI-powered commit messages',
        'Open Settings',
        'Get API Key'
    ).then(selection => {
        if (selection === 'Open Settings') {
            vscode.commands.executeCommand('workbench.action.openSettings', 'gitgenie');
        } else if (selection === 'Get API Key') {
            vscode.env.openExternal(vscode.Uri.parse('https://makersuite.google.com/app/apikey'));
        }
    });

    context.globalState.update('gitgenie.welcomeShown', true);
}

export function deactivate() {
    if (outputChannel) {
        outputChannel.dispose();
    }
}
```

</details>

---

## Part 6: Configuration & Commands

Your extension is now fully functional! Let's review what users can do:

### Available Commands

Open Command Palette (Ctrl+Shift+P) and type "GitGenie":

1. **GitGenie: Generate Commit Message**
   - Quick generation without explanations
   - Keyboard shortcut: Ctrl+Shift+G (Cmd+Shift+G on Mac)

2. **GitGenie: Generate Commit Message with Explanation**
   - Shows AI reasoning for each suggestion
   - Great for learning good commit practices

### Settings

Open Settings (File → Preferences → Settings) and search for "GitGenie":

1. **API Key** (`gitgenie.geminiApiKey`)
   - Your Gemini API key
   - Required for the extension to work

2. **Model** (`gitgenie.model`)
   - Choose which Gemini model to use
   - Options: flash (fast), pro (smart)

3. **Conventional Commits** (`gitgenie.conventionalCommits`)
   - Enable/disable conventional format
   - Formats: `feat:`, `fix:`, etc.

4. **Include Emoji** (`gitgenie.includeEmoji`)
   - Add emojis to messages
   - Example: ✨ feat: Add new feature

### UI Integration

- **Status Bar**: Click the sparkle icon
- **Source Control Panel**: Click the wand button
- **Keyboard**: Press Ctrl+Shift+G

---

## Part 7: Build System

### Development Workflow

1. **Start Watch Mode**

```bash
npm run watch
```

This runs two processes:
- TypeScript type checker (watches for type errors)
- esbuild (bundles your code)

2. **Press F5 to Debug**
   - Opens Extension Development Host
   - Test your extension in a new VS Code window
   - Console logs appear in Debug Console

3. **Make Changes**
   - Edit files in `src/`
   - Watch mode automatically rebuilds
   - Press `Ctrl+R` in Extension Host to reload

### Production Build

```bash
npm run package
```

This creates an optimized build:
- Minified JavaScript
- No source maps
- Ready for distribution

### Project Structure

```
gitgenie/
├── src/
│   ├── extension.ts              # Main entry point
│   ├── gitService.ts             # Git operations
│   └── commitMessageGenerator.ts  # AI logic
├── dist/
│   └── extension.js              # Bundled output
├── package.json                  # Extension manifest
├── tsconfig.json                 # TypeScript config
├── esbuild.js                    # Build script
└── README.md                     # Documentation
```

---

## Part 8: Testing & Debugging

### Test the Extension

1. **Open Extension Project in VS Code**

```bash
code .
```

2. **Press F5**
   - VS Code opens a new "Extension Development Host" window
   - Your extension is loaded there

3. **Open a Git Repository**
   - In the Extension Host, open any folder with git

4. **Make Some Changes**
   - Edit a file
   - Stage it with `git add`

5. **Try the Extension**
   - Press `Ctrl+Shift+G`
   - Or click the GitGenie status bar item
   - Or open Command Palette and run "GitGenie: Generate Commit Message"

### View Logs

1. In Extension Host, open **View → Output**
2. Select **GitGenie** from the dropdown
3. See detailed logs:
   - Model being used
   - Diff size
   - API responses
   - Errors

### Common Issues and Solutions

**"No API key configured"**
```
Solution: Go to Settings → GitGenie → Gemini API Key
Get free key at: https://makersuite.google.com/app/apikey
```

**"No staged changes found"**
```bash
# Stage your changes first
git add .
# Or stage specific files
git add path/to/file.ts
```

**Extension not appearing**
```
1. Check package.json activationEvents is []
2. Reload window: Ctrl+Shift+P → "Reload Window"
3. Check for build errors in terminal
```

**API Rate Limits**
```
Gemini free tier limits:
- 60 requests per minute
- 1500 requests per day
Switch to flash-lite model for more quota
```

---

## Part 9: Publishing

### Prepare for Publishing

#### 1. Create an Icon

Create a 128x128 PNG icon:

```bash
# Save as icon.png in project root
# Recommended: Use a lamp/genie theme
```

#### 2. Write a Great README

Your README should include:
- What the extension does
- Screenshots/GIFs
- Installation instructions
- Usage guide
- Configuration options
- Troubleshooting

#### 3. Update package.json Metadata

```json
{
  "publisher": "your-publisher-name",
  "repository": {
    "type": "git",
    "url": "https://github.com/yourusername/gitgenie"
  },
  "homepage": "https://github.com/yourusername/gitgenie#readme",
  "license": "MIT",
  "bugs": {
    "url": "https://github.com/yourusername/gitgenie/issues"
  }
}
```

### Install Publishing Tools

```bash
npm install -g @vscode/vsce
```

### Package the Extension

```bash
# Create .vsix file
vsce package

# Output: gitgenie-0.0.1.vsix
```

### Test the Package Locally

```bash
# Install from .vsix
code --install-extension gitgenie-0.0.1.vsix

# Test it
# Restart VS Code
# Try the extension in a real project
```

### Publish to Marketplace

#### 1. Create Publisher Account

- Go to https://marketplace.visualstudio.com/manage
- Sign in with Microsoft account
- Create a publisher ID (e.g., "yourname")

#### 2. Get Personal Access Token

- Go to https://dev.azure.com
- Click User Settings → Personal Access Tokens
- Create new token with **Marketplace (Publish)** scope
- Save the token securely

#### 3. Login with VSCE

```bash
vsce login your-publisher-name
# Paste your token when prompted
```

#### 4. Publish

```bash
vsce publish
```

Your extension is now live! 🎉

It will appear at:
```
https://marketplace.visualstudio.com/items?itemName=your-publisher-name.gitgenie
```

### Update the Extension

```bash
# Patch version (0.0.1 → 0.0.2)
vsce publish patch

# Minor version (0.0.2 → 0.1.0)
vsce publish minor

# Major version (0.1.0 → 1.0.0)
vsce publish major
```

---

## Next Steps & Enhancements

### Ideas to Extend GitGenie

#### 1. Multiple Language Support
```typescript
// Add language detection
const userLocale = vscode.env.language;
// Generate messages in user's language
```

#### 2. Custom Templates
```typescript
// Let users define custom message formats
const template = config.get('messageTemplate');
// Apply template to AI suggestions
```

#### 3. Commit History Analysis
```typescript
// Analyze past commits for patterns
const analysis = analyzeCommitQuality(recentCommits);
// Suggest improvements
```

#### 4. Team Standards Enforcement
```typescript
// Validate against team rules
const rules = config.get('teamRules');
// Reject messages that don't comply
```

#### 5. Cost Tracking
```typescript
// Track API usage
const usage = await trackApiCalls();
// Show estimated costs
```

---

## Resources

### Official Documentation
- [VS Code Extension API](https://code.visualstudio.com/api)
- [Google Gemini API Docs](https://ai.google.dev/docs)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [simple-git Documentation](https://github.com/steveukx/git-js)

### Tools Used
- [Yeoman Generator](https://github.com/Microsoft/vscode-generator-code)
- [esbuild](https://esbuild.github.io/)
- [TypeScript](https://www.typescriptlang.org/)

### Community
- GitHub: Report issues and contribute
- VS Code Discord: Get help from community
- Stack Overflow: Tag `vscode-extensions`

---

## Troubleshooting Guide

### Build Issues

**TypeScript errors**
```bash
# Check types
npm run check-types

# Common fix: update @types
npm install --save-dev @types/node@latest @types/vscode@latest
```

**esbuild errors**
```bash
# Clean and rebuild
rm -rf dist node_modules
npm install
npm run compile
```

### Runtime Issues

**Extension not activating**
- Check `activationEvents: []` in package.json
- Look for errors in Debug Console
- Try: Developer: Reload Window

**Commands not appearing**
- Verify command names match exactly
- Check `contributes.commands` in package.json
- Restart Extension Host

**API errors**
- Verify API key is valid
- Check internet connection
- Look at Output → GitGenie for details
- Try a different model (flash vs pro)

---

## Conclusion

Congratulations! You've built GitGenie from scratch! 🎉

### What You've Learned

✅ **VS Code Extension Development**
- Extension manifest (package.json)
- Command registration
- Settings and configuration
- UI integration (menus, keybindings, status bar)

✅ **Gemini AI Integration**
- Setting up the SDK
- Crafting effective prompts
- Handling API responses
- Error handling and fallbacks

✅ **Git Operations**
- Reading diffs programmatically
- Accessing commit history
- Detecting languages and frameworks
- Parsing branch information

✅ **TypeScript Best Practices**
- Interface definitions
- Async/await patterns
- Error handling
- Code organization

✅ **Build & Distribution**
- esbuild configuration
- Development workflow
- Packaging extensions
- Publishing to marketplace

### What GitGenie Does

✨ **Generates 3 styles of messages**: brief, standard, detailed
🧠 **Learns from your history**: analyzes recent commits
🎯 **Context-aware**: detects languages and frameworks
📝 **Conventional commits**: follows industry standards
🎨 **Optional emojis**: adds visual flair
🔍 **Explains reasoning**: teaches good practices
⚡ **Fast**: uses efficient Gemini flash models

---

## Call to Action

**Stop writing "fixed stuff" as commit messages!**

### Share Your Extension
- Publish to VS Code Marketplace
- Share on Twitter/LinkedIn
- Write a blog post about your experience
- Present at local meetups

### Contribute
- Add support for more frameworks
- Improve language detection
- Add new AI models (OpenAI, Claude)
- Create video tutorials

### Build More Tools
This is just the beginning! Use what you learned to build:
- Code documentation generators
- Test generators
- Code review assistants
- Refactoring tools

---

**Built with ✨ at DevFest Ado Ekiti 2025**

Questions or feedback?
- GitHub: [@mastersam07](https://github.com/mastersam07)
- Twitter: [@mastersam_](https://twitter.com/mastersam_)
- Email: abadasamuelosp@gmail.com

**Now go build something amazing!** 🚀
