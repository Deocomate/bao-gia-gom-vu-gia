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
/* Đơn giá của dòng luôn theo bảng giá hiện tại, trừ dòng đã sửa tay (manual) cho riêng bộ đó */
function syncLinePrices(d) {
  let n = 0;
  for (const l of d.items || []) {
    const p = S.products.get(l.code);
    if (!p || l.manual) continue;
    const v = p.price ?? null;
    if ((l.price ?? null) !== v) { l.price = v; n++; }
  }
  return n;
}
/* Áp giá bảng giá vào bộ đang soạn và mọi mẫu/báo giá đã lưu, ghi lại những bản ghi có đổi */
async function syncAllPrices() {
  const clean = S.draft && !draftDirty();
  if (S.draft && syncLinePrices(S.draft)) { if (clean && S.draft.id) S.draftBase = contentSig(S.draft); persistDraft(); }
  const changed = [...S.records.values()].filter(r => syncLinePrices(r));
  if (!changed.length || !S.dbOK) return;
  try { await DB.run(["records"], "readwrite", t => changed.forEach(r => t.objectStore("records").put(r))); }
  catch (e) { toast("Chưa ghi được giá mới vào mẫu/báo giá: " + errMsg(e), "bad"); }
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
  S.pe = null;  await syncAllPrices();
}
async function boot() {
  try { S.framed = window.self !== window.top; } catch { S.framed = true; }
  try { localStorage.removeItem("gvg_ws"); } catch { }
  try {
    const me = await DB.open();
    $("#user-name").textContent = me.user;
    await loadAll();
  } catch (e) {
    S.dbOK = false;
    S.meta = { groups: [], counters: {}, priceVersion: 0 }; S.draft = newDraft();
    toast("Không tải được dữ liệu từ máy chủ: " + errMsg(e) + ". Hãy tải lại trang.", "bad", 9000);
  }
  renderBnav();
  bindGlobal();
  updateInstallUI();
  let v = "builder";
  try { v = localStorage.getItem("gvg_view") || v; } catch { }
  if (!S.products.size) v = "prices";
  show(v, true);
  updateStoreChip();
  getDownloads();
}
async function logout() {
  if (!(await leaveGuard("logout"))) return;
  try { await DB.req("logout", {}); } catch { }
  location.replace("/login");
}
/* Nhãn góc phải: nơi lưu + nhắc sao lưu khi đã lâu chưa sao lưu */
function backupAge() {
  const t = S.meta?.lastBackupAt;
  return t ? Math.floor((Date.now() - new Date(t).getTime()) / 864e5) : null;
}
function backupDue() { const a = backupAge(); return (S.products.size || S.records.size) && (a == null || a >= 7); }
function updateStoreChip() {
  const chip = $("#store-chip"), a = backupAge();
  chip.classList.toggle("bad", !S.dbOK);
  chip.classList.toggle("warn", S.dbOK && !!backupDue());
  $("#store-chip-text").textContent = !S.dbOK ? "Mất kết nối máy chủ" : a == null ? "Chưa sao lưu" : a === 0 ? "Đã sao lưu hôm nay" : `Sao lưu ${a} ngày trước`;
}

/* ===================== Điều hướng ===================== */
const VIEWS = { builder: () => renderBuilder(), quotes: () => renderQuotes(), templates: () => renderTemplates(), prices: () => renderPrices(), data: () => renderData() };
const VIEW_TITLES = { builder: "Tạo bộ ban thờ", quotes: "Báo giá khách hàng", templates: "Mẫu ban thờ", prices: "Bảng giá", data: "Sao lưu & dữ liệu" };
/* Thanh mục dưới đáy màn hình điện thoại (CSS ẩn trên máy tính) */
function renderBnav() {
  const it = (v, icon, text) => `<button type="button" class="bn" data-view="${v}" aria-selected="false">${icon}<span>${text}</span></button>`;
  $("#bnav").innerHTML = it("builder", ICON.set, "Tạo bộ") + it("quotes", ICON.doc, "Báo giá") + it("templates", ICON.grid, "Mẫu") + it("prices", ICON.tag, "Bảng giá")
    + `<button type="button" class="bn" id="bnav-more" aria-selected="false">${ICON.more}<span>Thêm</span></button>`;
}
function openMoreSheet() {
  actionSheet("Thêm", [
    { text: "Sao lưu & dữ liệu", sub: $("#store-chip-text").textContent, icon: ICON.save, run: () => show("data") },
    canInstall() && { text: "Cài ứng dụng lên màn hình chính", sub: "Mở nhanh như một app, toàn màn hình", icon: ICON.addsq, run: installApp },
    { text: "Đăng xuất", sub: $("#user-name").textContent ? "Tài khoản " + $("#user-name").textContent : "", icon: ICON.out, cls: "danger", run: logout }
  ]);
}

