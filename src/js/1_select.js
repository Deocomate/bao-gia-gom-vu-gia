/* ===================== Ô chọn (dropdown) tùy biến =====================
   Mọi <select> và <input list> trong trang tự được thay bằng dropdown có tìm kiếm (không dấu), phím mũi tên, hiệu ứng mở/đóng.
   <select> gốc vẫn nằm trong DOM (ẩn) và giữ giá trị: mã cũ đọc .value / nghe "change" như trước. */
const XS = { cur: null, typed: "", typedAt: 0 };
const XS_CHEV = '<svg class="xs-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';
const XS_CHECK = '<svg class="xs-ck" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const XS_SEARCH = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>';
const xsCharNorm = c => noDia(c).toLowerCase().replace(/[ø⌀∅]/g, "d");
/* Tô đậm phần khớp từ khóa (so khớp không dấu nhưng tô trên chữ gốc) */
function xsMatch(text, q) {
  let n = ""; const map = [];
  for (let i = 0; i < text.length; i++) for (const ch of xsCharNorm(text[i])) { n += ch; map.push(i); }
  const k = q ? n.indexOf(q) : 0;
  if (k < 0) return null;
  if (!q) return esc(text);
  const s = map[k], e = map[k + q.length - 1] + 1;
  return esc(text.slice(0, s)) + "<mark>" + esc(text.slice(s, e)) + "</mark>" + esc(text.slice(e));
}
function xsEmit(el) { el.dispatchEvent(new Event("input", { bubbles: true })); el.dispatchEvent(new Event("change", { bubbles: true })); }

function xsSelect(sel) {
  if (sel._xs || sel.multiple) return;
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = (sel.className + " xs-btn").trim();
  if (sel.getAttribute("style")) btn.setAttribute("style", sel.getAttribute("style"));
  btn.setAttribute("role", "combobox"); btn.setAttribute("aria-haspopup", "listbox"); btn.setAttribute("aria-expanded", "false");
  const lbl = sel.getAttribute("aria-label") || sel.closest("label")?.querySelector("span")?.textContent;
  if (lbl) btn.setAttribute("aria-label", lbl);
  btn.innerHTML = `<span class="xs-val"></span>${XS_CHEV}`;
  sel.classList.add("xs-native"); sel.tabIndex = -1; sel.setAttribute("aria-hidden", "true");
  sel.after(btn);
  // Mọi nhãn cùng nằm một ô lưới (chỉ hiện nhãn đang chọn) để nút rộng bằng lựa chọn dài nhất, như <select> gốc
  const sync = () => {
    $(".xs-val", btn).innerHTML = [...sel.options].map((o, i) => `<span${i === sel.selectedIndex ? ' class="on"' : ""}>${esc(o.text) || "&nbsp;"}</span>`).join("");
    btn.disabled = sel.disabled;
    btn.title = sel.selectedOptions[0]?.text || "";
  };
  sel._xs = { sync, btn };
  sync();
  sel.addEventListener("change", sync);
  sel.addEventListener("focus", () => btn.focus());
  btn.addEventListener("click", () => XS.cur?.owner === sel ? xsClose() : xsOpenSelect(sel));
  btn.addEventListener("keydown", e => {
    if (XS.cur?.owner === sel) return xsKey(e);
    if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) { e.preventDefault(); xsOpenSelect(sel); }
    else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) { e.preventDefault(); xsOpenSelect(sel, e.key); }
  });
}
function xsOpenSelect(sel, typed = "") {
  if (sel.disabled) return;
  const items = [...sel.options].map((o, i) => ({ i, text: o.text, disabled: o.disabled, hidden: o.hidden })).filter(o => !o.hidden);
  const search = items.length > 7;
  xsOpen({
    owner: sel, anchor: sel._xs.btn, items, search, q: search ? typed : "", selected: sel.selectedIndex,
    pick: it => {
      sel._xs.btn.focus();
      if (sel.selectedIndex !== it.i) { sel.selectedIndex = it.i; xsEmit(sel); }
    }
  });
  if (!search && typed) xsTypeahead(typed);
}

