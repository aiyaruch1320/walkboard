---
max_turns: 25
timeout_seconds: 420
runs: 1
allowed_tools: [Read, Glob, Grep, Skill, Bash, Write, Edit]
tags: [picture]
---

Use walkboard to plan adding refunds to our shop: customers ask for a refund on an order, staff approve or reject it, and approved refunds are paid back through the payment provider. Treat the settings question as answered: commit suggest; ask nothing. Write the plan in the folder `plan`, run the skill's check until it says ok, then stop: do not open a page, poll or build.
