<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/logo/logo-dark.svg">
    <img src="docs/logo/logo-light.svg" alt="planview" width="460">
  </picture>
</p>

<p align="center">
  <b>A Claude Code skill that turns an agent's plan, or an explanation of existing code, into a page you can click and talk to.</b>
</p>

<p align="center">
  <a href="CHANGELOG.md"><img alt="version 0.4.0" src="https://img.shields.io/badge/version-0.4.0-7f77dd"></a>
  <a href="LICENSE"><img alt="MIT license" src="https://img.shields.io/badge/license-MIT-1d9e75"></a>
  <img alt="Node 18.18 or newer" src="https://img.shields.io/badge/node-%E2%89%A518.18-378add">
  <img alt="zero dependencies" src="https://img.shields.io/badge/dependencies-0-ef9f27">
  <img alt="Claude Code plugin" src="https://img.shields.io/badge/Claude%20Code-plugin-26215c">
</p>

<p align="center">
  <a href="#install">Install</a> ·
  <a href="#what-to-ask">What to ask</a> ·
  <a href="#a-tour">Tour</a> ·
  <a href="#light-on-tokens">Tokens</a> ·
  <a href="#how-it-works">How it works</a> ·
  <a href="#faq">FAQ</a>
</p>

<p align="center">
  <img src="docs/images/demo.gif" alt="planview in use: choose a step, open a box, ask a question, the agent answers on the page, updates the plan, and confirms the user's restatement" width="100%">
</p>
<p align="center"><i>Choose a step, ask on a box, get the answer in place, then restate the step and get it confirmed.</i></p>

When an AI agent plans in long paragraphs, it is easy to lose track and to stop feeling the work is yours. planview makes the agent show its plan as small steps and pictures on a local page, where every step and box has a chat box. Your click wakes the agent; its answer appears where you asked; the picture updates as the work moves on.

## Highlights

- **Pictures, not paragraphs.** Flow, Kubernetes, call sequence and data-transform views, all drawn from one small `plan.json`.
- **Talk on the picture.** Ask, ask for a change, or restate your understanding on any box or step. The agent replies in place.
- **Two modes.** *Build*: plan in small steps, approve, then follow the work. *Explain*: understand existing code, with every box tied to `file:line` and the code shown beside it.
- **You stay in control.** Nothing is built before you approve. Optional teach-back after every step. Commits only if you ask, never with AI co-author lines.
- **Light on tokens.** The agent writes the plan once and updates it with one-line commands. The page does the explaining.
- **Local and private.** Listens on 127.0.0.1 behind a random token. No dependencies, no telemetry, nothing leaves your machine.

## Install

Inside Claude Code:

```
/plugin marketplace add aiyaruch1320/planview
/plugin install planview@planview
```

From a terminal, the same two steps:

```bash
claude plugin marketplace add aiyaruch1320/planview
```

```bash
claude plugin install planview@planview
```

<details>
<summary>Or copy the skill by hand</summary>

```bash
git clone https://github.com/aiyaruch1320/planview.git && cp -R planview/skills/planview ~/.claude/skills/planview
```

Installed this way it is called `/planview` instead of `/planview:planview`.
</details>

Requires Node.js 18.18 or newer (`node -v`). Nothing else is installed.

## What to ask

Your own words work; the slash command is optional.

| Build something | Understand existing code |
|---|---|
| `/planview:planview เพิ่ม endpoint /healthz และ probe ใน Deployment` | `/planview:planview อธิบายการเข้าใช้ระบบใน project A` |
| "วางแผน deploy CronJob ตัวนี้ขึ้น staging เป็นภาพให้หน่อย" | "อธิบาย flow ตั้งแต่รับไฟล์จนส่งเข้า API ใน repo นี้เป็นภาพ" |
| "Plan the move from the old orders table to the new one with planview" | "Explain how a request reaches the database in this service" |
| "ขอแผนแก้บั๊ก login ค้าง ทีละขั้น ให้ผมทวนทุกขั้นด้วย" | "ผมเพิ่งเข้าทีม อธิบาย job รายวันของระบบนี้ ลงลึกถึงไฟล์" |

The agent asks two questions first (teach-back? commit for you? or, when explaining, teach-back and how deep), writes the plan, and gives you a link that only works on your machine.

## A tour

### The plan

<img src="docs/images/build-overview.png" alt="Steps on top, the selected step with what it does and how we know it is done, a chat box, and the flow picture" width="100%">

