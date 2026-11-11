---
name: walkboard
description: Show work as an interactive picture (flow, cloud or Kubernetes map, sequence, state, timeline…) that the user clicks to ask, correct or confirm. Three modes - plan a feature as small steps and build it step by step, explain how existing code works ("explain the login flow in project A"), or compare designs for something new and pick one. Use when the user wants a visual plan, explanation or comparison, wants to follow along before you build, mentions walkboard, or runs /walkboard.
---

# Walkboard

Long text loses people. You write `plan.json`; Walkboard draws it as a local page; what the user clicks or types there comes back to you.

`WB` = `node <this skill's base directory>/bin/walkboard.mjs` (Node 18.18+, no install): write it out or make a shell function, `wb() { node <dir>/bin/walkboard.mjs "$@"; }`; a variable holding it does not run in zsh. Files named below are under `references/`: read one only when you reach it.

## 0. Language, mode, questions, settings

Use the user's language for everything (questions, plan, replies, suggested commit messages) and set `"lang"`. Code, ids and paths stay as they are. Readers build software: keep technical terms as the team says them (config, deploy, Secret, egress, batch), never translated or invented; say what a thing is or does, not a vague label. Hard terms are explained on hover (`glossary` for the project's own).

- **build**: something new or changed. Sections 1, 3, 4.
- **explain**: understand existing code. Sections 2E, 3, 4E.
- **design**: choose how to build something that does not exist yet ("what should we use for…", "compare…"). Read [design.md](references/design.md), then section 3.

`/walkboard` alone: look through the repository briefly and offer 2-3 things from it by name (a question tool if you have one, else in chat), a real flow to explain first.

If the request leaves open something that changes the picture (scope, repository or service, environment, what "done" means), ask up to three short questions in one go before writing, with the settings question below. What you still assume goes on the page (`constraints` with `"confirmed": false`, or boxes with `"basis": "assumed"`): one short fact each (≤ 12 words), numbers and sources in `detail`; `ask` when it is not a yes or no ("How many services run there?").

`settings`, first match wins: the request · existing `settings` · `~/.walkboard/config.json`. Still missing: ask once (a question tool if you have one, else in chat): build → `"commit": "auto"|"suggest"`; explain → `"depth": "overview"|"detail"`. Offer to save it to the config. No way to ask (a subagent, no user)? `suggest` / `overview`, and say so in one line.

## 1. Write the plan (build)

Folder: `~/.walkboard/<project>/<task>/plan.json` unless the user names one. Fields: [schema.md](references/schema.md).

- 3-8 **steps**, each reviewable in minutes: `title`, `detail`, `done` (how we know), `nodes`.
- **nodes**: `name` (≤ 4 words), `what` (≤ 6 words), `in` / `out` / `why` one line each, `file`. Icons are guessed from names; set `icon` only when wrong.
- **views**: the pictures that explain this work best, as many tabs as the reader needs, each answering its own question: the order of the steps → `flow`; where it runs → `map`; who calls whom, what if it fails → `sequence`; tables, keys → `datamodel`; how it is split up, what uses what → `components`; states and what moves them → `state`; if this, then what → `decision`; data before and after → `transform`; one record's way → `journey`; retries, timeouts, cron → `timeline`; what breaks if it goes down → `impact`; now and after → `diff`. Before writing a picture, read its file, `references/views/<kind>.md`. Each has `id`, `kind` and a `title` the reader knows (its tab); boxes are node ids; never write `layout` (the user's arrangement). Leave `views` out only when the order of the steps is all there is: the page then draws them as a flow.
- **glossary**: only project terms. No secrets, tokens or real customer data.
- `WB check <dir>` until ok with no warnings: a box in no picture cannot be seen or asked about.

## 2E. Write the explanation (explain)

1. Read the real path (entry points, middleware, services, data access, external calls, deployment). Do not guess from names.
2. `"mode": "explain"`, `"root": "<repo>"` (`"roots"` for more), `"start"`. 3-10 stages in order; `done` = what the reader understands there. Pictures as in section 1 (`views`): who calls whom is a `sequence`, where it runs a `map`.
3. Every code box has `file` = `path:line` or `path:from-to` and `anchor` = a short piece of that code (`"function send("`), so `check` notices when the code moves; the page shows the code, so **never paste code into the plan**. `highlight` only the lines that make the point, with a short note when it helps: `{"152": "returns: this wakes the agent"}`. External systems `"ext"`, the focus `"new"`, missing `"todo"`. Mark guesses "unconfirmed: …". A box that is not code (a user, an outside system, a managed service you only call) has `"status": "ext"` and no `file`: never borrow a line for it.
4. `WB check <dir>` until ok with no warnings (it fails when a file or line does not exist).

Only where the flow itself is the hard part, add `moves` to that step or stage ([moves.md](references/moves.md)). Most need none.

