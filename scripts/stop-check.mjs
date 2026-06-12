// Stop hook: gentle reminder (never blocks) when work isn't finished
// per the git-flow workflow: unpushed commits or pushed branch without a PR.
import { execFileSync } from 'node:child_process';
import { repoState, readStdinJson, git } from './lib/git-state.mjs';

const input = readStdinJson();
const cwd = input?.cwd ?? process.cwd();
const s = repoState(cwd);

if (!s.isRepo || s.onProtected) process.exit(0);

const dirty = git(['status', '--porcelain'], cwd);
const reminders = [];

if (dirty) {
  reminders.push('uncommitted changes in the working tree');
}
if (s.unpushed === null) {
  const ahead = git(['rev-list', '--count', `${s.hasDev ? 'dev' : 'HEAD~0'}..HEAD`], cwd);
  if (Number(ahead) > 0) reminders.push('branch has commits but no upstream (never pushed)');
} else if (s.unpushed > 0) {
  reminders.push(`${s.unpushed} unpushed commit(s)`);
}

// PR existence check (best effort; gh may be absent or unauthenticated).
let prChecked = false;
try {
  const out = execFileSync('gh', ['pr', 'list', '--head', s.branch, '--json', 'number'], {
    cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 6000,
  });
  prChecked = true;
  if (JSON.parse(out).length === 0 && s.unpushed === 0) {
    reminders.push('branch is pushed but has no open PR');
  }
} catch { /* gh unavailable — skip */ }

if (reminders.length) {
  console.log(
    `[git-flow-guard] Workflow not finished on '${s.branch}': ${reminders.join('; ')}. ` +
    'Per git-flow: commit (conventional), push -u, then open a PR to dev (/flow-pr) and wait for human review.' +
    (prChecked ? '' : ' (PR status not verified — gh unavailable.)')
  );
}
process.exit(0);
