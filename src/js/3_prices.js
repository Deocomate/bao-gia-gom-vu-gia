/* ===================== QUẢN LÝ BẢNG GIÁ ===================== */
const PE_FIELDS = ["group", "name", "pattern", "size", "glaze", "unit", "price", "note"];
function peInit() {
  if (S.pe) return;
  const rows = new Map(), order = [];
  sortProducts([...S.products.values()]).forEach(p => { const r = clone(p); r._key = p.code; rows.set(p.code, r); order.push(p.code); });
  S.pe = { rows, order, dirty: new Set(), news: new Set(), err: new Map(), limit: 300 };
}
function peFiltered() {
  const f = S.peFilter, q = norm(f.q);
  const out = [];
  for (const k of S.pe.order) {
    const r = S.pe.rows.get(k);
    if (S.pe.news.has(k)) { out.push(r); continue; }
    if (f.status === "active" && r.active === false) continue;
    if (f.status === "inactive" && r.active !== false) continue;
    if (f.group && r.group !== f.group) continue;
    if (f.glaze && r.glaze !== f.glaze) continue;
    if (f.size && r.size !== f.size) continue;
    if (q && !norm([r.code, r.name, r.size, r.group, r.pattern, r.glaze].join(" ")).includes(q)) continue;
    out.push(r);
  }
  return out;
}
function renderPrices() {
  const el = $("#view-prices");
  peInit();
  const hasAny = S.pe.order.length > 0;
  const demoNote = S.ws === "demo" ? `<span class="chip gold">Dữ liệu mẫu</span>` : "";
  el.innerHTML = `
  <div class="view-head">
    <div><h1>Quản lý bảng giá ${demoNote}</h1>
    <p>Bảng giá gốc dùng khi chọn sản phẩm mới. Sửa trực tiếp trong ô rồi bấm “Lưu thay đổi”. Báo giá đã lưu không tự đổi theo bảng giá.</p></div>
    <div class="btn-row">
      <button class="btn primary" data-act="import">${ICON.upload.replace('width="30" height="30"', 'width="16" height="16"')} Nhập Excel</button>
      <button class="btn" data-act="add">${ICON.plus} Thêm sản phẩm</button>
      <button class="btn" data-act="export" ${hasAny ? "" : "disabled"}>Xuất Excel</button>
      <button class="btn ghost" data-act="template">Tải file Excel mẫu</button>
    </div>
  </div>
  <div id="pe-body"></div>`;
  el.onclick = onPricesClick;
  renderPeBody();
}
function renderPeBody() {
  const box = $("#pe-body");
  if (!box) return;
  if (!S.pe.order.length) {
    box.innerHTML = `
    <div class="empty-state">
      <div class="panel lead">
        <h2>Bắt đầu bằng bảng giá Excel</h2>
        <p class="muted">Bảng giá thật hiện đang trống. Ứng dụng không tự điền giá nào.</p>
        <ol class="steps">
          <li><span>Tải <b>file Excel mẫu</b> – đã chép sẵn từ bảng giá PDF “Bộ đồ thờ Phúc Liên Hoa” (2 sheet: theo biến thể và 2 cột giá). Kiểm tra lại giá trong file.</span></li>
          <li><span>Bấm <b>Nhập Excel</b>, chọn sheet, dòng tiêu đề và cột giá rồi xem trước.</span></li>
          <li><span>Xác nhận nhập – sau đó sang <b>Tạo bộ ban thờ</b> để chọn sản phẩm.</span></li>
        </ol>
        <div class="btn-row"><button class="btn primary" data-act="import">Nhập Excel</button><button class="btn" data-act="template">Tải file Excel mẫu</button></div>
      </div>
      <div class="panel">
        <h3 style="margin:0 0 6px">Muốn xem thử trước?</h3>
        <p class="muted" style="margin:0 0 12px">Mở bộ dữ liệu mẫu gồm bảng giá chép từ PDF, một bộ ban thờ mẫu có ảnh và một báo giá mẫu. Dữ liệu mẫu lưu ở kho riêng, có dải báo màu vàng và không trộn vào bảng giá thật.</p>
        <button class="btn" data-act="demo">Xem thử với dữ liệu mẫu</button>
        <p class="muted" style="margin:14px 0 0;font-size:12.5px">Hoặc bấm <b>Thêm sản phẩm</b> để nhập tay từng dòng.</p>
      </div>
    </div>`;
    return;
  }
  const f = S.peFilter;
  const rowsAll = [...S.pe.rows.values()];
  const opt = (arr, cur) => arr.map(v => `<option ${v === cur ? "selected" : ""}>${esc(v)}</option>`).join("");
  const groups = [...new Set(rowsAll.map(r => r.group).filter(Boolean))];
  const glazes = [...new Set(rowsAll.map(r => r.glaze).filter(Boolean))];
  const sizes = [...new Set(rowsAll.filter(r => !f.group || r.group === f.group).map(r => r.size).filter(Boolean))].sort((a, b) => a.localeCompare(b, "vi", { numeric: true }));
  const list = peFiltered();
  const shown = list.slice(0, S.pe.limit);
  const nActive = rowsAll.filter(r => r.active !== false).length, nNoPrice = rowsAll.filter(r => r.active !== false && r.price == null).length;
  box.innerHTML = `
  <div class="toolbar">
    <input class="inp search" id="pe-q" type="search" placeholder="Tìm theo tên hoặc mã…" value="${esc(f.q)}" aria-label="Tìm kiếm">
    <select class="inp" id="pe-group" aria-label="Lọc nhóm"><option value="">Tất cả nhóm</option>${opt(groups, f.group)}</select>
    <select class="inp" id="pe-glaze" aria-label="Lọc dòng men"><option value="">Mọi dòng men</option>${opt(glazes, f.glaze)}</select>
    <select class="inp" id="pe-size" aria-label="Lọc kích thước"><option value="">Mọi kích thước</option>${opt(sizes, f.size)}</select>
    <select class="inp" id="pe-status" aria-label="Lọc trạng thái">
      <option value="active" ${f.status === "active" ? "selected" : ""}>Đang dùng</option>
      <option value="inactive" ${f.status === "inactive" ? "selected" : ""}>Ngừng dùng</option>
      <option value="all" ${f.status === "all" ? "selected" : ""}>Tất cả trạng thái</option></select>
  </div>
  <div class="sumrow"><span class="chip lam">${nActive} biến thể đang dùng</span>${nNoPrice ? `<span class="chip bad">${nNoPrice} chưa có giá</span>` : ""}<span class="chip off">Đang hiện ${list.length}</span></div>
  <div class="tbl-wrap"><table class="grid" id="pe-table">
    <thead><tr><th style="width:52px">Ảnh</th><th style="width:150px">Mã</th><th style="width:140px">Nhóm</th><th style="min-width:220px">Tên sản phẩm</th><th style="width:90px">Họa tiết</th><th style="width:96px">Quy cách</th><th style="width:160px">Dòng men</th><th style="width:84px">ĐVT</th><th style="width:124px;text-align:right">Đơn giá (đ)</th><th style="width:190px">Ghi chú</th><th style="width:116px">Trạng thái</th></tr></thead>
    <tbody>${shown.map(peRowHTML).join("") || `<tr><td colspan="11" class="empty">Không có sản phẩm khớp bộ lọc.</td></tr>`}</tbody>
  </table></div>
  ${list.length > shown.length ? `<div style="text-align:center;margin-top:10px"><button class="btn" data-act="more">Hiện thêm (${list.length - shown.length} dòng)</button></div>` : ""}
  <datalist id="dl-group">${allGroups().map(g => `<option value="${esc(g)}">`).join("")}</datalist>
  <datalist id="dl-glaze">${distinct("glaze", DEFAULT_GLAZES).map(g => `<option value="${esc(g)}">`).join("")}</datalist>
  <datalist id="dl-unit">${distinct("unit", DEFAULT_UNITS).map(g => `<option value="${esc(g)}">`).join("")}</datalist>
  <datalist id="dl-pattern">${distinct("pattern", ["Sen", "Rồng", "Công đào", "Mây"]).map(g => `<option value="${esc(g)}">`).join("")}</datalist>
  <div id="pe-savebar"></div>`;
  const rerender = debounce(() => { S.pe.limit = 300; renderPeBody(); const q = $("#pe-q"); if (q) { q.focus(); q.setSelectionRange(q.value.length, q.value.length); } }, 250);
  $("#pe-q").oninput = e => { f.q = e.target.value; rerender(); };
  [["pe-group", "group"], ["pe-glaze", "glaze"], ["pe-size", "size"], ["pe-status", "status"]].forEach(([id, k]) => $("#" + id).onchange = e => { f[k] = e.target.value; if (k === "group") f.size = ""; S.pe.limit = 300; renderPeBody(); });
  const tb = $("#pe-table tbody");
  tb.addEventListener("input", onPeInput);
  tb.addEventListener("focusout", e => {
    const i = e.target;
    if (i.dataset.f === "price") { const r = S.pe.rows.get(i.dataset.k); if (r && !S.pe.err.get(r._key)?.price) i.value = fmt(r.price); }
  });
  renderSavebar();
}
function peRowHTML(r) {
  const k = esc(r._key), isNew = S.pe.news.has(r._key), err = S.pe.err.get(r._key) || {};
  const url = r.image ? S.imgURL.get(r.image) : null;
  if (r.image && !url) imageURL(r.image).then(u => { const t = $(`[data-thumb="${CSS.escape(r._key)}"]`); if (t && u) t.innerHTML = `<img src="${u}" alt="">`; });
  const inp = (f, extra = "") => `<input class="cell-inp ${err[f] ? "err" : ""} ${f === "price" ? "price" : ""}" data-k="${k}" data-f="${f}" value="${esc(f === "price" ? (r._praw ?? fmt(r.price)) : r[f])}" ${extra} aria-label="${f}">`;
  return `<tr data-k="${k}" class="${r.active === false ? "inactive" : ""} ${isNew ? "isnew" : S.pe.dirty.has(r._key) ? "changed" : ""}">
    <td><button class="thumb" data-act="img" data-k="${k}" data-thumb="${k}" title="Thêm/đổi ảnh sản phẩm">${url ? `<img src="${url}" alt="">` : ICON.img}</button></td>
    <td>${isNew ? `<input class="cell-inp ${err.code ? "err" : ""}" data-k="${k}" data-f="code" value="${esc(r.code)}" placeholder="Tự tạo nếu trống">` : `<input class="cell-inp num" value="${esc(r.code)}" readonly title="Mã cố định">`}</td>
    <td>${inp("group", 'list="dl-group"')}</td>
    <td>${inp("name", err.name ? 'placeholder="Cần nhập tên"' : "")}</td>
    <td>${inp("pattern", 'list="dl-pattern"')}</td>
    <td>${inp("size")}</td>
    <td>${inp("glaze", 'list="dl-glaze"')}</td>
    <td>${inp("unit", 'list="dl-unit"')}</td>
    <td>${inp("price", 'inputmode="numeric" placeholder="Chưa có giá"')}${err.price ? `<div class="errtxt">${esc(err.price)}</div>` : ""}</td>
    <td>${inp("note")}</td>
    <td>${isNew ? `<button class="btn sm danger" data-act="rm-new" data-k="${k}">Bỏ dòng</button>` :
      `<button class="status-btn" data-act="toggle" data-k="${k}" title="Bấm để đổi trạng thái">${r.active === false ? '<span class="chip off">Ngừng dùng</span>' : '<span class="chip ok">Đang dùng</span>'}</button>`}</td>
  </tr>`;
}
function peValidateRow(r) {
  const e = {};
  if (!String(r.name || "").trim()) e.name = "Cần tên";
  if (!String(r.unit || "").trim()) e.unit = "Cần ĐVT";
  if (r._praw != null) { const p = parsePrice(r._praw); if (!p.ok) e.price = p.zero ? "Giá phải lớn hơn 0 – để trống nếu chưa có giá" : (p.reason || "Giá không hợp lệ"); }
  if (S.pe.news.has(r._key) && r.code) {
    const c = r.code.trim();
    if (S.products.has(c) || [...S.pe.news].some(k => k !== r._key && S.pe.rows.get(k).code.trim() === c)) e.code = "Mã đã tồn tại";
  }
  if (Object.keys(e).length) S.pe.err.set(r._key, e); else S.pe.err.delete(r._key);
  return e;
}
function onPeInput(e) {
  const i = e.target, k = i.dataset.k, f = i.dataset.f;
  if (!k || !f) return;
  const r = S.pe.rows.get(k);
  if (f === "price") {
    const p = parsePrice(i.value);
    if (p.ok) { r.price = p.value; r._praw = null; } else r._praw = i.value;
  } else r[f] = i.value;
  S.pe.dirty.add(k);
  const er = peValidateRow(r);
  $$(`input[data-k="${CSS.escape(k)}"]`).forEach(x => x.classList.toggle("err", !!er[x.dataset.f]));
  const tr = i.closest("tr"); if (tr && !S.pe.news.has(k)) tr.classList.add("changed");
  const pe = tr && $(".errtxt", tr.children[8]);
  if (f === "price") { if (pe) pe.remove(); if (er.price) i.insertAdjacentHTML("afterend", `<div class="errtxt">${esc(er.price)}</div>`); }
  renderSavebar();
}
function renderSavebar() {
  const sb = $("#pe-savebar");
  if (!sb) return;
  const n = S.pe.dirty.size + [...S.pe.news].filter(k => !S.pe.dirty.has(k)).length;
  if (!n) { sb.innerHTML = ""; return; }
  const ne = S.pe.err.size;
  sb.innerHTML = `<div class="savebar"><span class="grow"><b>${n}</b> dòng đã sửa, chưa lưu.${ne ? ` <span class="errtxt">${ne} dòng cần sửa lỗi trước khi lưu.</span>` : ""}</span>
    <button class="btn" data-act="discard">Hủy thay đổi</button><button class="btn primary" data-act="save" ${ne ? "disabled" : ""}>Lưu thay đổi</button></div>`;
}
async function onPricesClick(e) {
  const b = e.target.closest("[data-act]");
  if (!b) return;
  const a = b.dataset.act, k = b.dataset.k;
  if (a === "import") { if (S.pe.dirty.size || S.pe.news.size) { toast("Hãy lưu hoặc hủy các thay đổi đang sửa trước khi nhập file mới", "bad"); return; } openImport(); }
  else if (a === "template") downloadTemplate();
  else if (a === "export") exportPriceExcel();
  else if (a === "demo") switchWorkspace("demo");
  else if (a === "more") { S.pe.limit += 300; renderPeBody(); }
  else if (a === "add") {
    const key = uid("new");
    const g = S.peFilter.group || "";
    S.pe.rows.set(key, { _key: key, code: "", group: g, name: "", pattern: "", size: "", glaze: S.peFilter.glaze || "", unit: "chiếc", price: null, note: "", image: null, active: true });
    S.pe.order.unshift(key); S.pe.news.add(key); S.pe.dirty.add(key);
    peValidateRow(S.pe.rows.get(key));
    renderPeBody();
    setTimeout(() => { const x = $(`input[data-k="${key}"][data-f="name"]`); x && x.focus(); }, 20);
  }
  else if (a === "rm-new") { S.pe.rows.delete(k); S.pe.order = S.pe.order.filter(x => x !== k); S.pe.news.delete(k); S.pe.dirty.delete(k); S.pe.err.delete(k); renderPeBody(); }
  else if (a === "toggle") { const r = S.pe.rows.get(k); r.active = r.active === false; S.pe.dirty.add(k); const tr = b.closest("tr"); tr.outerHTML = peRowHTML(r); renderSavebar(); }
  else if (a === "img") {
    pickFile("image/*", async file => {
      try { const id = await storeImageFile(file, 900); const r = S.pe.rows.get(k); r.image = id; S.pe.dirty.add(k); const tr = $(`tr[data-k="${CSS.escape(k)}"]`); if (tr) tr.outerHTML = peRowHTML(r); renderSavebar(); }
      catch (err) { toast("Không lưu được ảnh: " + errMsg(err), "bad"); }
    });
  }
  else if (a === "discard") { if (await confirmBox({ title: "Hủy thay đổi?", html: "<p>Các chỉnh sửa chưa lưu trong bảng giá sẽ bị bỏ.</p>", okText: "Hủy thay đổi", danger: true, cancelText: "Quay lại" })) { S.pe = null; renderPrices(); toast("Đã hủy các thay đổi"); } }
  else if (a === "save") savePriceEdits();
}
function pickFile(accept, cb) {
  const inp = $("#file-any");
  inp.value = ""; inp.accept = accept;
  inp.onchange = () => { const f = inp.files && inp.files[0]; if (f) cb(f); };
  inp.click();
}
async function savePriceEdits() {
  if (!S.pe) return true;
  const keys = [...new Set([...S.pe.dirty, ...S.pe.news])];
  keys.forEach(k => S.pe.rows.has(k) && peValidateRow(S.pe.rows.get(k)));
  if (S.pe.err.size) { renderPeBody(); toast("Còn " + S.pe.err.size + " dòng có lỗi (tô đỏ). Hãy sửa rồi lưu lại.", "bad"); return false; }
  const taken = new Set([...S.products.keys()]);
  const now = new Date().toISOString();
  const out = [];
  let maxOrd = Math.max(0, ...[...S.products.values()].map(p => p.ord || 0));
  for (const k of keys) {
    const r = S.pe.rows.get(k);
    if (!r) continue;
    const p = {};
    ["code", "group", "name", "pattern", "size", "glaze", "unit", "note"].forEach(f => p[f] = String(r[f] ?? "").trim());
    p.price = r.price ?? null; p.image = r.image || null; p.active = r.active !== false;
    if (S.pe.news.has(k)) { if (!p.code) p.code = makeCode(p, taken); else taken.add(p.code); p.createdAt = now; p.ord = ++maxOrd; }
    else { const old = S.products.get(r.code); p.createdAt = old?.createdAt || now; p.ord = old?.ord ?? ++maxOrd; if (old?.demo) p.demo = true; }
    p.updatedAt = now;
    out.push(p);
  }
  if (!out.length) { S.pe = null; renderPrices(); return true; }
  busy("Đang lưu bảng giá…");
  try {
    const metaNext = clone(S.meta);
    metaNext.priceVersion = (metaNext.priceVersion || 0) + 1;
    out.forEach(p => { if (p.group && !allGroups().includes(p.group)) (metaNext.groups = metaNext.groups || []).push(p.group); });
    await DB.run(["products", "kv"], "readwrite", t => { const os = t.objectStore("products"); out.forEach(p => os.put(p)); t.objectStore("kv").put({ k: "meta", v: metaNext }); });
    out.forEach(p => S.products.set(p.code, p));
    S.meta = metaNext;
    S.pe = null; S.cardSel.clear();
    busy();
    toast(`Đã lưu ${out.length} dòng vào bảng giá`);
    if (S.view === "prices") renderPrices();
    return true;
  } catch (err) {
    busy();
    toast("CHƯA LƯU được bảng giá: " + errMsg(err), "bad");
    return false;
  }
}
const EXPORT_COLS = ["Mã", "Nhóm", "Tên sản phẩm", "Họa tiết", "Quy cách", "Dòng men", "ĐVT", "Đơn giá", "Ghi chú", "Trạng thái"];
async function exportPriceExcel() {
  if (!needLib("xlsx")) return;
  if (S.pe && (S.pe.dirty.size || S.pe.news.size)) toast("Lưu ý: file xuất theo bảng giá ĐÃ LƯU, chưa gồm các thay đổi đang sửa.", "bad");
  const rows = sortProducts([...S.products.values()]).map(p => [p.code, p.group, p.name, p.pattern, p.size, p.glaze, p.unit, p.price ?? null, p.note, p.active === false ? "Ngừng dùng" : "Đang dùng"]);
  const ws = XLSX.utils.aoa_to_sheet([EXPORT_COLS, ...rows]);
  ws["!cols"] = [18, 18, 32, 10, 12, 18, 8, 14, 44, 12].map(w => ({ wch: w }));
  for (let r = 1; r <= rows.length; r++) { const c = ws[XLSX.utils.encode_cell({ r, c: 7 })]; if (c && typeof c.v === "number") c.z = "#,##0"; }
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Bang gia");
  const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const tag = S.ws === "demo" ? "DU-LIEU-MAU_" : "";
  await saveFile(`${tag}Bang_gia_Gom_Vu_Gia_${todayISO()}.xlsx`, new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
}
async function downloadTemplate() {
  const bin = atob(TEMPLATE_XLSX_B64);
  const u8 = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  await saveFile("Bang_gia_mau_Gom_Vu_Gia.xlsx", new Blob([u8], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
}
