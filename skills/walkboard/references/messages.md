# Less frequent messages from the page

Read this the first time one of these arrives. `WB` is the CLI from SKILL.md.

## propose (`change` = `add`, `change` or `remove`; any mode)

Decide what it is first:

- It corrects the picture (wrong, unclear or missing explanation of what exists): fix the picture and say so.
- It changes what gets built and the plan is not approved yet: change the plan directly and `WB check`; the page outlines what changed.
- Otherwise draw it and build nothing:
  - `add`: a new node with `"proposal": {"type": "add", "note": "…"}`, placed in the views next to the box it came from.
  - `change` / `remove`: `WB set <dir> node:<id> 'proposal={"type":"change","note":"…"}'`.

Reply in one line. In explain mode proposals are the only part of the picture that is not in the code. `change` from older pages means the same as `propose`.

## withdraw

Remove that node's `proposal`, and a proposed node with its places in the views.

## plan (explain) / apply (build)

Both carry `proposals`, the ids of the proposed nodes.

- `plan`: write a build plan in a new folder from those proposals, carrying their context (root, related boxes and their `file`). `WB open` it, add `{"title": "…", "url": "…"}` to this plan's `links` (`WB set <dir> 'links=[…]'`), and reply with the URL. Open questions become the first step.
- `apply`: turn the proposals into real steps and nodes, drop their `proposal` field, `WB check`, and reply with what changed.

## review (map)

The user arranged a map and asks whether it still matches the plan. A box or zone dropped into another zone is drawn inside it, marked as not in the plan yet. `geometry` is the picture as it stands on their screen, in px from the map's top left corner (never saved: it depends on the window):

- `boxes` and `zones`: `x`, `y`, `w`, `h`; `zone` = where the plan puts it, `inside` = the smallest zone its centre is in on screen (`null`: none). `outOfZone` lists where the two differ (zones as `z:<label>`); `moved` = what the user dragged.
- `overlaps`: boxes lying on each other. `linesOverBoxes`: links drawn across other boxes.

Reply with `WB reply <dir>` (whole plan) and change nothing yet. For each entry in `outOfZone`, say what it would mean for the plan ("A in Cloud now calls Oracle across the VPN, and needs a migrate step") and ask whether to change the plan that way. Mention an overlap or a crossing line only when it hides something. Nothing out of place: say it matches, in one line. Looks (balance, spacing) cannot be judged from numbers; leave them out.

- Yes: move the node (or the zone) in that view's `zones`, update what depends on it (links, steps, notes), `WB check`, and reply with what changed. Leave `layout` alone: the page sees the plan now agrees and drops the mark (an offset remembers its zone too).
- No: change nothing; the user moves it back with undo or **Lay out automatically**.

## Suggested commits (`settings.commit` = `"suggest"`)

When a step is done, put the message on the step and wait:

- One commit: `WB set <dir> step:<id> commitMessage="<message>"`.
- Separate concerns (refactor and feature, migration and the code using it, dependency bump and code): `WB set <dir> step:<id> 'commits=[{"message":"…","files":["…"]}]'`. More than 3 means the step is too big; split the step instead.

The page shows them, editable, each with its files.

- `commit` (with `commits` = the messages as the user left them): make those commits in order, each with only its files, then go on.
- `committed`: the user committed; go on.

Before the next step, `git status`: if this step's changes are still uncommitted, ask instead of going on, so steps never mix in one working tree.
