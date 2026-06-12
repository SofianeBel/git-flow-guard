# git-flow-guard

A Claude Code plugin that makes the AI work like an engineer at a company with real Git discipline — based on the "Git at Scale" playbook.

## What it enforces

In any git repo with a `main`/`dev` structure, the AI must:

1. **Never touch `main`, `master`, or `dev` directly** — commits, pushes, merges, and rebases on protected branches are hard-blocked by hooks.
2. **Branch from `dev`** (`feat/`, `fix/`, `refactor/`, `chore/` — short-lived).
3. **Commit each logical step** with [Conventional Commits](https://www.conventionalcommits.org) — non-conforming messages are blocked.
4. **Never leak secrets** — Write/Edit content and staged git diffs are scanned against ~18 secret patterns (AWS, GitHub, Anthropic, OpenAI, Stripe, private keys, connection strings…); `.env`/key files can't be staged.
5. **Maintain docs** — README.md, CHANGELOG.md (Keep a Changelog), CONTRIBUTING.md, PR template. Missing pieces are detected at session start; the AI asks before scaffolding.
6. **Bump the semver itself** — computed from conventional commit types (feat→minor, fix→patch, breaking→major).
7. **Finish with a PR to `dev`** — then **stop and wait for human review**. `gh pr merge` is blocked; merging is always the human's decision.

## Components

| Piece | Role |
|---|---|
| `hooks/hooks.json` | SessionStart context injection, PreToolUse hard blocks (git rules + secret scan), Stop reminders |
| `skills/git-flow` | The full operating procedure |
| `skills/repo-bootstrap` | Ask-first creation of dev branch, docs, version source |
| `skills/release` | SemVer computation + changelog management |
| `/flow-status` | Read-only workflow health report |
| `/flow-pr` | Finishing move: quality gate → docs → version bump → push → PR to dev → wait |

## Install

```bash
claude plugin marketplace add C:\path\to\git-flow-guard
claude plugin install git-flow-guard
```

Requires Node.js (already required by Claude Code) and optionally `gh` for PR automation.

## Development

```bash
npm test    # unit tests for the bash guard parser and secret scanner
```

This repo follows its own workflow: branch from `dev`, conventional commits, PRs to `dev`, human review.
