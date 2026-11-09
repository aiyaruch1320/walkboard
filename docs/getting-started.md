# Getting started

[Docs](README.md) › Getting started

## Install

You need Claude Code and Node.js 18.18 or newer (`node -v`). Nothing else.

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

1. The agent asks up to three short questions when the answer would change the picture. For a plan it also asks whether it should commit for you or only suggest commit messages. Save your answers in `~/.walkboard/config.json` and they are not asked again.
2. It writes a small `plan.json` and gives you a link like `http://127.0.0.1:…/?token=…`. Open it.
3. Click a box to see what it does. Type in the chat bar at the bottom to ask, or to say what to add, change or remove.
4. Keep Claude Code open while you use the page: that is where the agent works. The dot at the top right says whether it is listening.

Which mode you get depends on what you asked: [plan](modes/plan.md), [explain](modes/explain.md) or [design](modes/design.md).

## Try it without an agent

From a clone of the repository you can open the examples, which cost no tokens:

```bash
node skills/walkboard/bin/walkboard.mjs open examples/connect-vpcs
```

`examples/explain-login` (explain), `examples/nightly-import` (plan) and `examples/walkboard` (a plan in Thai) work the same way. With no agent listening, what you send waits in a queue and nobody answers.

## Updates

`/plugin` → **Marketplaces** → **walkboard** → **Enable auto-update** gets new versions by themselves; Claude Code leaves it off for marketplaces outside its own. By hand:

```
/plugin marketplace update walkboard
```

A running session keeps the version it started with until `/reload-plugins` or a new session. The page shows its version at the bottom of **⋮**, and Walkboard says when a newer copy is installed.

## Next

- [The page](page.md): every part of the page
- [FAQ](faq.md): when a click does nothing, permissions, where plans are kept
