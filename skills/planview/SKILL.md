---
name: planview
description: Show work as an interactive diagram (flow, Kubernetes, sequence, data transform) that the user can click to ask, correct or confirm. Two modes - plan a feature as small steps and build it step by step, or explain how existing code works (e.g. "explain the login flow in project A"). Use when the user wants a visual plan or explanation, wants to follow along or understand before you build, mentions planview, or runs /planview.
---

# planview

Long text loses people. You write `plan.json`; planview draws it as a local page; what the user clicks or types there comes back to you.

`PV` = `node <this skill's base directory>/bin/planview.mjs` (Node 18.18+, no install).

## 0. Language, mode and settings

Use the language the user writes in for everything: questions, the plan, replies, commit-message suggestions. Set `"lang"` in the plan to its code (`"en"`, `"th"`, …); the page's buttons and labels follow it (English for languages planview has no labels for). Code, ids and file paths stay as they are.

- **build**: something new or changed. Sections 1, 3, 4.
- **explain**: understand existing code. Sections 2E, 3, 4E.

`settings` in the plan, in this order of precedence:

1. What the request says ("no restating", "commit for me", "just an overview").
2. Existing `settings` in the plan; never ask again.
3. The user's defaults in `~/.planview/config.json`, e.g. `{"teachBack": true, "commit": "suggest", "depth": "overview"}`.
4. Still missing: ask one question (AskUserQuestion when available). build: commit for them, or only suggest messages? → `"commit": "auto"|"suggest"`; explain: overview or detail? → `"depth"`. Then offer to save the answer to `~/.planview/config.json` so it is never asked again.

Do not ask about restating (`teachBack`): it is on unless set to `false`. The user can switch it, and commits, on the page.

## 1. Write the plan (build)

Folder: `~/.planview/<project>/<task>/plan.json` unless the user names one. Read [references/schema.md](references/schema.md) the first time.

- 3-8 **steps**, each reviewable in minutes: `title`, `detail` (what it does), `done` (how we know), `nodes` (boxes it touches).
- **nodes**: `name` (≤ 4 words), `what` (≤ 6 words), `in` / `out` / `why` one line each, `file`. The page picks an icon from the name (S3, BigQuery, CronJob, PostgreSQL, API, …); set `icon` only when that guess is wrong or a cloud service has a generic name: `aws:s3`, `gcp:bigquery`, `azure:keyvault`, `k8s:cronjob`, or a plain one such as `database`, `queue`, `user` (list in the schema reference).
- **views**: leave them out for a plain flow (built from the steps). Add `k8s` when something runs in Kubernetes, `sequence` when call order matters (alternatives in a `group`), `transform` when data changes shape; see [references/views.md](references/views.md).
- **glossary**: only terms specific to this project. Common terms (Kubernetes, CI, HTTP, JWT, …) ship with planview.
- No secrets, tokens or real customer data.
- `PV check <dir>` until it says ok.

## 2E. Write the explanation (explain)

1. Read the real path: entry points, middleware, services, data access, external calls, deployment files. Do not guess from names.
2. `"mode": "explain"`, `"root": "<repo path>"`, `"roots": {"deploy": "<path>"}` for other repositories, `"start": "<first stage id>"`. Steps are 3-10 stages in order with `detail` and `done` (what the reader understands there).
3. Every code box has `file` = `path:line` or `path:from-to` (`deploy:path:line` for a named root). The page shows that code and links it to the editor, so **never paste code into the plan**. `PV check` fails if a file or line does not exist. Mark anything unconfirmed in `why` ("unconfirmed: …", in the user's language). Code is `"done"` (the default), external systems `"ext"`, the parts the question is about `"new"`.
4. `PV check <dir>` until ok.

## 3. Show and listen

1. `PV open <dir>` starts or reuses the server and prints the URL (`--no-browser` when you open it yourself, e.g. in a browser pane). Add `&step=<id>`, `&node=<id>` or `&view=<id>` to point at something. Give the user the URL in one line.
2. While you wait, keep exactly one `PV poll <dir>` running **in the background** (`PV status` shows `waiting: 1` if one is). It exits when the page sends something, which wakes you, and prints one JSON line per message: `kind`, `text`, and `node` or `step` (`viewingStep` = the step the user had open). Handle every line:
   - `question` / `confused`: `PV reply <dir> --node <id> "<answer>"` (or `--step <id>`; neither for the whole plan). Two or three sentences. If the picture was unclear, fix the box instead and say so.
   - `deeper`: add boxes, a stage or a view (with `file` evidence), then reply with what you added.
   - `change`: change the plan, `PV check`, reply with what changed (the page highlights it).
   - `teachback`: say what is right, correct what is not; when it matches, `PV set <dir> step:<id> confirmed=true`.
   - `approve`: `PV set <dir> approved=true`, then reply in one line. `ok`: acknowledge in one line.
   - `settings`: switches the user changed on the page (already in plan.json). It only arrives together with another message and needs no reply.
   Reply to every other message, even in one line: the page shows you as typing from the moment you take a message until you reply or poll again.
3. Refer to steps by title, not number. Start `PV poll` again. The user may also answer in chat; handle both.

## 4. Build (build)

Do not start until `approved` is true. For each step:

1. `PV set <dir> step:<id> status=doing node:<a> status=new …`
2. Do the work, limited to that step.
3. `PV set <dir> step:<id> status=review node:<a> status=done …` (the page shows "Your turn").
4. Read the current `settings` first (`PV status <dir>` prints them; the user may have switched them on the page). With teach-back on (`teachBack` is not `false`), wait until the step is `confirmed`; if the user asks to skip restating this step, go on without it. Otherwise skip.
5. Commit per `settings.commit`: `"auto"` → small commits, one context each; `"suggest"` → give the messages, do not commit. The user who installed planview wants no `Co-Authored-By` or other line naming an AI or tool in these messages.
6. `PV set <dir> step:<id> status=done`.

## 4E. Walk through (explain)

Answer from the code, reading more when needed and adding `file` evidence. Prefer new boxes, stages or views over long replies. With teach-back on, confirm each stage as above.

## Keep it cheap

The page carries the explanation, so tokens go into the plan once and stay small afterwards:

- Write `plan.json` once. After that, change it with `PV set` (statuses, flags, single fields) or a small Edit; never rewrite or re-read the whole file to change a status.
- Leave out what has a default: `views` for a plain flow, `status`, empty fields, common glossary terms.
- Point at code with `file:line`; the page shows it.
- Keep replies to two or three sentences and do not repeat in chat what the page shows. In chat, give the URL and what changed.
- Fix `PV check` problems and move on; warnings are advice.

## Finish

Summarize in chat with the URL. `PV stop <dir>` unless the user wants the page kept; a waiting poll then exits by itself. If permission prompts interrupt the loop, suggest allowing `node <skill dir>/bin/planview.mjs` and edits under `~/.planview/`; do not change their settings yourself.

## Commands

| Command | Does |
|---|---|
| `PV check <dir>` | Validate; problems exit 1, warnings are advice |
| `PV set <dir> [step:<id> \| node:<id> \| plan] key=value …` | Change fields in place (`key=` removes one) |
| `PV open <dir> [--no-browser]` | Start or reuse the server, print the URL |
| `PV poll <dir>` | Wait for the page; one JSON line per message |
| `PV reply <dir> [--node id \| --step id] <text>` | Answer on the page |
| `PV status <dir>` / `PV stop <dir>` | URL, queue and waiting poll / stop the server |
