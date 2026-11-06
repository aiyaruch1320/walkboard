# timeline

```json
{"id":"retry","kind":"timeline","unit":"s","marks":[{"at":20,"label":"give up"}],
 "lanes":[{"node":"worker","events":[{"at":0,"to":3,"label":"wait (timeout 3 s)","state":"todo"},
  {"at":3,"label":"fail #1","state":"blocked"},{"at":5,"label":"retry #1"}]}]}
```

A lane per box; `to` makes a span; `marks` cross all lanes.
