# Sequence

[Docs](../README.md) › [Pictures](README.md) › Sequence

**Answers:** who calls whom, in what order, and what happens if it fails?

![A call sequence with an alternative path framed](../images/sequence.png)

## How to read it

- Each column is a part of the system; time goes down the page.
- A solid arrow is a call; a dashed arrow back is its reply.
- An arrow from a column to itself is something that part does on its own (split into batches, retry).
- A frame around some messages is one alternative path, named at its top ("If the write fails").
- Choosing a step fades the messages of other steps.

Click a message to open the box that receives it, with its details and conversation.

There is no draft mode on a sequence: ask for changes in the chat.
