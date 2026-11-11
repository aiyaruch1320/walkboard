---
type: regex
pattern: '"kind"\s*:\s*"(?:state|sequence|datamodel|decision)"'
target: {source: file, path: plan/plan.json}
weight: 3
---
