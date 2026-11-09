# Design mode

[Docs](../README.md) › Design mode

Use it to choose how to build something new: `/walkboard compare ways to connect EC2 across two AWS accounts`.

![Design mode: three ways to connect two VPCs scored with sources; changing two weights puts another option ahead](../images/design.gif)

## What you get

The agent researches 2–4 options and draws each as its own picture tab, with its score and a ★ on the one it recommends.

- **The table** scores every option on each criterion: ●●●●● is best for you (cheapest, easiest), ✓ / ✗ for things that work or do not. A score can show the figure behind it, such as a monthly price. Click a cell for the reason and its sources; each source says when it was read.
- **Your priorities.** Click the weight dots under a criterion to say how much it matters. This saves at once and does not wake the agent. When your weights put another option ahead of the ★, a note says so and offers **Ask the agent to re-check**.
- **Must-haves.** A criterion marked "must" greys out every option that fails it.
- **Assumptions.** Constraints in the bar above, and dashed boxes in the pictures, are guesses until you answer them: press **✎ Answer** and type what is true. Rows that rest on an unanswered guess are marked ❓.
- **Choose this → write a plan** records the decision (why this one, why not the others) and starts a [plan](plan.md) in a new page, linked from the choice.

## Sharing a decision

Export or print the design and it opens with the decision and why: see [Send a plan to someone](../share.md).

## Try it

From a clone of the repository, with no agent and no tokens:

```bash
node skills/walkboard/bin/walkboard.mjs open examples/connect-vpcs
```
