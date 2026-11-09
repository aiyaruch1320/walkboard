# Sketch your own changes

[Docs](README.md) › Sketch your own changes

Sometimes it is quicker to draw what you mean than to type it. Press **✎ Draft changes** above a picture and change it yourself; the agent reviews your sketch and puts in the plan only what you agree to.

![Draft mode on a map: a new RDS replica and a line drawn dashed with signs, the list of changes beside it and the toolbar at the bottom](images/draft.png)

## Which pictures

[Map](pictures/map.md), [data model](pictures/datamodel.md), [flow](pictures/flow.md), [state](pictures/state.md), [decision](pictures/decision.md) and [impact](pictures/impact.md). A [before / after](pictures/diff.md) pair has a pencil that leads to its two pictures. Other kinds have no draft mode.

## What you can do

| To | Do |
|---|---|
| Add a box, zone, table, group or lane | Pick the tool (B, Z, the data model's C for a column), then click where it goes, or press Enter for the first free place in sight |
| Draw a line | L, then drag from one box to another. Near the window's edge the page scrolls with you |
| Edit or take out | R or double-click to edit, D or Delete to take out; both work on lines too |
| Move | Drag between zones, groups or lanes. On a flow, drag a lane's title to reorder |
| Copy | ⌘C ⌘V, or ⌘D to duplicate (Ctrl on other systems). A zone comes with what it holds |
| Go back | ⌘Z ⇧⌘Z; × on one change in the list; **Start over from the plan** for all of it; Escape leaves |

A box's card holds its name, a short note, its icon and, on a map, [what it is on a platform](platforms/README.md) (an RDS, a CronJob). A small amber ⚠ marks something placed where it does not usually sit; it is a hint, nothing is blocked.

Each picture's **?** lists its own tools and what the signs mean.

## What the signs mean

| Sign | Means |
|---|---|
| **+** dashed | new, not in the plan yet |
| **~** | edited, not in the plan yet |
| **−** | to be taken out, still in the plan |
| **↦** | moved; the plan still has it where it was |

## Asking for a review

Sketching does not wake the agent and does not change the plan. When you are ready, press **Ask the agent to review**. It says in plain words what your sketch means for the plan (the network, a migration, a missing step), using the names on the picture, and asks once before changing anything.

![The agent's review in the whole plan's chat, in plain words, with a link to a box](images/review.png)

What it puts in the plan stays where you placed it; what you turned down stays in your draft.

## Arranging is not sketching

Outside draft mode a drag only arranges the picture: nothing changes in the plan, and dropping a box into another zone puts it back with a message. **↺ Arrange again** lays the picture out from the plan, keeping what you drew where you put it. On a map, **Auto | By hand** chooses whether the page lays it out or everything stays where you put it.

## Sharing a sketch

Exports and PDFs carry your sketch on purpose, marked as not in the plan yet, so you can talk it over with people. Untick it in Export to leave it out. See [Send a plan to someone](share.md).
