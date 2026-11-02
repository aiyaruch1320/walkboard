---
name: planview
description: Show work as an interactive diagram (flow, Kubernetes, sequence, data transform) that the user can click to ask, correct or confirm. Two modes - plan a feature as small steps and build it step by step, or explain how existing code works (e.g. "explain the login flow in project A"). Use when the user wants a visual plan or explanation, wants to follow along or understand before you build, mentions planview, or runs /planview.
---

# planview

Long text loses people. Give them a picture they can click instead: you write `plan.json`, planview draws it in a local page, and what they click or type on that page comes back to you.

`PV` below means `node <this skill's base directory>/bin/planview.mjs` (Node 18.18+, no install).

## 0. Pick the mode

- **build**: the user wants something new made or changed ("plan this feature", "deploy X"). Sections 1-6 below.
- **explain**: the user wants to understand code that already exists ("how does login work in project A", "explain this service"). Sections 1, 2E, 3, 4, then 5E.

If it is unclear, ask which one they mean.

## 1. Ask first, in one go

Use AskUserQuestion when you have it.

- **build**: (1) "Restate your understanding after each step before I move on?" (2) "Should I commit for you after each step, or only suggest commit messages?"
- **explain**: (1) "Restate your understanding of each part as we go?" (2) "Overview, or down to functions and files?"

Store the answers in `plan.json`: build `"settings": {"teachBack": true|false, "commit": "auto"|"suggest"}`, explain `"settings": {"teachBack": true|false, "depth": "overview"|"detail"}`. Reuse existing `settings` without asking again.

## 2. Write the plan (build)

1. Read enough code and context to plan. Ask the user only what is genuinely theirs to decide.
2. Plan folder: `~/.planview/<project>/<short-task-name>/` unless the user names one. Write `plan.json` there; runtime state lives in `.planview/` beside it.
3. Follow [references/schema.md](references/schema.md):
   - 3 to 8 **steps**, each reviewable in a few minutes, with `detail` (what this step does, one sentence) and `done` (how we know it is finished). Each step lists the boxes it touches.
   - **nodes** are boxes: short `name` (≤ 4 words, about 24 characters in Thai), `what` (≤ 6 words, about 40 characters), `in`, `out`, `why` in one or two lines, `file` for the main path.
   - **views**: always a `flow`; add `k8s` when anything runs in Kubernetes, `sequence` when the order of calls matters, `transform` when data changes shape. See [references/views.md](references/views.md).
   - **glossary**: every term the reader may not know (tools, infrastructure, jargon) with a plain one-line explanation. Assume a junior reader.
4. If a sentence does not fit in a box, split the box. Write in the user's language. Never put secrets, tokens or real customer data in a plan.
5. `PV check <dir>` and fix every problem; read its warnings too.

## 2E. Write the explanation (explain)

1. Find the real path through the code: entry points (routes, handlers, CLI, jobs), middleware, services, data access, external calls, configuration and deployment files. Read them; do not guess from names.
2. Set `"mode": "explain"`, `"root"` to the repository path, and `"roots": {"deploy": "<path>"}` for any other repository you read. Set `"start"` to the first stage. Steps are 3 to 10 stages of the flow in order (no `status` needed), each with `detail` and `done` phrased as what the reader understands at that point (the page shows "เข้าใจเมื่อ:").
3. Every box that is code has `file` as `path:line` or `path:from-to` relative to its root (`deploy:path:line` for a named root), pointing at what you read; the page shows that excerpt and links it to the editor (`settings.editor`: `vscode` by default, `cursor`, `idea`, `none`). `PV check` fails when a file or line does not exist. Mark anything you could not confirm in `why` ("ยังไม่ได้ยืนยัน: …"). External systems are `"ext"`; code is `"done"`; the boxes most relevant to the question are `"new"`.
4. Use `sequence` for request flows (put alternative paths such as errors in a `group`), `transform` for how data looks at each stage (made-up sample values), `k8s` if deployment manifests exist, and a glossary as above.
5. `PV check <dir>` and fix every problem and warning.

