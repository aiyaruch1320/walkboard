# The page

[Docs](README.md) › The page

![Steps on top, the selected step with what it does and how we know it is done, the tabs with the draft button, and the flow picture](https://raw.githubusercontent.com/aiyaruch1320/walkboard/media/build-overview.png)

## Parts of the page

| Part | What it does |
|---|---|
| Top bar | What to do next is always the button at the right: **Approve plan**, **Start next step: …** or **Check the commit message**, beside how far the work is. |
| The dot | How the agent is: green listening, purple answering you, orange busy (your message waits in a queue). Hover for words; the tooltip also shows the version. |
| 💬 | Every conversation on the page, newest first. It turns orange with "new" when the agent has replied; click one to carry on. |
| ⋮ | The mode, who commits, Export, the theme, the [docs](README.md), the shortcuts and the version. |
| ✎ Plan changed | What the agent changed since you last looked, outlined until you press **Mark as seen**. |
| Step bar | Choose a step: everything it does not touch fades and the page switches to a picture that shows it. ✓ done, 👉 your turn. ⏵ Play walks through the steps once. |
| Tabs | The plan's pictures, with **✎ Draft changes** and **?** on the same row. **?** says how to read this kind of picture, with a link to [its page](pictures/README.md). |
| Chat bar | At the bottom: opens the conversation about what is on screen (the selected step, or the whole plan with **All** selected). |
| Side panel | A box's details and its conversation. Opens when you click a box or the chat bar; closes with ✕, Esc or a second click on the same box. |
| Boxes | An icon for what the box is, its status (✓ done, ● in progress, dashed = to do, ↗ external) and 💬 when there is a conversation on it. |
| Dotted words | Glossary: click a dotted word for a plain explanation. Inside a box, point at it instead (a click opens the box). |

The address keeps the step, picture and box, so a reload or a link opens the same place.

## Talking to the agent

Click a box and type; the answer appears in that box's conversation.

![A question and the agent's answer](https://raw.githubusercontent.com/aiyaruch1320/walkboard/media/chat.png)

- **One box takes everything:** a question, or what to add, change or remove. The agent decides whether a request just corrects the picture, changes a plan not yet approved, or is drawn as a proposal for you to accept.
- **Images:** paste, drop or 📎, up to five per message, 10 MB each (PNG, JPEG, GIF, WebP). Big images are scaled down first, so one costs the agent about 1,500 tokens at most. They stay beside the plan in `.walkboard/images` and are left out of exports.
- **Still unclear · Go deeper** (explain mode) send at once.
- **A message waiting** says it is in line, with its place in the line. The top bar shows ⏳ and how many are waiting.
- **An answer given elsewhere:** when the agent answers on another box, your message links to that box.
- **Every message reaches the agent and costs one turn.** Settings, arranging a picture and sketching do not reach it, so they cost nothing.

## The side panel

The details sit above the chat, and the box you type in stays at the bottom. Click **▾ Details** or **▾ Chat** to fold either away; the choice is remembered. Drag the panel's left edge for any width, or press **⤢** for a wide panel where details and chat sit side by side. On a narrow screen it is a sheet from the bottom.

## Guesses to answer

Anything the agent assumed rather than checked is marked: a constraint in the bar above the picture, or a dashed box with ❓. Press **✎ Answer** under it and type in your own words: that it is right, what is true instead, or the answer to its question. The bar shows the first three on one line; **Answer…** lists them all with the numbers behind each.

## Language and theme

The agent writes the plan in the language you use, and the page's buttons follow (English and Thai today; other languages get English labels). **⋮ → Theme** chooses light, dark or the system's.

## Shortcuts

| Key | Does |
|---|---|
| ← → | previous / next step |
| Esc | close the side panel, leave draft mode |
| Enter | send (Shift+Enter: new line) |

Draft mode has its own keys: see [Sketch your own changes](draft.md).

The first time on a computer the picture draws itself along its arrows, then a hint says to click a box. **⋮ → Shortcuts** shows the shortcuts again.
