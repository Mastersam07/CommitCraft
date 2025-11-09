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
                'Gemini API key not configured. Get a free key at Google AI Studio.',
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
                    vscode.window.showInformationMessage('No staged changes found. Stage your changes with `git add` first.');
                    return;
                }

                if (token.isCancellationRequested) {
                    return;
                }

                progress.report({ increment: 20, message: 'Learning from commit history...' });
                const recentCommits = await gitService.getRecentCommits(workspaceFolder.uri.fsPath, 10);

                progress.report({ increment: 20, message: 'Analyzing file context...' });
                const fileContext = await gitService.getFileContext(workspaceFolder.uri.fsPath);
                const branchInfo = await gitService.getBranchInfo(workspaceFolder.uri.fsPath);

                if (token.isCancellationRequested) {
                    return;
                }

                progress.report({ increment: 20, message: 'Generating commit message...' });

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
        vscode.window.showErrorMessage(`Failed to generate commit message: ${error instanceof Error ? error.message : String(error)}`);
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
            'Commit message applied! Review and commit when ready.',
            'Commit Now'
        ).then(selection => {
            if (selection === 'Commit Now') {
                vscode.commands.executeCommand('git.commit');
            }
        });
    } else {
        await vscode.env.clipboard.writeText(message);
        vscode.window.showInformationMessage('Commit message copied to clipboard!');
    }
}

function showWelcomeMessage(context: vscode.ExtensionContext) {
    vscode.window.showInformationMessage(
        'Welcome to GitGenie! Generate your first AI-powered commit message with Ctrl+Shift+G',
        'Open Settings',
        'Get API Key',
        'View Guide'
    ).then(selection => {
        if (selection === 'Open Settings') {
            vscode.commands.executeCommand('workbench.action.openSettings', 'gitgenie');
        } else if (selection === 'Get API Key') {
            vscode.env.openExternal(vscode.Uri.parse('https://makersuite.google.com/app/apikey'));
        } else if (selection === 'View Guide') {
            vscode.env.openExternal(vscode.Uri.parse('https://github.com/mastersam07/gitgenie#readme'));
        }
    });

    context.globalState.update('gitgenie.welcomeShown', true);
}

export function deactivate() {
    if (outputChannel) {
        outputChannel.dispose();
    }
}
