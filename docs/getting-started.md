# Installation

This page shows you how to install Walkboard, open your first page, and keep it up to date.

## System requirements

Before you begin, make sure you have:

- Claude Code, in the terminal or the desktop app. Using another agent, such as Codex or Gemini CLI? See [Use other agents](other-agents.md) instead.
- Node.js 18.18 or newer. Run `node -v` to check.

You do not need an account, an API key or any other package. Walkboard is free and open source (MIT licence). The work the agent does for you counts toward your normal Claude Code usage, like any other request.

Walkboard is built and used every day on macOS, with Chrome, in the terminal and the desktop app. The automatic tests also run on Linux and Windows, but nobody has tried those by hand yet. If you do, we would love to hear how it went.

## Installing the plugin

In Claude Code, add the Walkboard marketplace and install the plugin:

```
/plugin marketplace add aiyaruch1320/walkboard
/plugin install walkboard@walkboard
```

Then start a new session, or run `/reload-plugins`. You should now see `/walkboard` in the slash-command menu.

> **Good to know:** If another plugin already has a command called `/walkboard`, type `/walkboard:walkboard` instead.

## Opening your first page

Open Claude Code in one of your repositories and try one of these:

```
/walkboard explain how this project starts up
/walkboard plan adding a health check endpoint
/walkboard compare ways to store uploaded files
```

You do not have to use the command. Asking in your own words works too, for example "show me how login works as a picture". If you type `/walkboard` on its own, the agent looks through the repository and suggests a few things worth seeing.

Here is what happens next:

1. The agent may ask you up to three short questions, but only when the answer would change the picture. For a plan, it also asks whether it should commit for you or only suggest commit messages. It can remember your answers so it does not ask again.
2. It writes the plan and sends you a link that looks like `http://127.0.0.1:…/?token=…`. Open it in your browser.
3. Click a box to see what it does. To ask a question, or to say what to add, change or remove, type in the chat bar at the bottom of the page. It opens the side panel, where the conversation goes on.

Keep Claude Code open while you use the page, because that is where the agent works. The dot at the top right of the page shows whether the agent is ready for your next message.

The agent chooses a mode from what you asked. You can read more about each one in [Plan mode](modes/plan.md), [Explain mode](modes/explain.md) and [Design mode](modes/design.md).

## Trying it without an agent

The live examples are finished pages you can open straight from this site. [The pictures example](https://aiyaruch1320.github.io/walkboard/examples/pictures.html?view=flow&step=all) shows every kind of picture for one small system, and [the platforms example](https://aiyaruch1320.github.io/walkboard/examples/platforms.html?view=aws&step=all) draws the same app on each cloud. You can click and look around, but nobody answers your questions there.

If you have cloned the repository, you can also open the examples as live pages on your machine:

```bash
node skills/walkboard/bin/walkboard.mjs open examples/connect-vpcs
```

## Updating Walkboard

Claude Code only updates plugins automatically when you turn it on for their marketplace. To get new versions of Walkboard by themselves, open `/plugin`, go to **Marketplaces → walkboard**, and choose **Enable auto-update**.

To update by hand, run:

```
/plugin marketplace update walkboard
```

A session that is already running keeps the version it started with. Run `/reload-plugins` or start a new session to use the new one. You can see which version a page is running at the bottom of the **⋮** menu. If a page opens with an older version while a newer one is installed, the agent tells you.

## Uninstalling

To remove the plugin, run:

```
/plugin uninstall walkboard@walkboard
```

Your plans are kept in `~/.walkboard/`. They stay there until you delete that folder.

## Next steps

- [The page](page.md): learn what each part of the page does and how to talk to the agent on it.
- [FAQ](faq.md): what to do when a click does nothing or `/walkboard` does not show up.
