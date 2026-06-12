---
description: Finish the current feature branch — verify checks, update changelog & version, push, open PR to dev, then stop for human review
allowed-tools: Bash, Read, Edit, Write, Glob, Grep
---

Finalize the current feature branch per the git-flow skill. Steps, in order:

1. **Preconditions**: must be on a feature branch (not main/master/dev); working tree changes must be committed (commit them with conventional messages if trivial leftovers, otherwise ask).
2. **Quality gate**: run the project's tests/lint/build (whatever exists: npm scripts, vitest, pytest, cargo…). If red, fix or report — never open a PR red.
3. **Docs**: update README.md if behavior/setup changed; ensure CHANGELOG.md has `[Unreleased]` entries covering this branch's changes.
4. **Version bump**: apply the release skill — compute bump from this branch's conventional commits and update the version source. Commit `chore(release): bump version to X.Y.Z`.
5. **Push**: `git push -u origin HEAD`.
6. **PR**: `gh pr create --base dev` with title = conventional summary and body answering *What & why / How to test / Risks & rollback plan* (use the repo's PR template if present).
7. **Stop**: print the PR URL and state explicitly that you are now **waiting for human review** — do not merge, do not continue work on this branch unless review feedback arrives.
