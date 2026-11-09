# Timeline

A **timeline** shows when things happen and how long they take. It is useful for retries, timeouts and schedules.

![Retries on a time axis: tries 1 to 3 fail with waits of 2, 4 and 8 minutes, try 4 is sent, and the give-up mark is at 30 minutes](https://raw.githubusercontent.com/aiyaruch1320/walkboard/media/pictures/timeline.png)

[Open this picture in the live example ↗](https://aiyaruch1320.github.io/walkboard/examples/pictures.html?view=retry&step=all)

## Reading a timeline

Each row is one part of the system. Time runs from left to right, in the unit shown on the axis: seconds, minutes or days.

- A dot is something that happens at one moment, such as "fail #1".
- A bar is something that lasts, such as "wait, timeout 3 s".
- A vertical mark across all rows is a moment that matters to all of them, such as "give up".

The colours mean the same as on a [map](map.md): green works, orange is still to do or waiting, red is blocked or failed, and blue is standby.

Click a row to open its box.

## Changing a timeline

A timeline has no draft mode. To change it, tell the agent what is different in the chat.

## Next steps

- [Sequence](sequence.md): see the calls behind each event, in order.
- [State](state.md): see which states something moves through, and why.