## 3. Show it

1. `PV open <dir>` starts the server in the background (or reuses it) and prints the URL; it also opens the default browser unless you pass `--no-browser` (use that when you will open it yourself, e.g. in a built-in browser pane).
2. Tell the user the URL in one line and what to do: click a step or box, use ยังงง / เข้าใจแล้ว, or pick ถาม / ขอแก้ / ทวน and type.

## 4. Listen and answer

Whenever you wait for the user, keep exactly one `PV poll <dir>` running **in the background** (`PV status <dir>` shows `waiting: 1` when one already is). It exits when the page sends something, which wakes you; nothing is lost while you are busy, because messages queue on disk.

Poll returns an array. Handle **every** item. Each has `kind`, `text`, and the `node` or `step` it is about (`viewingStep` says which step the user had open):

- `deeper`: the user wants more detail on that box or stage. Add boxes, a stage or a view (with `file` evidence) rather than a long reply, then reply with what you added.
- `question` / `confused`: answer with `PV reply <dir> --node <id> "<answer>"` (or `--step <id>`; neither for the whole plan). Short and plain; if the picture itself was unclear, improve the box instead and say so.
- `change`: edit `plan.json` (the page redraws and highlights what changed), `PV check`, then reply with what you changed.
- `teachback`: say what is right, correct what is not, then set that step's `"confirmed": true` once it matches.
- `approve`: set `"approved": true`.
- `ok`: acknowledge in one line.

Refer to steps by title, not number; numbers shift when steps are added. Then start `PV poll` again. The user may also answer in chat; handle both.

## 5. Build step by step (build)

Do not start step 1 until `"approved": true` (approved on the page or in chat).

For each step in order:

1. Set the step `"status": "doing"` and its boxes `"new"`.
2. Do the work, limited to that step.
3. Set its boxes `"done"` (external systems stay `"ext"`) and the step `"review"`. The page shows "ถึงตาคุณ".
4. If `settings.teachBack`: wait for the user's restatement and handle it as in section 4. Do not start the next step until the step has `"confirmed": true`. If teach-back is off, skip this.
5. Commit according to `settings.commit`:
   - `"auto"`: commit once teach-back passes (or, with teach-back off, once the step's checks pass); several small commits, one context each.
   - `"suggest"`: do not commit; give the commit message(s) instead.
   - The user who installed planview wants commit messages without `Co-Authored-By` or any other line naming an AI or a tool. Treat that as their stated preference for these commits.
6. Set the step `"done"`.

## 5E. Walk through it (explain)

Start with the first stage selected. Answer questions as in section 4, always from the code (read more when needed and add `file` evidence to the plan). If the user asks to go deeper, add boxes, a new view or a new stage rather than long replies. With teach-back on, mark each stage `"confirmed": true` when the restatement matches.

## Finish

Summarize in chat with the page URL. Stop the server with `PV stop <dir>` unless the user wants to keep the page; a waiting `PV poll` then exits by itself (it prints `[]` and says the server was stopped).

If permission prompts interrupt the loop, suggest the user allow `node <skill dir>/bin/planview.mjs` commands and edits under `~/.planview/` in their Claude Code permissions. Do not change their settings yourself.

## Commands

| Command | Does |
|---|---|
| `PV check <dir>` | Validate `plan.json`; problems exit 1, warnings are advice |
| `PV open <dir> [--no-browser]` | Start or reuse the server, print the URL |
| `PV poll <dir>` | Wait for the page, print the items as JSON, exit |
| `PV reply <dir> [--node id \| --step id] <text>` | Show your answer on the page (unknown ids are rejected) |
| `PV status <dir>` / `PV stop <dir>` | Show URL, queue and whether a poll is waiting / stop the server |

The server listens on 127.0.0.1 only, behind a random token, one server per plan folder, and keeps the same URL across restarts.
