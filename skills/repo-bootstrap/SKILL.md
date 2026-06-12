---
name: repo-bootstrap
description: Ask-first setup of a repo for the git-flow workflow — create the dev branch, scaffold README/CHANGELOG/CONTRIBUTING/PR template, and ensure a version source. Use when session-start context reports a missing dev branch or missing docs.
---

# Repo Bootstrap

When `[git-flow-guard]` session context reports missing pieces, **always ASK the user first** (AskUserQuestion) listing exactly what would be created. Never bootstrap silently.

## What to check

1. `dev` branch exists?
2. Docs: `README.md`, `CHANGELOG.md`, `CONTRIBUTING.md`, `.github/pull_request_template.md`
3. Version source: `package.json` version field, `pyproject.toml`, `Cargo.toml`, or a plain `VERSION` file (create `VERSION` with `0.1.0` if nothing fits).
4. `.gitignore` covers `.env*` (except `.env.example`), `*.pem`, key files.

## How to apply (after user approval)

- **dev branch:** `git switch main && git pull && git switch -c dev && git push -u origin dev`. This is the one allowed direct push (creating the branch itself).
- **Everything else as a PR:** `git switch -c chore/bootstrap-repo` from dev, add the scaffolds, conventional commits per file group, push, `gh pr create --base dev`, wait for review.

## Scaffolds

**CHANGELOG.md** (Keep a Changelog):
```markdown
# Changelog

All notable changes are documented here. Format: [Keep a Changelog](https://keepachangelog.com), versioning: [SemVer](https://semver.org).

## [Unreleased]

## [0.1.0] - YYYY-MM-DD
### Added
- Initial release.
```

**CONTRIBUTING.md** — document this very workflow: branch from dev, conventional commits, small PRs to dev, human review required, semver bumps, changelog entries.

**.github/pull_request_template.md**:
```markdown
## What & why

## How to test

## Risks & rollback plan

- [ ] Tests added/updated
- [ ] CHANGELOG.md updated
- [ ] Version bumped if needed
```

**README.md** — if missing, generate from actual project inspection (purpose, setup, commands, structure). Never a generic placeholder.
