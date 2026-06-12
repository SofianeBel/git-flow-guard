---
name: git-flow
description: Git-at-Scale operating procedure — branch from dev, conventional commit per step, push, PR to dev, wait for human review. Use in any git repo with a main/dev structure, at session start and before any git operation.
---

# Git Flow — Operating Procedure

Every change follows this loop. Hooks hard-block violations; this skill is the playbook.

## Session start ritual

```bash
git switch dev && git pull          # always start from latest dev
git switch -c feat/<short-scope>    # short-lived branch: feat/, fix/, refactor/, chore/, docs/
```

- Never work on `main`, `master`, or `dev` directly — hooks will block commits there.
- If `dev` does not exist or docs are missing, use the `repo-bootstrap` skill (ASK the user first).
- Branches live hours to ~1 day. If the task is big, split into multiple small branches/PRs.

## During work

- **One logical step = one commit.** Commit as you go, not one giant commit at the end.
- **Conventional Commits, enforced:** `<type>(<scope>): <description>` — types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `ci`, `build`, `style`, `revert`. Breaking change: `!` after type or `BREAKING CHANGE:` footer.
- Never commit secrets. Real values go in gitignored `.env`; code reads `process.env.X`. If a key was ever committed, it must be rotated.
- Keep the PR small (~50–300 lines). Reviewable beats complete.

## Finishing (or run /flow-pr)

1. Run tests/lint/build — must be green. Never open a PR red.
2. Update **README.md** if behavior, setup, or API changed.
3. Add a **CHANGELOG.md** entry under `## [Unreleased]` (Keep a Changelog format: Added/Changed/Fixed/Removed).
4. **Bump the version** yourself (see `release` skill): feat → minor, fix/chore → patch, breaking → major. Commit as `chore(release): bump version to X.Y.Z` or fold into the last commit.
5. Push: `git push -u origin HEAD`.
6. Open the PR **to dev** (never to main):
   ```bash
   gh pr create --base dev --title "feat(scope): summary" --body "..."
   ```
   Body answers: **What & why / How to test / Risks & rollback plan**. Use `.github/pull_request_template.md` if present.
7. **STOP. Wait for human review.** Never run `gh pr merge`. Never merge locally. Report the PR URL to the user and end the turn.
8. Review feedback → new commits on the same branch (no force-push of shared work; `--force-with-lease` only on your own un-merged branch if truly needed).

`main` only receives merges from `dev`, by the human, via PR.

## Anti-patterns (actively avoided)

- Long-lived branches → integrate within a day.
- Giant PRs → split or stack them.
- Vague commits (`fix`, `wip`, `stuff`) → useless during incidents.
- Plain `--force` push → blocked; `--force-with-lease` on own branches only.
- Merging red CI, direct commits to main/dev, committing secrets or large binaries.
- When prod breaks: **revert first** (`git revert <sha>` via PR), diagnose after.
