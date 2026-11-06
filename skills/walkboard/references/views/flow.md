# flow

```json
{"id":"flow","kind":"flow","lanes":[{"title":"CI","nodes":["commit","build","tagjob"]},
 {"title":"Before enabling","nodes":["secret","egress"],"arrows":false}]}
```

Lanes of boxes, left to right. `"arrows": false` makes a lane a checklist.
