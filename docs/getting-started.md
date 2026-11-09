# Getting started

[Docs](README.md) › Getting started

## Before you install

- **You need** Claude Code and Node.js 18.18 or newer (`node -v`). Nothing else: no account, no API key, no other package.
- **Cost:** Walkboard is free (MIT licence). What the agent does counts toward your normal Claude Code usage, as any other request does.
- **Tested on** macOS with Chrome. Linux and Windows pass the automatic tests, but nobody has used them by hand yet. Other browsers should work.
- **Want to look first?** [Open a finished example page](https://aiyaruch1320.github.io/walkboard/examples/pictures.html?view=flow&step=all). It runs in your browser, with no install and no agent.

## Install

```
/plugin marketplace add aiyaruch1320/walkboard
/plugin install walkboard@walkboard
```

Start a new session (or run `/reload-plugins`). `/walkboard` now appears in the slash-command menu. If another command is already called `/walkboard`, use `/walkboard:walkboard`.

## Your first page

Open Claude Code in a repository and try one of these:

```
/walkboard explain how this project starts up
/walkboard plan adding a health check endpoint
/walkboard compare ways to store uploaded files
```

Or just ask in your own words ("show me how login works as a picture"). On its own, `/walkboard` looks through the repository and offers things to see first.

What happens:

1. The agent may ask up to three short questions, when the answer would change the picture. For a plan it also asks whether it should commit for you or only suggest commit messages. It offers to remember your answers, so it does not ask again.
2. It writes a small `plan.json` and gives you a link like `http://127.0.0.1:…/?token=…`. Open it.
3. Click a box to see what it does. Type in the chat bar at the bottom to ask, or to say what to add, change or remove.
4. Keep Claude Code open while you use the page: the agent works there. The dot at the top right shows whether the agent is ready for your message.

Which mode you get depends on what you asked: [plan](modes/plan.md), [explain](modes/explain.md) or [design](modes/design.md).

## Try it without an agent

The [live examples](https://aiyaruch1320.github.io/walkboard/examples/pictures.html?view=flow&step=all) show every kind of picture, and [the platform example](https://aiyaruch1320.github.io/walkboard/examples/platforms.html?view=aws&step=all) shows one small system on each cloud. They are read only: you can click and look, but nobody answers.

From a clone of the repository you can also open the examples as live pages:

```bash
node skills/walkboard/bin/walkboard.mjs open examples/connect-vpcs
```

## Updates

`/plugin` → **Marketplaces** → **walkboard** → **Enable auto-update** gets new versions by themselves; Claude Code leaves it off for marketplaces outside its own. By hand:

```
/plugin marketplace update walkboard
```

A running session keeps the version it started with until `/reload-plugins` or a new session. The page shows its version at the bottom of **⋮**, and Walkboard says when a newer copy is installed.

## Uninstall

```
/plugin uninstall walkboard@walkboard
```

Your plans stay in `~/.walkboard/` until you delete that folder.

## Next

- [The page](page.md): every part of the page
- [FAQ](faq.md): when a click does nothing, when `/walkboard` does not appear, permissions, where plans are kept
