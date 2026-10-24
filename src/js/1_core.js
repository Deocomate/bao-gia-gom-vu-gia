"use strict";
/* ===================== Tiện ích ===================== */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fmt = n => (n == null || n === "" || isNaN(n)) ? "" : (n < 0 ? "-" : "") + Math.abs(Math.round(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
const money = n => fmt(n) + "\u00a0đ";
const uid = p => p + "_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const clone = o => JSON.parse(JSON.stringify(o));
const noDia = s => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D");
const norm = s => noDia(s).toLowerCase().replace(/[ø⌀∅]/g, "d").replace(/\s+/g, " ").trim();
const todayISO = () => { const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
const fmtDate = iso => { if (!iso) return ""; const d = new Date(iso); if (isNaN(d)) { const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})/); return m ? `${m[3]}/${m[2]}/${m[1]}` : iso; } return String(d.getDate()).padStart(2, "0") + "/" + String(d.getMonth() + 1).padStart(2, "0") + "/" + d.getFullYear(); };
const fmtDay = s => { const m = String(s || "").match(/^(\d{4})-(\d{2})-(\d{2})$/); return m ? `${m[3]}/${m[2]}/${m[1]}` : fmtDate(s); };
const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
const ICON = {
  plus: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  up: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 15l6-6 6 6"/></svg>',
  down: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 9l6 6 6-6"/></svg>',
  x: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  swap: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 4L3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7"/></svg>',
  edit: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9l-4-4L4 16v4z"/><path d="M13.5 6.5l4 4"/></svg>',
  img: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 17l-5-5-9 8"/></svg>',
  upload: '<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v3a1 1 0 001 1h14a1 1 0 001-1v-3"/></svg>',
  vase: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3h6M10 3v3c-3 2-5 5-5 9a7 7 0 0014 0c0-4-2-7-5-9V3"/></svg>'
};

/* Giá tiền: trả về {ok, value} — value null nghĩa là “Chưa có giá”. Không bao giờ đổi ô trống thành 0. */
function parsePrice(v) {
  if (v == null) return { ok: true, value: null };
  if (typeof v === "number") {
    if (!isFinite(v) || v < 0) return { ok: false, raw: String(v), reason: "Giá âm hoặc không hợp lệ" };
    if (Math.abs(v - Math.round(v)) > 1e-6) return { ok: false, raw: String(v), reason: "Giá có phần lẻ" };
    if (Math.round(v) === 0) return { ok: false, raw: "0", reason: "Giá bằng 0", zero: true };
    return { ok: true, value: Math.round(v) };
  }
  let s = String(v).trim();
  if (!s) return { ok: true, value: null };
  s = s.replace(/\s+/g, "").replace(/(vnđ|vnd|đồng|đ|₫)$/i, "");
  if (/^-/.test(s)) return { ok: false, raw: String(v), reason: "Giá âm" };
  let n = null;
  if (/^\d+$/.test(s)) n = +s;
  else if (/^\d{1,3}(\.\d{3})+$/.test(s) || /^\d{1,3}(,\d{3})+$/.test(s)) n = +s.replace(/[.,]/g, "");
  else if (/^\d{1,3}(\.\d{3})+,0+$/.test(s)) n = +s.split(",")[0].replace(/\./g, "");
  else if (/^\d{1,3}(,\d{3})+\.0+$/.test(s)) n = +s.split(".")[0].replace(/,/g, "");
  if (n == null || !isFinite(n)) return { ok: false, raw: String(v), reason: "Không đọc được giá" };
  if (n === 0) return { ok: false, raw: String(v), reason: "Giá bằng 0", zero: true };
  return { ok: true, value: n };
}
const parseMoneyInput = s => { const d = String(s ?? "").replace(/[^\d]/g, ""); return d ? +d : 0; };

