# Changelog

## Unreleased

- **Tried with OpenCode, and fixed what it tripped on.** OpenCode found the skill in `.opencode/skills`, drew a plan, and handled questions, an answered guess and an approval when told to check the page. Along the way: the page now counts an agent as listening only while it polls or did in the last few minutes (OpenCode backgrounded a poll that then ended with its run, and the page kept saying "busy"); SKILL.md says only a tool that starts a new turn when a background command ends may poll, and never to claim messages arrive by themselves; `set` keeps a plan written one entry per line, so the agent's next Edit still matches.
- **A new box is never lost.** After you add a box, zone or table in draft mode, the page scrolls to wherever the layout put it and marks it for a moment. A box added to a zone full of other zones goes under them, which could be off screen.
- **A phone shows the picture sooner.** Under 600 px the top bar fits in two rows (the logo, the status as ✉ and a count, the next step), the guesses to confirm become a count ("❓ 2 to confirm"), and the picture tabs scroll in one row beside the **?**. The picture starts about 230 px higher. Its **?** says sketching needs a computer.
- **Narrow windows sketch too.** Draft mode and arranging need a mouse and 640 px instead of 820, the toolbar drops its words to fit, and resizing across that width redraws the picture so its tools match.
- **A first visit says what to do.** The first hint sits above its box when the chat bar would cover it, and mentions the bar. A sent message scrolls into view with what happens next.
- **Draft mode explains itself.** A **?** on the toolbar lists the picture's tools, keys and moves, and links to that picture's sketching section in the docs, which now shows a whole sketch step by step (sketch.gif). A note about something refused while sketching links there too, and a line dropped back on its own box says why it was not drawn.
- **SKILL.md:** the agent always tells the user what to do on the page when it gives the link; a waiting poll runs the whole session, building included; questions go to a question tool or the chat.
- **Other agents talk to you in their own chat.** An agent that cannot be woken by a background command no longer sits waiting on the page. Your clicks and questions wait; tell it "check the page" in its chat and it reads them with the new `walkboard poll --now` and answers on the page, where you asked. The page shows this with a grey dot, ✉ and the number waiting, and the waiting message says what to type. New guide: [Use other agents](https://aiyaruch1320.github.io/walkboard/other-agents.html).
- **A docs website: [aiyaruch1320.github.io/walkboard](https://aiyaruch1320.github.io/walkboard/).** One page per subject: getting started, the page, each mode, each of the eleven pictures, sketching, sharing, FAQ and reference, plus a start page in Thai. Each platform (AWS, Google Cloud, Azure, Huawei Cloud, Kubernetes, container, on-prem) has a page generated from its profile, listing every kind with where it usually sits.
- **Shown, not only told.** Every picture and every platform page has a picture drawn by Walkboard and a live example to click (two new example plans, `examples/pictures` and `examples/platforms`, exported by the site build).
- **The page links to them.** **⋮ → Guide** opens the docs (in Thai when the plan is), a picture's **?** ends with a link to that picture's page, and a ⚠ card links to its kind on the platform's page. The links open in a new tab; the page itself still loads nothing from the network.
- **A smaller install.** The images and GIFs moved to the `media` branch, so installing no longer downloads them: about 1.7 MB on disk instead of about 20 MB.
- **Search in the docs.** The button in the header, ⌘K or / searches the pages of the language you read, down to a kind's row on a platform page.
- **The docs move smoothly.** A page opens in place: the header and menu stay still (the menu keeps its scroll), the content fades across in about 0.3 s, and a page is fetched while the pointer rests on its link. An "On this page" outline marks the section you are reading. Type, spacing and colours are calmer, after Apple's pages, and every motion is left out when the system asks for reduced motion. Live examples open in a new tab.
- **The docs in Thai, every page.** `docs/th/` mirrors the English pages one for one, the platform pages are generated in both languages, and each page's header switches to the same page in the other language. A Thai plan's links (⋮ → Guide, a picture's ?, a ⚠ card, the draft help) open the Thai pages.
- **Docs in plain words.** Every page starts with what it is about, explains a word before using it, and ends with where to go next, in the manner of the Next.js docs. The menu is grouped as Getting started, Guides, Pictures, Platforms and Reference, with previous and next links at the bottom of each page. A new guide shows how to draw a system you already have from Terraform or Kubernetes files. The page addresses are unchanged.
- **README:** install and a first command come first, in plainer words; the details moved to the docs.
- **Fixes on Windows.** The server no longer keeps its lock file open, so it can stop and start again; saving the plan or a sketch retries for up to a second while another program has the file open, instead of failing when two commands save at once.
- **`check` says how to fix a box that is in no picture**, and counts in the singular when there is one.
- **SKILL.md is shorter again** (9.6 KB), though it says more about other agents and the Thai docs: it is read on every use.
- **Tests run on macOS, Windows and Linux**, with Node 18 and 22, on every push. Issue forms ask for the version, system and agent.

## 0.10.3

- **Answering a guess is typed, and folded until you want it.** Each assumption shows a small **✎ Answer**; it opens a field like the chat's, with the send arrow inside. **✓ Right** is gone: say it in words. An empty field folds again when you leave it or press Esc.

## 0.10.2

- **Answer a guess in your own words.** Under every assumption there is a box to type what is true, beside **✓ Right**; "Not true" is gone. A guess that is not a yes or no (how many services, which size) can come as a question: `ask` on a constraint or an assumed box. The agent receives your words as `answer`.
- **Constraints on one line.** The bar shows the first three still to confirm, cut to one line, then how many more and how many are confirmed. **Answer…** opens them all: open ones first, the confirmed ones folded. A constraint's numbers and sources go in its new `detail`, shown only there. Print still lists every constraint.
- **A smaller ⋮ menu.** One line for the mode (what it means is a tooltip), shorter rows: about 190×160 px instead of 310×226.

## 0.10.1

- **Which version a page runs** is the last line of **⋮**, small and grey, and in the connection dot's tooltip.

## 0.10.0

- **The picture comes first.** The first box starts 215 px higher on a plan's first screen. The mode and who commits moved to **⋮**, the colours and how to read a picture to one **?**, the draft button beside the tabs. Status says itself once, as a dot when all is well.
- **A first look instead of a tour.** The first time on a computer the picture draws itself along its arrows and one hint says to click a box. The old tour dimmed the page and came back on every plan, because each has its own port.
- **One chat bar.** A bar at the bottom opens the conversation about what is on screen.
- **`/walkboard` on its own** looks through the repository and offers things to see first.
- **Start the next step with a button.** When a step is finished the agent stops; **Start next step** goes on, **Run the rest** does the remaining steps without stopping.
- **Restating is gone.** It did not help in real use: the picture already explains. Old plans with `teachBack` or a step's `confirmed` still open, and the fields are ignored.
- **A commit box only when there is something to commit.** The agent checks `git status`; a step that changed no files offers to go on instead of asking for a message.
- **One box to ask or to say what to change.** The Ask and Propose switch is gone. **Still unclear** and **Go deeper** stay in explain mode only.
- **A page never stays on old code.** Opening a plan that an older Walkboard still serves (a session started before an update) restarts it with the current one, on the same address, and the open tab reloads itself (or says so, when something is being typed). A newer one is left alone. `open` also says when a newer version is installed than the session runs.
- **Back from the plan to the design.** A plan written from a design links back to it, to sketch or compare again.
- **Attach images to a message.** Paste, drop or pick up to five. A big image is scaled down before it is sent, so it costs less to send, store and read. Never SVG.

## 0.9.1

- **Tabs stay where they are.** A plan with a big map changed the page's width from one picture to the next, so the text above rewrapped and the tabs moved. Now the width holds for the whole plan.
- **You can see your message is in line.** While the agent is busy, a message it has not taken says so in its chat: its place, and what the agent is on, as a link. The top bar counts them and the conversations list marks them with ⏳.
- **A zone resizes in height as it does in width.** Dragging its corner near the window's edge scrolls the page, so a zone can be made taller than the window, and it takes in the room left where a box was dragged away, down to what it holds. As small as it goes, the cursor says so.

## 0.9.0

**Change a picture yourself, then talk it over.**

- **Draft changes.** **✎ Draft changes** on a map, data model, flow, state, decision or impact picture opens a toolbar: add boxes, zones, tables, columns, groups, lanes and lines, rename, take out, drag between zones, groups or lanes, undo and redo, copy and paste (⌘C ⌘V ⌘D). Every change is drawn on the picture with an outline and a sign (+ ~ − ↦), listed in the side panel and kept in `.walkboard/draft.json`, never in plan.json. Sketching does not wake the agent.
- **Ask the agent to review.** The button sends the sketch. The agent says what it means for the plan in the names on the picture, and puts in only what you agree to. What it puts in stays where you placed it. `walkboard draft <dir> [clear …]` prints or clears the draft. `walkboard reply` refuses a draft's ids, which mean nothing to a reader.
- **A sketch goes along when you export.** PDF and the exported file draw the draft and list it in words, marked as not in the plan yet. A switch in Export leaves it out, as does `walkboard export --no-draft`.
- **Draft mode by keyboard.** Keys choose the tools; with an adding tool, Enter places on the first free spot in sight.

**Maps know what things are.**

- **Profiles.** A box, zone or line on a map can have a kind on a platform (`aws:rds`, `k8s:deployment`), with its icon and fields: 360 kinds across AWS, Google Cloud, Azure, Huawei Cloud, on-prem, containers and Kubernetes. A kind where it usually does not sit gets a small amber ⚠ that explains itself; nothing is blocked. Profiles mix, so EKS can sit in an AWS VPC.
- **Kubernetes is a map now.** The `k8s` picture is gone, so it has every map tool. **Plans with `kind: "k8s"` no longer load**: redraw them as a `map` with the `k8s` profile.
- **Auto or by hand.** On a map, a switch keeps everything where you put it. Zones resize from their corner, can share a name (`id` beside `label`), and a line can be told which sides of its boxes to meet.

**Arranging.**

- Outside draft mode a drag only arranges; moving something to another zone or group says draft mode is where that happens. State, decision and impact pictures can be arranged too, and hold still while you sketch, as data models do. Before / after only compares.
- **↺ Arrange again** lays a picture out from the plan, keeping the places of what you drew, and shows only when there is arranging of yours to undo. **Start over from the plan** drops the draft and the places, with one undo.
- Cards are the same everywhere: name, note and icon for a box, zone, table or group, and name, type and key for a column. Lines have a card too (turn one round, N:1 or 1:1, sides). A decision box can be a question, step or end; a state box can be the start or an end. **? How to read this picture** says what the lines mean.

**On paper.**

- A picture too small to read prints as an overview, then parts at a size to read, from 16 boxes to over 200: a map by zone, with a label where a line leaves a part; other pictures on sheets cut along the gaps between boxes. A picture that reads well stays on one page.
- A map arranged by hand keeps its arrangement on paper, and line labels no longer have a grey rectangle in PDF readers such as Preview.

**The page.**

- **The side panel takes the width you give it** (drag its left edge; double-click for the usual size). From 640 px details and chat sit side by side, and either folds into a rail.
- **An answer elsewhere is a link.** A message answered on another box says where, instead of looking unanswered. A reply can link to a place itself: `[[node:id]]`, `[[step:id]]`, `[[option:id]]`, `[[plan]]`. A message with no answer for a long time says the agent has it, quietly, and can be hidden.
- The conversations list puts the newest message on top. A sent message leaves the input at once.
- **Quicker.** A 52-box map drags at 60 frames a second, as a redraw only touches what moves. A click on a box no longer routes every line again, and a long chat is not built again on every event. Opening the side panel no longer rearranges the picture.

**For agents.**

- **A smaller skill.** An agent loads only what it uses: one file per picture (`references/views/<kind>.md`) and per platform (`references/profiles/<name>.md`), the review guide apart from the rarer messages, animation apart from the plan format. Drawing an AWS map and answering a review reads about 56% less (62 KB to 27 KB).
- `walkboard poll` keeps a review's `view` and, of where things sit on screen, only what is off; `--full` has the rest. `walkboard <command> --help` prints that command's options.
- `evals/` holds a suite for `claude plugin eval`: what agents do with the skill.

## 0.8.0

- **Much faster pages.** Lines were recalculated with a slow browser call: a big map redrew at about 2 frames a second while dragging, and now keeps up with the screen. The page no longer redraws when nothing changed, and a new box pulses three times instead of forever.
- **Undo and redo when arranging.** Buttons appear after the first drag, on maps and data models; ⌘Z and ⇧⌘Z (Ctrl+Z, Ctrl+Y) work too. Going back to the automatic layout can be undone.
- **Boxes stay on top.** A box can no longer disappear behind a zone, and what you moved last lies over the rest.
- **Choosing in design mode.** Every tab can be chosen: a picture no option owns offers **Choose this picture**, and the agent is told which one. Supporting pictures (`"option": "<id>"` on a view) sit under their option. `check` warns about a picture no option owns, and the guide tells the agent to keep revised designs as options.
- The confirm panel no longer lets the chat run over the form: list, chat, then the form at the bottom. Confirm buttons line up.
- **Drag on map pictures.** Move a box, or a whole zone by its title; arrow keys move a selected box; the place is saved and **Lay out automatically** puts it back.
- **Landscape pages in PDF.** A big picture takes a landscape page of its own when that makes it larger. Check the print preview if your browser does not support mixed page orientation.
- Thai text uses a looped face where the computer has one, easier to read at small sizes.

- **Pictures for cloud architects.** Icons for Huawei Cloud and on-prem (data center, VMware, F5, Oracle, NAS, AD), for ExpressRoute, Direct Connect, Cloud Interconnect, VPN and firewalls. A `standby` line for a backup path. A big map keeps its zones in a row: over 12 boxes or 4+ top-level zones it uses smaller boxes, uses the whole window, and wraps only when it still does not fit. Lines also leave or enter a box from the side when another box is in the way.
- **PDF fixes.** A picture with lines stays whole on one page, scaled to fit: before, tall ones lost their boxes to the next page. Lines now meet their boxes on paper. A diff prints its change list with the first picture.
- A wide diff shows Before or After at a time, swapped in place. Sequences with 6+ actors and impact pictures fit without scrolling sideways. The line a move travels on is solid, so it never looks like a "not ready" dashed line, and its label no longer hides the box it reaches.
- When most boxes are guesses, each gets a small ❓ and the picture says it once. A score can be `"basis": "judgment"` when there is no document to cite. `check` warns when a tab would show a bare id, and the guide says to `title` each view; boxes that are not code need no `file`.
- **Stories in pictures.** A step can say what travels: `moves` sends a label along the line between two boxes each time the step opens, `keep` leaves it on the box it reached, `show` puts a few lines inside a box. Play holds each step long enough to read it, and moves wait, travel slowly and rest so you can follow them. On paper, moves print under their step.
- Big map pictures: `"stack": true` stacks what a zone holds, over 12 boxes the page uses smaller ones and keeps top-level zones in one row, and lines look for the nearest gap first.
- Kubernetes pictures: a line that would run through a box, or between workloads stacked one above the other, now goes around.
- Thai labels keep technical terms as engineers say them (commit message, block, Input/Output, Snapshot) and say what a thing is where they were vague.
- Map pictures route lines around boxes: below, above or beside them, each in its own lane, when the straight way would cross another box.
- A box taken out of the plan keeps its conversation: 🗑 in the conversations list, with its name, still readable (and in exports with chat). Typing there continues in the whole plan's chat, naming the box. The agent says why in the whole plan's chat before taking out a box someone talked about.

## 0.7.0

- **Move tables yourself.** On a data model picture, drag a table by its title or a group by its label; the place is saved in plan.json, so exports and other browsers keep it, and the agent is not woken. Arrow keys move a selected table; **Lay out automatically** puts everything back.
- **Groups** frame tables that belong together: ask the agent to group them.
- Columns that point at another table show FK, beside PK when a table shares another's key (1:1). A line between tables stacked one above the other loops beside them instead of crossing one.
- The comparison says what its dots are: "●●○ = weight · click to change".
- Chat opens on the newest message and stays there when unfolded, widened or resized, until you scroll up; also on panels with only a chat (the whole plan, an option), where the box to type in now stays in view.

## 0.6.0

- Design pages: every guess has **Confirm** and **Not true**; a constraint can name the criteria it decides (`affects`), which show ❓ until it is confirmed; a cell can show the figure behind its rating (`value`, e.g. a monthly price); options that fail a must show ✗ on their tab; a table's panel lists the columns it stores again and which are kept on purpose.
- PDF: a design opens with the choice (or recommendation) and why, why not the others and which boxes are guesses, then the comparison with weights as numbers; journeys print as numbered stops; explanations print the cited lines; an exported file with chat prints the conversation.
- Side panel: approving is sent once from either button; your turn and the suggested commits sit with the chat; the panel follows the agent to its next step; ⤢ keeps your place in the chat and is gone on phones, where the panel is a sheet with a grabber and a dimmed page behind it.
- `check` also fails when an anchor is no longer at the start of a cited range, a highlight is outside the lines shown, a title is blank, a list has an empty item, or a column key is not text. `set` keeps `[skip ci] …` as text.
- Smaller: **bold** and *italic* in chat, plan changes say old → new status, dates in Thai use 2026 rather than 2569, Esc ends the tour, step statuses hide until the plan is approved, shorter connection labels, Enter and Space open any box, dimmed parts and badges are easier to read, decision boxes have a full outline, edge labels no longer sit on each other.
- Safer under load and mistakes: writes to plan.json (`walkboard set`, switches on the page) take a lock, so two at once both land; a batch of messages counts as read only after `poll` has printed it, so a killed poll loses nothing (`--timeout s` for agents whose commands are cut off); a broken plan.json no longer stops the server; a deleted `.walkboard/` is put back so a second server never starts; exports drop the plan's `root`, links to local pages and anything in `.walkboard/`, and never write over plan.json.
- **Export**: **⋮ → Export** in the top bar, or `walkboard export <dir> [--html file] [--no-code] [--with-chat]`, writes a read-only copy as one HTML file that opens anywhere offline (the code boxes point at included unless left out, the chat only when asked for, no token or server address, network blocked by its Content-Security-Policy); PDF goes through the browser's print window with a layout for paper: every step, every picture scaled to the page, then the boxes.
- **Renamed from planview to Walkboard.** The skill and command are `/walkboard`, the CLI is `walkboard`, plans live in `~/.walkboard/`, defaults in `~/.walkboard/config.json`, and each plan keeps its server state in `.walkboard/` beside `plan.json`. To keep a plan's conversation from before, rename its `.planview/` folder to `.walkboard/`.
- While the agent works on a message, the page shows typing dots where you asked and "Agent is answering you" in the top bar, with the minutes elapsed; after 10 minutes without a reply it says to check Claude Code.
- Restating each step is on by default and switched on the page, under **Agent settings**, together with how commits are made; each setting is a card that says what its current value means. The page saves the change to plan.json without waking the agent: the agent reads it before its next step, and gets it alongside your next message. The skill no longer asks about restating up front.
- Defaults for every plan in `~/.walkboard/config.json`; the skill asks its one question only when nothing says the answer, and offers to save it. `walkboard status` prints the current settings.
- The page explains and the side panel acts: step cards show only what a step does and its status, while a box's details, conversations, restating, suggested commits and approval open in a panel that slides in from the right (a sheet from the bottom on narrow screens). Clicking the same box again closes it.
- Steps read as a timeline that fades where more steps are off to the side; ◀ ⏵ Play ▶ and "Talk about the whole plan" sit on the same row.
- Code in replies: ``` fences become code blocks and `ticks` inline code. Ports used by several workloads show once with a count; tables without rows say so.
- Proposals, in every mode: on a box choose **Propose** (add after it, change it, remove it), or propose for the whole picture. The agent draws them in their own colours (purple dashed add, teal change, red struck-through remove) without building anything; a bar above the steps counts them and **Turn into a plan** (explain) or **Change the plan** (build) hands them all to the agent. Plans started from a page are linked there (`links`).
- Code excerpts highlight only the lines that make the point (`highlight`); the highlight reaches the end of the line and line numbers stay put when scrolling sideways. In explain mode the picture must match the code.
- Design mode: for something not built yet, the agent researches options and draws each one; a comparison table scores them on weighted criteria with cited sources (click a cell for the reasons, click the weight dots to say what matters, no agent wake-up); constraints and assumed boxes are marked and can be confirmed; **Choose this → write a plan** records the decision and starts a plan. A mode pill next to the logo says which mode you are in, and the agent asks what is unclear before drawing.
- Six more pictures: `state` (states and transitions, loops arced over), `decision` (questions as diamonds, outcomes), `timeline` (lanes on a time axis: spans, points and marks such as a timeout), `datamodel` (tables, keys and relations), `impact` (click a box: what breaks if it goes down, what it needs) and `diff` (before and after side by side, added, removed and changed boxes marked). Graphs lay out by longest path, route around boxes and spread edges. `references/views.md` starts with a "which picture" table.
- Two new pictures: `map` (zones inside zones, for cloud accounts, VPCs and clusters, with links routed across them) and `journey` (one piece of data travelling stop by stop, showing what it looks like at each stop with the changes highlighted; play or step through).
- Lighter on tokens: SKILL.md is about 7 KB (was 10.5 KB) with proposals and suggested commits moved to `references/messages.md`, read only when such a message arrives; the references are written compactly (22 KB in all, was 27 KB) and the icon list is `walkboard icons` instead; `poll` lines drop the view, `status` prints one line. A highlighted code line can carry a short note, and code wraps on phones (toggle "Wrap lines").
- Simpler to learn: the message box offers only **Ask** and **Propose** (Restate when it is your turn); a three-stop tour on the first visit and **?** for shortcuts and the tour; ← → move between steps; empty panels say what you can do there; the colour legend folds away; the agent adds one line on how to use the page with the first link.
- From two first-time-user tests: approving with open proposals asks first; to-do boxes are readable; after you restate or commit the bar says "Sent · waiting for the agent"; your turn shows on the whole-plan view and in the tab title; explain mode offers "Restate this stage" on each card and says "stage" throughout; proposed boxes have a neutral fill, a dashed border and their note, so they never look like real code; code excerpts drop shared indentation and fade where they continue; the step bar stays in view; playing starts where you are and holds 6 s; progress no longer counts as "plan changed"; links in replies are readable.
- The "Got it" button is gone: it woke the agent for nothing. The logo sits top left and a link to the repository bottom right.
- The agent replies to every message, approvals included, so the dots always end.
- With "suggest messages", the agent waits after each step: the step shows the suggested commit message (`commitMessage`), editable, with **Agent commits these, then goes on** (the agent commits exactly that text) and **I committed, go on**. The agent checks `git status` before the next step, so two steps never mix in one working tree. A step may suggest several commits (`commits`, each with its files) when it holds separate concerns.
- From a review by four testers (junior and senior developers, a mid-level developer on explain mode, a product owner on design mode):
  - `walkboard check` refuses plans that would stop the page drawing (a string where a list belongs, text fields that are objects, duplicate design ids, two recommended options); a picture that still fails says so in its own place instead of blanking the page, and a diff never compares itself.
  - Explain mode: `anchor` (a short piece of the cited code) lets `check` notice code that moved since it was explained and say where it went; the page warns on the code itself. Ranges are checked end to end.
  - Approve, commit and "write a plan" are sent once: the buttons say "sent" until the agent answers, and the server drops a repeat within 5 seconds.
  - Design mode: criteria can be `must`; an option that fails one is out of the running whatever its total. Missing scores count as 0. When your weights put another option ahead of the recommendation, the page says so and offers "Ask the agent to re-check". A cell's or option's conversation stays in its own thread (`walkboard reply --option --criterion`). The decide panel lists what is still unconfirmed, each with Confirm; the chosen option keeps why the others lost and the plan it became. A legend says what the dots mean.
  - `walkboard set` reaches the design lists (`constraint:`, `option:`, `criterion:`, `source:`), inside objects (`settings.commit=auto`), keeps digits as text when quoted, keeps the file compact if it was, and refuses a word that is neither a target nor key=value (a mistyped folder). Bad weights are refused. A stale server lock says how to clear it; CLI errors print one line instead of a stack.
  - The connection pill says when the agent is building; a step in review no longer claims it is your turn when nothing waits for you; the agent replies with what it built before you check a step.
  - Esc closes the panel from an empty text box; Space opens a box; on phones a tap on an underlined word inside a box opens the box; the tab, step and box you are on stay in the address; picking "All" returns to the picture you chose; a panel for a box not in the picture closes; unsent text survives a reload; the commit box scrolls into view.
  - The glossary only reads prose (not field names or URLs) and ships cloud networking terms (VPC, CIDR, subnet, Transit Gateway, PrivateLink, security group, …); the journey marks only real changes; the impact picture fades what is unaffected; timeline lanes open their box; changed boxes in a diff are amber; the decision diamond shows when selected; long titles wrap; the side panel becomes a bottom sheet only below 820 px.
  - Diff pictures list the links removed and added, and `changed` may say what changed per box (`{"api": "…"}`). Long state pictures continue on a second row instead of scrolling sideways. Box names break after `.` `/` `_` `-` rather than mid-word. No tour and no Approve on a plan with nothing drawn yet. The chosen design option shows who chose it and when (`decision.by`, `decision.at`; the page sends the weights with the choice).
  - Data model pictures show redundancy: a column with `copy` (⧉, amber) stores the same data as another one, `keep` marks a copy kept on purpose; a summary counts the copies per original and pointing at one shows its copies and their lines. FK lines and `relations` now show together. Lines leaving a box keep the order of their ends, so they no longer cross, and meet a question's hexagon on its side. Wide pictures in a diff sit one above the other.
  - **💬** in the top bar lists every conversation on the page, newest first and new replies on top, so you can carry on one you left; it replaces "new from the agent". **⋮** in the top bar holds Export, the theme (system, light, dark; remembered in the browser) and the shortcuts and tour, so the bar keeps only what is used all the time. Wordy hints went: the send-key line under the box you type in, the "tell the agent" label, empty-chat hints and the "wider than the screen" line (a wide picture now fades at the edge that has more); the remaining notes are shorter.
  - Long details and long chats: **▾ Details** and **▾ Chat** fold away, either or both, sliding shut with a quiet "folded" beside the name (remembered); **⤢** widens the panel to about 60% of the screen with details and chat side by side, the picture still on the left (full height on phones).
  - PDF uses light colours from the print stylesheet, so the screen never flashes white in dark mode; the printed layout has step cards, each picture framed with its title (in design mode its option and summary), and the boxes as cards in two columns.
  - The side panel reads like a chat: messages first, the box you type in kept at the bottom, opening on the latest message. Enter sends, Shift+Enter starts a new line.
  - The mode pill shows in one line what the current mode does; it, **?** and "Plan changed" close on a second click, as does a term's explanation. The "Terms in this plan" list is gone, since every term explains itself where it appears.
  - The page is now `viewer.html` with `viewer.css` and `strings.js` beside it, inlined by the server into one response; unused labels and duplicated drawing code are gone.
- The step being built shows "The agent is building this step"; the top bar shows which step the agent is on (or "All steps done") and the page follows the agent to its next step.

## 0.5.0

- The agent plans and replies in the language the user writes in. `lang` sets the page's labels (English or Thai; others get English); without it, a Thai title or goal means Thai. Checker messages are in English.
- Icons on boxes, guessed from names or set with `icon` (`aws:s3`, `gcp:bigquery`, `azure:keyvault`, `k8s:cronjob`, `database`, …). Cloud parts use their provider's colours; the icons are Walkboard's own drawings, not vendor logos.
- Status is a small mark inside each box (✓ ● ↗ ★) instead of a tag on its border; link labels such as ports sit on the box they reach instead of on the line.
- Kubernetes links leave the namespace on a straight line and spread out at both ends, so none run along a border or end in one point; "blocked" links end in a bar.
- Sequence pictures: notes no longer cross the next lifeline, groups no longer break the lifelines or cover the arrow above them.
- Approving: a "Your turn" banner on an unapproved plan and an Approve button in the top bar. Choosing a step no longer opens a box you did not click, and its boxes stay readable.
- One legend beside the picture; one-click buttons say they send at once; your own message scrolls into view; "↑ Picture" in the detail panel; explain mode speaks of stages and "Correct the picture".
- The glossary tooltip points at its word and flips above when there is no room.
- Shared glossary in English and Thai. Examples, screenshots and the demo GIF in English.

## 0.4.0

- `walkboard set` changes statuses and fields in place with one short command, so the agent never rewrites the plan to move a step.
- A shared glossary of about 70 common terms ships with Walkboard; plans only add their own, and the page lists only the terms a plan uses.
- Plans may leave out `views`; each step becomes a lane of a flow picture.
- `poll` prints one compact line per message; `check` caps its warnings.
- Deep links: `&step=`, `&view=`, `&node=` (or `&step=all`) and `&theme=light|dark`.
- Logo, plugin icon and page icon.
- The skill is invoked as `/walkboard` (the full `/walkboard:walkboard` only when names collide).
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
