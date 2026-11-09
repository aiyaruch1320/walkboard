# Send a plan to someone

[Docs](README.md) › Send a plan to someone

The page runs on your machine, so a teammate cannot open your link. Send them a copy instead: **⋮ → Export** on the page, or `walkboard export <folder>`.

## HTML

One file that opens anywhere, offline and read only: every picture, step and box, and in explain mode the code each box points at.

- **The code** goes in unless you untick it (`--no-code`).
- **The chat** stays out unless you tick it (`--with-chat`).
- **Your sketch** goes in, drawn on the pictures and listed as not in the plan yet. Untick it to leave it out (`--no-draft`).
- No server address, token or path on your machine goes into it, and the file cannot load anything from the network.

## PDF

**PDF** opens the browser's print window with a layout for paper: every step, every picture one after another, then the boxes. Choose **Save as PDF**. A design opens with the decision and why.

On paper, a picture whose names would come out smaller than 7 pt prints as an overview, then parts at a size you can read. A map is cut by zone, and a line that leaves a part becomes a label on its box (`→ Aurora · 5432 · Part 3`). Other pictures are cut along the gaps between boxes. The overview numbers the parts.

## Before you send it

Look at what the file contains: it is your plan and, unless left out, your code. Do not send plans that hold customer data, hostnames or secrets you would not paste elsewhere.

## Sharing the plan itself

`plan.json` in the plan's folder is the whole plan. If they have Walkboard, they can run `walkboard open` on a copy of that folder and get the live page on their own machine.