## 3. Show and listen

1. `WB open <dir>` prints the URL (`--no-browser` if you open it yourself; `&step=`, `&node=`, `&view=` point at something). If it says a newer Walkboard is installed, tell the user in one line.
2. Give the URL with one line, in their language: "Click a box to see it, type below to ask or change something, approve when ready." Not polling (3)? Add: "then tell me here to check the page."
3. Listen. Only if your tool starts a new turn for you when a background command ends (Claude Code's `run_in_background`): keep one `WB poll <dir>` running that way all session, building included; it exits with what the page sent; start it again after each batch; its `[]` = server stopped, `WB open` again. Otherwise (a tool that backgrounds long commands by itself too) never run a plain `WB poll` nor say messages reach you by themselves: when told to check the page (any words), `WB poll <dir> --now` (`[]` = nothing yet), and end by reminding them. One JSON line per message: `kind`, `text`, `node`/`step`, `viewingStep` (step on screen), `images` (paths: read them).
   - `question` / `confused`: a request to add, change or remove something is a proposal (messages.md). Otherwise `WB reply <dir> [--node <id> | --step <id>] "<answer>"`. Two or three sentences; code in ``` fences. If the picture was unclear, fix it and say so.
   - `deeper`: add boxes, a stage or a view (with `file` evidence); reply with what you added.
   - `approve`: `WB set <dir> approved=true`, reply in one line.
   - `confirm` (`constraint` or `node`): `WB set <dir> constraint:<id> confirmed=true` or the box's real `basis`; if corrected, update what depended on it (scores, `must`, the recommendation) and say what changed. `answer` = the user's own words (it is right, what is true instead, or the answer to its `ask`): act on them the same way. `wrong: true` (older pages): ask what is true, or find out.
   - `review`: [review.md](references/review.md). `withdraw`, `plan`, `apply`, `commit`, `committed`: [messages.md](references/messages.md). `decide`: design.md.
   - `settings`: already saved in plan.json; arrives with another message; no reply.

   Reply to every other message **on the page, where it was asked**, even in one line, even if you also act or say it in chat. An answer that belongs elsewhere goes there, plus one line where it was asked linking it: `[[node:<id>]]`, `[[step:<id>]]`, `[[plan]]`. A person reads it: names and titles on the picture, never ids.

   Asked how Walkboard itself works? A line or two, and the page from https://aiyaruch1320.github.io/walkboard/ (`pictures/<kind>.html`, `platforms/<profile>.html`, `draft.html`, `share.html`, `other-agents.html`, `faq.html`; Thai: the same under `th/`).

4. Taking out a box someone talked about: first `WB reply <dir>` (whole plan) in one line why. The user may also answer in chat.

## 4. Build (build)

Not before `approved` is true. For each step:

1. `WB set <dir> step:<id> status=doing node:<a> status=new …`, then do only that step.
2. `git status`; `WB status <dir>` for the current `settings`. Files changed: `"auto"` → small commits now, one context each; `"suggest"` → a suggested message, `commitMessage=…` on the step (messages.md). None changed, or no repository: neither.
3. `WB set <dir> step:<id> status=review node:<a> status=done …` (the suggested message in the same call), and `WB reply <dir> --step <id>`: one line on what you built and the files touched, or that none changed.
4. Wait (not woken by the page: stop and say so). `next` (`commit`, `committed`: messages.md): `WB set <dir> step:<id> status=done`, then the next step. `"all": true`: the remaining steps without stopping. No reply needed.

## 4E. Walk through (explain)

Answer from the code, reading more when needed; prefer new boxes or stages over long replies. A request that contradicts the code is answered with what the code does and its `file:line`, not drawn. Explain mode never edits the project.

## Keep it cheap

- Write `plan.json` once, compact (no indentation); then `WB set` or a small Edit. Never rewrite or re-read the whole file to change a status.
- Leave out defaults (`status`, empty fields, common terms).
- Point at code with `file:line`; keep replies short; do not repeat in chat what the page shows.

## Finish

Summarize in chat with the URL. `WB stop <dir>` unless the user wants the page kept. If permission prompts interrupt, suggest allowing `node <skill dir>/bin/walkboard.mjs` and edits under `~/.walkboard/`; do not change their settings yourself.

## Other commands

`WB set <dir> [plan | step: | node: | constraint: | option: | criterion: | source:<id>] key=value …` (`key=` removes one; JSON values allowed; `[skip ci] …` stays text). `WB export <dir> [--html file] [--no-code] [--no-draft] [--with-chat]`: a read-only copy when the user asks to share the plan, draft changes marked (PDF: the page's ⋮ → Export → PDF). `WB draft <dir> [clear [view] [change …]]`: what the user sketched / clear it once it is in the plan. `WB icons`: icon names. `WB <command> --help`: its options.
