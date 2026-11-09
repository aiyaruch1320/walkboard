# Explain mode

[Docs](../README.md) › Explain mode

Use it to understand code that already exists: `/walkboard explain how login works in project A`. Nothing is changed.

![Explain mode: the login flow in stages](../images/explain-overview.png)

## What you get

- **Stages in order** instead of steps: what happens first, then next. Click a stage to see the boxes it involves.
- **Every box that is code points at `file:line`.** The side panel shows that code, with the lines that matter marked and a note on each. The path opens in VS Code, Cursor or IntelliJ (`editor`: `vscode`, `cursor`, `idea` or `none`, saved in `~/.walkboard/config.json`).
- **Overview or detail.** The agent asks once how deep to go, unless you said so or saved it in the config.
- **Checked against the code.** Each box carries a short piece of its code. `walkboard check` fails when the file or lines are gone or that piece is no longer there (and says where it went), and the page warns on the code itself when it changed since it was explained.
- **Still unclear · Go deeper** ask the agent to explain a box again more simply, or in more depth.

![A box showing its code excerpt and an editor link](../images/explain-code.png)

## Which code it can show

Only files under the folders the agent declared for the plan (`root` or `roots`). The page never reads anything outside them, and an exported copy can leave the code out.

## Pictures you will see

Often a [flow](../pictures/flow.md) or [sequence](../pictures/sequence.md) of what calls what, a [journey](../pictures/journey.md) of one request or record, a [transform](../pictures/transform.md) of how data changes shape, or a [state](../pictures/state.md) picture. See [all pictures](../pictures/README.md).

## Try it

From a clone of the repository, with no agent and no tokens:

```bash
node skills/walkboard/bin/walkboard.mjs open examples/explain-login
```
