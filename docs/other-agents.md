# Use other agents

Walkboard is a skill, and skills are not only for Claude Code. Codex, Gemini CLI, Cursor, GitHub Copilot and other coding agents that read `SKILL.md` skills can use it too. This page explains what works the same, what is different, and how to install it.

## What works the same

The pictures and the page do not depend on the agent. With any agent, you get:

- every kind of picture, and every mode: plan, explain and design
- clicking a box to see its details and its code
- asking on a box, and answers that appear on that box
- [sketching your own changes](draft.md) and asking for a review
- export to HTML and PDF

## What is different

In Claude Code, the agent is woken up the moment you click or ask on the page. It answers right away, while you keep using its chat for other things.

Most other agents cannot be woken up from outside. So instead of waiting on the page, the agent goes back to its chat, and your messages on the page wait for it. When you are ready, tell it in its chat:

```
check the page
```

Any words work, in any language, for example "ดูหน้า walkboard". The agent reads everything that waited: your questions, an approval, a sketch to review. Then it answers each one on the page, where you asked, and goes back to its chat. Behind the scenes it runs `walkboard poll --now`, which hands over what waits and returns at once.

You can tell which way a page works from the status at the top right. It reads **✉ Not live: tell your agent**. After you send something, it also shows how many messages are waiting. Click it for the words to copy into the chat. Each waiting message on the page says the same, with a **Copy** button.

> **Good to know:** "Check the page" also works in Claude Code. If the agent is busy building a step, it makes the agent read your messages sooner.

## Installing

You need Node.js 18.18 or newer. Run `node -v` to check.

Clone the repository, then copy the whole `skills/walkboard` folder, not only `SKILL.md`, to the folder where your agent reads skills. `~/.agents/skills` is where Codex looks, and several other agents read it too. OpenCode also finds a skill in your project's `.opencode/skills` folder. If yours reads skills from another folder, its documentation names it.

On macOS or Linux:

```bash
git clone https://github.com/aiyaruch1320/walkboard.git
mkdir -p ~/.agents/skills
cp -R walkboard/skills/walkboard ~/.agents/skills/walkboard
```

On Windows, in PowerShell:

```powershell
git clone https://github.com/aiyaruch1320/walkboard.git
New-Item -ItemType Directory -Force "$HOME\.agents\skills" | Out-Null
Copy-Item -Recurse walkboard\skills\walkboard "$HOME\.agents\skills\walkboard"
```

To check the copy, run its command line. It should print its usage:

```bash
node ~/.agents/skills/walkboard/bin/walkboard.mjs --help
```

## Starting it

Start a new session in one of your repositories, and ask in your own words, for example "show me how login works as a picture" or "plan adding a health check, with walkboard". The agent picks the skill from its description.

The agent writes the plan and gives you a link that starts with `http://127.0.0.1:`. Open it in your browser. If the agent does not mention the skill, ask it whether it has the walkboard skill. If not, check the folder above and start a new session.

## Permissions and sandboxes

The agent runs `node …/skills/walkboard/bin/walkboard.mjs` many times. Allow that command in your agent's settings, or it asks you each time.

Walkboard needs to do two things that a strict sandbox may block:

- write plans under `~/.walkboard/`, unless you ask for another folder
- run a small server on 127.0.0.1, which your browser connects to

If the agent reports that it cannot write there or cannot start the server, allow those in your agent's sandbox settings. The server never makes network requests of its own. [SECURITY.md](../SECURITY.md) lists everything it reads, writes and runs.

## Updating and uninstalling

To update, pull the repository and copy the folder again:

```bash
cd walkboard && git pull
rm -rf ~/.agents/skills/walkboard && cp -R skills/walkboard ~/.agents/skills/walkboard
```

To uninstall, delete `~/.agents/skills/walkboard`. Your plans stay in `~/.walkboard/` until you delete that folder too.

## How well it is tested

Walkboard is built and used every day with Claude Code. It has also been tried end to end with **OpenCode** 2.2: it found the skill by itself, drew an explanation and a plan, answered questions and an approval when told to check the page, and built the first step. Other agents should work too, because they follow the same `SKILL.md`, but nobody has tried them by hand yet.

If you try one, please [tell us how it went](https://github.com/aiyaruch1320/walkboard/issues/new/choose), even if it worked. The bug form asks which agent you use.

## Next steps

- [Installation](getting-started.md): the first page, and what happens next.
- [The page](page.md): what each part of the page does.
