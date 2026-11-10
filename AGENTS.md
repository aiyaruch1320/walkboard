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
| `skills/walkboard/lib/version.mjs` | Which copy is running: version from `.claude-plugin/plugin.json`, newer copies installed beside it |
| `skills/walkboard/lib/source.mjs` | `file:line` lookups confined to declared roots |
| `skills/walkboard/lib/edit.mjs` | `walkboard set` |
| `skills/walkboard/lib/icons.mjs` | Box icons and how they are guessed from names (runs in Node and the browser) |
| `skills/walkboard/lib/profiles.mjs` | Profiles: kinds of box, zone and line on a platform (AWS…), their fields and where each usually sits. A new profile is one more entry; then `node scripts/profiles-doc.mjs` rewrites `references/profiles/` and `docs/platforms/` (npm test checks it) |
| `skills/walkboard/assets/viewer.html` | The page script; `viewer.css` and `strings.js` (labels) beside it are inlined by the server, so the page is still one response with no network |
| `skills/walkboard/assets/glossary.json` | Shared glossary, English and Thai |
| `docs/` | Docs for people, also the website https://aiyaruch1320.github.io/walkboard/ (`scripts/site.mjs`, `.github/workflows/pages.yml`), linked from the page (⋮ → Guide, a picture's ?, a ⚠ card): `pictures/<kind>.md`, `platforms/<profile>.md` (generated), `th/README.md` in Thai. A new picture kind needs its page and a view in `examples/pictures`; npm test checks every link and builds the site |
| `media` branch | Every image and GIF of the README and docs, so installing Walkboard never downloads them. Linked as `https://raw.githubusercontent.com/aiyaruch1320/walkboard/media/…`. Check it out at `media/` (ignored on main): `git worktree add media media` |
| `.github/` | Tests on macOS, Windows and Linux; issue forms |
| `examples/` | Example plans; `npm test` validates all of them |
| `evals/` | What agents do with the skill: `claude plugin eval`, see `evals/README.md`. Runs real agents on your account |
| `scripts/` | Screenshots and the demo GIF (headless Chrome via DevTools, no dependencies) |
| `.claude-plugin/` | Plugin and marketplace manifests, icon |

## Rules

- No runtime dependencies. Node 18.18+ for the skill; Node 22 for `scripts/`.
- The server binds 127.0.0.1 and checks the token on every route. Plan text is rendered with `textContent`, never as HTML.
- Code excerpts never leave the declared `root` / `roots` (realpath check).
- Page labels live in `STRINGS` in `assets/strings.js` (English and Thai); add a key to both. Code, comments and docs are English.
- Icons are Walkboard's own line drawings. Do not add vendor logos: their licences do not allow shipping them here.
- Keep `SKILL.md` small and the plan format backward compatible; document new fields in `references/schema.md` (a picture's in `references/views/<kind>.md`; a draft change's in `references/review.md`) and `CHANGELOG.md`.
- **A change people can see changes its docs in the same commit, in both languages.** A new or renamed button, label, sign, shortcut, behaviour or command updates the page in `docs/` that describes it and its twin in `docs/th/` (find it with the site's search, or `grep -rn` for the old words). A renamed label in `strings.js`: search both docs for the old English and Thai label. A change in what the agent does goes in `SKILL.md` or `references/`. Every such change also gets a line in `CHANGELOG.md`, and a picture that shows it is regenerated (see "Check your change"). `npm test` catches broken links and a missing Thai page, not an outdated sentence: that part is yours.

## Writing the docs

The pages in `docs/` are for people who have never seen Walkboard. Write them the way you would explain it to a colleague sitting next to you. The Next.js docs are the model.

- **Start every page with what it is about**, in a sentence or two: what the thing is, and what the page will show you.
- **Explain a word before you use it.** Put the term in bold the first time, with a plain sentence: "A **zone** is a frame that holds boxes."
- **Headings name what the reader does or wants to know**: "Asking about a box", "Approving the plan". Not "Overview" or "Details".
- **Whole sentences, one idea each.** Say "To do X, click Y." and "For example, …". Avoid chains of colons and semicolons, stacked brackets, and bold labels in front of every list item.
- **Say why** when the reason is not obvious, in the same plain words.
- **Tables are for looking things up** (keys, signs, tools). Explain things in sentences.
- **A side note goes in a `> **Good to know:**` block** at the end of its section, not in brackets in the middle of a sentence.
- **End with "Next steps"**: two or three pages, each with one line on why you would read it.
- Use the labels exactly as the page shows them, and keep the page URLs: the page links to `pictures/<kind>`, `platforms/<profile>`, `draft`, `share`, `faq` and `th/`.

`docs/th/` mirrors `docs/` page for page (`docs/th/pictures/map.md` is `docs/pictures/map.md` in Thai), so the site can switch between them. It is written for Thai developers, not translated word for word:

- Natural Thai, the way a Thai developer writes in a team chat or a blog. The readers work in software, so software jargon a Thai developer would say in English is written in English, in Latin script: side panel, field, resource, map, export, browser, folder, icon, tab, card, toolbar, shortcut, label, setting, database, column, key, timeout, retry, token, port, deploy, config, commit, zone, subnet, `plan.json`. Do not coin a formal Thai word for these (not แผงด้านข้าง, ช่องข้อมูล, ทรัพยากร, ส่งออก). Explain a term in Thai the first time, as the English pages do.
- Everyday words stay Thai (คลิก, เปิด, ลาก, ภาพ, ขั้น, กล่อง, ตาราง), and so do Thai grammar and sentence flow: only the nouns and jargon switch, so a page never reads as a wall of English.
- A label on the page is written exactly as the Thai page shows it, from `th` in `assets/strings.js` (**✎ ร่างการแก้ไข**, **อนุมัติแผน**, **ให้ agent รีวิวภาพนี้**).
- Same headings in the same order, the same images (same URLs) and live-example links, the same `<a id="…">` anchors. Links go to the Thai page when there is one, relatively (`../draft.md`), and to files in the repository as the English page does, one folder deeper.
- "Good to know" is **ควรรู้:**, "Next steps" is **อ่านต่อ**.
- The platform pages under `docs/th/platforms/` are generated with the English ones (`node scripts/profiles-doc.mjs`), except `README.md`.

## Check your change

```bash
npm test
```

```bash
claude plugin validate .
```

After a visible change, regenerate the images and look at them (needs Node 22 and Google Chrome; set `CHROME` to another Chromium binary if needed). They are written to `media/` (the `media` branch, see the map), never to main; commit them there and run the docs site workflow from the Actions tab. If neither is available, leave the images as they are and say in your summary that they were not regenerated:

```bash
node scripts/screenshots.mjs && node scripts/demo-gif.mjs
```

Preview the docs site: `node scripts/site.mjs` writes `site/` (with `media/` and the live examples), then serve that folder.

`DEMO_FRAMES=<dir> node scripts/demo-gif.mjs` also writes every GIF frame as a PNG, which is the practical way to review the animation.

The page script can be syntax-checked by extracting the `<script type="module">` block from `viewer.html` and running `node --check` on it.

## Commits

Small, one context each, imperative subject (`feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`).
