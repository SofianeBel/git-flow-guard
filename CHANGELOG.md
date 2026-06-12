# Changelog

All notable changes are documented here. Format: [Keep a Changelog](https://keepachangelog.com), versioning: [SemVer](https://semver.org).

## [Unreleased]
### Added
- Skill `plan-tasks`: drafts `.claude/tasks.json` (tasks with title, description, acceptance criteria, kanban status, and issue number), runs an approve/adjust loop via AskUserQuestion, then creates one GitHub issue per task with `gh issue create --body-file`.
- Command `/flow-plan`: plan-mode entry point for task drafting → GitHub issue creation → implementation plan.
- SessionStart context nudge to use the plan-tasks skill (`/flow-plan`) when planning multi-step work.

## [0.1.0] - 2026-06-12
### Added
- SessionStart hook injecting repo workflow state (branches, docs, version source) into context.
- PreToolUse Bash guard: blocks commits/pushes/merges/rebases on protected branches, direct pushes to main/dev, plain force-push, `gh pr merge`, protected-branch deletion, and non-conventional commit messages.
- PreToolUse secret scanner for Write/Edit content and staged git diffs (~18 patterns with placeholder and entropy filtering); blocks staging of `.env`/key/credential files.
- Stop hook reminder when a feature branch has uncommitted, unpushed, or un-PR'd work.
- Skills: `git-flow` (operating procedure), `repo-bootstrap` (ask-first dev branch + docs scaffolding), `release` (semver bump + changelog).
- Commands: `/flow-status` (health report) and `/flow-pr` (finish branch → PR to dev → wait for review).
- Unit tests for the bash guard parser and secret patterns.
