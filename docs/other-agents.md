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

The agent reads everything that waited, your questions, an approval, a sketch to review, and answers each one on the page, where you asked.

You can tell which way a page works from the dot at the top right. A grey dot means messages wait for your agent. After you send one, it shows **✉** and how many are waiting, and the message itself reminds you to tell the agent.

> **Good to know:** This also works in Claude Code. If the agent is busy building a step, you can say "check the page" to make it read your messages sooner.

## Installing

You need Node.js 18.18 or newer. Run `node -v` to check.

Clone the repository, then copy the whole `skills/walkboard` folder, not only `SKILL.md`, to the folder where your agent reads skills:

```bash
git clone https://github.com/aiyaruch1320/walkboard.git
cp -R walkboard/skills/walkboard ~/.agents/skills/walkboard
```

`~/.agents/skills` is where Codex looks, and several other agents read it too. If yours reads skills from another folder, its documentation names it.

Start a new session. To check that it worked, ask the agent whether it has the walkboard skill, or ask for a picture in your own words, such as "show me how login works as a picture".

> **Good to know:** The agent runs `node …/skills/walkboard/bin/walkboard.mjs` many times. Allow that command in your agent's permissions, or it will ask you each time.

## How well it is tested

Walkboard is built and used every day with Claude Code. Other agents should work, because they follow the same `SKILL.md`, but nobody has tried them by hand yet.

If you try one, please [tell us how it went](https://github.com/aiyaruch1320/walkboard/issues/new/choose), even if it worked. The bug form asks which agent you use.

## Next steps

- [Installation](getting-started.md): the first page, and what happens next.
- [The page](page.md): what each part of the page does.
