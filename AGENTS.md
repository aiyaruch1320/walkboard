# Working on planview

Notes for AI agents (and people) changing this repository. To *use* planview, read [skills/planview/SKILL.md](skills/planview/SKILL.md) instead.

## Map

| Path | What it is |
|---|---|
| `skills/planview/SKILL.md` | Instructions the agent follows when the skill runs. Keep it short: it is loaded every time |
| `skills/planview/references/` | `plan.json` and view reference, read on demand |
| `skills/planview/bin/planview.mjs` | CLI: `check`, `set`, `open`, `poll`, `reply`, `status`, `stop`, `serve` |
| `skills/planview/lib/server.mjs` | Local server: token, queue on disk, long poll, SSE, code excerpts |
| `skills/planview/lib/schema.mjs` | Validation shared by the CLI and the page (runs in Node and the browser: no Node imports) |
| `skills/planview/lib/source.mjs` | `file:line` lookups confined to declared roots |
| `skills/planview/lib/edit.mjs` | `planview set` |
| `skills/planview/assets/viewer.html` | The page: one file, no dependencies, no network |
| `skills/planview/assets/glossary.th.json` | Shared glossary |
| `examples/` | Example plans; `npm test` validates all of them |
| `scripts/` | Screenshots and the demo GIF (headless Chrome via DevTools, no dependencies) |
| `.claude-plugin/` | Plugin and marketplace manifests, icon |

## Rules

- No runtime dependencies. Node 18.18+ for the skill; Node 22 for `scripts/`.
- The server binds 127.0.0.1 and checks the token on every route. Plan text is rendered with `textContent`, never as HTML.
- Code excerpts never leave the declared `root` / `roots` (realpath check).
- Page labels are Thai; code, comments and docs are English.
- Keep `SKILL.md` small and the plan format backward compatible; document new fields in `references/schema.md` and `CHANGELOG.md`.

## Check your change

```bash
npm test
```

```bash
claude plugin validate .
```

After a visible change, regenerate the images and look at them:

```bash
node scripts/screenshots.mjs && node scripts/demo-gif.mjs
```

The page script can be syntax-checked by extracting the `<script type="module">` block from `viewer.html` and running `node --check` on it.

## Commits

Small, one context each, imperative subject (`feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`). No `Co-Authored-By` or other AI attribution lines.
