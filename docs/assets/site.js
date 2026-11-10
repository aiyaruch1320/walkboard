// The docs site's own script (scripts/site.mjs adds it to every page). No dependencies, nothing sent anywhere.
// - Going to another page of the same language swaps the page in place: the menu, header and scroll of the menu
//   stay, the content fades across (View Transitions when the browser has them), and a page is fetched while the
//   pointer is still on its link. Anything else (the other language, a new tab, a failed fetch) is a normal load.
// - "On this page": the sections of the page, the one being read marked as you scroll.
// - Search (⌘K, Ctrl+K or /) looks through this language's pages: an index of this site, read when search opens.
// Motion is short (about 0.3 s), never waits on you, and is left out when the system asks for reduced motion.
const me = document.currentScript;
// The site's root folder ("" on a top-level page means this folder, not this page).
const root = new URL(me.dataset.base || "./", location.href);
const indexUrl = new URL(me.dataset.index, location.href);
const still = matchMedia("(prefers-reduced-motion: reduce)");
const thai = (u) => new URL(u, location.href).pathname.startsWith(new URL("th/", root).pathname);

// ---------- The menu keeps its place; the page you are on stays in sight.
const side = () => document.querySelector(".side");
function showCurrent() {
  const s = side(), on = s?.querySelector("a.on");
  if (on && (on.offsetTop < s.scrollTop || on.offsetTop + on.offsetHeight > s.scrollTop + s.clientHeight)) s.scrollTop = on.offsetTop - s.clientHeight / 2;
}
try {
  const y = sessionStorage.getItem("wb-side");
  if (y !== null && side()) side().scrollTop = Number(y);
} catch {}
showCurrent();
addEventListener("pagehide", () => {
  try {
    sessionStorage.setItem("wb-side", String(side()?.scrollTop || 0));
  } catch {}
});

// ---------- On this page.
let spy = null;
function outline() {
  const box = document.querySelector(".toc"), list = box?.querySelector("nav");
  if (!list) return;
  spy?.disconnect();
  const heads = [...document.querySelectorAll(".doc h2[id], .doc h3[id]")];
  box.hidden = heads.length < 2;
  list.replaceChildren(...heads.map((h) => {
    const a = document.createElement("a");
    a.href = "#" + encodeURIComponent(h.id);
    a.textContent = h.textContent;
    if (h.tagName === "H3") a.className = "sub";
    return a;
  }));
  // The section being read: the last heading that has passed the top part of the window.
  const links = [...list.children];
  const mark = () => {
    const above = heads.filter((h) => h.getBoundingClientRect().top < innerHeight * 0.3);
    const at = above.length ? heads.indexOf(above.at(-1)) : 0;
    links.forEach((a, i) => a.classList.toggle("on", i === at));
  };
  spy = new IntersectionObserver(mark, {rootMargin: "0px 0px -60% 0px"});
  heads.forEach((h) => spy.observe(h));
  mark();
}
outline();

// ---------- In-place navigation.
const cache = new Map();
const fetchPage = (url) => {
  const key = url.split("#")[0];
  if (!cache.has(key)) cache.set(key, fetch(key).then((r) => (r.ok ? r.text() : Promise.reject(new Error(r.status)))));
  return cache.get(key);
};
// A link this script takes over: a page of this site, in the same language, in this tab.
function ours(a, e) {
  if (!a || a.target || a.hasAttribute("download") || (e && (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button))) return false;
  const u = new URL(a.href, location.href);
  if (u.origin !== location.origin || !u.pathname.startsWith(root.pathname) || u.pathname.includes("/examples/")) return false;
  if (!/\.html$|\/$/.test(u.pathname) || thai(u) !== thai(location.href)) return false;
  return !(u.pathname === location.pathname && u.hash);
}

