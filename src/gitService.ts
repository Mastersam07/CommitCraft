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
            // Get staged diff
            const diff = await git.diff(['--cached']);

            if (!diff || diff.trim().length === 0) {
                // If nothing staged, check if there are any changes at all
                const status = await git.status();
                if (status.modified.length > 0 || status.created.length > 0 || status.deleted.length > 0) {
                    // Return unstaged diff as fallback (with a note)
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
            // Get recent commit messages
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
            // Include all changed files
            const changedFiles = [
                ...status.modified,
                ...status.created,
                ...status.staged,
                ...status.renamed.map(r => r.to),
            ].filter((v, i, a) => a.indexOf(v) === i); // Remove duplicates

            // Analyze file types
            const extensions = changedFiles.map(file => path.extname(file).toLowerCase());
            const uniqueExtensions = [...new Set(extensions)];

            // Detect primary language
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
                '.elm': 'Elm',
                '.scala': 'Scala',
                '.clj': 'Clojure',
                '.ex': 'Elixir',
                '.exs': 'Elixir',
            };

            let primaryLanguage = 'Unknown';
            for (const ext of uniqueExtensions) {
                if (languageMap[ext]) {
                    primaryLanguage = languageMap[ext];
                    break;
                }
            }

            // Detect frameworks based on files and patterns
            const frameworks: string[] = [];

            // Flutter/Dart
            if (changedFiles.some(f => f.endsWith('.dart') || f.includes('pubspec'))) {
                frameworks.push('Flutter');
            }

            // React
            if (changedFiles.some(f => f.endsWith('.tsx') || f.endsWith('.jsx') || f.includes('react'))) {
                frameworks.push('React');
            }

            // Vue
            if (changedFiles.some(f => f.endsWith('.vue'))) {
                frameworks.push('Vue');
            }

            // Angular
            if (changedFiles.some(f => f.includes('.component.ts') || f.includes('.module.ts') || f.includes('angular'))) {
                frameworks.push('Angular');
            }

            // Next.js
            if (changedFiles.some(f => f.includes('pages/') || f.includes('app/') || f.includes('next.config'))) {
                frameworks.push('Next.js');
            }

            // Express
            if (changedFiles.some(f => f.includes('routes/') || f.includes('middleware/') || f.includes('express'))) {
                frameworks.push('Express');
            }

            // Django
            if (changedFiles.some(f => f.includes('models.py') || f.includes('views.py') || f.includes('urls.py'))) {
                frameworks.push('Django');
            }

            // FastAPI
            if (changedFiles.some(f => f.includes('main.py') && primaryLanguage === 'Python')) {
                frameworks.push('FastAPI');
            }

            // Spring
            if (changedFiles.some(f => f.includes('@SpringBoot') || f.includes('application.properties'))) {
                frameworks.push('Spring');
            }

            // Check for test files
            const hasTests = changedFiles.some(f =>
                f.includes('test') ||
                f.includes('spec') ||
                f.includes('__tests__') ||
                f.endsWith('.test.ts') ||
                f.endsWith('.spec.ts') ||
                f.endsWith('.test.js') ||
                f.endsWith('.spec.js') ||
                f.includes('test_') ||
                f.includes('_test.')
            );

            // Check for documentation
            const hasDocs = changedFiles.some(f =>
                f.endsWith('.md') ||
                f.endsWith('.mdx') ||
                f.includes('README') ||
                f.includes('docs/') ||
                f.includes('documentation/') ||
                f.includes('CHANGELOG') ||
                f.includes('CONTRIBUTING')
            );

            return {
                primaryLanguage,
                frameworks: [...new Set(frameworks)], // Remove duplicates
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

            // Try to extract issue number from branch name
            // Common patterns: feature/123-description, issue-123, bug/123, JIRA-123
            const patterns = [
                /(\d+)/,                    // Just numbers
                /issue[- ](\d+)/i,          // issue-123 or issue 123
                /feature\/(\d+)/i,          // feature/123
                /bug\/(\d+)/i,              // bug/123
                /fix\/(\d+)/i,              // fix/123
                /([A-Z]+-\d+)/,             // JIRA-123, PROJ-456
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

    async getRepositoryInfo(repoPath: string): Promise<{ name: string; isMonorepo: boolean }> {
        try {
            // Check for monorepo indicators
            const monorepoIndicators = [
                'lerna.json',
                'pnpm-workspace.yaml',
                'rush.json',
                'nx.json',
                'turbo.json',
                'workspace.json',
            ];

            let isMonorepo = false;
            for (const indicator of monorepoIndicators) {
                if (fs.existsSync(path.join(repoPath, indicator))) {
                    isMonorepo = true;
                    break;
                }
            }

            // Also check for packages directory with package.json (common monorepo structure)
            if (!isMonorepo && fs.existsSync(path.join(repoPath, 'packages')) &&
                fs.existsSync(path.join(repoPath, 'package.json'))) {
                isMonorepo = true;
            }

            const repoName = path.basename(repoPath);

            return {
                name: repoName,
                isMonorepo
            };
        } catch (error) {
            console.error('Error getting repository info:', error);
            return {
                name: 'unknown',
                isMonorepo: false
            };
        }
    }
}