/* ===================== Cài ứng dụng lên màn hình chính ===================== */
let installEvt = null;
const isStandalone = () => matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
/* Chrome/Edge/Android báo được cài (beforeinstallprompt); iPhone/iPad và máy cảm ứng khác thì hiện hướng dẫn */
function canInstall() { return !S.framed && !isStandalone() && (!!installEvt || isIOS() || matchMedia("(pointer:coarse)").matches); }
function updateInstallUI() {
  const b = $("#install-btn"); if (!b) return;
  b.hidden = !canInstall();
  b.innerHTML = `${ICON.addsq} Cài ứng dụng`;
  if (S.view === "builder") renderBanners();
}
window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); installEvt = e; updateInstallUI(); });
window.addEventListener("appinstalled", () => { installEvt = null; updateInstallUI(); toast("Đã cài ứng dụng Gốm Vũ Gia lên màn hình chính"); });
async function installApp() {
  if (installEvt) {
    const e = installEvt; installEvt = null;
    try { await e.prompt(); await e.userChoice; } catch { }
    updateInstallUI(); return;
  }
  const ua = navigator.userAgent, inApp = /FBAN|FBAV|Instagram|Zalo|Line\/|; wv\)/i.test(ua);
  const step = (n, html) => `<li><b>${n}</b><span>${html}</span></li>`;
  let body;
  if (isIOS() && inApp) body = `<p>Bạn đang mở trang trong ứng dụng khác (Zalo, Facebook…). Hãy mở bằng <b>Safari</b> trước: bấm nút <b>⋯</b> hoặc biểu tượng la bàn → <b>Mở bằng Safari</b>, rồi bấm lại <b>Cài ứng dụng</b>.</p>`;
  else if (isIOS()) body = `<ol class="isteps">${step(1, `Bấm nút <b>Chia sẻ</b> <span class="ikey">${ICON.share}</span> ở thanh dưới của Safari (iPad: góc trên bên phải).`)}${step(2, `Kéo xuống, chọn <b>Thêm vào MH chính</b> <span class="ikey">${ICON.addsq}</span>.`)}${step(3, `Bấm <b>Thêm</b>. Biểu tượng <b>Gốm Vũ Gia</b> xuất hiện trên màn hình chính.`)}</ol>
    <p class="muted" style="margin:12px 0 0">Mở ứng dụng từ biểu tượng mới và <b>đăng nhập lại một lần</b> (ứng dụng trên màn hình chính không dùng chung đăng nhập với Safari). Phiên đăng nhập giữ 30 ngày.</p>`;
  else body = `<ol class="isteps">${step(1, `Mở menu của trình duyệt (nút <b>⋮</b> hoặc <b>⋯</b>).`)}${step(2, `Chọn <b>Cài đặt ứng dụng</b> hoặc <b>Thêm vào màn hình chính</b>.`)}${step(3, `Xác nhận. Biểu tượng <b>Gốm Vũ Gia</b> xuất hiện trên màn hình chính.`)}</ol>`;
  modal({ title: "Cài ứng dụng lên màn hình chính", size: "sheet", body: `<div class="iapp"><img src="icon-180.png" alt="" width="56" height="56"><div><b>Gốm Vũ Gia</b><div class="muted">Báo giá đồ thờ · mở toàn màn hình như app</div></div></div>${body}`, foot: `<button class="btn primary" data-close>Đã hiểu</button>` });
}
/* Lời nhắc cài app ở trang Tạo bộ (chỉ điện thoại, tắt được) */
function installHintOn() {
  if (!isPhone() || !canInstall()) return false;
  try { return !localStorage.getItem("gvg_install_hint_off"); } catch { return false; }
}
function hideInstallHint() { try { localStorage.setItem("gvg_install_hint_off", "1"); } catch { } renderBanners(); }
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
  if (!VIEWS[v]) v = "builder";
  if (!force && v === S.view) { VIEWS[v](); return; }
  if (!force && !(await leaveGuard(v))) return;
  S.view = v;
  try { localStorage.setItem("gvg_view", v); } catch { }
  $$(".tab,.bn[data-view]").forEach(t => t.setAttribute("aria-selected", String(t.dataset.view === v)));
  $("#bnav-more")?.setAttribute("aria-selected", String(v === "data"));
  $("#appbar-title").textContent = VIEW_TITLES[v];
  Object.keys(VIEWS).forEach(k => $("#view-" + k).hidden = k !== v);
  VIEWS[v]();
  window.scrollTo(0, 0);
}
function bindGlobal() {
  document.addEventListener("click", e => {
    const t = e.target.closest("[data-view]");
    if (t && (t.classList.contains("tab") || t.classList.contains("bn") || t.id === "store-chip" || t.dataset.go)) { e.preventDefault(); show(t.dataset.view); }
    if (e.target.closest("#logout")) logout();
    if (e.target.closest("#bnav-more")) openMoreSheet();
    if (e.target.closest("#install-btn")) installApp();
    $$("details.menu[open]").forEach(m => { if (!m.contains(e.target)) m.open = false; });
  });
  window.addEventListener("beforeunload", e => {
    if ((S.pe && S.pe.dirty.size) || (S.draft && S.draft.id && draftDirty())) { e.preventDefault(); e.returnValue = ""; }
  });
}
