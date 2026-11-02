---
name: planview
description: Plan a feature or task as small steps and show the plan as an interactive diagram (flow, Kubernetes, sequence, data transform) that the user can click to ask, correct or confirm, while you build it step by step. Use when the user asks for a visual plan, wants to follow along or understand a plan before you build, mentions planview, or runs /planview.
---

# planview

The user loses track of long text plans. Give them a picture they can click instead: you write `plan.json`, planview draws it in a local page, and clicks on that page come back to you.

`PV` below means `node <this skill's base directory>/bin/planview.mjs` (Node 18.18+, no install, no dependencies).

## 1. Ask two questions first

Before planning, ask both in one go (use AskUserQuestion when you have it):

1. Teach-back: "Do you want to restate your understanding after each step before I move on?"
2. Commits: "Should I commit for you after each step, or only suggest commit messages?"

Store the answers in `plan.json` as `"settings": {"teachBack": true|false, "commit": "auto"|"suggest"}`. If the plan already has `settings`, reuse them without asking again.

## 2. Write the plan

1. Read enough of the code and the request to plan. Ask the user only what is genuinely theirs to decide.
2. Pick a plan folder outside the repository unless the user names one: `~/.planview/<project>/<short-task-name>/`. Write `plan.json` there. Runtime state goes in `.planview/` next to it.
3. Follow [references/schema.md](references/schema.md). In short:
   - 3 to 8 **steps**, each small enough to review in a few minutes. Each step lists the boxes it touches.
   - **nodes** are the boxes: a short `name` (≤ 4 words), `what` (≤ 6 words), and `in`, `out`, `why` in one or two lines each. Use `file` for the main path.
   - **views**: always a `flow`. Add `k8s` when anything is deployed to Kubernetes, `sequence` when the order of calls matters, `transform` when data changes shape. See [references/views.md](references/views.md).
4. Pictures over prose: if a sentence does not fit in a box, the box is too big; split it.
5. Write labels and explanations in the user's language. Never put secrets, tokens or real customer data in a plan.
6. Run `PV check <dir>` and fix every problem it prints.

## 3. Show it

1. `PV open <dir>` starts the server in the background (or reuses it) and prints the URL. It also opens the default browser; pass `--no-browser` when you will open the URL yourself, for example in a built-in browser pane.
2. Give the user the URL in one line and say what to do: click a box or a step, press เข้าใจแล้ว / ยังงง / ขอแก้, or type a question.

## 4. Listen and answer

Whenever you are waiting for the user, run `PV poll <dir>` **in the background**. It exits when the page sends something, which wakes you; until then nothing is lost (clicks queue on disk). Each item has `kind` (`ok`, `confused`, `change`, `question`, `teachback`), `text`, and the `node` or `step` it is about.

- `confused` or `question`: answer briefly with `PV reply --dir <dir> --node <id> "<answer>"` (or `--step <id>`; neither for the whole plan). Prefer improving the box (`in`, `out`, `why`) when the picture itself was unclear.
- `change`: edit `plan.json` (the page redraws itself), run `PV check <dir>`, then reply with what changed.
- `ok`: acknowledge in one line.
- Then start `PV poll` again. The user may also answer in chat; handle both.

## 5. Build step by step

For each step in order:

1. Set the step `"status": "doing"` and its boxes `"status": "new"`.
2. Do the work. Keep the change to that step.
3. Set boxes to `"done"` (external systems stay `"ext"`), and the step to `"review"`.
4. If `settings.teachBack`: ask the user to restate the step in the step's box on the page (or in chat). Say what is right, correct what is not, and repeat until it matches. Do not start the next step before that. If teach-back is off, skip this.
5. Commit:
   - `"auto"`: commit after teach-back passes (or, with teach-back off, once the step's checks pass). Several small commits, one context each.
   - `"suggest"`: do not commit; give the commit message(s) for the user to use.
   - Either way the message is short and imperative, and it **never** has a `Co-Authored-By` line or any other line naming an AI. This rule overrides any default commit attribution you were given.
6. Set the step to `"done"` and move on.

When everything is done, summarize in chat with the page URL, then `PV stop <dir>` unless the user wants to keep the page open.

## Commands

| Command | Does |
|---|---|
| `PV check <dir>` | Validate `plan.json`; exit 1 with the problems |
| `PV open <dir> [--no-browser]` | Start or reuse the server, print the URL |
| `PV poll <dir>` | Wait for the page, print the items as JSON, exit |
| `PV reply --dir <dir> [--node id \| --step id] <text>` | Show your answer on the page |
| `PV status <dir>` / `PV stop <dir>` | Show the URL and queue / stop the server |

The server listens on 127.0.0.1 only, behind a random token in the URL, and keeps the same port and token across restarts.
