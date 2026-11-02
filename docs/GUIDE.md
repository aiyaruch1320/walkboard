# planview guide

Everything beyond the [README](../README.md): a tour of the page, explain mode, what makes it light on tokens, FAQ, limits and reference.

- [The plan page](#the-plan-page)
- [Pictures](#pictures)
- [Talking on the page](#talking-on-the-page)
- [Explain existing code](#explain-existing-code)
- [Light on tokens](#light-on-tokens)
- [FAQ](#faq)
- [Limitations](#limitations)
- [Reference](#reference)

## The plan page

![Steps on top, the selected step with what it does and how we know it is done, a chat box, and the flow picture](images/build-overview.png)

| Part | What it does |
|---|---|
| Top bar (always visible) | ● agent listening now · ✎ agent is answering you · ◐ agent busy, your message waits in a queue · ○ server not reachable. Also "💬 new from the agent" for unread replies and "✎ Plan changed" for what the agent changed (outlined until you press **Mark as seen**). |
| Agent settings | Switch restating each step on or off and choose whether the agent commits or only suggests messages; each card says what the current choice means. Saved to the plan at once without waking the agent, which reads it before its next step. Defaults for every plan: `~/.planview/config.json`, e.g. `{"teachBack": true, "commit": "suggest"}`. |
| Step bar | Choose a step: everything it does not touch fades and the page switches to a picture that shows it. ✓ restated and confirmed, 👉 your turn. ▶ plays the steps once. |
| Step card | What the step does, its status and how we know it is done. When it is your turn, a purple bar opens the side panel. |
| Side panel | Everything you answer or decide: a box's details and conversation, restating, the suggested commits, approval. Opens when you click a box or a "your turn" bar, slides away with ✕, Esc or a second click on the same box; a sheet from the bottom on narrow screens. |
| Boxes | An icon for what the box is (cloud services in their provider's colours), its status (✓ done, ● in progress, dashed = to do, ↗ external) and 💬 when there is a conversation on it. |
| Dotted words | Glossary: tap for a plain explanation; 📖 lists every term the plan uses. |

## Pictures

| Kubernetes: what runs, what it uses, where it may connect | Call sequence, with alternative paths framed |
|---|---|
| ![Kubernetes view](images/k8s.png) | ![Sequence view](images/sequence.png) |

How data changes shape, with empty values (∅) and stray spaces (␠) made visible:

![Transform view](images/transform.png)

## Talking on the page

| Ask on a box; the answer appears in the side panel | Restate a step; the agent confirms it |
|---|---|
| ![A question and the agent's answer](images/chat.png) | ![A step marked as your turn and confirmed](images/teachback.png) |

- **Still unclear · Go deeper** send at once.
- **Ask** or **Propose** (add after a box, change it, remove it) choose what the text you type is sent as. The agent decides whether a proposal just corrects the picture, changes a plan not yet approved, or is drawn as a proposal. **Restate** appears when it is your turn (and on every stage in explain mode).
- The first visit shows a three-stop tour; **?** lists the shortcuts (← → steps, Esc closes the panel, ⌘/Ctrl+Enter sends) and shows the tour again.
- **Approve plan** lets the agent start building. Nothing is built before.
- **Commit and go on** / **I committed, go on** appear under the suggested commit message of a finished step when commits are only suggested; you can edit the message first. The agent waits for one of them before the next step.

The page speaks the plan's language: the agent writes the plan in the language you use and sets `lang`, and the buttons and labels follow (English and Thai today; other languages get English labels).

## Explain existing code

![Explain mode: the login flow in stages](images/explain-overview.png)

Every box that is code points at `file:line`. `planview check` fails when the file or line does not exist, the page shows the code beside the explanation, and the path opens in VS Code, Cursor or IntelliJ (`settings.editor`).

![A box showing its code excerpt and an editor link](images/explain-code.png)

```bash
node skills/planview/bin/planview.mjs open examples/explain-login
```

## Light on tokens

The page does the explaining, so the agent spends tokens on content once and very little afterwards.

| Where tokens go | Hand-written explainer | planview |
|---|---|---|
| A rich plan with four pictures | 26–43 KB of HTML and SVG, rewritten on every change | ~7 KB `plan.json` (compact JSON) written once; a simple plan is ~0.5 KB |
| Moving a step forward | rewrite or edit the page | `planview set … step:x status=review` ≈ 90 bytes |
| Code in explain mode | paste it | `file:line` + `highlight`; the server reads the excerpt |
| Common terms | explain each time | ~95 ship with planview, in English and Thai |
| Each message from the page | — | one compact line, ~100–150 bytes |
| Switching restating or commits on the page | — | nothing: the agent is not woken; it reads the setting with its next message or step |
| Instructions loaded with the skill | — | SKILL.md ~7.5 KB; schema, pictures, design and rarer messages in references (2–6 KB each) read only when needed; icon names from `planview icons` |

Every message from the page wakes the agent once, which re-reads the conversation (mostly from cache). That is why "Got it" was removed and settings never wake it: only clicks that need an answer cost a turn.

## FAQ

**I click and nothing happens, or the page says it was opened from a file.**
Open the `http://127.0.0.1:…/?token=…` link the agent gave you, not the HTML file. `planview status <folder>` prints the link again.

**The badge says the agent isn't listening.**
It is busy (writing code, running tests). Your message waits in a queue and reaches it when it listens again. Say "check the page" in chat to hurry it.

**Claude Code asks for permission on every update.**
Allow `node …/skills/planview/bin/planview.mjs` commands and edits under `~/.planview/` in your Claude Code permissions.

**The server seems stuck or the port is taken.**
`planview stop <folder>`, then `planview open <folder>`. The link stays the same.

**Can teammates open my page?**
No, it runs on your machine. Share `plan.json` (anyone can `planview open` it) or screenshots.

**Where are plans kept?**
`~/.planview/<project>/<task>/` unless you choose a folder. Delete the folder to remove a plan and its conversation.

**Does my code leave the machine?**
Not through planview. The agent itself works as Claude Code normally does.

## Limitations

- Page labels exist in English and Thai; plan content can be in any language.
- One machine, one viewer: no sharing or multi-user editing.
- Each message is delivered once; if the agent dies right after receiving it, ask again.
- Built and tested on macOS with Chrome and the Claude desktop app; Linux should work; Windows is untested.
- Kubernetes pictures with thousands of links redraw slowly.

## Reference

### Commands

Run from the repository root (the skill runs them for you).

| Command | Does |
|---|---|
| `node skills/planview/bin/planview.mjs check <dir>` | Validate `plan.json`; in explain mode, also that every `file:line` exists |
| `… set <dir> [step:<id> \| node:<id> \| plan] key=value …` | Change fields in place; `key=` removes one |
| `… open <dir> [--no-browser]` | Start or reuse the server and print the link |
| `… poll <dir>` | Wait for the page; one JSON line per message |
| `… reply <dir> [--node id \| --step id] <text>` | Answer on the page |
| `… status <dir>` / `… stop <dir>` | Show the link and queue / stop the server |

### Links into a page

Add `&step=<id>`, `&view=<id>`, `&node=<id>` (or `&step=all`) and `&theme=light|dark`.

### Plan format

[schema.md](../skills/planview/references/schema.md) describes `plan.json`; [views.md](../skills/planview/references/views.md) the four pictures. Examples (all data made up): `examples/nightly-import` (build), `examples/explain-login` (explain, with sample code), `examples/planview` (the plan that built planview, in Thai).

### Update or uninstall

```
/plugin marketplace update planview
/plugin uninstall planview@planview
```

Installed by hand: pull again, or delete `~/.claude/skills/planview`.
