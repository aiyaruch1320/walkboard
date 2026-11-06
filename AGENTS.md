# Working on Walkboard

Notes for AI agents (and people) changing this repository. To *use* Walkboard, read [skills/walkboard/SKILL.md](skills/walkboard/SKILL.md) instead.

## Map

| Path | What it is |
|---|---|
| `skills/walkboard/SKILL.md` | Instructions the agent follows when the skill runs. Keep it short: it is loaded every time |
| `skills/walkboard/references/` | Read on demand, in small files so an agent loads only what it uses: `schema.md`, `moves.md`, `views.md` + `views/<kind>.md`, `profiles/<profile>.md`, `review.md`, `messages.md`, `design.md` |
| `skills/walkboard/bin/walkboard.mjs` | CLI: `check`, `set`, `open`, `poll`, `reply`, `status`, `stop`, `serve` |
| `skills/walkboard/lib/server.mjs` | Local server: token, queue on disk, long poll, SSE, code excerpts |
| `skills/walkboard/lib/schema.mjs` | Validation shared by the CLI and the page (runs in Node and the browser: no Node imports) |
| `skills/walkboard/lib/source.mjs` | `file:line` lookups confined to declared roots |
| `skills/walkboard/lib/edit.mjs` | `walkboard set` |
| `skills/walkboard/lib/icons.mjs` | Box icons and how they are guessed from names (runs in Node and the browser) |
| `skills/walkboard/lib/profiles.mjs` | Profiles: kinds of box, zone and line on a platform (AWS…), their fields and where each usually sits. A new profile is one more entry; then `node scripts/profiles-doc.mjs` rewrites `references/profiles/` (npm test checks it) |
| `skills/walkboard/assets/viewer.html` | The page script; `viewer.css` and `strings.js` (labels) beside it are inlined by the server, so the page is still one response with no network |
| `skills/walkboard/assets/glossary.json` | Shared glossary, English and Thai |
| `examples/` | Example plans; `npm test` validates all of them |
| `scripts/` | Screenshots and the demo GIF (headless Chrome via DevTools, no dependencies) |
| `.claude-plugin/` | Plugin and marketplace manifests, icon |

## Rules

- No runtime dependencies. Node 18.18+ for the skill; Node 22 for `scripts/`.
- The server binds 127.0.0.1 and checks the token on every route. Plan text is rendered with `textContent`, never as HTML.
- Code excerpts never leave the declared `root` / `roots` (realpath check).
- Page labels live in `STRINGS` in `assets/strings.js` (English and Thai); add a key to both. Code, comments and docs are English.
- Icons are Walkboard's own line drawings. Do not add vendor logos: their licences do not allow shipping them here.
- Keep `SKILL.md` small and the plan format backward compatible; document new fields in `references/schema.md` (a picture's in `references/views/<kind>.md`; a draft change's in `references/review.md`) and `CHANGELOG.md`.

## Check your change

```bash
npm test
```

```bash
claude plugin validate .
```

After a visible change, regenerate the images and look at them (needs Node 22 and Google Chrome; set `CHROME` to another Chromium binary if needed). If neither is available, leave `docs/images` as it is and say in your summary that the images were not regenerated:

```bash
node scripts/screenshots.mjs && node scripts/demo-gif.mjs
```

`DEMO_FRAMES=<dir> node scripts/demo-gif.mjs` also writes every GIF frame as a PNG, which is the practical way to review the animation.

The page script can be syntax-checked by extracting the `<script type="module">` block from `viewer.html` and running `node --check` on it.

## Commits

Small, one context each, imperative subject (`feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`).
