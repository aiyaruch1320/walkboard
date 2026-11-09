# FAQ and limits

[Docs](README.md) › FAQ and limits

## FAQ

**`/walkboard` does not appear in the menu.**
Start a new session, or run `/reload-plugins`. Still missing? Open `/plugin` and check that walkboard is installed and enabled. If another command is already called `/walkboard`, type `/walkboard:walkboard`. You can also just ask in words: "show me how login works as a picture".

**I click and nothing happens, or the page says it was opened from a file.**
Open the `http://127.0.0.1:…/?token=…` link the agent gave you, not the HTML file. `walkboard status <folder>` prints the link again.

**The dot says the agent is busy.**
It is doing something else (writing code, running tests). Your message waits in a queue and reaches the agent when it is free. Say "check the page" in Claude Code to hurry it.

**The page looks older than the version I installed.**
A running session keeps the version it started with. Run `/reload-plugins` or start a new session, then ask the agent to open the plan again: a page from an older copy is replaced. The version is at the bottom of **⋮**.

**Claude Code asks for permission on every update.**
Allow `node …/skills/walkboard/bin/walkboard.mjs` commands and edits under `~/.walkboard/` in your Claude Code permissions.

**The server seems stuck or the port is taken.**
`walkboard stop <folder>`, then `walkboard open <folder>`. The link stays the same.

**Can teammates open my page?**
No, it runs on your machine. [Send them a copy](share.md) or share `plan.json`.

**Where are plans kept?**
`~/.walkboard/<project>/<task>/` unless you choose a folder. Delete the folder to remove a plan and its conversation.

**Does my code leave the machine?**
Walkboard's page and server stay on your machine: the server listens only on 127.0.0.1 behind a random token, makes no network requests and sends no telemetry. What the agent reads to make a plan goes to the model, as in any Claude Code session. See [SECURITY.md](../SECURITY.md).

**Does it touch my cloud accounts?**
Never to change anything. In design mode the agent may want to look at what exists. It uses only read-only commands (`describe`, `list`, `get`) and asks you before each one, or it gives you the command to run yourself.

**Can it draw a system I already have?**
Yes: ask for it ("explain our AWS network from the Terraform in infra/"). The agent reads what is in the repository, such as Terraform, Kubernetes manifests or compose files, and draws a [map](pictures/map.md). Then you can correct it by asking, or [sketch the changes](draft.md) yourself.

**How many tokens does it use?**
Less than a hand-written explainer: the agent writes a small JSON file once and changes it with one-line commands. Each click that needs an answer wakes the agent once; settings, arranging and sketching do not. Numbers in the [reference](reference.md#tokens).

**Does it work with other agents?**
The page and pictures work the same. Only Claude Code is tested; elsewhere the agent waits for clicks in the foreground instead of being woken in the background. See the README's [For AI agents](../README.md#for-ai-agents).

## Limits

- Page labels exist in English and Thai; plan content can be in any language.
- One machine, one viewer: no sharing or multi-user editing.
- Each message is delivered once; if the agent stops right after receiving it, ask again.
- Built and tested on macOS with Chrome and the Claude desktop app. The tests also run on Linux and Windows, but nobody has used it there by hand yet.
- Pictures with thousands of lines redraw slowly.
- A very large picture's overview on paper is only for its shape: read its parts.

Found something else? [Open an issue](https://github.com/aiyaruch1320/walkboard/issues/new/choose).
