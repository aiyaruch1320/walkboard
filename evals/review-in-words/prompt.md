---
max_turns: 8
timeout_seconds: 420
runs: 1
allowed_tools: [Read, Glob, Grep, Skill]
tags: [review]
---

You are the agent on a walkboard plan that has a box Redis (id redis) in the Data subnet and a Worker (id worker) in the Public subnet. There is no server to reach. Read what the walkboard skill says about this message, then write only the reply you would send on the page, in Thai, as your final message. Change nothing.

{"view": "net", "kind": "review", "text": "Check what this sketch means for the plan", "geometry": {"moved": ["worker", "new:c1"]}, "changes": [{"id": "o3fk2ab", "op": "addNode", "node": "new:c1", "name": "Redis sessions", "zone": "Data subnet", "kind": "aws:elasticache", "kindName": "ElastiCache (AWS)"}, {"id": "o9qd4xz", "op": "move", "node": "Worker (worker)", "to": "Private subnet"}, {"id": "o7mn2kw", "op": "addLink", "from": "Worker (worker)", "to": "Redis sessions (new:c1)", "label": "6379"}]}