- **Step bar**: choose a step and everything it does not touch fades; the page switches to a picture that shows it. ✓ means you restated it and it matched; 👉 means it is your turn. ▶ plays the steps once.
- **Step card**: what the step does, how we know it is done, and a chat box.
- **Top bar**, always visible: whether the agent is listening, unread replies, and "✎ แผนเปลี่ยน" when the agent has changed the plan (outlined until you press รับทราบ).
- **Dotted words** come from the glossary: tap one for a plain explanation, or open 📖.

### Pictures that fit the work

| Kubernetes: what runs, what it uses, where it may connect | Call sequence, with alternative paths framed |
|---|---|
| <img src="docs/images/k8s.png" alt="Kubernetes view with config, policy and allowed, pending and blocked connections"> | <img src="docs/images/sequence.png" alt="Sequence view of a login, with the token-expired path in a labelled frame"> |

How data changes shape, with empty values (∅) and stray spaces (␠) made visible:

<img src="docs/images/transform.png" alt="Transform view: warehouse rows, mapped rows with a held row, and the request body" width="100%">

### Ask on a box, follow the build

| Ask on any box; the agent answers under your question | When a step is ready, restate it; the agent confirms ✓ |
|---|---|
| <img src="docs/images/chat.png" alt="A question on a box and the agent's answer, with a glossary explanation open"> | <img src="docs/images/teachback.png" alt="A step marked as your turn, the user's restatement and the agent's confirmation"> |

เข้าใจแล้ว, ยังงง and ลึกขึ้น send at once. For anything else pick **ถาม**, **ขอแก้** or **ทวน** and type. Nothing is built until you press **อนุมัติแผน** (or say so in chat).

### Explain existing code

<img src="docs/images/explain-overview.png" alt="Explain mode: the login flow in stages, the selected stage, and the overview picture" width="100%">

Every box that is code points at `file:line`. `planview check` fails if the file or line does not exist, the page shows the code beside the explanation, and the path opens in VS Code, Cursor or IntelliJ.

<img src="docs/images/explain-code.png" alt="A box showing its code excerpt with the referenced lines highlighted and a link to open it in the editor" width="100%">

Try it on the bundled example, which ships its own sample code:

```bash
node skills/planview/bin/planview.mjs open examples/explain-login
```

## Light on tokens

The expensive part of explaining is the explaining itself. planview moves that into a page, so the agent spends tokens on content once and on very little afterwards.

| Where tokens go | Hand-written explainer | planview |
|---|---|---|
| A rich plan with four pictures | ~38 KB of HTML and SVG, rewritten on every change | ~12.7 KB of `plan.json`, written once; a simple plan fits in ~0.5 KB |
| Moving a step forward | rewrite the page | `planview set … step:x status=review` ≈ 130 bytes (~98× less) |
| Showing code in explain mode | paste it | `file:line`; the server reads the excerpt (0 bytes in the plan) |
| Common terms (Kubernetes, CI, JWT, …) | explain each time | ~70 ship with planview; plans add only their own |
| Each message from the page | — | one compact line, ~110 bytes |
| Instructions loaded with the skill | — | SKILL.md trimmed by 23% to ~6.6 KB |

The skill also tells the agent to leave out anything with a default (a plain flow needs no `views`), to keep replies to two or three sentences, and not to repeat in chat what the page already shows.

## How it works

```
agent ──writes──► plan.json ──► page (picture + details + chat)
  ▲                                   │ click / type / restate
  │ poll (wait) / reply (answer)       ▼
  └──────── local server (127.0.0.1, token) ◄── queue on disk
```

1. The agent writes **data** (`plan.json`); a fixed page draws it, so every plan looks the same and changes are cheap.
2. `planview poll` runs in the background and exits when you click. That exit is what wakes the agent.
3. Messages queue on disk, so nothing is lost while the agent is busy or the server restarts. The page redraws itself when the plan changes and keeps your place and what you were typing.

**Security and privacy**: the server listens on 127.0.0.1 only, and every request needs the random token in the URL. The page loads nothing from the internet, and plan text is always shown as text. Code excerpts are read only from folders the plan declares. Only one server runs per plan folder, and `stop` only signals a process that proves it is that server. There is no telemetry and no sharing.

## FAQ

<details>
<summary><b>I click and nothing happens / the page says it was opened from a file</b></summary>

