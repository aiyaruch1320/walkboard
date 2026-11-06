---
name: walkboard
description: Show work as an interactive picture (flow, cloud or Kubernetes map, sequence, state, timeline…) that the user clicks to ask, correct or confirm. Three modes - plan a feature as small steps and build it step by step, explain how existing code works ("explain the login flow in project A"), or compare designs for something new and pick one. Use when the user wants a visual plan, explanation or comparison, wants to follow along before you build, mentions walkboard, or runs /walkboard.
---

# Walkboard

Long text loses people. You write `plan.json`; Walkboard draws it as a local page; what the user clicks or types there comes back to you.

`WB` = `node <this skill's base directory>/bin/walkboard.mjs` (Node 18.18+, no install): write it out or make a shell function; a variable holding it does not run in zsh. Files named below are under `references/`: read one only when you reach it.

## 0. Language, mode, questions, settings

Use the user's language for everything (questions, plan, replies, suggested commit messages) and set `"lang"`. Code, ids and paths stay as they are. Readers build software: keep technical terms as the team says them (config, deploy, Secret, egress, batch), never translated or invented; say what a thing is or does, not a vague label. Hard terms are explained on hover (`glossary` for the project's own).

- **build**: something new or changed. Sections 1, 3, 4.
- **explain**: understand existing code. Sections 2E, 3, 4E.
- **design**: choose how to build something that does not exist yet ("what should we use for…", "compare…"). Read [design.md](references/design.md), then section 3.

If the request leaves open something that changes the picture (scope, repository or service, environment, what "done" means), ask up to three short questions in one go before writing, with the settings question below. What you still assume goes on the page (`constraints` with `"confirmed": false`, or boxes with `"basis": "assumed"`).

`settings`, first match wins: the request · existing `settings` · `~/.walkboard/config.json`. Still missing: ask once (AskUserQuestion when available): build → `"commit": "auto"|"suggest"`; explain → `"depth": "overview"|"detail"`. Offer to save it to the config.

## 1. Write the plan (build)

Folder: `~/.walkboard/<project>/<task>/plan.json` unless the user names one. Fields: [schema.md](references/schema.md).

- 3-8 **steps**, each reviewable in minutes: `title`, `detail`, `done` (how we know), `nodes`.
- **nodes**: `name` (≤ 4 words), `what` (≤ 6 words), `in` / `out` / `why` one line each, `file`. Icons are guessed from names; set `icon` only when wrong.
- **views**: leave out for a plain flow. When a picture explains better, pick one or two from [views.md](references/views.md).
- **glossary**: only project terms. No secrets, tokens or real customer data.
- `WB check <dir>` until ok.

## 2E. Write the explanation (explain)

1. Read the real path (entry points, middleware, services, data access, external calls, deployment). Do not guess from names.
2. `"mode": "explain"`, `"root": "<repo>"` (`"roots"` for more), `"start"`. 3-10 stages in order; `done` = what the reader understands there.
3. Every code box has `file` = `path:line` or `path:from-to` and `anchor` = a short piece of that code (`"function send("`), so `check` notices when the code moves; the page shows the code, so **never paste code into the plan**. `highlight` only the lines that make the point, with a short note when it helps: `{"152": "returns: this wakes the agent"}`. External systems `"ext"`, the focus `"new"`, missing `"todo"`. Mark guesses "unconfirmed: …". A box that is not code (a user, an outside system, a managed service you only call) has `"status": "ext"` and no `file`: never borrow a line for it.
4. `WB check <dir>` until ok (it fails when a file or line does not exist).

Only where the flow itself is the hard part, add `moves` to that step or stage ([moves.md](references/moves.md)). Most need none.

## 3. Show and listen

