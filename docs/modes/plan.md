# Plan mode

Plan mode is for building or changing something. The agent breaks the work into small steps and draws them, you approve the plan, and then it builds one step at a time. Nothing is built until you say so.

For example:

```
/walkboard plan deploying this CronJob to staging
```

![Steps on top, the selected step and the flow picture](https://raw.githubusercontent.com/aiyaruch1320/walkboard/media/build-overview.png)

## How a plan goes

1. **The agent asks first.** If the answer would change the plan, the agent asks up to three short questions. It also asks whether it should commit for you or only suggest commit messages.
2. **It draws the plan.** A plan has 3 to 8 small steps. Each step says what it does and how you will know it is done. One or two pictures show the steps. Click a step to see what it touches, and everything else fades.
3. **You talk it over.** Ask about any box or step, or say what to add, change or remove. Until you approve, the agent changes the plan directly and shows you what changed with **✎ Plan changed**.
4. **You approve.** Press **Approve plan** when you are happy with it.
5. **It builds one step at a time.** The agent builds a step, marks it for review and stops. Look at what it did and ask about it if you like. When you are ready, press **Start next step: …** at the top. On the last step the button says **Finish**.

![A finished step waits; the user presses Start next step and the agent moves on](https://raw.githubusercontent.com/aiyaruch1320/walkboard/media/next.gif)

## Choosing who commits

You can choose who makes the commits in the **⋮** menu, and change your mind at any time. Switching does not interrupt the agent and costs nothing.

- With **Agent commits**, the agent commits each step itself. You also get **Run the rest**, which builds all the remaining steps without stopping.
- With **Suggest messages**, each step that changed files shows a suggested commit message. Edit it if you like, then press **Agent commits these, then goes on**, or commit yourself and press **I committed, go on**. A step that changed no files does not ask for a message.

## Changing the plan after approval

Once you approve the plan, the agent no longer changes it directly. Instead, a change you ask for is drawn on the picture as a proposal, with **+** for something added, **~** for something changed and **−** for something removed. Nothing is built until you accept it.

A bigger change can come as two pictures side by side, one for now and one for after. See [Before and after](../pictures/diff.md).

If it is easier to draw the change than to describe it, you can [sketch it yourself](../draft.md).

## Pictures you will see

Most plans have a [flow](../pictures/flow.md) built from their steps. Depending on the work, you may also see a [map](../pictures/map.md) of where things run, a [sequence](../pictures/sequence.md) of who calls whom, or a [data model](../pictures/datamodel.md) of the tables.

## Next steps

- [Sketch your own changes](../draft.md): draw a change on the picture and let the agent review it.
- [Pictures](../pictures/README.md): how to read each kind of picture.
