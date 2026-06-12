// Shared git state helpers for git-flow-guard hooks.
// All functions are synchronous and fail soft: on any error they return
// values that make the hooks no-op (never block the user by accident).

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const PROTECTED_BRANCHES = ['main', 'master', 'dev'];

export function git(args, cwd) {
  try {
    return execFileSync('git', args, {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 4000,
    }).trim();
  } catch {
    return null;
  }
}

export function isGitRepo(cwd) {
  return git(['rev-parse', '--is-inside-work-tree'], cwd) === 'true';
}

export function currentBranch(cwd) {
  return git(['rev-parse', '--abbrev-ref', 'HEAD'], cwd);
}

export function localBranches(cwd) {
  const out = git(['branch', '--format=%(refname:short)'], cwd);
  return out ? out.split('\n').map((b) => b.trim()).filter(Boolean) : [];
}

export function isProtectedBranch(branch) {
  return PROTECTED_BRANCHES.includes(branch);
}

export function repoState(cwd) {
  if (!isGitRepo(cwd)) return { isRepo: false };

  const branches = localBranches(cwd);
  const branch = currentBranch(cwd);
  const root = git(['rev-parse', '--show-toplevel'], cwd) || cwd;

  const hasDoc = (name) => existsSync(join(root, name));
  const upstream = git(['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}'], cwd);
  const unpushed = upstream
    ? Number(git(['rev-list', '--count', `${upstream}..HEAD`], cwd) ?? 0)
    : null; // null = no upstream at all

  return {
    isRepo: true,
    root,
    branch,
    branches,
    hasMain: branches.includes('main') || branches.includes('master'),
    hasDev: branches.includes('dev'),
    onProtected: isProtectedBranch(branch),
    docs: {
      readme: hasDoc('README.md'),
      changelog: hasDoc('CHANGELOG.md'),
      contributing: hasDoc('CONTRIBUTING.md'),
      prTemplate: hasDoc(join('.github', 'pull_request_template.md')),
    },
    versionSource:
      ['package.json', 'pyproject.toml', 'Cargo.toml', 'VERSION'].find(hasDoc) ?? null,
    upstream,
    unpushed,
  };
}

export function readStdinJson() {
  try {
    const data = readFileSync(0, 'utf8');
    return JSON.parse(data);
  } catch {
    return null;
  }
}
