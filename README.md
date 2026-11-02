<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/logo/logo-dark.svg">
    <img src="docs/logo/logo-light.svg" alt="planview" width="420">
  </picture>
</p>

<p align="center">
  A Claude Code skill that turns a plan, an explanation of existing code,<br>
  or a comparison of designs into a page you can click and talk to.
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

Long AI-written plans are hard to follow, and it is easy to lose the feeling that the work is yours. planview has the agent show its work as pictures on a local page instead. Click a box, a step or a table cell to ask about it, and the agent answers right there.

### What you get

- **See it, don't scroll it.** Twelve kinds of picture (flow, Kubernetes, network map, sequence, data journey, state, timeline and more) replace pages of text. The agent picks the one that answers your question.
- **Ask on the spot.** Every box, step and comparison cell has its own thread. Your click wakes the agent, and its answer appears where you asked, not somewhere in a long chat.
- **You stay in charge.** Nothing is built before you press **Approve plan**. After each step you restate it in your own words and the agent corrects what you missed. Commit messages are suggested for you to edit, and proposed changes are drawn on the picture before anything is built.
- **Evidence, not guesses.** In explain mode every box points at the real `file:line`, the page shows that code with the important lines marked, and `planview check` notices when the code has moved since it was explained. In design mode every score cites a source with the date it was read. Anything the agent assumed is drawn dashed until you confirm it.
- **Decide with your own priorities.** Weigh what matters (cost, effort, scale), mark the must-haves, and the page tells you when your weights put a different option ahead of the agent's recommendation. Choosing an option turns it into a step-by-step plan.
- **Lighter than a hand-written explainer.** The agent writes a small JSON file once and updates it with one-line commands, while the page does the drawing. A four-picture plan is about 7 KB of JSON instead of 26–43 KB of HTML rewritten on every change ([numbers](docs/GUIDE.md#light-on-tokens)).
- **For the whole team.** A product owner can compare options without reading code; a new developer can follow a plan step by step; a senior can check claims against the code.
- **Private and simple.** Everything stays on your machine: a zero-dependency Node server on 127.0.0.1 behind a random token, no telemetry. The agent plans in the language you write in, and the page's labels follow (English and Thai).

## Three modes

| Mode | Use it to | You get |
|---|---|---|
| **Plan** | build or change something | 3-8 small steps you approve, then follow as the agent builds them, restating each one |
| **Explain** | understand code that already exists | stages in order, each box tied to the real code, with notes on the lines that matter |
| **Design** | choose how to build something new | 2-4 options drawn side by side, scored against your criteria with sources, and a recommendation |

The agent picks the mode from your request and asks up to three short questions first if something would change the picture.

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
/planview compare ways to connect EC2 across two AWS accounts
```

<sub>If another command is already called `/planview`, use the full name `/planview:planview`.</sub>

1. The agent asks what it needs to know (for a plan: commit for you, or only suggest messages?). Save your answers in `~/.planview/config.json` and they are not asked again.
2. It writes the plan and gives you a link to a page on your machine.
3. Click a box to see what it is, ask about it, or propose a change. 👉 and a purple bar mean it is your turn; **?** shows a short tour.
4. Switch restating and commits under **Agent settings** at the top of the page. Switching does not wake the agent or cost tokens. Keep Claude Code open while you use the page: that is where the agent works.

Boxes carry icons for what they are, with AWS, Google Cloud, Azure and Kubernetes parts in their own colours. Built and tested on macOS.

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

The agent writes `plan.json`; a fixed page draws it, so every plan looks familiar and the agent never writes HTML. What you click or type is queued on disk and handed to a background `planview poll`, which wakes the agent; `planview reply` puts its answer back on the page.

## For AI agents

- **Using planview for a user**: read [skills/planview/SKILL.md](skills/planview/SKILL.md) and follow it. It covers the three modes, the questions to ask first, the plan format and every command. From a clone, the CLI also works without installing: `node skills/planview/bin/planview.mjs <command>`.
- **Installing it for a user**: ask first, because it changes their Claude Code setup.
  1. Check `node -v` is 18.18 or newer.
  2. Prefer the plugin: `claude plugin marketplace add aiyaruch1320/planview`, then `claude plugin install planview@planview`. If plugins are not available, clone this repository and copy `skills/planview` to `~/.claude/skills/planview`.
  3. Tell the user to start a new Claude Code session. It worked if `/planview` appears in the slash-command menu and `node <skill dir>/bin/planview.mjs` prints its usage.
- **Changing this repository**: read [AGENTS.md](AGENTS.md) for the map, rules and checks.

## License

[MIT](LICENSE) · [Changelog](CHANGELOG.md) · Inspired by [lavish-axi](https://github.com/kunchenguid/lavish-axi)
