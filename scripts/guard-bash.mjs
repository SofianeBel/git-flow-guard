// PreToolUse(Bash) hook: hard-block git operations that violate the workflow.
// Exit 2 + stderr = block. Conservative: only blocks confident matches.
import { repoState, readStdinJson } from './lib/git-state.mjs';

const CONVENTIONAL_RE = /^(feat|fix|refactor|docs|test|chore|perf|ci|build|style|revert)(\([^)]+\))?!?: .+/s;

export function checkCommand(command, state) {
  if (!command || !state?.isRepo) return null;

  // Only inspect git/gh invocations. Strip leading cd/env wrappers crudely
  // but never block when unsure.
  const segments = command.split(/&&|\|\||;|\n/).map((s) => s.trim());

  for (const seg of segments) {
    const isGit = /^git\s/.test(seg);
    const isGh = /^gh\s/.test(seg);
    if (!isGit && !isGh) continue;

    // --- merging is the human's job ---
    if (/^gh\s+pr\s+merge\b/.test(seg)) {
      return 'gh pr merge is blocked: merging PRs is the human reviewer\'s decision. Open the PR and wait for review.';
    }

    if (isGit) {
      const protectedHere = state.onProtected;

      // commit on protected branch
      if (/^git\s+commit\b/.test(seg) && protectedHere) {
        return `Committing on protected branch '${state.branch}' is blocked. Run: git switch ${state.hasDev ? 'dev && git pull && git switch -c feat/<scope>' : '-c feat/<scope>'} first.`;
      }

      // conventional commit message check
      const msgMatch = seg.match(/^git\s+commit\b[^]*?(?:-m|--message)(?:=|\s+)(['"])([^]*?)\1/);
      if (msgMatch && !CONVENTIONAL_RE.test(msgMatch[2])) {
        return `Commit message must follow Conventional Commits: <type>(<scope>): <description>\nTypes: feat, fix, refactor, docs, test, chore, perf, ci, build, style, revert.\nGot: "${msgMatch[2].slice(0, 80)}"`;
      }

      // push to protected branches (explicit refspec)
      const pushMatch = seg.match(/^git\s+push\b(.*)$/);
      if (pushMatch) {
        const rest = pushMatch[1];
        if (/(?:^|\s|:)(?:refs\/heads\/)?(main|master|dev)(?:\s|$)/.test(rest)) {
          return 'Pushing directly to main/master/dev is blocked. Push your feature branch (git push -u origin HEAD) and open a PR to dev.';
        }
        // bare `git push` while ON a protected branch
        if (state.onProtected && !/\s\S+\s+\S+/.test(rest.trim() ? ` ${rest.trim()}` : '')) {
          if (!rest.trim() || /^(-u|--set-upstream|origin)?\s*$/.test(rest.trim())) {
            return `git push while on protected branch '${state.branch}' is blocked.`;
          }
        }
        // force push
        if (/(?:^|\s)(?:--force|-f)(?:\s|$)/.test(rest) && !/--force-with-lease/.test(rest)) {
          return 'Plain --force push is blocked. Use --force-with-lease, and only on your own un-merged feature branch.';
        }
      }

      // local merge into protected branch
      if (/^git\s+merge\b/.test(seg) && state.onProtected) {
        return `Merging into '${state.branch}' locally is blocked. Changes reach ${state.branch} only through reviewed PRs.`;
      }

      // deleting protected branches
      if (/^git\s+branch\s+(?:-D|-d|--delete(?:\s+--force)?)\s+.*\b(main|master|dev)\b/.test(seg)) {
        return 'Deleting main/master/dev is blocked.';
      }

      // rebase while on protected branch
      if (/^git\s+rebase\b/.test(seg) && state.onProtected) {
        return `Rebasing protected branch '${state.branch}' is blocked (it rewrites shared history).`;
      }
    }
  }
  return null;
}

// --- main (skipped when imported by tests) ---
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/').split('/').pop())) {
  const input = readStdinJson();
  const command = input?.tool_input?.command ?? '';
  const cwd = input?.cwd ?? process.cwd();
  const state = repoState(cwd);
  const verdict = checkCommand(command, state);
  if (verdict) {
    console.error(`[git-flow-guard] BLOCKED: ${verdict}`);
    process.exit(2);
  }
  process.exit(0);
}
