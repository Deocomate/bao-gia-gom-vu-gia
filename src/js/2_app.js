/* ===================== Sản phẩm & tính tiền ===================== */
function pLabel(p) { return [p.name, p.size].filter(Boolean).join(" "); }
function lineTitle(l) { return [l.name, l.size].filter(Boolean).join(" "); }
function lineSub(l) { return [l.glaze, l.pattern && !norm(l.name).includes(norm(l.pattern)) ? "Họa tiết " + l.pattern.toLowerCase() : ""].filter(Boolean).join(" · "); }
function allGroups() {
  const set = new Set([...(S.meta?.groups || []), ...DEFAULT_GROUPS]);
  for (const p of S.products.values()) if (p.group) set.add(p.group);
  return [...set];
}
function distinct(field, defaults = []) {
  const set = new Set(defaults);
  for (const p of S.products.values()) if (p[field]) set.add(p[field]);
  return [...set];
}
function sortProducts(list) { return list.sort((a, b) => (a.ord ?? 1e9) - (b.ord ?? 1e9) || a.code.localeCompare(b.code)); }

/* Mã tự tạo: nhóm + chữ đầu tên + quy cách + dòng men, ổn định với cùng dữ liệu */
function initials(s) {
  return noDia(s).toUpperCase().replace(/[Ø⌀∅]/g, "D").split(/[^A-Z0-9]+/).filter(Boolean).map(w => /^\d/.test(w) ? w : w[0]).join("");
}
function sizeTok(s) { return noDia(s).toUpperCase().replace(/[Ø⌀∅]/g, "D").replace(/\(.*?\)/g, "").replace(/[^A-Z0-9]/g, ""); }
function makeCode(v, taken) {
  const parts = [initials(v.group) || "SP", initials(v.name) || "X"];
  const st = sizeTok(v.size); if (st) parts.push(st);
  const gt = initials(v.glaze); if (gt) parts.push(gt);
  let base = parts.join("-"), code = base, i = 2;
  while (taken.has(code)) code = base + "-" + (i++);
  taken.add(code);
  return code;
}
const variantKey = v => [norm(v.name), norm(v.size), norm(v.glaze)].join("|");

function calc(d) {
  let subtotal = 0, missing = 0, qtyBad = 0, count = 0;
  for (const l of d.items) {
    const q = Number.isInteger(l.qty) && l.qty > 0 ? l.qty : (qtyBad++, 0);
    count += q;
    if (l.price == null) missing++; else subtotal += l.price * q;
  }
  const disc = d.discount || { mode: "none", value: 0 };
  let discount = 0, discErr = "";
  if (disc.mode === "percent") {
    const v = Number(disc.value) || 0;
    if (v < 0 || v > 100) discErr = "Phần trăm giảm phải từ 0 đến 100";
    discount = Math.round(subtotal * Math.min(Math.max(v, 0), 100) / 100);
  } else if (disc.mode === "amount") {
    discount = Math.max(0, Math.round(Number(disc.value) || 0));
    if (discount > subtotal) discErr = "Số tiền giảm vượt tổng tiền vật phẩm";
  }
  discount = Math.min(discount, subtotal);
  const fees = (d.shipping || 0) + (d.install || 0) + (d.otherFee || 0);
  const total = subtotal - discount + fees;
  return { subtotal, discount, discErr, fees, total, missing, qtyBad, count, lines: d.items.length };
}
function priceDiffs(d) {
  const out = [];
  for (const l of d.items) {
    const p = S.products.get(l.code);
    if (!p) continue;
    if ((p.price ?? null) !== (l.price ?? null)) out.push({ line: l, oldP: l.price ?? null, newP: p.price ?? null });
  }
  return out;
}
function newDraft() {
  return {
    id: null, kind: "new", name: "", desc: "", altarSize: "", imageId: null, imageSig: null, items: [],
    discount: { mode: "none", value: 0 }, shipping: 0, install: 0, otherFee: 0, otherFeeLabel: "", note: "", vatNote: "",
    customer: { name: "", phone: "", address: "" }, quoteCode: "", quoteDate: todayISO(), validUntil: "",
    createdAt: null, updatedAt: null, sourceTemplateId: null
  };
}
const contentSig = d => JSON.stringify([d.name, d.desc, d.altarSize, d.imageId, d.items, d.discount, d.shipping, d.install, d.otherFee, d.otherFeeLabel, d.note, d.vatNote, d.customer, d.quoteCode, d.quoteDate, d.validUntil]);
const itemsSig = d => d.items.map(i => i.code + "x" + i.qty).join("|");
function draftDirty() { return S.draft && (S.draft.id ? contentSig(S.draft) !== S.draftBase : (S.draft.items.length > 0 || !!S.draft.imageId || !!S.draft.name)); }
function nextQuoteCode() {
  const d = new Date(), day = String(d.getFullYear()).slice(2) + String(d.getMonth() + 1).padStart(2, "0") + String(d.getDate()).padStart(2, "0");
  const c = S.meta.counters || (S.meta.counters = {});
  let n = (c[day] || 0) + 1, code;
  const used = new Set([...S.records.values()].map(r => r.quoteCode));
  do { code = `BG${day}-${String(n).padStart(3, "0")}`; n++; } while (used.has(code));
  c[day] = n - 1;
  return code;
}

