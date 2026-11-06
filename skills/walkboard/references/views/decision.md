# decision

```json
{"id":"rule","kind":"decision","start":"hasEmail","edges":[{"from":"hasEmail","to":"consent","label":"yes"},
 {"from":"hasEmail","to":"admin","label":"no"},{"from":"consent","to":"send","label":"yes"}]}
```

Boxes with two or more ways out are drawn as questions, one as a step, none as an end; name questions as questions. `"shapes": {"admin": "end"}` sets what a box is when its lines do not show it (the user can choose it in draft mode).
