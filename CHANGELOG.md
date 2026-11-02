# Changelog

## 0.6.0

- While the agent works on a message, the page shows typing dots where you asked and "Agent is answering you" in the top bar, with the minutes elapsed; after 10 minutes without a reply it says to check Claude Code.
- Restating each step is on by default and switched on the page, under **Agent settings**, together with how commits are made; each setting is a card that says what its current value means. The page saves the change to plan.json without waking the agent: the agent reads it before its next step, and gets it alongside your next message. The skill no longer asks about restating up front.
- Defaults for every plan in `~/.planview/config.json`; the skill asks its one question only when nothing says the answer, and offers to save it. `planview status` prints the current settings.
- The page explains and the side panel acts: step cards show only what a step does and its status, while a box's details, conversations, restating, suggested commits and approval open in a panel that slides in from the right (a sheet from the bottom on narrow screens). Clicking the same box again closes it.
- Steps read as a timeline that fades where more steps are off to the side; ◀ ▶▶ ▶ and "Talk about the whole plan" sit on the same row.
- Code in replies: ``` fences become code blocks and `ticks` inline code. Ports used by several workloads show once with a count; tables without rows say so.
- Proposals, in every mode: on a box choose **Propose** (add after it, change it, remove it), or propose for the whole picture. The agent draws them in their own colours (purple dashed add, teal change, red struck-through remove) without building anything; a bar above the steps counts them and **Turn into a plan** (explain) or **Change the plan** (build) hands them all to the agent. Plans started from a page are linked there (`links`).
- Code excerpts highlight only the lines that make the point (`highlight`); the highlight reaches the end of the line and line numbers stay put when scrolling sideways. In explain mode the picture must match the code.
- Lighter on tokens: SKILL.md is 6.7 KB (was 10.5 KB) with proposals and suggested commits moved to `references/messages.md`, read only when such a message arrives; `poll` lines drop the view, `status` prints one line. A highlighted code line can carry a short note, and code wraps on phones (toggle "Wrap lines").
- Simpler to learn: the message box offers only **Ask** and **Propose** (Restate when it is your turn); a three-stop tour on the first visit and **?** for shortcuts and the tour; ← → move between steps; empty panels say what you can do there; the colour legend folds away; the agent adds one line on how to use the page with the first link.
- From two first-time-user tests: approving with open proposals asks first; to-do boxes are readable; after you restate or commit the bar says "Sent · waiting for the agent"; your turn shows on the whole-plan view and in the tab title; explain mode offers "Restate this stage" on each card and says "stage" throughout; proposed boxes have a neutral fill, a dashed border and their note, so they never look like real code; code excerpts drop shared indentation and fade where they continue; the step bar stays in view; playing starts where you are and holds 6 s; progress no longer counts as "plan changed"; links in replies are readable.
- The "Got it" button is gone: it woke the agent for nothing. The logo sits top left and a link to the repository bottom right.
- The agent replies to every message, approvals included, so the dots always end.
- With "suggest messages", the agent waits after each step: the step shows the suggested commit message (`commitMessage`), editable, with **Commit and go on** (the agent commits exactly that text) and **I committed, go on**. The agent checks `git status` before the next step, so two steps never mix in one working tree. A step may suggest several commits (`commits`, each with its files) when it holds separate concerns.
- The step being built shows "The agent is building this step"; the top bar shows which step the agent is on (or "All steps done") and the page follows the agent to its next step.

## 0.5.0

- The agent plans and replies in the language the user writes in. `lang` sets the page's labels (English or Thai; others get English); without it, a Thai title or goal means Thai. Checker messages are in English.
- Icons on boxes, guessed from names or set with `icon` (`aws:s3`, `gcp:bigquery`, `azure:keyvault`, `k8s:cronjob`, `database`, …). Cloud parts use their provider's colours; the icons are planview's own drawings, not vendor logos.
- Status is a small mark inside each box (✓ ● ↗ ★) instead of a tag on its border; link labels such as ports sit on the box they reach instead of on the line.
- Kubernetes links leave the namespace on a straight line and spread out at both ends, so none run along a border or end in one point; "blocked" links end in a bar.
- Sequence pictures: notes no longer cross the next lifeline, groups no longer break the lifelines or cover the arrow above them.
- Approving: a "Your turn" banner on an unapproved plan and an Approve button in the top bar. Choosing a step no longer opens a box you did not click, and its boxes stay readable.
- One legend beside the picture; one-click buttons say they send at once; your own message scrolls into view; "↑ Picture" in the detail panel; explain mode speaks of stages and "Correct the picture".
- The glossary tooltip points at its word and flips above when there is no room.
- Shared glossary in English and Thai. Examples, screenshots and the demo GIF in English.

## 0.4.0

- `planview set` changes statuses and fields in place with one short command, so the agent never rewrites the plan to move a step.
- A shared glossary of about 70 common terms ships with planview; plans only add their own, and the page lists only the terms a plan uses.
- Plans may leave out `views`; each step becomes a lane of a flow picture.
- `poll` prints one compact line per message; `check` caps its warnings.
- Deep links: `&step=`, `&view=`, `&node=` (or `&step=all`) and `&theme=light|dark`.
- Logo, plugin icon and page icon.
- The skill is invoked as `/planview` (the full `/planview:planview` only when names collide).
- A short README with a demo GIF; details in `docs/GUIDE.md`; `AGENTS.md` for changing the repository.
- Shorter SKILL.md with a "keep it cheap" section.

## 0.3.0

- Explain mode can point at code: `root` / `roots`, `file:line` and `file:from-to`. `check` fails when a file or line does not exist; the page shows the excerpt and links it to VS Code, Cursor or IntelliJ.
- "ลึกขึ้น" (`deeper`) asks the agent to break a box or stage down further.
- Sequence views frame alternative paths with `group`.
- Sticky status bar; changes stay outlined until acknowledged.
- `poll` ends by itself when the server is stopped.

## 0.2.0

- Explain mode for existing code, with stages, `start` and "เข้าใจเมื่อ".
- Approval before building, teach-back recorded per step (`confirmed`), step `detail` and `done`.
- Chat modes ถาม / ขอแก้ / ทวน on every box, step and the whole plan; unread markers; change highlights; glossary.
- Fixes from four testers: selection kept by id, focus kept while typing, no double sends, one server per folder, safe `stop`, a torn queue line no longer stops the server, byte-safe request bodies.

## 0.1.0

- Plan as `plan.json`, drawn as flow, Kubernetes, sequence and transform pictures.
- Local server with a token, live reload, a durable feedback queue, `poll` and `reply`.
- Packaged as a Claude Code plugin.
