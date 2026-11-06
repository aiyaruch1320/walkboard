---
max_turns: 25
timeout_seconds: 420
runs: 1
allowed_tools: [Read, Glob, Grep, Skill, Bash, Write, Edit]
tags: [picture, profile]
---

Use walkboard to plan an order API on AWS, as three small steps with a picture of what sits where: an ALB in a public subnet, pods in an EKS cluster in private subnets (namespace shop: Deployment api, a ConfigMap it reads), RDS Postgres in a private data subnet, S3 for receipts. Treat the settings question as answered: commit suggest; ask nothing. Write the plan in the folder `plan`, run the skill's check until it says ok, then stop: do not open a page, poll or build.