/* ===================== Trạng thái ===================== */
const DEFAULT_GROUPS = ["Bát hương", "Lọ lộc bình", "Chóe", "Mâm bồng", "Kỷ chén", "Nậm rượu", "Ống hương", "Đèn dầu", "Chân nến", "Bộ trà", "Tam cấp/kệ bát hương", "Phụ kiện khác"];
const DEFAULT_GLAZES = ["Men lam", "Men lam vẽ vàng"];
const DEFAULT_UNITS = ["chiếc", "đôi", "bộ", "cái"];
const S = {
  dbOK: true, products: new Map(), records: new Map(), meta: null,
  draft: null, draftBase: "", view: "prices", imgURL: new Map(), imgMeta: new Map(),
  pe: null, peFilter: { q: "", group: "", glaze: "", size: "", status: "active" },
  cat: { q: "", group: "", glaze: "" }, cardSel: new Map(), catOpen: false, catHidden: false,
  tplQ: "", quoteQ: "", downloads: undefined, framed: false
};

/* ===================== Dữ liệu trên máy chủ =====================
   Giữ cách gọi giống IndexedDB cũ: DB.run gom các thao tác put/delete/clear rồi gửi một lần, máy chủ ghi trong một giao dịch. */
function blobToDataURL(b) { return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = () => rej(r.error); r.readAsDataURL(b); }); }
function dataURLToBlob(u) { const [h, d] = u.split(","); const type = (h.match(/data:([^;]+)/) || [])[1] || "application/octet-stream"; const bin = atob(d); const a = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i); return new Blob([a], { type }); }
const DB = {
  async req(path, body) {
    let r;
    try {
      r = await fetch("/api/" + path, body === undefined ? { cache: "no-store" }
        : { method: "POST", headers: { "Content-Type": "application/json", "X-GVG": "1" }, body: JSON.stringify(body) });
    } catch { throw new Error("Không kết nối được máy chủ – kiểm tra mạng rồi thử lại"); }
    if (r.status === 401 && path !== "login") { location.href = "/login"; throw new Error("Phiên đăng nhập đã hết hạn – hãy đăng nhập lại"); }
    const j = await r.json().catch(() => null);
    if (!r.ok) throw new Error((j && j.error) || `Máy chủ báo lỗi ${r.status}`);
    return j;
  },
  open() { return this.req("me"); },
  async run(stores, mode, fn) {
    const ops = [];
    const t = { objectStore: store => ({ put: obj => ops.push({ op: "put", store, obj }), delete: key => ops.push({ op: "del", store, key }), clear: () => ops.push({ op: "clear", store }) }) };
    const out = fn(t);
    for (const o of ops) if (o.store === "images" && o.op === "put" && o.obj.blob) { const { blob, ...rest } = o.obj; o.obj = { ...rest, data: await blobToDataURL(blob) }; }
    await this.req("tx", { ops });
    return out;
  },
  imgIn(o) { if (!o || !o.data) return o; const { data, ...rest } = o; return { ...rest, blob: dataURLToBlob(data) }; },
  async getAll(store) { const l = await this.req("data/" + store); return store === "images" ? l.map(o => this.imgIn(o)) : l; },
  async get(store, key) { const o = await this.req(`data/${store}/${encodeURIComponent(key)}`); return store === "images" ? this.imgIn(o) : o; },
  put(store, objs) { const list = Array.isArray(objs) ? objs : [objs]; return this.run([store], "readwrite", t => { const os = t.objectStore(store); list.forEach(o => os.put(o)); }); },
  del(store, key) { return this.run([store], "readwrite", t => t.objectStore(store).delete(key)); }
};
const errMsg = e => (e && (e.message || e.name)) || String(e);

async function saveMeta() { await DB.put("kv", { k: "meta", v: S.meta }); }