async function go(url, {push = true} = {}) {
  let html;
  try {
    html = await fetchPage(url);
  } catch {
    location.href = url;
    return;
  }
  const next = new DOMParser().parseFromString(html, "text/html");
  const swap = () => {
    // The address first: relative links in the new content resolve against it.
    if (push) history.pushState({}, "", url);
    const keep = side()?.scrollTop || 0;
    document.title = next.title;
    for (const sel of [".top", ".wrap"]) document.querySelector(sel).replaceWith(document.adoptNode(next.querySelector(sel)));
    if (side()) side().scrollTop = keep;
    showCurrent();
    outline();
    const hash = new URL(url, location.href).hash;
    const target = hash && document.getElementById(decodeURIComponent(hash.slice(1)));
    if (target) target.scrollIntoView();
    else scrollTo(0, 0);
    // The reader's place moves to the new page, for a screen reader too.
    const h1 = document.querySelector(".doc h1");
    if (h1) {
      h1.tabIndex = -1;
      h1.focus({preventScroll: true});
    }
  };
  // A hidden tab draws no frames, so a transition there would wait: swap at once.
  if (document.startViewTransition && !still.matches && document.visibilityState === "visible") document.startViewTransition(swap);
  else {
    swap();
    if (!still.matches) document.querySelector(".doc")?.classList.add("enter");
  }
}

document.addEventListener("click", (e) => {
  const a = e.target.closest?.("a[href]");
  if (!ours(a, e)) return;
  e.preventDefault();
  go(a.href);
});
// Fetched while the pointer rests on the link, so the click shows the page at once.
document.addEventListener("pointerover", (e) => {
  const a = e.target.closest?.("a[href]");
  if (ours(a)) fetchPage(a.href).catch(() => {});
});
addEventListener("popstate", () => go(location.href, {push: false}));

// ---------- Search.
let index = null;
const load = () => (index ||= fetch(indexUrl).then((r) => r.json()).catch(() => []));
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
  const words = norm(q).split(/\s+/).filter(Boolean).map(matcher);
  if (!words.length) return [];
  const hits = [];
  for (const e of index) {
    const t = norm(e.t), h = norm(e.h), x = norm(e.x);
    let score = 0;
    for (const has of words) {
      // In the text, a word that comes up again and again says more, up to a point.
      const s = (has(t) ? 10 : 0) + (has(h) ? 6 : 0) + Math.min(4, has(x));
      if (!s) {
        score = 0;
        break;
      }
      score += s;
    }
    if (score) hits.push({e, score});
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
    a.href = new URL(e.u, root).href;
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
// A result opens like any other link: in place, then the search closes.
function openResult(a) {
  dialog.close();
  if (new URL(a.href).pathname === location.pathname) {
    const id = decodeURIComponent(new URL(a.href).hash.slice(1));
    history.pushState({}, "", a.href);
    document.getElementById(id)?.scrollIntoView({behavior: still.matches ? "auto" : "smooth"});
  } else if (ours(a)) go(a.href);
  else location.href = a.href;
}

async function openSearch() {
  if (!dialog.open) dialog.showModal();
  input.select();
  index = await load();
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
      openResult(a);
    }
  }
});
list.addEventListener("click", (e) => {
  const a = e.target.closest("a");
  if (!a || e.metaKey || e.ctrlKey) return;
  e.preventDefault();
  e.stopPropagation();
  openResult(a);
});
// A click outside the box closes it.
dialog.addEventListener("click", (e) => e.target === dialog && dialog.close());
// The header is swapped with each page: one listener on the document serves every search button.
const mac = /Mac|iP(hone|ad)/.test(navigator.platform);
const keyLabel = () => !mac && document.querySelectorAll(".searchbtn kbd").forEach((k) => (k.textContent = "Ctrl K"));
keyLabel();
new MutationObserver(keyLabel).observe(document.body, {childList: true});
document.addEventListener("click", (e) => e.target.closest?.(".searchbtn") && openSearch());
addEventListener("keydown", (e) => {
  const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName || "");
  if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) {
    e.preventDefault();
    openSearch();
  }
});
