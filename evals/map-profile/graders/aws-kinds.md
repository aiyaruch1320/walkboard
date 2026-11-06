---
type: regex
pattern: '"kind"\s*:\s*"aws:rds"'
target: {source: file, path: plan/plan.json}
weight: 2
---
