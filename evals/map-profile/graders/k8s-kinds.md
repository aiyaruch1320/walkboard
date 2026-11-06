---
type: regex
pattern: '"kind"\s*:\s*"k8s:deployment"'
target: {source: file, path: plan/plan.json}
weight: 2
---
