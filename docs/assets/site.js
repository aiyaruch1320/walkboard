// The docs site's own script (scripts/site.mjs adds it to every page): the menu keeps its place from page to page,
// and search (⌘K, Ctrl+K or /) looks through this language's pages. No dependencies, nothing sent anywhere: the index
// is a file of this site, read the first time search opens.
const me = document.currentScript;

// The menu: where it was scrolled on the last page, and the page you are on always in sight.
const side = document.querySelector(".side");
if (side) {
  try {
    const y = sessionStorage.getItem("wb-side");
    if (y !== null) side.scrollTop = Number(y);
  } catch {}
  const on = side.querySelector("a.on");
  if (on && (on.offsetTop < side.scrollTop || on.offsetTop + on.offsetHeight > side.scrollTop + side.clientHeight)) side.scrollTop = on.offsetTop - side.clientHeight / 2;
  addEventListener("pagehide", () => {
    try {
      sessionStorage.setItem("wb-side", String(side.scrollTop));
    } catch {}
  });
}

// Search.
const base = me.dataset.base;
let index = null;
const load = () => (index ||= fetch(me.dataset.index).then((r) => r.json()).catch(() => []));
const norm = (s) => s.toLowerCase().normalize("NFC");

const dialog = document.createElement("dialog");
dialog.className = "search";
dialog.innerHTML = '<form method="dialog" class="searchbox"><input type="search" autocomplete="off" spellcheck="false"><button value="close" aria-label="Close">Esc</button></form><ol class="results"></ol>';
document.body.append(dialog);
const input = dialog.querySelector("input"), list = dialog.querySelector(".results");
input.placeholder = me.dataset.hint;
input.setAttribute("aria-label", me.dataset.hint);

// Every word must appear; a word in the title counts most, then in the section's heading, then in its text. A Latin
// word matches from the start of a word ("rds" finds RDS, not "words"); Thai has no spaces, so it matches anywhere.
const esc = (w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// How many times a word appears (0: not at all).
const matcher = (w) => {
  const re = new RegExp(/^[\x00-\x7f]+$/.test(w) ? `(^|[^a-z0-9])${esc(w)}` : esc(w), "g");
  return (s) => (s.match(re) || []).length;
};
function find(q) {
  const words = norm(q).split(/\s+/).filter(Boolean).map((w) => [w, matcher(w)]);
  if (!words.length) return [];
  const hits = [];
  for (const e of index) {
    const t = norm(e.t), h = norm(e.h), x = norm(e.x);
    let score = 0;
    for (const [, has] of words) {
      // In the text, a word that comes up again and again says more, up to a point.
      const s = (has(t) ? 10 : 0) + (has(h) ? 6 : 0) + Math.min(4, has(x));
      if (!s) {
        score = 0;
        break;
      }
      score += s;
    }
    if (score) hits.push({e, score: score - (e.u.includes("#") ? 0 : 0.5)});
  }
  return hits.sort((a, b) => b.score - a.score).slice(0, 30).map((x) => x.e);
}

// A few words around the first match, with the words marked.
function snippet(text, words) {
  const low = norm(text);
  const at = Math.max(0, Math.min(...words.map((w) => low.indexOf(w)).filter((i) => i >= 0), low.length));
  const from = Math.max(0, at - 50), part = (from ? "…" : "") + text.slice(from, from + 160) + (from + 160 < text.length ? "…" : "");
  const frag = document.createDocumentFragment();
  const re = new RegExp(`(${words.map(esc).join("|")})`, "gi");
  part.split(re).forEach((bit, i) => frag.append(i % 2 ? Object.assign(document.createElement("mark"), {textContent: bit}) : bit));
  return frag;
}

let picked = 0;
function show() {
  const q = input.value.trim(), words = norm(q).split(/\s+/).filter(Boolean);
  const found = q ? find(q) : [];
  list.replaceChildren(...found.map((e, i) => {
    const li = document.createElement("li"), a = document.createElement("a");
    a.href = base + e.u;
    const head = document.createElement("span");
    head.className = "where";
    head.textContent = e.h ? `${e.t} › ${e.h}` : e.t;
    const text = document.createElement("span");
    text.className = "what";
    text.append(snippet(e.x || e.h, words));
    a.append(head, text);
    if (i === 0) a.classList.add("on");
    li.append(a);
    return li;
  }));
  if (q && !found.length) list.replaceChildren(Object.assign(document.createElement("li"), {className: "none", textContent: me.dataset.none}));
  picked = 0;
}
const move = (by) => {
  const links = [...list.querySelectorAll("a")];
  if (!links.length) return;
  links[picked]?.classList.remove("on");
  picked = (picked + by + links.length) % links.length;
  links[picked].classList.add("on");
  links[picked].scrollIntoView({block: "nearest"});
};

async function open() {
  if (!dialog.open) dialog.showModal();
  input.select();
  await load();
  index = await index;
  show();
}
input.addEventListener("input", async () => {
  index = await load();
  show();
});
input.addEventListener("keydown", (e) => {
  if (e.key === "ArrowDown" || e.key === "ArrowUp") {
    e.preventDefault();
    move(e.key === "ArrowDown" ? 1 : -1);
  } else if (e.key === "Enter") {
    const a = list.querySelectorAll("a")[picked];
    if (a) {
      e.preventDefault();
      location.href = a.href;
      dialog.close();
    }
  }
});
// A click outside the box closes it.
dialog.addEventListener("click", (e) => e.target === dialog && dialog.close());
const btn = document.querySelector(".searchbtn");
btn?.addEventListener("click", open);
if (btn && !/Mac|iP(hone|ad)/.test(navigator.platform)) btn.querySelector("kbd").textContent = "Ctrl K";
addEventListener("keydown", (e) => {
  const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName || "");
  if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) {
    e.preventDefault();
    open();
  }
});