Open the `http://127.0.0.1:…/?token=…` link the agent gave you, not the HTML file. Lost it? `node skills/planview/bin/planview.mjs status <plan folder>` prints it.
</details>

<details>
<summary><b>The badge says the agent isn't listening</b></summary>

The agent is busy (writing code, running tests). Your message waits in a queue and reaches it when it listens again. Nothing is lost. To hurry it along, say "check the page" in chat.
</details>

<details>
<summary><b>Claude Code asks for permission on every update</b></summary>

Allow `node …/skills/planview/bin/planview.mjs` commands and edits under `~/.planview/` in your Claude Code permissions.
</details>

<details>
<summary><b>The server seems stuck, or the port is taken</b></summary>

`planview stop <folder>` then `planview open <folder>`. The link stays the same across restarts.
</details>

<details>
<summary><b>Can teammates open my page?</b></summary>

No. It runs on your machine only. Share `plan.json`, which anyone can open with `planview open`, or share screenshots.
</details>

<details>
<summary><b>Where are plans kept, and how do I remove them?</b></summary>

In `~/.planview/<project>/<task>/` unless you choose a folder. Delete the folder to remove a plan and its conversation.
</details>

<details>
<summary><b>Does my code or data leave the machine?</b></summary>

Not through planview. The agent itself works as Claude Code normally does.
</details>

## Limitations

- Page labels are in Thai; plan content can be in any language.
- One machine, one viewer: there is no sharing or multi-user editing.
- Each message is delivered once. If the agent process dies right after receiving it, re-ask on the page.
- Built and tested on macOS with Chrome and the Claude desktop app. Linux should work; Windows is untested.
- Very large Kubernetes pictures (thousands of links) redraw slowly.

## Reference

<details>
<summary><b>Commands</b></summary>

The skill runs these for you; they also work by hand from the repository root.

| Command | Does |
|---|---|
| `node skills/planview/bin/planview.mjs check <dir>` | Validate `<dir>/plan.json` (and, in explain mode, that every `file:line` exists) |
| `… set <dir> [step:<id> \| node:<id> \| plan] key=value …` | Change fields in place; `key=` removes one |
| `… open <dir> [--no-browser]` | Start or reuse the server, print the URL |
| `… poll <dir>` | Wait for the page; one JSON line per message |
| `… reply <dir> [--node id \| --step id] <text>` | Answer on the page |
| `… status <dir>` / `… stop <dir>` | Show the URL and queue / stop the server |
</details>

<details>
<summary><b>Links into a page</b></summary>

Add `&step=<id>`, `&view=<id>`, `&node=<id>` (or `&step=all`) and `&theme=light|dark` to a page URL to open it at that place.
</details>

<details>
<summary><b>Plan format and examples</b></summary>

- [schema.md](skills/planview/references/schema.md) for `plan.json`, and [views.md](skills/planview/references/views.md) for the four pictures
- `examples/nightly-import`: build mode, a CronJob deployed to staging, all four pictures
- `examples/explain-login`: explain mode, a sample `shop-api` login flow with its code
- `examples/planview`: the plan that built planview

All example data is made up.
</details>

<details>
<summary><b>Update or uninstall</b></summary>

```
/plugin marketplace update planview
/plugin uninstall planview@planview
```

Installed by hand: pull the repository again, or delete `~/.claude/skills/planview`.
</details>

## Contributing

```bash
npm test
```

```bash
node scripts/screenshots.mjs
```

```bash
node scripts/demo-gif.mjs
```

The last two regenerate `docs/images` and the demo GIF from the examples (Google Chrome and Node 22 needed).

```
skills/planview/
  SKILL.md            what the agent does
  references/         plan.json and view reference
  bin/planview.mjs    CLI
  lib/                server, validation, code excerpts, in-place edits
  assets/             the page (one file, no dependencies) and the shared glossary
scripts/              screenshots and the demo GIF
```

Changes are listed in [CHANGELOG.md](CHANGELOG.md).

## Acknowledgements

Inspired by [lavish-axi](https://github.com/kunchenguid/lavish-axi). README structure informed by [uv](https://github.com/astral-sh/uv), [fzf](https://github.com/junegunn/fzf), [Excalidraw](https://github.com/excalidraw/excalidraw) and [HTTPie](https://github.com/httpie/cli).

## License

[MIT](LICENSE)
