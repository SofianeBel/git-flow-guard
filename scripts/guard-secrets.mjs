// PreToolUse(Write|Edit|Bash) hook: block secret leaks before they are
// written to files or committed to git history.
import { readStdinJson, git, isGitRepo } from './lib/git-state.mjs';
import { scanText, EXEMPT_FILE_RE, FORBIDDEN_FILE_RE } from './lib/secret-patterns.mjs';

export function checkWrite(filePath, content) {
  if (filePath && EXEMPT_FILE_RE.test(filePath)) return null;
  const findings = scanText(content);
  if (!findings.length) return null;
  const list = findings.slice(0, 5).map((f) => `  - ${f.name}: ${f.match}…`).join('\n');
  return `Potential secret(s) detected in ${filePath ?? 'content'}:\n${list}\nUse environment variables (process.env.X) instead, and keep real values in a gitignored .env file. If this is a false positive, use an obvious placeholder like "your-key-here".`;
}

export function checkGitStaging(command, cwd) {
  if (!/^git\s+(add|commit)\b/.test(command?.trim() ?? '') && !/(?:&&|;)\s*git\s+(add|commit)\b/.test(command ?? '')) {
    return null;
  }
  if (!isGitRepo(cwd)) return null;

  const usesAll = /git\s+commit\b[^]*\s(?:-a|--all|-am)\b/.test(command);

  // Forbidden files staged (or about to be staged)?
  const staged = git(['diff', '--cached', '--name-only'], cwd) ?? '';
  const addTargets = command.match(/git\s+add\s+([^&|;]+)/)?.[1] ?? '';
  const candidates = [...staged.split('\n'), ...addTargets.split(/\s+/)].filter(Boolean);
  for (const f of candidates) {
    if (FORBIDDEN_FILE_RE.test(f) && f !== '.' && f !== '-A' && f !== '--all') {
      return `Staging '${f}' is blocked: env files, private keys, and credential files must never enter git history. Add it to .gitignore.`;
    }
  }

  // Scan the diff that would be committed.
  const diff = git(['diff', usesAll ? 'HEAD' : '--cached'], cwd);
  if (diff) {
    // Only scan added lines, excluding exempt files' hunks (cheap approach:
    // scan whole diff; placeholders are already filtered).
    const added = diff.split('\n').filter((l) => l.startsWith('+') && !l.startsWith('+++')).join('\n');
    const findings = scanText(added);
    if (findings.length) {
      const list = findings.slice(0, 5).map((f) => `  - ${f.name}: ${f.match}…`).join('\n');
      return `Potential secret(s) in the changes you are committing:\n${list}\nRemove them, use environment variables, and if a real key was ever committed before — rotate it.`;
    }
  }
  return null;
}

// --- main ---
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/').split('/').pop())) {
  const input = readStdinJson();
  if (!input) process.exit(0);
  const cwd = input.cwd ?? process.cwd();
  const tool = input.tool_name;
  let verdict = null;

  if (tool === 'Write') {
    verdict = checkWrite(input.tool_input?.file_path, input.tool_input?.content);
  } else if (tool === 'Edit') {
    verdict = checkWrite(input.tool_input?.file_path, input.tool_input?.new_string);
  } else if (tool === 'Bash') {
    verdict = checkGitStaging(input.tool_input?.command ?? '', cwd);
  }

  if (verdict) {
    console.error(`[git-flow-guard] BLOCKED (secret scan): ${verdict}`);
    process.exit(2);
  }
  process.exit(0);
}
