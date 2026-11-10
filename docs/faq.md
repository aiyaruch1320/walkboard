# FAQ and limits

Answers to the questions people ask most, and the things Walkboard cannot do yet.

## Getting it running

### `/walkboard` does not appear in the menu

Start a new session, or run `/reload-plugins`. If it is still missing, open `/plugin` and check that walkboard is installed and enabled.

If another plugin already has a command called `/walkboard`, type `/walkboard:walkboard` instead. You can also just ask in your own words, such as "show me how login works as a picture".

### I click and nothing happens, or the page says it was opened from a file

You probably opened the HTML file instead of the link. Open the `http://127.0.0.1:…/?token=…` link the agent gave you. If you lost it, ask the agent for the Walkboard link again.

### The dot says the agent is busy

The agent is doing something else, such as writing code or running tests. Your message waits in line and reaches the agent when it is free. To hurry it, type "check the page" in the agent's chat.

If the status says **✉ Not live: tell your agent** instead, your agent is not woken by the page at all. That is how most agents other than Claude Code work: tell it in its chat when you want it to read the page. See [Use other agents](other-agents.md).

### The page looks older than the version I installed

A session that is already running keeps the version it started with. Run `/reload-plugins` or start a new session, then ask the agent to open the plan again. The page from the older copy is replaced. You can check the version at the bottom of the **⋮** menu.

### The agent asks for permission every time it changes the plan

In your agent's permissions, allow `node …/skills/walkboard/bin/walkboard.mjs` commands and edits under `~/.walkboard/`.

### The server seems stuck, or the port is taken

Ask the agent to restart the Walkboard server. It runs `walkboard stop` and then `walkboard open` on the plan's folder, and the link stays the same.

## Privacy and safety

### Does my code leave my machine?

Walkboard's page and server stay on your machine. The server listens only on 127.0.0.1, behind a random token. It makes no network requests and sends no telemetry.

The agent itself works as it always does: what it reads to make a plan goes to the model, like in any other session. See [SECURITY.md](../SECURITY.md) for the details.

### Does it touch my cloud accounts?

It never changes anything in them. In design mode the agent may want to look at what already exists. It uses only commands that read, such as `describe`, `list` and `get`, and it asks you before each one. Or it gives you the command, so you can run it yourself.

### Can my teammates open my page?

No. The page runs on your machine, so the link only works there. To show them a plan, [send them a copy](share.md) or share its `plan.json`.

### Where are my plans kept?

In `~/.walkboard/<project>/<task>/`, unless you choose another folder. To remove a plan and its conversation, delete its folder.

## Using it

### Can it draw a system I already have?

Yes. Ask for it, for example "explain our AWS network from the Terraform in infra/". The agent reads what is in the repository, such as Terraform, Kubernetes manifests or Compose files, and draws a [map](pictures/map.md). See [Draw a system you already have](existing.md).

### How many tokens does it use?

Fewer than having the agent write an HTML page itself. The agent writes one small JSON file and then changes it with one-line commands. Each message you send from the page costs one turn. Changing settings, arranging and sketching cost nothing, because they never reach the agent. The [reference](reference.md#tokens) has the numbers.

### Does it work with other agents?

Yes. Agents that read `SKILL.md` skills, such as Codex, Gemini CLI or Cursor, get the same pictures and page. The difference is that most of them cannot be woken up by a click, so your messages on the page wait until you tell the agent "check the page" in its chat. Claude Code is used every day, and OpenCode has been tried end to end. [Use other agents](other-agents.md) shows how to install it and what to expect.

## Limits

These are the things Walkboard does not do yet:

- Page labels are in English and Thai only. The plan itself can be in any language.
- A page is for one person on one machine. Several people cannot edit it together.
- Each message is delivered once. If the agent stops right after it receives your message, send it again.
- Walkboard is built and used on macOS, with Chrome, in the terminal and the Claude desktop app. The automatic tests also run on Linux and Windows, but nobody has used it there by hand yet.
- A picture with thousands of lines redraws slowly.
- When a very large picture is printed, its overview only shows the shape. Read the parts that follow it for the details.

Found something else? [Open an issue](https://github.com/aiyaruch1320/walkboard/issues/new/choose).
