# Data model

[Docs](../README.md) › [Pictures](README.md) › Data model

**Answers:** what are the tables, their keys, and how do they relate?

## How to read it

- Each box is a table with only the columns that matter, and their types.
- **pk** is the table's own key; **fk** points at another table. A column can be both when a table shares another's key (1:1).
- A line goes from a foreign-key column to the column it points at. It is many-to-one (N:1) unless it says 1:1.
- **⧉** marks a column that stores the same data again; the table says how many places hold a copy. A grey ⧉ is a copy kept on purpose (the price at the time of sale).
- A frame groups tables that belong together, such as one service's tables.

## Arranging

Drag a table to arrange it, or into and out of a frame to change its group. Arrow keys move a selected table (Shift: further).

## Draft mode

| Tool | Does |
|---|---|
| Table | click an empty spot (inside a frame: in that group) |
| Column (C) | click a table, then type `name type [pk / fk]` |
| Line | drag a column onto the column it points at: a foreign key. Again takes it out; onto another column moves it |
| Group | click a table to start a new group with it |
| Edit | click a table or a group's title for its name, note and icon, a column to edit it in place, or a line for N:1 / 1:1 |
| Take out | click a table, a column, a group's title or a line |

Click just before a column to make it the key (PK). See [Sketch your own changes](../draft.md).