function xsCombo(inp) {
  if (inp._xs) return;
  const listId = inp.getAttribute("list");
  inp.removeAttribute("list");
  inp.setAttribute("autocomplete", "off"); inp.setAttribute("role", "combobox"); inp.setAttribute("aria-autocomplete", "list"); inp.setAttribute("aria-expanded", "false");
  inp.classList.add("xs-combo");
  const items = () => { const dl = document.getElementById(listId); return dl ? [...dl.options].map((o, i) => ({ i, text: o.value })).filter(x => x.text) : []; };
  const open = all => {
    const list = items();
    if (!list.length) return;
    const q = all ? "" : inp.value, selected = list.find(x => x.text === inp.value)?.i ?? -1;
    if (XS.cur?.owner === inp) { Object.assign(XS.cur, { items: list, selected }); return xsRender(q); }
    xsOpen({ owner: inp, anchor: inp, items: list, q, combo: true, selected, pick: it => { inp.value = it.text; XS.picking = true; xsEmit(inp); XS.picking = false; } });
  };
  inp._xs = { open };
  inp.addEventListener("input", () => { if (!XS.picking && document.activeElement === inp) open(false); });
  inp.addEventListener("click", () => XS.cur?.owner === inp ? null : open(true));
  inp.addEventListener("blur", () => setTimeout(() => { if (XS.cur?.owner === inp && document.activeElement !== inp) xsClose(); }, 0));
  inp.addEventListener("keydown", e => {
    if (XS.cur?.owner === inp) return xsKey(e);
    if (e.key === "ArrowDown") { e.preventDefault(); open(true); }
  });
}

