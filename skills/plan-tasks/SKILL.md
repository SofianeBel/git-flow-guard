---
name: plan-tasks
description: Use when entering plan mode or planning any multi-step feature — draft .claude/tasks.json, get user approval via AskUserQuestion (approve/adjust loop), create one GitHub issue per task, then write the implementation plan.
---

# Plan Tasks — Drafting, approval, and GitHub issues

The planning stage that runs before branches and PRs. Every multi-step feature starts here: capture the work as structured tasks, get explicit approval, back each task with a GitHub issue, then write the implementation plan. The issues become the source of truth; the git-flow skill takes over once work starts.

## Step 1 — Draft `.claude/tasks.json`

Explore the repo and the request, then write `.claude/tasks.json`:

```json
{
  "version": 1,
  "createdAt": "<ISO-8601 date>",
  "planTitle": "short feature name",
  "milestone": "<name>",
  "tasks": [
    {
      "id": "T1",
      "title": "...",
      "description": "what and why",
      "acceptanceCriteria": ["done when X", "no regression in Y"],
      "labels": ["enhancement"],
      "status": "todo",
      "issue": null
    }
  ]
}
```

Rules:
- **3–8 tasks.** If fewer than 3, it is likely one task; if more than 8, group or split the feature.
- **One issue = one piece of work.** Each task must be a single bug, feature, or chore with a clear "done when X". Never a vague bucket ("misc", "cleanup", "other stuff").
- **Each task is independently completable** as one branch and one PR.
- **`status`** follows the kanban board states: `todo | in-progress | in-review | done`. `in-review` = PR open; `done` = PR merged and issue auto-closed by the `Closes #N` link.
- **`labels`**: categorize per task — `bug`, `enhancement`, `chore`, optionally `priority:high`. Use whatever labels already exist in the repo; new labels are created only if the repo has none.
- **`milestone`** (optional, top-level): when the plan targets a named release or deadline, record the milestone name here to group all issues under it.

## Step 2 — Approval loop

Present a readable summary of the draft — task titles, descriptions in one line each, acceptance criteria count. Then ask:

```
AskUserQuestion — options: Approve / Adjust
```

On **Approve**: proceed to Step 3.

On **Adjust**: ask targeted clarifying questions — scope boundaries, whether a task should be split, whether acceptance criteria are clear enough. Revise `.claude/tasks.json`, re-present the summary, and ask again. Repeat until the user gives explicit approval.

Never create GitHub issues without explicit approval. Never present a percentage confidence or ask the user to score confidence — the only signal needed is Approve or Adjust.

## Step 3 — Create GitHub issues

For each task in order, run:

```powershell
# Write body to a temp file (PowerShell-compatible path, no spaces)
$tmp = "$env:TEMP\gfg_T1.md"
@"
<task description>

## Acceptance criteria

- [ ] <criterion 1>
- [ ] <criterion 2>

---
Planned via git-flow-guard /flow-plan (T1)
"@ | Set-Content -Encoding utf8 $tmp

gh issue create --title "T1: <title>" --label "enhancement" --body-file $tmp

Remove-Item $tmp
```

After each `gh issue create`:
1. Parse the issue number from the returned URL (`#42`).
2. Write the number back into `tasks.json` under `"issue": 42`.
3. Delete the temp file.

**Labels**: use existing repo labels. If `gh` rejects unknown labels, retry the same command without `--label`.

**Milestone** (optional): if `tasks.json` has a `milestone`, create it first if it does not exist:

```bash
gh api repos/{owner}/{repo}/milestones -f title="<milestone name>"
```

Then pass `--milestone "<name>"` to each `gh issue create`. Skip gracefully if milestone creation fails and tell the user.

**If `gh` is unavailable or unauthenticated**: skip issue creation, leave `"issue": null` in tasks.json, and tell the user which tasks need issues before work starts.

Never touch `gh project`.

## Step 4 — Write the implementation plan

Write the plan referencing task IDs and issue numbers. Example anchor: "T1 (#42) — add the parser". The plan is narrative; the issues are the authoritative work items.

## Step 5 — Lifecycle (glue to git-flow)

Once the plan is approved and issues exist, tasks move through the board as work proceeds:

1. **Pick up a task** → set `"status": "in-progress"` in tasks.json.
2. **Branch** `feat/<scope>` (or `fix/`, `chore/`) from `dev`. Commits may reference the issue (`#42`).
3. **Open PR to dev** with `Closes #42` in the body → set `"status": "in-review"`. The human merge auto-closes the issue.
4. **After merge** → set `"status": "done"`. Never run `gh issue close` manually — the `Closes #N` link keeps code and tracking in sync.

If new work surfaces mid-implementation, create a new task + new issue. Never let work live only in the conversation.

**Committing tasks.json**: commit `.claude/tasks.json` for traceability so the team can see the plan alongside the code. The user may add `.claude/tasks.json` to `.gitignore` if they prefer to keep it local.

## Anti-patterns (actively avoided)

- Vague bucket tasks (`"misc"`, `"cleanup"`, `"other"`) with no clear done-when — split into named, scoped work items.
- Creating GitHub issues before the user has approved the draft — the approval loop exists precisely to prevent premature commits to the issue tracker.
- Closing issues manually with `gh issue close` — use `Closes #N` in the PR body and let the merge do it.
- Tracking work only in the conversation — chat is ephemeral; tasks.json and GitHub issues are the record.
- Asking for a confidence percentage — the only signal needed is Approve or Adjust.
- Touching `gh project` — issues only, no project board automation.
- More than 8 tasks in a single plan — split the feature or sequence the plans.
