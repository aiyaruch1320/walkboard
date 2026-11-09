# Timeline

[Docs](../README.md) › [Pictures](README.md) › Timeline

**Answers:** when, and for how long? Retries, timeouts, schedules.

![Retries on a time axis: tries 1 to 3 fail with waits of 2, 4 and 8 minutes, try 4 is sent, and the give-up mark is at 30 minutes](https://raw.githubusercontent.com/aiyaruch1320/walkboard/media/pictures/timeline.png)

[Try it: click a box, choose a step ↗](https://aiyaruch1320.github.io/walkboard/examples/pictures.html?view=retry&step=all)

## How to read it

- One row per part of the system; time runs left to right in the unit shown (seconds, minutes, days).
- A dot is something that happens at one moment ("fail #1"); a bar is something that lasts ("wait, timeout 3 s").
- Colours are those of a map's lines: green works, orange to do or waiting, red blocked or failed, blue standby.
- A vertical mark across all rows is a moment that matters to all of them ("give up").

Click a row to open its box.

There is no draft mode on a timeline: ask for changes in the chat.
