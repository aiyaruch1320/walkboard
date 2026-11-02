---
name: planview
description: Show work as an interactive diagram (flow, Kubernetes, sequence, data transform) that the user can click to ask, correct or confirm. Two modes - plan a feature as small steps and build it step by step, or explain how existing code works (e.g. "explain the login flow in project A"). Use when the user wants a visual plan or explanation, wants to follow along or understand before you build, mentions planview, or runs /planview.
---

# planview

Long text loses people. You write `plan.json`; planview draws it as a local page; what the user clicks or types there comes back to you.

`PV` = `node <this skill's base directory>/bin/planview.mjs` (Node 18.18+, no install).

## 0. Language, mode and settings

Use the language the user writes in for everything: questions, the plan, replies, commit messages you suggest. Set `"lang"` to its code (`"en"`, `"th"`, …); the page's labels follow. Code, ids and paths stay as they are.

- **build**: something new or changed. Sections 1, 3, 4.
- **explain**: understand existing code. Sections 2E, 3, 4E.

`settings`, first match wins: what the request says ("no restating", "commit for me") · existing `settings` · `~/.planview/config.json` (same fields). Still missing: ask one question (AskUserQuestion when available): build → commit for them or only suggest messages (`"commit": "auto"|"suggest"`); explain → overview or detail (`"depth"`). Then offer to save it to `~/.planview/config.json`. Never ask about restating: `teachBack` is on unless `false`, and the user switches it on the page.

## 1. Write the plan (build)

Folder: `~/.planview/<project>/<task>/plan.json` unless the user names one. Read [references/schema.md](references/schema.md) the first time.

- 3-8 **steps**, each reviewable in minutes: `title`, `detail` (what it does), `done` (how we know), `nodes`.
- **nodes**: `name` (≤ 4 words), `what` (≤ 6 words), `in` / `out` / `why` one line each, `file`. Icons are guessed from names; set `icon` only when the guess is wrong (`aws:s3`, `gcp:bigquery`, `k8s:cronjob`, `database`, …).
- **views**: leave out for a plain flow. Add `k8s`, `sequence` (alternatives in a `group`) or `transform` when they explain better; see [references/views.md](references/views.md).
- **glossary**: only project-specific terms. No secrets, tokens or real customer data.
- `PV check <dir>` until ok.

## 2E. Write the explanation (explain)

1. Read the real path (entry points, middleware, services, data access, external calls, deployment). Do not guess from names.
2. `"mode": "explain"`, `"root": "<repo>"` (`"roots": {"deploy": "<path>"}` for more), `"start"`. Steps are 3-10 stages in order; `done` = what the reader understands there.
3. Every code box has `file` = `path:line` or `path:from-to`; the page shows the code, so **never paste code into the plan**. `highlight` only the lines that make the point, with a short note when it helps: `{"152": "returns: this wakes the agent"}`. Code is `"done"` (default), external systems `"ext"`, the focus `"new"`, missing `"todo"`. Mark guesses "unconfirmed: …".
4. `PV check <dir>` until ok (it fails when a file or line does not exist).

## 3. Show and listen

1. `PV open <dir>` prints the URL (`--no-browser` if you open it yourself; `&step=`, `&node=`, `&view=` point at something). The first time, add one line in the user's language: click a box to see, ask or propose; 👉 and a purple bar mean their turn; "?" shows a tour.
2. Keep exactly one `PV poll <dir>` running **in the background**. It exits when the page sends something, which wakes you, with one JSON line per message (`kind`, `text`, `node` or `step`). Handle each:
   - `question` / `confused`: `PV reply <dir> --node <id> "<answer>"` (or `--step <id>`, or neither). Two or three sentences; code in ``` fences. If the picture was unclear, fix it and say so.
   - `deeper`: add boxes, a stage or a view (with `file` evidence), reply with what you added.
   - `teachback`: say what is right, correct the rest; when it matches, `PV set <dir> step:<id> confirmed=true`.
   - `approve`: `PV set <dir> approved=true`, reply in one line.
   - `propose`, `change`, `withdraw`, `plan`, `apply`, `commit`, `committed`: read [references/messages.md](references/messages.md) the first time.
   - `settings`: switches already saved in plan.json; arrives only with another message; no reply.
   Reply to every other message, even in one line: the page shows you typing until you reply or poll again.
3. Refer to steps by title. Start `PV poll` again. The user may also answer in chat.

## 4. Build (build)

Not before `approved` is true. For each step:

1. `PV set <dir> step:<id> status=doing node:<a> status=new …`, then do only that step.
2. `PV set <dir> step:<id> status=review node:<a> status=done …`.
3. `PV status <dir>` shows the current `settings`. Teach-back on: wait for `confirmed` (skip only if the user asks).
4. Commit: `"auto"` → small commits, one context each, then go on; `"suggest"` → suggest the message on the page and wait (references/messages.md). No `Co-Authored-By` or other line naming an AI or tool: the user who installed planview does not want them.
5. `PV set <dir> step:<id> status=done`, next step. Teach-back off and `"auto"`: nothing waits.

## 4E. Walk through (explain)

Answer from the code, reading more when needed; prefer new boxes or stages over long replies. The picture must match the code: a request that contradicts it is answered with what the code does and its `file:line`, not drawn. Explain mode never edits the project.

## Keep it cheap

- Write `plan.json` once, compact (no indentation: about a third fewer tokens); then `PV set` or a small Edit. Never rewrite or re-read the whole file to change a status.
- Leave out defaults (`views` for a plain flow, `status`, empty fields, common terms).
- Point at code with `file:line`; replies stay short; do not repeat in chat what the page shows.

## Finish

Summarize in chat with the URL. `PV stop <dir>` unless the user wants the page kept. If permission prompts interrupt, suggest allowing `node <skill dir>/bin/planview.mjs` and edits under `~/.planview/`; do not change their settings yourself.

| Command | Does |
|---|---|
| `PV check <dir>` | Validate; problems exit 1, warnings are advice |
| `PV set <dir> [step:<id> \| node:<id> \| plan] key=value …` | Change fields in place (`key=` removes one; JSON values allowed) |
| `PV open <dir> [--no-browser]` | Start or reuse the server, print the URL |
| `PV poll <dir>` | Wait for the page; one JSON line per message |
| `PV reply <dir> [--node id \| --step id] <text>` | Answer on the page |
| `PV status <dir>` / `PV stop <dir>` | URL, queue, settings / stop the server |