/* ===================== Khởi động ===================== */
async function loadAll() {
  S.products.clear(); S.records.clear();
  S.imgURL.forEach(u => URL.revokeObjectURL(u)); S.imgURL.clear(); S.imgMeta.clear();
  const [kv, prods, recs] = await Promise.all([DB.getAll("kv"), DB.getAll("products"), DB.getAll("records")]);
  const kvm = Object.fromEntries(kv.map(x => [x.k, x.v]));
  S.meta = kvm.meta || { groups: [], counters: {}, priceVersion: 0, createdAt: new Date().toISOString() };
  prods.forEach(p => S.products.set(p.code, p));
  recs.forEach(r => S.records.set(r.id, r));
  S.draft = kvm.draft?.draft || newDraft();
  S.draftBase = kvm.draft?.base || "";
  S.pe = null;
}
async function boot() {
  try { S.framed = window.self !== window.top; } catch { S.framed = true; }
  try { S.ws = localStorage.getItem("gvg_ws") === "demo" ? "demo" : "real"; } catch { S.ws = "real"; }
  await openWorkspace();
  bindGlobal();
  let v = "prices";
  try { v = localStorage.getItem("gvg_view") || (S.products.size ? "builder" : "prices"); } catch { }
  if (!S.products.size && !S.records.size) v = "prices";
  show(v, true);
  getDownloads();
  try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch { }
}
async function openWorkspace() {
  DB.close();
  try {
    await DB.open();
    S.dbOK = true;
    if (S.ws === "demo") await ensureDemoSeed();
    await loadAll();
  } catch (e) {
    S.dbOK = false;
    S.meta = { groups: [], counters: {}, priceVersion: 0 }; S.draft = newDraft();
    toast("Không mở được kho lưu trữ của trình duyệt: " + errMsg(e) + ". Dữ liệu sẽ không được lưu.", "bad", 9000);
  }
  $("#demo-ribbon").hidden = S.ws !== "demo";
  $("#store-chip").classList.toggle("bad", !S.dbOK);
  $("#store-chip-text").textContent = S.dbOK ? (S.ws === "demo" ? "Dữ liệu mẫu – lưu riêng" : "Lưu trên trình duyệt này") : "Không lưu được";
}
async function switchWorkspace(ws) {
  if (!(await leaveGuard())) return;
  S.ws = ws;
  try { localStorage.setItem("gvg_ws", ws); } catch { }
  busy(ws === "demo" ? "Đang mở dữ liệu mẫu…" : "Đang mở dữ liệu thật…");
  await openWorkspace();
  busy();
  S.cardSel.clear();
  show(ws === "demo" ? "builder" : (S.products.size ? S.view : "prices"), true);
  toast(ws === "demo" ? "Đang xem dữ liệu mẫu (lưu riêng)" : "Đã quay về dữ liệu thật");
}

/* ===================== Điều hướng ===================== */
const VIEWS = { prices: () => renderPrices(), builder: () => renderBuilder(), templates: () => renderTemplates(), quotes: () => renderQuotes(), data: () => renderData() };
async function leaveGuard(target) {
  if (S.pe && S.pe.dirty.size && S.view === "prices" && target !== "prices") {
    const r = await choiceBox({
      title: "Bảng giá có thay đổi chưa lưu", html: `<p>Bạn đã sửa <b>${S.pe.dirty.size}</b> dòng trong bảng giá nhưng chưa lưu.</p>`,
      choices: [{ text: "Ở lại", value: "stay" }, { text: "Bỏ thay đổi", value: "discard", cls: "danger" }, { text: "Lưu thay đổi", value: "save", cls: "primary" }]
    });
    if (!r || r === "stay") return false;
    if (r === "discard") S.pe = null;
    if (r === "save" && !(await savePriceEdits())) return false;
  }
  return true;
}
async function show(v, force) {
  if (!VIEWS[v]) v = "prices";
  if (!force && v === S.view) { VIEWS[v](); return; }
  if (!force && !(await leaveGuard(v))) return;
  S.view = v;
  try { localStorage.setItem("gvg_view", v); } catch { }
  $$(".tab").forEach(t => t.setAttribute("aria-selected", String(t.dataset.view === v)));
  Object.keys(VIEWS).forEach(k => $("#view-" + k).hidden = k !== v);
  VIEWS[v]();
  window.scrollTo(0, 0);
}
function bindGlobal() {
  document.addEventListener("click", e => {
    const t = e.target.closest("[data-view]");
    if (t && (t.classList.contains("tab") || t.id === "store-chip" || t.dataset.go)) { e.preventDefault(); show(t.dataset.view); }
  });
  $("#exit-demo").onclick = () => switchWorkspace("real");
  window.addEventListener("beforeunload", e => {
    if ((S.pe && S.pe.dirty.size) || (S.draft && S.draft.id && draftDirty())) { e.preventDefault(); e.returnValue = ""; }
  });
}
