# Security

## Reporting a problem

Please report security issues privately through [GitHub's private vulnerability reporting](https://github.com/aiyaruch1320/walkboard/security/advisories/new) rather than in a public issue.

## What Walkboard does on your machine

- **One local server per plan.** `walkboard open` starts a Node.js server bound to `127.0.0.1` only. Every request must carry a random token (128 bits) from the link; anything else gets `403`. Request bodies are capped at 64 KB.
- **No network.** The page loads nothing from the internet: no CDN, fonts, analytics or telemetry. The only outside links are ones you click (sources in design mode, the repository link), opened with `noopener noreferrer`, and the page sends no referrer.
- **No dependencies.** The package has no npm dependencies and no install scripts; everything is in this repository.
- **Programs it starts.** Your browser, to open the link (`open`, `xdg-open` or `rundll32 url.dll,FileProtocolHandler`, without a shell), and nothing else. Editor links (`vscode://`, `cursor://`, `idea://`) open only when you click them.

## What it reads and writes

- **Writes** `plan.json` and a `.walkboard/` folder next to it: your messages (`feedback.jsonl`), the agent's replies (`replies.jsonl`), the server's port and token (`session.json`, readable only by you), and a lock file. Plans live in `~/.walkboard/<project>/<task>/` unless you choose a folder; defaults in `~/.walkboard/config.json`. Deleting the folder removes the plan and its conversation.
- **Reads** code only in explain mode, and only files inside the repository the plan names (`root`): paths that leave it, including through symbolic links, are refused.
- Page text from a plan is always inserted as text, never as HTML.

## What the skill tells the agent

- Never put secrets, tokens or real customer data into a plan; shorten account ids, ARNs and IP addresses.
- Explain mode never edits the project.
- Design mode looks at live cloud state only with read-only commands (`describe`, `list`, `get`) and asks before running any; otherwise it gives you the command to run.

## Limits

- The server trusts anyone who has the link with its token. Do not share it; anyone on your machine who can read `.walkboard/session.json` can reach your plan.
- Messages are handed to the agent as text. The agent treats them as your requests, so only you should be able to type into the page.
