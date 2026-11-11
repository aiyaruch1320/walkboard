# review

The user asks you to check a picture. The message has `view` (for `WB draft … clear`), `changes` (what they sketched; none if they only arranged), and on a map `geometry`. `WB draft <dir>` prints the draft at any time.

## Reply

`WB reply <dir>` (whole plan) and change nothing yet. A person reads this while looking at the picture, so write as you would to a colleague beside them:

- Use the names on the picture (a box, a zone, a line as "API → Aurora") and everyday words. Never `o3fk2`, `new:…` (`WB reply` refuses them), node ids or change names such as `addNode`; ids are only for `WB draft … clear`. Geometry gives ids: say the box's name. A zone in `changes` is named as on the picture.
- Open with one line on what the sketch adds up to. Then only what it means for the plan (network, cost, a missing step, a broken constraint), what goes together on one line, most important first. End by asking once whether to put them in the plan.
- A box already in the plan can be a link: `[[node:<id>]]`.
- Nothing out of place: say it matches, in one line. A box in `moved` that stayed in its zone is only arranged: say nothing about it. Mention an overlap or a crossing line only when it hides something; looks (balance, spacing) cannot be judged from numbers, so leave them out.

```text
You added a cache and moved the worker.
- **Redis sessions**: [[node:redis]] is already in the data subnet. The same one, or a second?
- **Worker** in the private subnet: it can no longer reach the payment API without a NAT Gateway, and the plan has none, so that is one more step.
Put these in the plan?
```

Check each new box against those already there: a new "Redis sessions" next to an existing Redis is likely the same thing. A `remove` lists the lines that go with the box (`lines`).

## Their answer

- Yes (all or some): write exactly those into plan.json with a small Edit or script (`WB set` does not add zones or lines; the shape is in views/<kind>.md): a node under `nodes` with a real id (short, lowercase, `redis-sessions`) for each `new:…`; its place in that view; links in that view; the `nodes` of the steps that build or change it. Then `WB check`, `WB draft <dir> clear <view> <op…>` for exactly those, in that order and keeping the names the user gave: that is how each keeps its place on the picture (it prints what is left). Reply with what changed, naming what stays in the draft. Leave `layout` alone.
- No: change nothing; ask whether to clear the draft (`WB draft <dir> clear <view>`), or the user drops it on the page.
- Explain mode never edits the project: agreed changes become `proposal`s. Design mode: agreed changes revise an option or make a new one (design.md), never a loose picture.

## In every picture's `changes`

In the order the user made them (one can name a zone added later in the list), each with an `id` (`o` and a few letters) and names next to ids.

- A new box (`addBox`, `addNode`, `addTable`) or `editNode` can carry `what` (a note for whoever reads the plan: the node's `what`) and `icon` (picked by hand; `""`: back to the one from the name).
- An edit has `was`: each field it changes as the plan has it now (`null` = not set).
- `copyOf` on a new box, zone, table or step box: a copy of that one (a zone comes with what it held, as further adds with `copyOf`, and the lines between them). Set it up as the original is (security groups, roles, size, columns) and ask only about what must differ (subnet, AZ, name, CIDR).
- `stale`: changes that no longer fit the plan, with `why`. `warnings`: boxes and zones put where their kind does not usually sit (`node` or `zone`, `kind`, `in`, `usuallyIn`); the user may mean it, so ask.

## Map (Kubernetes too)

`geometry`, what is on their screen and left out when empty (never saved: it depends on the window): `moved` (dragged), `outOfZone` (on screen outside the zone the plan puts it in; zones as `z:<key>`), `overlaps` (boxes on each other), `linesOverBoxes`. `WB poll --full` adds every box's and zone's place; you rarely need it.

- `addNode`, `editNode`, `remove` (`lines`); `addZone`, `editZone` (`label` = new name, `icon`, `note`; `""` takes one away), `removeZone`; `move`, `moveZone`. `at`: where it goes among what the zone holds by then, counting from 0; past the end is last. Order inside a zone is rarely worth more than a rough match.
- `addLink`, `editLink`, `removeLink`. An `addLink` with `replaces` (`"API (api) → Aurora (db)"`) is a line whose end was dragged to another box: the `removeLink` of that line goes with it, so treat the two as one move.
- `reverseLink`: the line `from` → `to` now points `to` → `from`, so who starts the connection changed; check rules and security groups on both ends. Later edits still name it by its old ends.
- `zone`, `parent` and `to` name a zone by its `id`, else its label (`""` = the top).
- `addZone`: `zone` is its name. With a `label`, that name is in use: write it with that `label` and `zone` as its `id`. An `editZone` whose new `label` another zone is known by keeps its key: give the zone `id` = the old key and the new `label`.
- Nodes, zones and links can carry `kind` (`aws:rds`, `aws:event`; `""` = none) with `kindName` (`Lambda (AWS)`), and `props`, the whole set rather than what changed: replace the node's `props` with it. When a box's kind changes, check what else says what it is (`what`, `in`/`out`, the step that builds it). See profiles/.

A new box goes in the `nodes` of the step that will build it.

## Data model

No `geometry`. Say what each change means for the schema: migrations, data to move, foreign keys across groups (services), what reads the column.

- `addTable`; `editNode` (a table's `name`, `what`, `icon`); `remove` (a table); `moveTable` (to a group, `""` = none).
- `addColumn` (`type`, `key`); `editColumn` (`name`, `type`, `key`, `ref` = the column it points at, `""` = the foreign key taken out); `removeColumn` (`copies`: columns elsewhere that keep a copy).
- `addGroup`, `editGroup` (`label` = new name, `icon`, `note`; `""` takes one away: put them on the group in `groups`), `removeGroup`.
- `editRelation` (`from`, `to`, `kind`): put it in `relations` with that kind and take the column's `ref` away, as `ref` always draws N:1. `removeRelation` (`from`, `to`): take it out of `relations`.

## Flow

`addBox`, `moveBox`, `addLane`, `editLane`, `moveLane` (`to` = its place after the move), `editNode`, `remove`. Lanes and places count from 0 in the JSON (from 1 in `WB draft` and on the page); each change also names its lane (`laneTitle`, and `step` for a step), and `lanesAfter` is the order once all changes are in, so you never count.

The flow the page builds from the steps (view `flow`) is the steps: a lane is a step, so these change `steps` (their order, new steps, which nodes a step touches). A box can be in several lanes; a `moveBox` that changes lanes names the one it left (`fromLaneTitle`, `fromStep`): only that step stops touching it. Before reordering steps, check what each needs from the ones before it and say if the new order breaks that.

## State, decision, impact

`addBox`, `addEdge`, `editEdge`, `removeEdge` (`label`), `reverseEdge` (the line now points the other way: a transition, an answer or a dependency turned round), `editNode`, `remove`.

- State and decision: `setStart` (`node`, `""` = none: the view's `start`). State: `setEnd` (`node`, `end`: the view's `end` list).
- Decision: `setShape` (`node`, `shape`: `question`, `step`, `end`, `""` = from its lines again: the view's `shapes`). A question needs two or more lines out, an end none: say so when the draft does not match yet.
