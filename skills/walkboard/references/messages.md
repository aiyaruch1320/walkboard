# Less frequent messages from the page

Read this the first time one of these arrives. `WB` is the CLI from SKILL.md.

## Proposals: a message asking to add, change or remove something (any mode)

It arrives as `question` (`propose` from older pages). Decide what it is first:

- It corrects the picture (wrong, unclear or missing explanation of what exists): fix the picture and say so.
- It changes what gets built and the plan is not approved yet: change the plan directly and `WB check`; the page outlines what changed.
- Otherwise draw it and build nothing:
  - To add: a new node with `"proposal": {"type": "add", "note": "…"}`, placed in the views next to the box it came from.
  - To change or remove (`"type":"remove"`): `WB set <dir> node:<id> 'proposal={"type":"change","note":"…"}'`.

Reply in one line. In explain mode proposals are the only part of the picture that is not in the code.

## withdraw

Remove that node's `proposal`, and a proposed node with its places in the views.

## plan (explain) / apply (build)

Both carry `proposals`, the ids of the proposed nodes.

- `plan`: write a build plan in a new folder from those proposals, carrying their context (root, related boxes and their `file`). `WB open` it, add `{"title": "…", "url": "…"}` to this plan's `links` (`WB set <dir> 'links=[…]'`), and reply with the URL. Open questions become the first step.
- `apply`: turn the proposals into real steps and nodes, drop their `proposal` field, `WB check`, and reply with what changed.

## Suggested commits (`settings.commit` = `"suggest"`)

When a step changed files, put the message on the step and wait (no files changed: no message, the page offers to go on instead):

- One commit: `WB set <dir> step:<id> commitMessage="<message>"`.
- Separate concerns (refactor and feature, migration and the code using it, dependency bump and code): `WB set <dir> step:<id> 'commits=[{"message":"…","files":["…"]}]'`. More than 3 means the step is too big; split the step instead.

The page shows them, editable, each with its files.

- `commit` (with `commits` = the messages as the user left them): make those commits in order, each with only its files. Going on needs no other word from the user.
- `committed`: the user committed; go on.

Before the next step, `git status`: if this step's changes are still uncommitted, ask instead of going on, so steps never mix in one working tree.