/* ===================== Ảnh ===================== */
async function imageURL(id) {
  if (!id) return null;
  if (S.imgURL.has(id)) return S.imgURL.get(id);
  try {
    const rec = await DB.get("images", id);
    if (!rec || !rec.blob) return null;
    const u = URL.createObjectURL(rec.blob);
    S.imgURL.set(id, u); S.imgMeta.set(id, { w: rec.w, h: rec.h });
    return u;
  } catch { return null; }
}
function loadImg(src) { return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error("Không đọc được ảnh")); i.src = src; }); }
/* Thu nhỏ ảnh lớn (giữ đúng tỷ lệ) rồi lưu lên máy chủ */
async function storeImageFile(file, maxSide = 2400) {
  if (!file || !/^image\//.test(file.type)) throw new Error("File không phải ảnh");
  const src = URL.createObjectURL(file);
  let img;
  try { img = await loadImg(src); } finally { URL.revokeObjectURL(src); }
  let w = img.naturalWidth, h = img.naturalHeight;
  const k = Math.min(1, maxSide / Math.max(w, h));
  let blob = file, type = file.type;
  if (k < 1 || !/jpe?g|png|webp/.test(file.type)) {
    const cw = Math.round(w * k), ch = Math.round(h * k);
    const c = document.createElement("canvas"); c.width = cw; c.height = ch;
    const keepAlpha = /png|webp|gif/.test(file.type); // giữ nền trong suốt của ảnh PNG
    const g = c.getContext("2d"); if (!keepAlpha) { g.fillStyle = "#fff"; g.fillRect(0, 0, cw, ch); } g.drawImage(img, 0, 0, cw, ch);
    type = keepAlpha ? "image/png" : "image/jpeg";
    blob = await new Promise(r => c.toBlob(r, type, 0.9)); w = cw; h = ch;
    if (!blob) throw new Error("Không xử lý được ảnh");
  }
  const id = uid("img");
  await DB.put("images", { id, blob, type, w, h, createdAt: new Date().toISOString() });
  S.imgURL.set(id, URL.createObjectURL(blob)); S.imgMeta.set(id, { w, h });
  return id;
}
async function imageMeta(id) { if (!S.imgMeta.has(id)) await imageURL(id); return S.imgMeta.get(id); }

/* ===================== Thông báo, hộp thoại ===================== */
function toast(msg, kind = "ok", ms = 3200) {
  const el = document.createElement("div");
  el.className = "toast " + kind; el.setAttribute("role", kind === "bad" ? "alert" : "status");
  el.innerHTML = `<div>${esc(msg)}</div>`;
  $("#toasts").appendChild(el);
  setTimeout(() => el.remove(), kind === "bad" ? Math.max(ms, 6500) : ms);
}
let busyEl = null;
function busy(msg) {
  if (!msg) { busyEl && busyEl.remove(); busyEl = null; return; }
  if (!busyEl) { busyEl = document.createElement("div"); busyEl.className = "busy"; document.body.appendChild(busyEl); }
  busyEl.innerHTML = `<div><span class="spin"></span><span>${esc(msg)}</span></div>`;
}
/* modal({title, body(html|node), foot(html), size, onMount(el, close)}) → close() */
function modal({ title, body, foot = "", size = "", onMount, onClose }) {
  const back = document.createElement("div");
  back.className = "modal-back";
  back.innerHTML = `<div class="modal ${size}" role="dialog" aria-modal="true" aria-label="${esc(title)}">
    <div class="modal-h"><h2>${esc(title)}</h2><button class="ibtn" data-close aria-label="Đóng">${ICON.x}</button></div>
    <div class="modal-b"></div>${foot ? `<div class="modal-f">${foot}</div>` : ""}</div>`;
  const b = $(".modal-b", back);
  if (typeof body === "string") b.innerHTML = body; else if (body) b.appendChild(body);
  $("#modal-root").appendChild(back);
  const close = () => { back.remove(); document.removeEventListener("keydown", onKey); onClose && onClose(); };
  const onKey = e => { if (e.key === "Escape" && back === $("#modal-root").lastElementChild) close(); };
  document.addEventListener("keydown", onKey);
  back.addEventListener("click", e => { if (e.target.closest("[data-close]")) close(); });
  onMount && onMount(back, close);
  const f = $("input,select,textarea,button.primary", $(".modal-b", back)) || $(".btn.primary", back);
  setTimeout(() => f && f.focus(), 30);
  return close;
}
function confirmBox({ title, html, okText = "Đồng ý", danger = false, cancelText = "Hủy" }) {
  return new Promise(res => {
    let done = false;
    modal({
      title, body: html, onClose: () => { if (!done) res(false); },
      foot: `<button class="btn" data-close>${esc(cancelText)}</button><button class="btn ${danger ? "danger" : "primary"}" data-ok>${esc(okText)}</button>`,
      onMount: (el, close) => $("[data-ok]", el).onclick = () => { done = true; close(); res(true); }
    });
  });
}
function choiceBox({ title, html, choices }) {
  return new Promise(res => {
    let done = false;
    modal({
      title, body: html, onClose: () => { if (!done) res(null); },
      foot: choices.map((c, i) => `<button class="btn ${c.cls || ""}" data-i="${i}">${esc(c.text)}</button>`).join(""),
      onMount: (el, close) => $$("[data-i]", el).forEach(b => b.onclick = () => { done = true; close(); res(choices[+b.dataset.i].value); })
    });
  });
}

/* ===================== Tải file về máy ===================== */
async function getDownloads() {
  if (S.downloads !== undefined) return S.downloads;
  if (window.claude && typeof window.claude.use === "function") {
    try { S.downloads = await window.claude.use("downloads"); } catch { S.downloads = null; }
  } else S.downloads = null;
  return S.downloads;
}
async function saveFile(filename, blob, previews) {
  const dl = await getDownloads();
  let reason = "";
  if (dl) {
    try { await dl.save({ filename, data: blob }); toast("Đã tải về: " + filename); return true; }
    catch (e) {
      if (e && e.code === "declined") { toast("Bạn đã hủy tải file", "ok"); return false; }
      if (e && e.code === "rate_limited") { toast("Đang có một hộp thoại tải file mở – hãy thử lại sau giây lát", "bad"); return false; }
      reason = (e && (e.code || e.message)) || "";
    }
  }
  // Trong khung Claude mà không được phép tải: hiện file để lưu tay thay vì báo “đã tải” sai
  if (S.framed) { showSaveFallback(filename, blob, previews, reason); return false; }
  try {
    const u = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = u; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(u), 4000);
    toast("Đã tải về: " + filename); return true;
  } catch (e) { toast("Trình duyệt chặn tải file: " + errMsg(e), "bad"); return false; }
}
function showSaveFallback(filename, blob, previews, reason) {
  const imgs = previews && previews.length ? previews : (/^image\//.test(blob.type) ? [URL.createObjectURL(blob)] : []);
  const isPdf = /\.pdf$/i.test(filename);
  modal({ title: "Lưu file bằng tay", size: "mid",
    body: `<div class="banner warn"><span class="grow">Trang đang mở không được phép tải file trực tiếp. Claude chỉ cho tải từ ứng dụng khi bạn mở nó trong claude.ai bằng chính tài khoản sở hữu (không qua đường link chia sẻ). Bản HTML chạy trên máy thì tải bình thường.</span></div>
      ${imgs.length ? `<p><b>Cách lưu ngay:</b> bấm chuột phải vào ảnh → <b>Lưu hình ảnh thành…</b> (điện thoại: chạm và giữ ảnh → <b>Lưu ảnh</b>).${isPdf ? " Mỗi ảnh dưới đây là một trang A4 của báo giá." : ""}</p>
        <div style="display:flex;flex-direction:column;gap:12px">${imgs.map((u, i) => `<img src="${u}" alt="${esc(filename)}${imgs.length > 1 ? " – trang " + (i + 1) : ""}" style="width:100%;height:auto;border:1px solid var(--line);border-radius:6px;background:#fff">`).join("")}</div>`
      : `<p>File <b>${esc(filename)}</b> không hiển thị được dạng ảnh. Hãy mở ứng dụng từ cuộc trò chuyện trong claude.ai khi đã đăng nhập, hoặc dùng bản HTML tải về máy để lưu file này.</p>`}
      ${reason ? `<p class="muted" style="font-size:12px;margin-top:10px">Mã lỗi: ${esc(reason)}</p>` : ""}`,
    foot: `<button class="btn primary" data-close>Đóng</button>` });
}
function needLib(name) {
  const ok = name === "xlsx" ? !!window.XLSX : name === "pdf" ? !!(window.jspdf && window.html2canvas) : !!window.html2canvas;
  if (!ok) toast("Chưa tải được thư viện cần thiết (cần kết nối Internet). Hãy tải lại trang rồi thử lại.", "bad");
  return ok;
}
