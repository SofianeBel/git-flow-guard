# Contributing

This repo follows the exact workflow the plugin enforces.

## Workflow

1. `git switch dev && git pull`
2. `git switch -c feat/<scope>` (or `fix/`, `refactor/`, `chore/`, `docs/`)
3. One logical step = one [Conventional Commit](https://www.conventionalcommits.org): `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`, `perf:`, `ci:`, `build:`, `style:`, `revert:`.
4. `npm test` must be green before opening a PR.
5. Update `CHANGELOG.md` under `[Unreleased]` and bump the version in `package.json` + `.claude-plugin/plugin.json` + `.claude-plugin/marketplace.json` (feat→minor, fix→patch, breaking→major).
6. `git push -u origin HEAD`, then open a PR **to `dev`** answering: what & why, how to test, risks & rollback.
7. Wait for human review. Never merge your own PR. `main` only receives merges from `dev`.

## Rules

- No secrets in code or history — env vars only; rotate anything that ever leaked.
- Small PRs (~50–300 lines). Split large work into stacked branches.
- No force-push to shared branches; `--force-with-lease` only on your own un-merged branch.
