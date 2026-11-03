# Changelog

## 0.6.0

- While the agent works on a message, the page shows typing dots where you asked and "Agent is answering you" in the top bar, with the minutes elapsed; after 10 minutes without a reply it says to check Claude Code.
- Restating each step is on by default and switched on the page, under **Agent settings**, together with how commits are made; each setting is a card that says what its current value means. The page saves the change to plan.json without waking the agent: the agent reads it before its next step, and gets it alongside your next message. The skill no longer asks about restating up front.
- Defaults for every plan in `~/.planview/config.json`; the skill asks its one question only when nothing says the answer, and offers to save it. `planview status` prints the current settings.
- The page explains and the side panel acts: step cards show only what a step does and its status, while a box's details, conversations, restating, suggested commits and approval open in a panel that slides in from the right (a sheet from the bottom on narrow screens). Clicking the same box again closes it.
- Steps read as a timeline that fades where more steps are off to the side; ◀ ⏵ Play ▶ and "Talk about the whole plan" sit on the same row.
- Code in replies: ``` fences become code blocks and `ticks` inline code. Ports used by several workloads show once with a count; tables without rows say so.
- Proposals, in every mode: on a box choose **Propose** (add after it, change it, remove it), or propose for the whole picture. The agent draws them in their own colours (purple dashed add, teal change, red struck-through remove) without building anything; a bar above the steps counts them and **Turn into a plan** (explain) or **Change the plan** (build) hands them all to the agent. Plans started from a page are linked there (`links`).
- Code excerpts highlight only the lines that make the point (`highlight`); the highlight reaches the end of the line and line numbers stay put when scrolling sideways. In explain mode the picture must match the code.
- Design mode: for something not built yet, the agent researches options and draws each one; a comparison table scores them on weighted criteria with cited sources (click a cell for the reasons, click the weight dots to say what matters, no agent wake-up); constraints and assumed boxes are marked and can be confirmed; **Choose this → write a plan** records the decision and starts a plan. A mode pill next to the logo says which mode you are in, and the agent asks what is unclear before drawing.
- Six more pictures: `state` (states and transitions, loops arced over), `decision` (questions as diamonds, outcomes), `timeline` (lanes on a time axis: spans, points and marks such as a timeout), `datamodel` (tables, keys and relations), `impact` (click a box: what breaks if it goes down, what it needs) and `diff` (before and after side by side, added, removed and changed boxes marked). Graphs lay out by longest path, route around boxes and spread edges. `references/views.md` starts with a "which picture" table.
- Two new pictures: `map` (zones inside zones, for cloud accounts, VPCs and clusters, with links routed across them) and `journey` (one piece of data travelling stop by stop, showing what it looks like at each stop with the changes highlighted; play or step through).
- Lighter on tokens: SKILL.md is about 7 KB (was 10.5 KB) with proposals and suggested commits moved to `references/messages.md`, read only when such a message arrives; the references are written compactly (22 KB in all, was 27 KB) and the icon list is `planview icons` instead; `poll` lines drop the view, `status` prints one line. A highlighted code line can carry a short note, and code wraps on phones (toggle "Wrap lines").
- Simpler to learn: the message box offers only **Ask** and **Propose** (Restate when it is your turn); a three-stop tour on the first visit and **?** for shortcuts and the tour; ← → move between steps; empty panels say what you can do there; the colour legend folds away; the agent adds one line on how to use the page with the first link.
- From two first-time-user tests: approving with open proposals asks first; to-do boxes are readable; after you restate or commit the bar says "Sent · waiting for the agent"; your turn shows on the whole-plan view and in the tab title; explain mode offers "Restate this stage" on each card and says "stage" throughout; proposed boxes have a neutral fill, a dashed border and their note, so they never look like real code; code excerpts drop shared indentation and fade where they continue; the step bar stays in view; playing starts where you are and holds 6 s; progress no longer counts as "plan changed"; links in replies are readable.
- The "Got it" button is gone: it woke the agent for nothing. The logo sits top left and a link to the repository bottom right.
- The agent replies to every message, approvals included, so the dots always end.
- With "suggest messages", the agent waits after each step: the step shows the suggested commit message (`commitMessage`), editable, with **Agent commits these, then goes on** (the agent commits exactly that text) and **I committed, go on**. The agent checks `git status` before the next step, so two steps never mix in one working tree. A step may suggest several commits (`commits`, each with its files) when it holds separate concerns.
- From a review by four testers (junior and senior developers, a mid-level developer on explain mode, a product owner on design mode):
  - `planview check` refuses plans that would stop the page drawing (a string where a list belongs, text fields that are objects, duplicate design ids, two recommended options); a picture that still fails says so in its own place instead of blanking the page, and a diff never compares itself.
  - Explain mode: `anchor` (a short piece of the cited code) lets `check` notice code that moved since it was explained and say where it went; the page warns on the code itself. Ranges are checked end to end.
  - Approve, commit and "write a plan" are sent once: the buttons say "sent" until the agent answers, and the server drops a repeat within 5 seconds.
  - Design mode: criteria can be `must`; an option that fails one is out of the running whatever its total. Missing scores count as 0. When your weights put another option ahead of the recommendation, the page says so and offers "Ask the agent to re-check". A cell's or option's conversation stays in its own thread (`planview reply --option --criterion`). The decide panel lists what is still unconfirmed, each with Confirm; the chosen option keeps why the others lost and the plan it became. A legend says what the dots mean.
  - `planview set` reaches the design lists (`constraint:`, `option:`, `criterion:`, `source:`), inside objects (`settings.commit=auto`), keeps digits as text when quoted, keeps the file compact if it was, and refuses a word that is neither a target nor key=value (a mistyped folder). Bad weights are refused. A stale server lock says how to clear it; CLI errors print one line instead of a stack.
  - The connection pill says when the agent is building; a step in review no longer claims it is your turn when nothing waits for you; the agent replies with what it built before you check a step.
  - Esc closes the panel from an empty text box; Space opens a box; on phones a tap on an underlined word inside a box opens the box; the tab, step and box you are on stay in the address; picking "All" returns to the picture you chose; a panel for a box not in the picture closes; unsent text survives a reload; the commit box scrolls into view.
  - The glossary only reads prose (not field names or URLs) and ships cloud networking terms (VPC, CIDR, subnet, Transit Gateway, PrivateLink, security group, …); the journey marks only real changes; the impact picture fades what is unaffected; timeline lanes open their box; changed boxes in a diff are amber; the decision diamond shows when selected; long titles wrap; the side panel becomes a bottom sheet only below 820 px.
  - Diff pictures list the links removed and added, and `changed` may say what changed per box (`{"api": "…"}`). Long state pictures continue on a second row instead of scrolling sideways. Box names break after `.` `/` `_` `-` rather than mid-word. No tour and no Approve on a plan with nothing drawn yet. The chosen design option shows who chose it and when (`decision.by`, `decision.at`; the page sends the weights with the choice).
  - Data model pictures show redundancy: a column with `copy` (⧉, amber) stores the same data as another one, `keep` marks a copy kept on purpose; a summary counts the copies per original and pointing at one shows its copies and their lines. FK lines and `relations` now show together. Lines leaving a box keep the order of their ends, so they no longer cross, and meet a question's hexagon on its side. Wide pictures in a diff sit one above the other.
  - **💬** in the top bar lists every conversation on the page, newest first and new replies on top, so you can carry on one you left; it replaces "new from the agent". **◐ / ☀ / ☾** picks the theme (system, light, dark), remembered in the browser.
  - Long details and long chats: **▾ Details** and **▾ Chat** fold away, either or both, each becoming a dashed "folded" bar (remembered); **⤢** widens the panel to about 60% of the screen with details and chat side by side, the picture still on the left (full height on phones).
  - The side panel reads like a chat: messages first, the box you type in kept at the bottom, opening on the latest message. Enter sends, Shift+Enter starts a new line.
  - The mode pill shows in one line what the current mode does; it, **?** and "Plan changed" close on a second click, as does a term's explanation. The "Terms in this plan" list is gone, since every term explains itself where it appears.
  - The page is now `viewer.html` with `viewer.css` and `strings.js` beside it, inlined by the server into one response; unused labels and duplicated drawing code are gone.
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
