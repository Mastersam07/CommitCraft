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
        const config = vscode.workspace.getConfiguration('commitcraft');
        const useConventional = config.get<boolean>('conventionalCommits', true);
        const includeEmoji = config.get<boolean>('includeEmoji', false);
        const modelName = config.get<string>('model', 'gemini-2.0-flash');

        // Initialize the client with API key
        const client = new GoogleGenAI({ apiKey: apiKey });

        // Build the prompt
        const prompt = this.buildPrompt(diff, recentCommits, fileContext, branchInfo, useConventional, includeEmoji);

        this.outputChannel.appendLine(`Using model: ${modelName}`);
        this.outputChannel.appendLine(`Diff size: ${diff.length} characters`);

        try {
            // Generate content using the new API
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
            this.outputChannel.appendLine(`Response received: ${text.length} characters`);

            // Parse the JSON response
            const parsed = this.parseResponse(text);

            // Check if we should suggest splitting
            const splitSuggestion = this.detectSplitSuggestion(diff, parsed);
            if (splitSuggestion) {
                parsed.splitSuggestion = splitSuggestion;
            }

            return parsed;
        } catch (error) {
            this.outputChannel.appendLine(`Error calling Gemini API: ${error}`);
            console.error('Error generating commit message:', error);

            // Fallback to simple generation
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
- feat: New feature for the user
- fix: Bug fix for the user
- docs: Documentation only changes
- style: Changes that do not affect the meaning of the code (white-space, formatting, etc)
- refactor: Code change that neither fixes a bug nor adds a feature
- perf: Code change that improves performance
- test: Adding missing tests or correcting existing tests
- build: Changes that affect the build system or dependencies
- ci: Changes to CI configuration files and scripts
- chore: Other changes that don't modify src or test files
- revert: Reverts a previous commit
` : '';

        const emojiGuide = includeEmoji ? `
Include ONE appropriate emoji at the very start:
✨ feat | 🐛 fix | 📝 docs | 💄 style | ♻️ refactor | ⚡ perf | ✅ test | 🔧 build/config | 👷 ci | 🔥 remove | 🚚 move/rename | 🎨 improve structure
` : '';

        const branchContext = branchInfo.issueNumber ? `
Branch indicates issue/ticket: #${branchInfo.issueNumber}
Include this reference in the commit message when appropriate.
` : '';

        const recentCommitsContext = recentCommits.length > 0 ? `
Recent commit messages from this repository (learn the style):
${recentCommits.slice(0, 5).map(c => `- ${c}`).join('\n')}
` : '';

        // Truncate diff if too long
        const maxDiffLength = 8000;
        const truncatedDiff = diff.length > maxDiffLength
            ? diff.substring(0, maxDiffLength) + '\n... (diff truncated)'
            : diff;

        const prompt = `You are an expert at writing clear, informative git commit messages.

Context about this repository:
- Primary language: ${fileContext.primaryLanguage}
- Frameworks detected: ${fileContext.frameworks.length > 0 ? fileContext.frameworks.join(', ') : 'none'}
- File types changed: ${fileContext.fileTypes.join(', ')}
- Test files ${fileContext.hasTests ? 'included' : 'not included'}
- Documentation ${fileContext.hasDocs ? 'updated' : 'not updated'}
- Branch: ${branchInfo.name}
${branchContext}

${recentCommitsContext}

Instructions:
${conventionalTypes}
${emojiGuide}

Analyze this git diff and generate exactly 3 commit message suggestions.

DIFF:
\`\`\`diff
${truncatedDiff}
\`\`\`

Generate a JSON response with three commit message suggestions and analysis.

Required JSON structure:
{
  "suggestions": [
    {
      "message": "brief commit message here",
      "style": "brief",
      "reasoning": "What the code actually does (functionality, not just files)"
    },
    {
      "message": "standard commit message here",
      "style": "standard",
      "reasoning": "Detailed explanation of the changes and their purpose"
    },
    {
      "message": "detailed commit message\\n\\nWith body explaining:\\n- What changed\\n- Why it changed",
      "style": "detailed",
      "reasoning": "Comprehensive analysis of all changes"
    }
  ],
  "confidence": 0.85,
  "patterns": ["validation", "error handling", "new feature", etc]
}

IMPORTANT RULES:
1. Focus on WHAT the code does functionally, not just which files changed
2. Be specific about the actual logic changes
3. For detailed messages, include a body with bullet points
4. Detect patterns like: error handling, validation, refactoring, performance optimization, new features, bug fixes
5. Set confidence between 0-1 based on how well you understand the changes
6. If you see unrelated changes, note in the patterns array

Respond with ONLY valid JSON, no other text.`;

        return prompt;
    }

    private parseResponse(text: string): GenerationResult {
        try {
            // Try to extract JSON from the response
            // Remove any markdown code blocks if present
            const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

            // Find JSON object in the text
            const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);

                // Validate and ensure correct structure
                if (parsed.suggestions && Array.isArray(parsed.suggestions)) {
                    return {
                        suggestions: parsed.suggestions.map((s: any) => ({
                            message: s.message || 'Update code',
                            style: s.style || 'standard',
                            reasoning: s.reasoning || 'Changes detected in the codebase'
                        })),
                        confidence: parsed.confidence || 0.5,
                        patterns: parsed.patterns || []
                    };
                }
            }
        } catch (error) {
            this.outputChannel.appendLine(`Error parsing AI response: ${error}`);
            console.error('Error parsing AI response:', error);
        }

        // Return a fallback if parsing fails
        return this.generateFallback('', {} as FileContext);
    }

    private generateFallback(diff: string, fileContext: FileContext): GenerationResult {
        // Simple fallback logic
        const lines = diff.split('\n');
        const addedLines = lines.filter(l => l.startsWith('+')).length;
        const removedLines = lines.filter(l => l.startsWith('-')).length;

        let baseMessage = 'Update ';
        if (fileContext.primaryLanguage && fileContext.primaryLanguage !== 'Unknown') {
            baseMessage += `${fileContext.primaryLanguage} `;
        }
        baseMessage += 'code';

        if (addedLines > removedLines * 2) {
            baseMessage = `Add new functionality`;
        } else if (removedLines > addedLines * 2) {
            baseMessage = `Remove deprecated code`;
        } else if (fileContext.hasTests) {
            baseMessage = `Update tests`;
        } else if (fileContext.hasDocs) {
            baseMessage = `Update documentation`;
        }

        return {
            suggestions: [
                {
                    message: baseMessage,
                    style: 'brief',
                    reasoning: 'Automatic fallback - Unable to analyze changes in detail'
                },
                {
                    message: `${baseMessage} with improvements`,
                    style: 'standard',
                    reasoning: 'Automatic fallback - Unable to analyze changes in detail'
                },
                {
                    message: `${baseMessage}\n\n- Modified ${addedLines + removedLines} lines\n- Updated ${fileContext.fileTypes?.join(', ') || 'files'}`,
                    style: 'detailed',
                    reasoning: 'Automatic fallback - Unable to analyze changes in detail'
                }
            ],
            confidence: 0.3,
            patterns: ['fallback']
        };
    }

    // Detect if changes should be split into multiple commits
    private detectSplitSuggestion(diff: string, result: GenerationResult): { shouldSplit: boolean; reasoning: string } | null {
        // Check patterns for mixed concerns
        const patterns = result.patterns || [];
        const hasMixedConcerns =
            (patterns.includes('new feature') && patterns.includes('bug fix')) ||
            (patterns.includes('refactoring') && patterns.includes('new feature')) ||
            patterns.includes('unrelated changes');

        if (hasMixedConcerns) {
            return {
                shouldSplit: true,
                reasoning: 'Consider splitting this into multiple commits - detected unrelated changes mixed together'
            };
        }

        // Check number of files
        const files = diff.match(/\+\+\+ b\/([^\n]+)/g);
        if (files && files.length > 10) {
            return {
                shouldSplit: true,
                reasoning: `Large commit touching ${files.length} files - consider breaking into smaller, focused commits`
            };
        }

        return null;
    }
}
