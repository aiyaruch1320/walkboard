# planview

A Claude Code skill that turns an agent's plan, or an explanation of existing code, into a picture you can click and talk to.

![A plan in planview: steps on top, the selected step's details and chat, and the flow picture below](docs/images/build-overview.png)

Long text plans are hard to follow, and it is easy to lose the feeling that the work is yours. With planview the agent shows its work as a local web page: small steps, pictures instead of paragraphs, and a chat box on every step and box. You click, ask, ask for changes or restate what you understood; the agent is woken by your click, answers on the page, and updates the picture.

It has two modes:

| Mode | Use it when | You get |
|---|---|---|
| **build** | you want something made or changed | a plan in small steps, an approval button, then the agent builds step by step while you follow, ask and restate |
| **explain** | you want to understand code that already exists | the real flow through the code, each box pointing at `file:line`, with the code shown and a link to open it in your editor |

## Install

As a plugin, inside Claude Code:

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

Or copy the skill folder by hand (then it is called `/planview` instead of `/planview:planview`):

```bash
git clone https://github.com/aiyaruch1320/planview.git && cp -R planview/skills/planview ~/.claude/skills/planview
```

Needs Node.js 18.18 or newer. Nothing else is installed.

## Examples of what to ask

Use your own words; the slash command is optional.

**build**

- `/planview:planview เพิ่ม endpoint /healthz และ probe ใน Deployment ของ service นี้`
- "วางแผน deploy CronJob ตัวนี้ขึ้น staging เป็นภาพให้หน่อย"
- "Plan the migration from the old orders table to the new one with planview"
- "ขอแผนแก้บั๊ก login ค้าง แบบทีละขั้น ให้ผมทวนทุกขั้นด้วย"

**explain**

- `/planview:planview อธิบายการเข้าใช้ระบบใน project A`
- "อธิบาย flow ตั้งแต่รับไฟล์จนส่งเข้า API ใน repo นี้เป็นภาพ"
- "Explain how a request reaches the database in this service"
- "ผมเพิ่งเข้าทีม ช่วยอธิบายว่า job รายวันของระบบนี้ทำงานอย่างไร ลงลึกถึงไฟล์"

## Walkthrough: build mode

### 1. Two questions first

Before planning, the agent asks:

1. *Do you want to restate your understanding after each step?* (teach-back)
2. *Should I commit for you, or only suggest commit messages?* Commits never carry a co-author or AI line.

### 2. The plan opens as a page

The agent writes the plan, checks it, and gives you a link such as `http://127.0.0.1:61778/?token=…` (it only works on your machine).

- **Step bar**: click a step and everything it does not touch fades; the page also switches to a picture that shows that step. ▶ plays the steps once.
- **Step card**: what the step does, how we know it is done, and a chat box.
- **Pictures** as tabs. Dotted words are in the glossary: click or tap one for a plain explanation, or open 📖 for the whole list.
- **Bar at the top** (stays while you scroll): whether the agent is listening right now, unread replies, and what the agent changed.

### 3. Pictures that fit the work

| Kubernetes: what runs, what it uses, where it may connect | Sequence: who calls whom, with alternative paths framed |
|---|---|
| ![Kubernetes view](docs/images/k8s.png) | ![Sequence view](docs/images/sequence.png) |

How data changes shape, with empty values (∅) and stray spaces (␠) made visible:

![Transform view](docs/images/transform.png)

### 4. Ask, or ask for a change, right on the box

Click any box: what goes in, what comes out, why, and a chat box. เข้าใจแล้ว and ยังงง send at once; pick **ถาม** or **ขอแก้** and type for anything else. The agent's answer appears under your message. If you ask for a change, the agent edits the plan, the page redraws by itself, and "✎ แผนเปลี่ยน" outlines what changed until you press รับทราบ.

![A question and the agent's answer on a box, with a glossary explanation open](docs/images/chat.png)

### 5. Approve, then follow the build

Press **อนุมัติแผน** on the whole-plan box (or say so in chat). The agent builds one step at a time. When a step is ready, it turns purple with **👉 ถึงตาคุณ**: restate it in your own words, the agent says what is right and corrects the rest, and the step gets **✓** once you match. Then it commits (or suggests the commit message) and moves on.

![A step waiting for the user's restatement, with the agent's confirmation](docs/images/teachback.png)

## Walkthrough: explain mode

Ask about existing code. The agent asks whether you want teach-back and how deep to go, reads the code, and opens the flow as stages ("ช่วงที่ 1, 2, 3…").

![Explain mode: stages of the login flow, the selected stage's explanation and the overview picture](docs/images/explain-overview.png)

Every box that is code points at `file:line`. `planview check` fails if a file or line does not exist, the page shows the code right there, and the path opens in VS Code (or Cursor / IntelliJ). **ลึกขึ้น** asks the agent to break that part down further.

![A box showing its code excerpt and a link to open it in the editor](docs/images/explain-code.png)

Try it with the example, which ships its own made-up sample code:

```bash
node skills/planview/bin/planview.mjs open examples/explain-login
```

## Page reference

| On the page | What it does |
|---|---|
| ● / ◐ / ○ badge | Agent listening now / connected but agent busy (your message waits in a queue) / server not reachable |
| 💬 ข้อความใหม่จาก agent | Jump to an unread reply; red dots mark where |
| ✎ แผนเปลี่ยน N จุด | List what the agent changed; รับทราบ clears the outlines |
| Step chips | ✓ restated and confirmed, 👉 your turn |
| เข้าใจแล้ว · ยังงง · ลึกขึ้น | Quick replies, sent at once |
| ถาม · ขอแก้ · ทวน | What the text you type is sent as |
| อนุมัติแผน | Lets the agent start building (build mode) |
| 📖 / dotted words | Glossary |

Links can open a given place: add `&step=<id>`, `&view=<id>`, `&node=<id>` (or `&step=all`) and `&theme=light|dark` to the URL.

## How it works

```
agent ──writes──► plan.json ──► page (picture + details + chat)
  ▲                                   │ click / type / restate
  │ poll (wait) / reply (answer)       ▼
  └──────── local server (127.0.0.1, token) ◄── queue on disk
```

- The agent writes only data (`plan.json`); the page draws it, so every plan looks the same and is cheap to change.
- `planview poll`, run in the background, waits for the page and exits when you click; that exit wakes the agent. Messages queue on disk, so nothing is lost while the agent is busy or the server restarts.
- The page reloads the plan by itself when the file changes and keeps your selection and what you were typing.

**Security**: the server listens on 127.0.0.1 only, every request needs the random token in the URL, the page loads nothing from the internet, and plan text is always shown as text. Code excerpts are read only from inside the folders the plan declares. One server runs per plan folder, and `stop` only signals a process that proves it is that server. There is no telemetry and no sharing.

If permission prompts interrupt the loop, allow `node …/skills/planview/bin/planview.mjs` commands and edits under `~/.planview/` in your Claude Code permissions.

## Commands

The skill runs these for you; they also work by hand from the repository root:

| Command | Does |
|---|---|
| `node skills/planview/bin/planview.mjs check <dir>` | Validate `<dir>/plan.json` (and in explain mode, that every `file:line` exists) |
| `… open <dir> [--no-browser]` | Start or reuse the server, print the URL |
| `… poll <dir>` | Wait for the page, print what it sent |
| `… reply <dir> [--node id \| --step id] <text>` | Answer on the page |
| `… status <dir>` / `… stop <dir>` | Show the URL and queue / stop the server |

Examples (all data is made up):

- `examples/nightly-import`: build mode, a CronJob deployed to staging, all four pictures
- `examples/explain-login`: explain mode, the login flow of a sample `shop-api`
- `examples/planview`: the plan that built planview

The plan format is described in [skills/planview/references/schema.md](skills/planview/references/schema.md) and the pictures in [views.md](skills/planview/references/views.md).

## Develop

```bash
npm test
```

Regenerate the screenshots in `docs/images` (needs Google Chrome and Node 22):

```bash
node scripts/screenshots.mjs
```

```
skills/planview/
  SKILL.md            what the agent does
  references/         plan.json and view reference
  bin/planview.mjs    CLI
  lib/server.mjs      local server, queue, live reload
  lib/schema.mjs      validation shared by the CLI and the page
  lib/source.mjs      code excerpts and file:line checks
  assets/viewer.html  the page (one file, no dependencies)
```

Inspired by [lavish-axi](https://github.com/kunchenguid/lavish-axi). MIT licensed.
