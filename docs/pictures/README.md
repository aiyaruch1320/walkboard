# Pictures

[Docs](../README.md) › Pictures

The agent picks one or two pictures that answer your question. Every box in every picture is clickable: it opens the same details and conversation wherever the box appears. Each picture's **?** button explains its colours and marks and links back here.

| The question | Picture | Draft mode |
|---|---|---|
| What are the steps, in order? | [Flow](flow.md) | ✓ |
| What sits inside what, on which platform? | [Map](map.md) | ✓ |
| Who calls whom, in what order, and what if it fails? | [Sequence](sequence.md) | |
| What does the data look like before and after? | [Transform](transform.md) | |
| What happens to one piece of data along the way? | [Journey](journey.md) | |
| Which states can it be in, and what moves it? | [State](state.md) | ✓ |
| If this, then what? | [Decision](decision.md) | ✓ |
| When, and for how long? | [Timeline](timeline.md) | |
| What are the tables, keys and relations? | [Data model](datamodel.md) | ✓ |
| If this goes down, what breaks? | [Impact](impact.md) | ✓ |
| What changes between now and after? | [Before and after](diff.md) | via its two pictures |

## Marks every picture shares

| Mark | Means |
|---|---|
| ✓ green | done |
| ● | in progress, or just done |
| dashed outline | to do |
| ↗ | an external system, not part of this work |
| grey | existing code, not changed |
| ❓ dashed | something the agent assumed: answer it with **✎ Answer** |
| 💬 | there is a conversation on this box |
| + ~ − | proposed: add, change, remove (after the plan is approved) |

Choosing a step fades everything it does not touch. Drag boxes to arrange a picture (map, data model, state, decision, impact); that never changes the plan or wakes the agent, and **↺ Arrange again** lays it out afresh. To change the picture for real, use [draft mode](../draft.md).
