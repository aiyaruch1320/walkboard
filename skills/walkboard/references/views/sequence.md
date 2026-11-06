# sequence

```json
{"id":"run","kind":"sequence","actors":["cronjob","db","warehouse"],"messages":[
 {"from":"cronjob","to":"db","text":"read the checkpoint","step":"run"},
 {"from":"cronjob","to":"warehouse","text":"query new customers"},
 {"from":"warehouse","to":"cronjob","text":"rows","reply":true},
 {"from":"cronjob","to":"cronjob","text":"split into batches of 200"},
 {"from":"cronjob","to":"db","text":"retry once","group":"If the write fails"}]}
```

`reply` draws a dashed return; `from == to` a note. Consecutive messages with the same `group` are framed: one group per alternative path. `step` fades the message on other steps; `node` is what a click opens (default: the receiver). `text` under ~8 words. In explain mode, give every message a `step`.
