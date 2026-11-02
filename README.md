<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/logo/logo-dark.svg">
    <img src="docs/logo/logo-light.svg" alt="planview" width="420">
  </picture>
</p>

<p align="center">
  A Claude Code skill that turns a plan, or an explanation of existing code,<br>
  into a page you can click and talk to.
</p>

<p align="center">
  <a href="CHANGELOG.md"><img alt="version 0.6.0" src="https://img.shields.io/badge/version-0.6.0-7f77dd"></a>
  <a href="LICENSE"><img alt="MIT license" src="https://img.shields.io/badge/license-MIT-1d9e75"></a>
  <img alt="zero dependencies" src="https://img.shields.io/badge/dependencies-0-ef9f27">
</p>

<p align="center">
  <img src="docs/images/demo.gif" alt="Typing a request in Claude Code, opening the plan page, choosing a step, asking on a box, the agent answering in place, and confirming a restated step" width="100%">
</p>

## Why

Long AI-written plans are hard to follow, and it is easy to lose the feeling that the work is yours. planview has the agent show its work as small steps and pictures on a local page. Every step and box has a chat box. Your click wakes the agent, and its answer appears where you asked.

- **Build**: plan a change in small steps, approve it, then follow along. After each step you can restate it in your own words; the agent tells you what you got right and corrects the rest, so you know you really understand the work before it moves on.
- **Explain**: understand code that already exists. Every box points at the real `file:line`, and the page shows that code beside the explanation.

## Install

```
/plugin marketplace add aiyaruch1320/planview
/plugin install planview@planview
```

Needs Node.js 18.18 or newer. Nothing else.

## Use

Type `/planview` and say what you want, or just ask in your own words:

```
/planview plan deploying this CronJob to staging
/planview explain how login works in project A
```

<sub>If another command is already called `/planview`, use the full name `/planview:planview`.</sub>

1. The agent asks one quick question (commit for you, or only suggest messages?), once: save your answer in `~/.planview/config.json` and it is never asked again.
2. It writes the plan and gives you a link to a page on your machine.
3. You click, ask, or ask for changes. Dots show while the agent works on your message; the answer appears on the page and the picture updates.
4. Restating each step is on by default; switch it, and how commits are made, under **Agent settings** at the top of the page; switching does not wake the agent or cost tokens. In build mode, nothing starts until you press **Approve plan**. Keep Claude Code open while you use the page: that is where the agent works.

The agent plans and answers in the language you write in, and the page's labels follow (English and Thai). Boxes carry icons for what they are, with AWS, Google Cloud, Azure and Kubernetes parts in their own colours, so the picture maps onto your system at a glance. Built and tested on macOS.

<table>
  <tr>
    <td width="50%"><img src="docs/images/chat.png" alt="A question on a box and the agent's answer"></td>
    <td width="50%"><img src="docs/images/explain-code.png" alt="Explain mode: a box with its code excerpt and an editor link"></td>
  </tr>
  <tr>
    <td align="center"><sub>Ask on any box; the answer appears in the side panel</sub></td>
    <td align="center"><sub>Explain mode shows the real code behind each box</sub></td>
  </tr>
</table>

More screens, FAQ and reference: **[docs/GUIDE.md](docs/GUIDE.md)**.

## How it works

```
agent ──writes──► plan.json ──► page (pictures + chat)
  ▲                                   │ click / ask / restate
  └── wakes up ◄── local server ◄─────┘
```

The agent writes a small JSON file once and updates it with one-line commands, while the page does the explaining, so it stays light on tokens ([numbers](docs/GUIDE.md#light-on-tokens)). Everything stays on your machine: the server listens on 127.0.0.1 behind a random token, has no dependencies, and sends no telemetry.

## For AI agents

- **Using planview for a user**: read [skills/planview/SKILL.md](skills/planview/SKILL.md) and follow it. It covers the modes, the up-front question, the plan format and every command. From a clone, the CLI also works without installing: `node skills/planview/bin/planview.mjs <command>`.
- **Installing it for a user**: ask first, because it changes their Claude Code setup.
  1. Check `node -v` is 18.18 or newer.
  2. Prefer the plugin: `claude plugin marketplace add aiyaruch1320/planview`, then `claude plugin install planview@planview`. If plugins are not available, clone this repository and copy `skills/planview` to `~/.claude/skills/planview`.
  3. Tell the user to start a new Claude Code session. It worked if `/planview` appears in the slash-command menu and `node <skill dir>/bin/planview.mjs` prints its usage.
- **Changing this repository**: read [AGENTS.md](AGENTS.md) for the map, rules and checks.

## License

[MIT](LICENSE) · [Changelog](CHANGELOG.md) · Inspired by [lavish-axi](https://github.com/kunchenguid/lavish-axi)
