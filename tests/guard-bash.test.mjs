import test from 'node:test';
import assert from 'node:assert/strict';
import { checkCommand } from '../scripts/guard-bash.mjs';

const onFeature = { isRepo: true, branch: 'feat/x', onProtected: false, hasDev: true };
const onDev = { isRepo: true, branch: 'dev', onProtected: true, hasDev: true };
const onMain = { isRepo: true, branch: 'main', onProtected: true, hasDev: true };

const block = (cmd, state) => assert.ok(checkCommand(cmd, state), `expected BLOCK: ${cmd}`);
const allow = (cmd, state) => assert.equal(checkCommand(cmd, state), null, `expected ALLOW: ${cmd}`);

test('allows conventional commit on feature branch', () => {
  allow('git commit -m "feat(auth): add login"', onFeature);
  allow('git commit -m "fix: handle null user"', onFeature);
  allow('git commit -m "chore(release): bump version to 1.2.0"', onFeature);
});

test('blocks commit on protected branches', () => {
  block('git commit -m "feat: x"', onDev);
  block('git commit -m "feat: x"', onMain);
});

test('blocks non-conventional commit messages', () => {
  block('git commit -m "fixed stuff"', onFeature);
  block('git commit -m "wip"', onFeature);
});

test('push rules', () => {
  allow('git push -u origin HEAD', onFeature);
  allow('git push -u origin feat/x', onFeature);
  block('git push origin main', onFeature);
  block('git push origin HEAD:dev', onFeature);
  block('git push', onDev);
  block('git push --force origin feat/x', onFeature);
  allow('git push --force-with-lease origin feat/x', onFeature);
});

test('merge and pr merge rules', () => {
  block('git merge feat/x', onDev);
  block('git merge feat/x', onMain);
  allow('git merge dev', onFeature); // updating feature from dev is fine
  block('gh pr merge 12 --squash', onFeature);
});

test('protected branch deletion and rebase', () => {
  block('git branch -D dev', onFeature);
  block('git rebase origin/main', onMain);
  allow('git rebase dev', onFeature);
});

test('non-git commands never blocked', () => {
  allow('npm test', onDev);
  allow('echo "git commit -m hello"', onDev);
  allow('ls -la', onMain);
});

test('compound commands are inspected per segment', () => {
  block('cd repo && git commit -m "bad message"', onFeature);
  allow('npm run lint && git commit -m "test: add coverage"', onFeature);
});
