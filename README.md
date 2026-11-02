# planview

A Claude Code skill that turns an agent's plan into a picture you can click.

Long text plans are hard to follow, and it is easy to lose the feeling that the work is yours. With planview the agent shows its work as an interactive page: a flow, a Kubernetes map when something is deployed, a sequence of calls, how data changes shape. Click any box to see what goes in, what comes out and why, then press เข้าใจแล้ว / ยังงง, or pick ถาม / ขอแก้ / ทวน and type. The agent is woken by your click, answers on the page, and updates the picture.

Two modes:

- **build**: plan a feature as small steps, approve the plan, then follow the agent building it step by step.
- **explain**: understand code that already exists, e.g. "/planview อธิบายการเข้าใช้ระบบใน project A". The agent reads the code and draws the real flow, every box pointing at `file:line`, and you ask about it on the page.

```
agent ──writes──► plan.json ──► page (picture + details + chat)
  ▲                                   │ click / type / restate
  │ poll (wait) / reply (answer)       ▼
  └──────── local server (127.0.0.1, token) ◄── queue on disk
```

## Install

As a plugin (recommended), in Claude Code:

```
/plugin marketplace add aiyaruch1320/planview
/plugin install planview@planview
```

or from a terminal:

```bash
claude plugin marketplace add aiyaruch1320/planview
```

```bash
claude plugin install planview@planview
```

Or copy the skill folder by hand:

```bash
git clone https://github.com/aiyaruch1320/planview.git && cp -R planview/skills/planview ~/.claude/skills/planview
```

Needs Node.js 18.18 or newer. Nothing else is installed.

## Use

Ask in your own words ("plan this with planview", "วางแผนเป็นภาพให้หน่อย", "อธิบาย flow การ login ให้ดูหน่อย") or run `/planview:planview` (`/planview` when installed by hand). The agent first asks:

- build: (1) restate your understanding after each step (teach-back)? (2) commit for you, or only suggest commit messages? Commits never carry a co-author or AI line.
- explain: (1) teach-back? (2) overview, or down to functions and files?

Then it writes the plan, opens the page and waits for you. On the page:

- the status badge says whether the agent is listening right now; if not, your message waits in the queue
- the step bar: click a step to fade everything it does not touch and jump to a picture that shows it; 👉 means it is your turn, ✓ means your restatement matched; ▶ plays the steps once
- tabs for each picture: `flow`, `k8s`, `sequence`, `transform`
- click a box for its details and a chat box; 💬 marks boxes with a conversation, red ones have an unread reply
- dotted words are in the glossary: click or tap them; 📖 lists them all
- in build mode, "อนุมัติแผน" on the whole-plan box lets the agent start; after the agent edits the plan, the changed steps and boxes are outlined

## How it works

- The agent writes only data (`plan.json`); the page draws it, so every plan looks the same and is cheap to change.
- `planview poll`, run in the background, is a long poll: it exits when you click, and its exit wakes the agent.
- Feedback is appended to `.planview/feedback.jsonl` next to the plan with a delivered counter, so nothing is lost or repeated when the agent is busy or the server restarts.
- The page reloads the plan by itself when the file changes and keeps your selection.

Security: the server listens on 127.0.0.1 only, every request needs the random token in the URL, the page loads nothing from the internet, and plan text is always rendered as text. One server runs per plan folder, and `stop` only signals a process that proves it is that server. There is no telemetry and no sharing.

If permission prompts interrupt the loop, allow `node …/skills/planview/bin/planview.mjs` commands and edits under `~/.planview/` in your Claude Code permissions.

## Commands

The skill runs these for you; they also work by hand from the repository root:

| Command | Does |
|---|---|
| `node skills/planview/bin/planview.mjs check <dir>` | Validate `<dir>/plan.json` |
| `… open <dir> [--no-browser]` | Start or reuse the server, print the URL |
| `… poll <dir>` | Wait for the page, print what it sent |
| `… reply <dir> [--node id \| --step id] <text>` | Answer on the page |
| `… status <dir>` / `… stop <dir>` | Show the URL and queue / stop the server |

Try the examples:

```bash
node skills/planview/bin/planview.mjs open examples/nightly-import
```

- `examples/nightly-import`: a CronJob deployed to staging, using all four pictures
- `examples/explain-login`: explain mode, the login flow of a made-up `shop-api`
- `examples/planview`: the plan that built planview

All example data is made up.

The plan format is described in [skills/planview/references/schema.md](skills/planview/references/schema.md) and the pictures in [views.md](skills/planview/references/views.md).

## Develop

```bash
npm test
```

```
skills/planview/
  SKILL.md            what the agent does
  references/         plan.json and view reference
  bin/planview.mjs    CLI
  lib/server.mjs      local server, queue, live reload
  lib/schema.mjs      validation shared by the CLI and the page
  assets/viewer.html  the page (one file, no dependencies)
```

Inspired by [lavish-axi](https://github.com/kunchenguid/lavish-axi).
