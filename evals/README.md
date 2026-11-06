# Evals

What agents do with the skill, as opposed to what `npm test` checks. These run real agents on your account, so they cost money:

```bash
claude plugin eval . --ablation none --no-publish --max-cost-usd 5 --allow-tools Bash Write Edit
```

Run it from a terminal where `claude` is logged in: without that every run stops at `Not logged in`. Each case runs once (`runs: 1`); add `--runs 3` before comparing two versions of the skill. `--no-publish` keeps the report on this machine: without it, it goes to claude.ai. Results land in `evals/results/`, which git ignores.
