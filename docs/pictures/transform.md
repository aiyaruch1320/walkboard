# Transform

A **transform** shows what the data looks like before and after each stage. It is useful when data changes shape on the way, for example from a database row to a queue message to an email.

![An orders row, the queue message and the email, with an empty value and a trailing space made visible](https://raw.githubusercontent.com/aiyaruch1320/walkboard/media/pictures/transform.png)

[Open this picture in the live example ↗](https://aiyaruch1320.github.io/walkboard/examples/pictures.html?view=shape&step=all)

## Reading a transform

The stages go from left to right. Each stage is either a small table, with columns and a few sample rows, or a piece of text such as a request body.

Two things are easy to miss in real data, so the picture shows them:

- **∅** is an empty value or `null`.
- **␠** is a space at the start or end of a value.

Notes under a stage tell you what to watch out for, such as "all values are text".

The rows are made-up samples, not your real data. Click a stage to open its box.

## Changing a transform

A transform has no draft mode. To change it, tell the agent what is different in the chat.

## Next steps

- [Journey](journey.md): follow one record from stop to stop.
- [Data model](datamodel.md): see the tables, their keys and how they relate.
