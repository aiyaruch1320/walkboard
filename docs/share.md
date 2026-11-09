# Send a plan to someone

The page runs on your own machine, so a teammate cannot open your link. To show them a plan, send them a copy instead. This page explains the two kinds of copy and what goes into each.

To make a copy, open **⋮ → Export** on the page, or ask the agent to export the plan.

## Sending an HTML file

An HTML export is a single file that opens in any browser, even offline. It has every picture, step and box, and you can click around in it just like on the page. Nobody can change it, and there is no agent to answer questions.

Before you export, you can choose what goes in:

- **The code** that boxes point at in explain mode is included unless you untick it.
- **The chat** is left out unless you tick it.
- **Your sketch**, if you have one, is included and marked as not in the plan yet. Untick it to leave it out.

> **Good to know:** The file holds no server address, no token and no paths from your machine. It cannot load anything from the network, so opening it sends nothing anywhere.

## Printing to PDF

Press **PDF** in Export, and the browser's print window opens with a layout made for paper. It has every step, then every picture one after another, then the boxes. Choose **Save as PDF** to get a file. If the plan came from design mode, the PDF starts with the option you chose and why.

Big pictures are split so you can still read them. If the names in a picture would print smaller than 7 pt, the PDF shows the whole picture as a numbered overview first, then each part at a readable size. A map is split by zone. When a line leaves its part, it becomes a label on the box instead, such as `→ Aurora · 5432 · Part 3`. Other pictures are split along the gaps between boxes.

## Checking before you send

A copy holds your plan and, unless you left it out, your code. Look through it before you send it, and do not share plans that contain customer data, hostnames or secrets you would not paste anywhere else.

## Sharing the plan itself

The whole plan lives in one file, `plan.json`, in the plan's folder. If your teammate has Walkboard too, they can copy that folder and run `walkboard open` on it. They get the live page on their own machine.

## Next steps

- [Sketch your own changes](draft.md): draw a change to talk over with your team.
- [FAQ](faq.md): where plans are kept and what leaves your machine.
