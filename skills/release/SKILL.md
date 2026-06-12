---
name: release
description: Compute and apply the next semantic version from conventional commits, update CHANGELOG.md, and optionally tag. Use when finishing a feature branch (version bump step) or when the user asks to cut a release.
---

# Release — SemVer & Changelog

## Computing the next version

Inspect commits since the last version (tag or last bump commit):

```bash
git describe --tags --abbrev=0          # last tag, if any
git log <last>..HEAD --pretty=%s        # commit subjects since
```

Bump rules from Conventional Commits:

| Found in commits | Bump |
|---|---|
| `BREAKING CHANGE` footer or `type!:` | **major** |
| any `feat:` | **minor** |
| only `fix:`/`chore:`/`refactor:`/`docs:`/etc. | **patch** |

Pre-1.0 convention: breaking → minor, feat/fix → patch.

## Applying the bump (per-branch, done before the PR)

1. Update the version source: `package.json` `"version"`, `pyproject.toml`, `Cargo.toml`, or `VERSION` file. Use the file's own tooling when available (`npm version --no-git-tag-version X.Y.Z`).
2. Move/extend the `## [Unreleased]` section of CHANGELOG.md: entries describing this branch's changes stay under `[Unreleased]` during feature work.
3. Commit: `chore(release): bump version to X.Y.Z`.

## Cutting a release (only when the user asks, typically on dev→main)

1. Move `[Unreleased]` entries under `## [X.Y.Z] - YYYY-MM-DD`.
2. Tag after the human merges: `git tag -a vX.Y.Z -m "vX.Y.Z" && git push origin vX.Y.Z`.
3. Optional: `gh release create vX.Y.Z --notes-from-tag` or paste the changelog section.

Never tag or release from an unmerged feature branch.
