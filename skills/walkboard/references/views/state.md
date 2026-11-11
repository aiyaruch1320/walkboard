# state

```json
{"id":"life","kind":"state","start":"created","end":["delivered","cancelled"],
 "states":["created","paid","delivered","cancelled"],
 "transitions":[{"from":"created","to":"paid","label":"paid"},{"from":"created","to":"cancelled","label":"30 min unpaid"},
  {"from":"paid","to":"delivered","label":"received"},{"from":"paid","to":"paid","label":"retry"}]}
```

States are node ids; loops are fine. Screens of an app work the same way: a screen per state, the action that leads on as the label ("tap Pay").
