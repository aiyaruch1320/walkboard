# components

```json
{"id":"parts","kind":"components","layers":[{"label":"Web","nodes":["ui"]},
 {"label":"API","note":"Express","nodes":["routes","auth"]},{"label":"Data","nodes":["repo","db"]}],
 "uses":[{"from":"ui","to":"routes","label":"HTTP"},{"from":"routes","to":"auth"},{"from":"routes","to":"repo"},{"from":"repo","to":"db","label":"SQL"}]}
```

How a system or codebase is split up. Layers are columns, the user's side first; a box sits in one layer. `uses`: `from` uses `to` (calls, imports, reads); `label` says how. In explain mode a box is a module or folder with its `file`. 3-5 layers, up to 5 boxes each; a click shows what a box uses and what uses it. No draft mode.
