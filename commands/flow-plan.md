---
description: Draft tasks.json from the current request, get approval, create GitHub issues, then plan
allowed-tools: Bash, Read, Write, Edit, Glob, Grep, AskUserQuestion
---

Apply the plan-tasks skill to turn the current feature request into a structured plan backed by GitHub issues. Steps, in order:

1. **Draft `.claude/tasks.json`**: explore the repo and the request, then write `.claude/tasks.json` with the full schema — `version`, `createdAt`, `planTitle`, optional `milestone`, and `tasks[]` each with `id`, `title`, `description`, `acceptanceCriteria`, `labels`, `status: "todo"`, and `issue: null`. 3–8 tasks; each independently completable as one branch/PR; one issue = one piece of work, not a vague bucket.
2. **Approval loop**: present a readable summary of the draft, then ask via AskUserQuestion (Approve / Adjust). On Adjust, ask targeted clarifying questions — scope, splitting, criteria — revise the file, re-present, and loop. Never proceed to issue creation without explicit approval.
3. **Create one GitHub issue per task**: write each issue body to a PowerShell-safe temp file and run `gh issue create --title "T<n>: <title>" --label <labels> --body-file <tmp>`. Body = description + `## Acceptance criteria` checklist + footer `Planned via git-flow-guard /flow-plan (T<n>)`. Parse the issue number from the returned URL, write it back to `tasks.json`, and delete the temp file. Retry without `--label` if labels are rejected. Create the milestone first if `tasks.json` has one. Skip gracefully and inform the user if `gh` is missing or unauthenticated. Never touch `gh project`.
4. **Write the implementation plan**: reference task IDs and issue numbers (e.g. `T1 (#42)`). The plan is narrative; the issues are the authoritative work items.

No implementation starts until step 4 is complete. Hand off to the git-flow skill when the user is ready to begin a task.