1. `WB open <dir>` prints the URL (`--no-browser` if you open it yourself; `&step=`, `&node=`, `&view=` point at something). The first time, add one line: click a box to see, ask or propose; 👉 and a purple bar mean their turn; "⋮" holds export, theme and the tour.
2. Keep exactly one `WB poll <dir>` running **in the background**. It exits when the page sends something, with one JSON line per message (`kind`, `text`, `node` or `step`; `viewingStep` = the step on screen). `[]` means the server stopped: `WB open` again. Start it again after each batch.
   - `question` / `confused`: a request to add, change or remove something is a proposal (messages.md). Otherwise `WB reply <dir> [--node <id> | --step <id>] "<answer>"`. Two or three sentences; code in ``` fences. If the picture was unclear, fix it and say so.
   - `deeper`: add boxes, a stage or a view (with `file` evidence); reply with what you added.
   - `approve`: `WB set <dir> approved=true`, reply in one line.
   - `confirm` (`constraint` or `node`): `WB set <dir> constraint:<id> confirmed=true` or the box's real `basis`; if corrected, update what depended on it (scores, `must`, the recommendation) and say what changed. `wrong: true` = the user says it is not true: ask what is, or find out, then fix it the same way.
   - `review`: [review.md](references/review.md). `withdraw`, `plan`, `apply`, `commit`, `committed`: [messages.md](references/messages.md). `decide`: design.md.
   - `settings`: already saved in plan.json; arrives with another message; no reply.

   Reply to every other message **on the page, where it was asked**, even in one line, even if you also act on it or say it in chat: asked on the page, answered on the page. If the answer belongs on another box or step, reply there and also, in one line, where it was asked with a link: `[[node:<id>]]`, `[[step:<id>]]`, `[[plan]]`.

   A person reads every reply: use the names on the picture, never ids.

   No background commands that wake you when they end? `WB poll <dir> --timeout 240` in the foreground instead (`[]` = nothing yet, poll again). A killed poll loses nothing.
3. Refer to steps by title. Taking out a box someone talked about: first `WB reply <dir>` (whole plan) in one line why. The user may also answer in chat.

## 4. Build (build)

Not before `approved` is true. For each step:

1. `WB set <dir> step:<id> status=doing node:<a> status=new …`, then do only that step.
2. `git status` to see what the step changed. `WB status <dir>` shows the current `settings`. Files changed: `"auto"` → small commits now, one context each; `"suggest"` → a suggested message (messages.md). Nothing changed (or not a repository): nothing to commit or suggest.
3. `WB set <dir> step:<id> status=review node:<a> status=done …` (with the suggested message, in one call), and `WB reply <dir> --step <id>` with one line on what you built and the files touched, or that no files changed.
4. Wait for the user, then `WB set <dir> step:<id> status=done` and start the next step: `next` (their go-ahead; on the last step, the end), or `commit` / `committed` (messages.md). `next` with `"all": true`: do the remaining steps without stopping.

## 4E. Walk through (explain)

Answer from the code, reading more when needed; prefer new boxes or stages over long replies. A request that contradicts the code is answered with what the code does and its `file:line`, not drawn. Explain mode never edits the project.

## Keep it cheap

- Write `plan.json` once, compact (no indentation); then `WB set` or a small Edit. Never rewrite or re-read the whole file to change a status.
- Leave out defaults (`views` for a plain flow, `status`, empty fields, common terms).
- Point at code with `file:line`; keep replies short; do not repeat in chat what the page shows.

## Finish

Summarize in chat with the URL. `WB stop <dir>` unless the user wants the page kept. If permission prompts interrupt, suggest allowing `node <skill dir>/bin/walkboard.mjs` and edits under `~/.walkboard/`; do not change their settings yourself.

## Other commands

`WB set <dir> [plan | step: | node: | constraint: | option: | criterion: | source:<id>] key=value …` (`key=` removes one; JSON values allowed; `[skip ci] …` stays text). `WB export <dir> [--html file] [--no-code] [--no-draft] [--with-chat]`: a read-only copy when the user asks to share the plan, draft changes marked (PDF: the page's ⋮ → Export → PDF). `WB draft <dir> [clear [view] [change …]]`: what the user sketched / clear it once it is in the plan. `WB icons`: icon names. `WB <command> --help`: its options.