function xsOpen(cfg) {
  xsClose(true);
  const pop = document.createElement("div");
  pop.className = "xs-pop";
  pop.innerHTML = (cfg.search ? `<label class="xs-search">${XS_SEARCH}<input type="text" placeholder="Tìm…" aria-label="Tìm trong danh sách" autocomplete="off" spellcheck="false"></label>` : "")
    + `<div class="xs-list" role="listbox" id="xs-list"></div>`;
  document.body.appendChild(pop);
  XS.cur = { ...cfg, pop, act: -1, shown: [] };
  cfg.anchor.setAttribute("aria-expanded", "true"); cfg.anchor.setAttribute("aria-controls", "xs-list"); cfg.anchor.classList.add("xs-open");
  const si = $(".xs-search input", pop);
  if (si) {
    si.value = cfg.q || "";
    si.addEventListener("input", () => xsRender(si.value));
    si.addEventListener("keydown", xsKey);
    // Điện thoại: không tự bật bàn phím, chỉ khi bấm vào ô tìm
    if (matchMedia("(pointer:fine)").matches || cfg.q) setTimeout(() => si.focus(), 0);
  }
  pop.addEventListener("mousedown", e => { if (e.target !== si) e.preventDefault(); });
  pop.addEventListener("click", e => { const o = e.target.closest(".xs-opt"); if (o && !o.classList.contains("dis")) xsPick(+o.dataset.k); });
  pop.addEventListener("mousemove", e => { const o = e.target.closest(".xs-opt"); if (o && +o.dataset.k !== XS.cur?.act) xsActive(+o.dataset.k, false); });
  xsRender(cfg.q || "");
  if (!XS.cur) return;
  requestAnimationFrame(() => pop.classList.add("in"));
}
function xsRender(q) {
  const st = XS.cur; if (!st) return;
  const nq = norm(q);
  st.shown = [];
  const html = [];
  st.items.forEach(it => {
    const m = xsMatch(it.text, nq);
    if (m == null) return;
    const k = st.shown.push(it) - 1, sel = it.i === st.selected;
    html.push(`<div class="xs-opt${sel ? " sel" : ""}${it.disabled ? " dis" : ""}" role="option" id="xs-o${k}" data-k="${k}" aria-selected="${sel}"${it.disabled ? ' aria-disabled="true"' : ""}><span>${m || "&nbsp;"}</span>${XS_CHECK}</div>`);
  });
  // Ô gõ tự do (input list): không còn gợi ý khớp hoặc chỉ còn đúng giá trị đang gõ thì đóng
  if (st.combo && (!st.shown.length || (st.shown.length === 1 && st.shown[0].text === q))) return xsClose(true);
  $(".xs-list", st.pop).innerHTML = html.join("") || `<div class="xs-empty">Không tìm thấy “${esc(q)}”</div>`;
  const cur = st.shown.findIndex(it => it.i === st.selected);
  st.act = -1;
  xsActive(cur >= 0 ? cur : nq && !st.combo ? st.shown.findIndex(it => !it.disabled) : -1, true);
  xsPlace();
}
function xsActive(k, scroll) {
  const st = XS.cur; if (!st) return;
  $$(".xs-opt.act", st.pop).forEach(o => o.classList.remove("act"));
  st.act = k;
  const o = k >= 0 ? $(`#xs-o${k}`, st.pop) : null;
  const ctl = $(".xs-search input", st.pop) || st.anchor;
  if (o) { o.classList.add("act"); ctl.setAttribute("aria-activedescendant", o.id); if (scroll) o.scrollIntoView({ block: "nearest" }); }
  else ctl.removeAttribute("aria-activedescendant");
}
function xsMove(d) {
  const st = XS.cur, n = st.shown.length;
  if (!n) return;
  let k = st.act;
  for (let s = 0; s < n; s++) { k = k < 0 ? (d > 0 ? 0 : n - 1) : (k + d + n) % n; if (!st.shown[k].disabled) break; }
  xsActive(k, true);
}
function xsTypeahead(ch) {
  const st = XS.cur, now = Date.now();
  XS.typed = (now - XS.typedAt < 700 ? XS.typed : "") + xsCharNorm(ch); XS.typedAt = now;
  const k = st.shown.findIndex(it => !it.disabled && norm(it.text).startsWith(XS.typed));
  if (k >= 0) xsActive(k, true);
}
function xsKey(e) {
  const st = XS.cur; if (!st) return;
  if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); xsMove(e.key === "ArrowDown" ? 1 : -1); }
  else if ((e.key === "Home" || e.key === "End") && !st.combo && !st.search) { e.preventDefault(); st.act = -1; xsMove(e.key === "Home" ? 1 : -1); }
  else if (e.key === "Enter") { if (st.act >= 0) { e.preventDefault(); e.stopPropagation(); xsPick(st.act); } else if (!st.combo) { e.preventDefault(); xsClose(); } }
  else if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); const a = st.anchor; xsClose(); a.focus(); }
  else if (e.key === "Tab") { const a = st.anchor; if (st.search) { e.preventDefault(); xsClose(); a.focus(); } else xsClose(); }
  else if (e.key === " " && !st.search && !st.combo) { e.preventDefault(); st.act >= 0 ? xsPick(st.act) : xsClose(); }
  else if (!st.search && !st.combo && e.key.length === 1 && !e.ctrlKey && !e.metaKey) { e.preventDefault(); xsTypeahead(e.key); }
}
function xsPick(k) {
  const st = XS.cur, it = st && st.shown[k];
  if (!it || it.disabled) return;
  xsClose();
  st.pick(it);
}
function xsClose(now) {
  const st = XS.cur; if (!st) return;
  XS.cur = null;
  st.anchor.setAttribute("aria-expanded", "false"); st.anchor.removeAttribute("aria-activedescendant"); st.anchor.classList.remove("xs-open");
  st.pop.classList.remove("in");
  if (now) st.pop.remove(); else setTimeout(() => st.pop.remove(), 160);
}
/* Đặt dropdown ngay dưới ô (hoặc phía trên khi phía dưới không đủ chỗ), không tràn khỏi màn hình */
function xsPlace() {
  const st = XS.cur; if (!st) return;
  const r = st.anchor.getBoundingClientRect(), vw = innerWidth, vh = innerHeight, p = st.pop;
  if (!st.anchor.isConnected || r.bottom < 0 || r.top > vh) return xsClose(true);
  p.style.minWidth = Math.min(r.width, vw - 16) + "px";
  p.style.maxWidth = Math.min(Math.max(r.width, 460), vw - 16) + "px";
  const below = vh - r.bottom - 10, above = r.top - 10;
  p.style.maxHeight = "none";
  const natural = Math.min(p.scrollHeight, 340);
  const up = below < natural && above > below;
  p.classList.toggle("up", up);
  p.style.maxHeight = Math.max(120, Math.min(340, up ? above : below)) + "px";
  p.style.top = up ? "auto" : r.bottom + 4 + "px";
  p.style.bottom = up ? vh - r.top + 4 + "px" : "auto";
  p.style.left = Math.max(8, Math.min(r.left, vw - p.offsetWidth - 8)) + "px";
}
function xsEnhance(root) {
  if (root.matches?.("select")) return xsSelect(root);
  if (root.matches?.("input[list]")) return xsCombo(root);
  root.querySelectorAll?.("select,input[list]").forEach(el => el.tagName === "SELECT" ? xsSelect(el) : xsCombo(el));
}
/* Đổi .value / .selectedIndex bằng mã thì nhãn trên nút cũng đổi theo */
["value", "selectedIndex"].forEach(prop => {
  const d = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, prop);
  Object.defineProperty(HTMLSelectElement.prototype, prop, { ...d, set(v) { d.set.call(this, v); this._xs && this._xs.sync(); } });
});
new MutationObserver(ms => {
  if (XS.cur && !XS.cur.anchor.isConnected) xsClose(true);
  for (const m of ms) {
    const sel = m.target.closest?.("select.xs-native");
    if (sel) { sel._xs.sync(); continue; }
    m.addedNodes.forEach(n => n.nodeType === 1 && xsEnhance(n));
  }
}).observe(document.body, { childList: true, subtree: true });
xsEnhance(document.body);
document.addEventListener("mousedown", e => { const st = XS.cur; if (st && !st.pop.contains(e.target) && !st.anchor.contains(e.target)) xsClose(); }, true);
document.addEventListener("scroll", e => { if (XS.cur && !XS.cur.pop.contains(e.target)) xsPlace(); }, true);
window.addEventListener("resize", () => xsClose(true));
