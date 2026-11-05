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

The user arranged or sketched on a map and asks whether it still matches the plan. `geometry` is the picture as it stands on their screen, in px from the map's top left corner (never saved: it depends on the window):

- `boxes` and `zones`: `x`, `y`, `w`, `h`; `zone` = where the plan puts it, `inside` = the smallest zone its centre is in on screen (`null`: none). `outOfZone` lists where the two differ (zones as `z:<label>`); `moved` = what the user dragged.
- `overlaps`: boxes lying on each other. `linesOverBoxes`: links drawn across other boxes.
- In `changes`, a new box (`addNode`) or an edit (`editNode`) can carry `what`, a note the user wrote for whoever reads the plan: put it in the node's `what`. `icon` is one they picked by hand (`""`: back to the icon from the name).

A data model's review has `changes` only (no `geometry`): `addTable` (can carry `what` and `icon`, as a new box does), `addColumn` (`type`, `key`), `editColumn` (`name`, `type`, `key`, `ref` = the column it points at, `""` = the foreign key taken out), `removeColumn` (`copies`: columns elsewhere that keep a copy of it), `moveTable` (to a group, `""` = none), `addGroup` and `editGroup` (`label` = its new name, `icon`, `note`; `""` takes an icon or a note away: put them in the group in `groups`), `removeGroup`, `editNode` (a table's `name`, `what` or `icon`), `remove` (a table). Say what each means for the schema: migrations, data to move, foreign keys across groups (services), what reads the column.

A flow's changes: `addBox`, `moveBox`, `addLane`, `editLane`, `moveLane` (`to` = its place after the move), `editNode`, `remove`. Lanes and places count from 0 in the JSON (from 1 in `WB draft` and on the page); each change also names its lane (`laneTitle`, and `step` for a step), and `lanesAfter` is the order of the lanes once all changes are in, so you never count. In a plan without views the flow is its steps (view `flow`): a lane is a step, so these change `steps` (their order, new steps, which nodes a step touches). Before reordering steps, check what each step needs from the ones before it and say if the new order breaks that. State, decision and impact pictures: `addBox`, `addEdge` / `editEdge` / `removeEdge` (`label`), `reverseEdge` (the line now points the other way: a transition, an answer or a dependency turned round), `editNode`, `remove`; k8s: `addBox` (a new target), `addLink` / `editLink` / `removeLink` (`label`, `state`), `reverseLink`, `editNode`, `remove`. On every picture a new box (`addBox`, `addNode`) or an edit (`editNode`) can carry `what` (the user's note for whoever reads the plan) and `icon`.

`changes` (when the user sketched in draft mode): the draft, oldest first, each with an `id` (`o` and a few letters) and names next to ids. `addNode` (a new box, id `new:…`), `addZone`, `addLink`, `editLink`, `removeLink`, `reverseLink` (the line `from` → `to` now points `to` → `from`: who starts the connection changed, so check rules and security groups on both ends; later edits still name it by its old ends), `editNode`, `editZone` (`label` = new name, `icon`, `note`; `""` takes one away), `remove`, `removeZone`, `move`, `moveZone`. `stale`: changes that no longer fit the plan, with `why`. `WB draft <dir>` prints the draft at any time.

Reply with `WB reply <dir>` (whole plan) and change nothing yet: one short line per change or out-of-place box, by id ("o3fk2: the worker needs SG 6379 from the app subnet"), saying what it means for the plan (network, cost, a missing step, a broken constraint), then ask once whether to put them in the plan. Mention an overlap or a crossing line only when it hides something. Nothing out of place: say it matches, in one line. Looks (balance, spacing) cannot be judged from numbers; leave them out.

Before replying, check each new box against the boxes already there: a new "Redis sessions" next to an existing Redis is likely the same thing. A `remove` lists the lines that go with the box (`lines`).

- Yes (all or some): write exactly those into plan.json (schema in references/schema.md): a node under `nodes` with a real id (short, lowercase, e.g. `redis-sessions`) for each `new:…`; its id in the zone's `nodes` in that view; `links` in that view; the `nodes` of the steps that build or change it. Then `WB check`, `WB draft <dir> clear <view> <op…>` for exactly those (it prints what is left), and reply with what changed. Leave `layout` alone.
- No: change nothing; ask whether to clear the draft (`WB draft <dir> clear <view>`), or the user drops it on the page.
- Explain mode never edits the project: agreed changes become `proposal`s. Design mode: agreed changes revise an option or make a new one (references/design.md), never a loose picture.

## Suggested commits (`settings.commit` = `"suggest"`)

When a step is done, put the message on the step and wait:

- One commit: `WB set <dir> step:<id> commitMessage="<message>"`.
- Separate concerns (refactor and feature, migration and the code using it, dependency bump and code): `WB set <dir> step:<id> 'commits=[{"message":"…","files":["…"]}]'`. More than 3 means the step is too big; split the step instead.

The page shows them, editable, each with its files.

- `commit` (with `commits` = the messages as the user left them): make those commits in order, each with only its files, then go on.
- `committed`: the user committed; go on.

Before the next step, `git status`: if this step's changes are still uncommitted, ask instead of going on, so steps never mix in one working tree.
