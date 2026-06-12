---
description: Report git-flow health — branches, current state, unpushed work, open PRs, doc & version freshness
allowed-tools: Bash(git status:*), Bash(git branch:*), Bash(git log:*), Bash(git rev-list:*), Bash(git describe:*), Bash(gh pr list:*), Read, Glob
---

Report the repo's git-flow status. Run read-only checks and present a compact health report:

1. **Branches**: does `main`/`master` and `dev` exist? Current branch? Is it protected (bad) or a feature branch (good)? `git log --oneline dev..HEAD` for branch-only commits.
2. **Work state**: `git status --porcelain` (uncommitted), unpushed commits vs upstream.
3. **PRs**: `gh pr list --state open` — list open PRs and whether the current branch has one.
4. **Docs**: existence of README.md, CHANGELOG.md (with an `[Unreleased]` section?), CONTRIBUTING.md, `.github/pull_request_template.md`.
5. **Version**: current version from package.json/pyproject.toml/Cargo.toml/VERSION, last tag (`git describe --tags --abbrev=0`), and whether commits since suggest a pending bump (per the release skill rules).

End with a short list of actions needed to get compliant, if any. Do not change anything.
