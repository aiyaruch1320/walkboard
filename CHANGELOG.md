# Changelog

## 0.6.0

- While the agent works on a message, the page shows typing dots where you asked and "Agent is answering you" in the top bar, with the minutes elapsed; after 10 minutes without a reply it says to check Claude Code.
- Restating each step is on by default and switched on the page, under **Agent settings**, together with how commits are made. The page saves the change to plan.json and the agent gets it as a `settings` message. The skill no longer asks about restating up front.
- The agent replies to every message, approvals included, so the dots always end.

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
