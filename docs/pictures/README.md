# Pictures

Walkboard draws a plan or an explanation as one or two pictures. There are eleven kinds of picture, and each answers a different kind of question. The agent picks the kind that fits what you asked, so you do not need to choose.

This section explains how to read each kind and what you can do on it.

## Choosing a picture

| If the question is | The picture is | You can sketch on it |
|---|---|---|
| What are the steps, in order? | [Flow](flow.md) | ✓ |
| What sits inside what, and on which platform? | [Map](map.md) | ✓ |
| Who calls whom, in what order, and what if it fails? | [Sequence](sequence.md) | |
| What does the data look like before and after? | [Transform](transform.md) | |
| What happens to one piece of data along the way? | [Journey](journey.md) | |
| Which states can it be in, and what moves it? | [State](state.md) | ✓ |
| If this, then what? | [Decision](decision.md) | ✓ |
| When does it happen, and for how long? | [Timeline](timeline.md) | |
| What are the tables, keys and relations? | [Data model](datamodel.md) | ✓ |
| If this goes down, what breaks? | [Impact](impact.md) | ✓ |
| What changes between now and after? | [Before and after](diff.md) | through its two pictures |

You can ask for a particular kind too, for example "show the retries as a timeline".

## Clicking a box

Every box in every picture can be clicked. A box opens the same details and conversation wherever it appears, so a question you ask on the flow is still there when you find the same box on the map.

On the page, the **?** next to the picture tabs explains the colours and marks of the picture you are looking at, and links back to its page here.

## Marks every picture shares

| Mark | Means |
|---|---|
| green with ✓ | done |
| ● | in progress, or just finished |
| dashed outline | still to do |
| ↗ | an outside system, not part of this work |
| grey | existing code that this work does not change |
| dashed with ❓ | something the agent assumed. Press **✎ Answer** to say what is true |
| 💬 | there is a conversation on this box |
| **+** **~** **−** | a proposed change after the plan was approved: add, change or remove |

When you choose a step, everything the step does not touch fades out.

## Arranging and sketching

You can drag boxes to tidy a map, data model, state, decision or impact picture. Arranging only moves things on screen. It never changes the plan, and the agent is not interrupted. To lay the picture out again, press **↺ Arrange again**.

To change what a picture says, use [draft mode](../draft.md) instead.

## Next steps

- [Flow](flow.md): the picture most plans start with.
- [Map](map.md): where things run, on a cloud or in a cluster.
