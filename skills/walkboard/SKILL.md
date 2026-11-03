---
name: walkboard
description: Show work as an interactive picture (flow, Kubernetes, sequence, map, state, timeline…) that the user clicks to ask, correct or confirm. Three modes - plan a feature as small steps and build it step by step, explain how existing code works ("explain the login flow in project A"), or compare designs for something new and pick one. Use when the user wants a visual plan, explanation or comparison, wants to follow along before you build, mentions walkboard, or runs /walkboard.
---

# Walkboard

Long text loses people. You write `plan.json`; Walkboard draws it as a local page; what the user clicks or types there comes back to you.

`WB` = `node <this skill's base directory>/bin/walkboard.mjs` (Node 18.18+, no install).

## 0. Language, mode, questions, settings

Use the user's language for everything (questions, plan, replies, suggested commit messages) and set `"lang"` (`"en"`, `"th"`, …). Code, ids and paths stay as they are.

- **build**: something new or changed. Sections 1, 3, 4.
- **explain**: understand existing code. Sections 2E, 3, 4E.
- **design**: choose how to build something that does not exist yet ("what should we use for…", "compare…"). Read [references/design.md](references/design.md), then section 3.

If the request leaves open something that changes the picture (scope, repository or service, environment, what "done" means), ask up to three short questions in one go before writing, together with the settings question below. What you still assume goes on the page (`constraints` with `"confirmed": false`, or boxes with `"basis": "assumed"`) for the user to confirm.

`settings`, first match wins: the request ("no restating", "commit for me") · existing `settings` · `~/.walkboard/config.json`. Still missing: ask once (AskUserQuestion when available): build → `"commit": "auto"|"suggest"`; explain → `"depth": "overview"|"detail"`. Offer to save it to the config. Never ask about restating: `teachBack` is on unless `false`, and the user switches it on the page.

## 1. Write the plan (build)

Folder: `~/.walkboard/<project>/<task>/plan.json` unless the user names one. Read [references/schema.md](references/schema.md) the first time.

- 3-8 **steps**, each reviewable in minutes: `title`, `detail`, `done` (how we know), `nodes`.
- **nodes**: `name` (≤ 4 words), `what` (≤ 6 words), `in` / `out` / `why` one line each, `file`. Icons are guessed from names; set `icon` only when wrong (`WB icons` lists them).
- **views**: leave out for a plain flow. When a picture explains better, pick one or two from the "Which picture" table in [references/views.md](references/views.md).
- **glossary**: only project terms. No secrets, tokens or real customer data.
- `WB check <dir>` until ok.

## 2E. Write the explanation (explain)

1. Read the real path (entry points, middleware, services, data access, external calls, deployment). Do not guess from names.
2. `"mode": "explain"`, `"root": "<repo>"` (`"roots"` for more), `"start"`. 3-10 stages in order; `done` = what the reader understands there.
3. Every code box has `file` = `path:line` or `path:from-to` and `anchor` = a short piece of that code (`"function send("`), so `check` notices when the code moves; the page shows the code, so **never paste code into the plan**. `highlight` only the lines that make the point, with a short note when it helps: `{"152": "returns: this wakes the agent"}`. External systems `"ext"`, the focus `"new"`, missing `"todo"`. Mark guesses "unconfirmed: …".
4. `WB check <dir>` until ok (it fails when a file or line does not exist).

## 3. Show and listen

1. `WB open <dir>` prints the URL (`--no-browser` if you open it yourself; `&step=`, `&node=`, `&view=` point at something). The first time, add one line: click a box to see, ask or propose; 👉 and a purple bar mean their turn; "⋮" holds export, theme and the tour.
2. Keep exactly one `WB poll <dir>` running **in the background**. It exits when the page sends something, waking you with one JSON line per message (`kind`, `text`, `node` or `step`; `viewingStep` = the step on screen). `[]` means the server stopped: `WB open` again.
   - `question` / `confused`: `WB reply <dir> [--node <id> | --step <id>] "<answer>"`. Two or three sentences; code in ``` fences. If the picture was unclear, fix it and say so.
   - `deeper`: add boxes, a stage or a view (with `file` evidence); reply with what you added.
   - `teachback`: say what is right, correct the rest; when it matches, `WB set <dir> step:<id> confirmed=true`.
   - `approve`: `WB set <dir> approved=true`, reply in one line.
   - `confirm` (`constraint` or `node`): `WB set <dir> constraint:<id> confirmed=true` or the box's real `basis`; if corrected, update what depended on it (scores, `must`, the recommendation) and say what changed.
   - `propose`, `withdraw`, `plan`, `apply`, `commit`, `committed`: [references/messages.md](references/messages.md) the first time; `decide`: references/design.md.
   - `settings`: already saved in plan.json; arrives with another message; no reply.
   Reply to every other message, even in one line: the page shows you typing until you reply or poll again.
   No background commands that wake you when they end (agents other than Claude Code)? Run `WB poll <dir>` in the foreground instead: it waits until the page sends something; handle it, then poll again.
3. Refer to steps by title. Start `WB poll` again. The user may also answer in chat.

## 4. Build (build)

Not before `approved` is true. For each step:

1. `WB set <dir> step:<id> status=doing node:<a> status=new …`, then do only that step.
2. `WB set <dir> step:<id> status=review node:<a> status=done …`, and `WB reply <dir> --step <id>` with one line on what you built and the files touched, so the user has something to check or restate.
3. `WB status <dir>` shows the current `settings`. Teach-back on: wait for `confirmed` (skip only if the user asks).
4. Commit: `"auto"` → small commits, one context each, then go on; `"suggest"` → suggest the message on the page and wait (references/messages.md).
5. `WB set <dir> step:<id> status=done`, next step. Teach-back off and `"auto"`: nothing waits.

## 4E. Walk through (explain)

Answer from the code, reading more when needed; prefer new boxes or stages over long replies. A request that contradicts the code is answered with what the code does and its `file:line`, not drawn. Explain mode never edits the project.

## Keep it cheap

- Write `plan.json` once, compact (no indentation); then `WB set` or a small Edit. Never rewrite or re-read the whole file to change a status.
- Leave out defaults (`views` for a plain flow, `status`, empty fields, common terms).
- Point at code with `file:line`; keep replies short; do not repeat in chat what the page shows.

## Finish

Summarize in chat with the URL. `WB stop <dir>` unless the user wants the page kept. If permission prompts interrupt, suggest allowing `node <skill dir>/bin/walkboard.mjs` and edits under `~/.walkboard/`; do not change their settings yourself.

| Command | Does |
|---|---|
| `WB check <dir>` | Validate; problems exit 1, warnings are advice |
| `WB set <dir> [plan \| step: \| node: \| constraint: \| option: \| criterion:<id>] key=value …` | Change fields in place (`key=` removes one; JSON values allowed) |
| `WB open <dir> [--no-browser]` | Start or reuse the server, print the URL |
| `WB poll <dir>` / `WB reply <dir> [--node id \| --step id] <text>` | Wait for the page / answer on it |
| `WB status <dir>` / `WB stop <dir>` | URL, queue, settings / stop the server |
| `WB export <dir> [--html file] [--no-code] [--with-chat]` | A read-only copy as one HTML file, when the user asks to share or send the plan (PDF: the page's ⋮ → Export → PDF) |
| `WB icons` | Icon names for `icon` |
