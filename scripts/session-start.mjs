// SessionStart hook: inject repo workflow state into context.
import { repoState, readStdinJson } from './lib/git-state.mjs';

const input = readStdinJson();
const cwd = input?.cwd ?? process.cwd();
const s = repoState(cwd);

if (!s.isRepo) process.exit(0);

const missingDocs = Object.entries({
  'README.md': s.docs.readme,
  'CHANGELOG.md': s.docs.changelog,
  'CONTRIBUTING.md': s.docs.contributing,
  '.github/pull_request_template.md': s.docs.prTemplate,
})
  .filter(([, ok]) => !ok)
  .map(([name]) => name);

const lines = [
  '[git-flow-guard] This repo is under the Git-at-Scale workflow. Rules (hard-enforced by hooks):',
  '- NEVER commit on main/master/dev. Always: git switch dev && git pull, then git switch -c feat/<scope> (or fix/, refactor/, chore/).',
  '- One logical step = one Conventional Commit (feat:, fix:, docs:, chore:, ...). Commit as you go.',
  '- When done: update CHANGELOG.md [Unreleased], bump the semver (feat=minor, fix=patch, breaking=major), push -u, open a PR to dev with gh pr create --base dev, then STOP and wait for human review. Never merge PRs yourself.',
  '- When planning multi-step work, use the plan-tasks skill (/flow-plan) to draft tasks.json and create GitHub issues before implementing.',
  '',
  `Repo state: branch=${s.branch} | main=${s.hasMain ? 'yes' : 'NO'} | dev=${s.hasDev ? 'yes' : 'NO'} | version source=${s.versionSource ?? 'NONE'}`,
];

if (!s.hasDev) {
  lines.push('⚠ No dev branch exists. ASK the user (AskUserQuestion) before creating it — see the git-flow-guard:repo-bootstrap skill.');
}
if (missingDocs.length) {
  lines.push(`⚠ Missing docs: ${missingDocs.join(', ')}. ASK the user before scaffolding them (repo-bootstrap skill).`);
}
if (s.onProtected) {
  lines.push(`⚠ Currently on protected branch '${s.branch}'. Create/switch to a feature branch before any change.`);
}

console.log(lines.join('\n'));
process.exit(0);
