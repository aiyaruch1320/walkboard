# Impact

An **impact** picture answers "if this goes down, what breaks?". It shows what each part depends on, so you can see how far a failure would spread.

![What depends on what: the API and worker need the queue, the database and SES](https://raw.githubusercontent.com/aiyaruch1320/walkboard/media/pictures/impact.png)

[Open this picture in the live example ↗](https://aiyaruch1320.github.io/walkboard/examples/pictures.html?view=deps&step=all)

## Reading an impact picture

A line from A to B means A needs B. If B fails, A is affected.

Click a box to see its reach. Everything that depends on it turns red, everything it needs turns blue, and its details open beside the picture.

## Arranging an impact picture

Drag boxes to arrange the picture. The rest of the picture holds still while you do.

To choose which side of a box a line meets, click the line, or drag the dot at either end.

<a id="sketch"></a>

## Sketching on an impact picture

In [draft mode](../draft.md) you can add boxes, draw lines, rename and take things out. To reverse a line, click it.

## Next steps

- [Map](map.md): see where each part runs and how they connect.
- [Sketch your own changes](../draft.md): how a sketch becomes part of the plan.
