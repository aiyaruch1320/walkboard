# Map

[Docs](../README.md) › [Pictures](README.md) › Map

**Answers:** what sits inside what, and on which platform? An AWS account › VPC › subnet, a cluster › namespace › pods, a host and its containers, and how they connect.

![An AWS map: an account, a region, a VPC with app and data subnets, managed services, and lines with ports](https://raw.githubusercontent.com/aiyaruch1320/walkboard/media/pictures/map.png)

[Try it: click a box, choose a step ↗](https://aiyaruch1320.github.io/walkboard/examples/pictures.html?view=map&step=all)

## How to read it

- **Zones** are frames that hold boxes and other zones: a region, a VPC, a subnet, a namespace, a server. Up to eight levels; three or four read best.
- **Lines** go from the side that starts the connection to the side that takes it. The label on the box the arrow reaches is usually the port (`← :5432`).
- **Kinds of line:**

  | Line | Means |
  |---|---|
  | solid green | allowed / works |
  | dashed orange | to open, not yet |
  | dotted red, with a bar | blocked |
  | dotted blue | standby, a backup path |

- A line may take another route when a box moves or the line is reversed: only the arrow, the colour and the dashes carry meaning.
- A whole system (many boxes, or four or more top-level zones) is drawn smaller, with one column per site or provider: read left to right, outside first.

## Platforms

A box, zone or line can say what it is on a platform, such as an RDS database or a Kubernetes CronJob. Its icon and fields come from that, the picture is tagged with the platform, and a small amber **⚠** marks something that usually sits elsewhere (an RDS outside a subnet). The ⚠ is a hint; nothing is blocked. Its card links to the platform's page, which lists every kind and where it usually goes: see [Platforms](../platforms/README.md).

## Arranging

Drag boxes and zones to arrange the map; drag a zone's edge to resize it. **Auto | By hand** above the map chooses whether the page lays it out or everything stays where you put it. Click a line, or drag the dot at either end, to choose which side of each box it meets.

## Draft mode

| Tool | Does |
|---|---|
| Box (B) | click inside the zone where the new box goes |
| Zone (Z) | click inside a zone for a zone in it, or on empty space for a new outer zone |
| Line (L) | drag from one box and let go on another |
| Edit (R) | click a box or a zone's title to edit its name, note, icon and kind, or a line for its label and direction |
| Take out (D) | click a box, a zone's title or a line |

Drag a box or zone into another zone to move it there; copy and paste keep a zone with what it holds. See [Sketch your own changes](../draft.md).
