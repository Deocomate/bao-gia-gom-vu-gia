/* ===================== QUẢN LÝ BẢNG GIÁ ===================== */
/* Bảng chỉ sửa trực tiếp giá, trạng thái, ảnh (chờ bấm “Lưu thay đổi”); thông tin khác sửa trong hộp “Sửa sản phẩm” và lưu ngay */
function peInit() {
  if (S.pe) return;
  const rows = new Map(), order = [];
  sortProducts([...S.products.values()]).forEach(p => { const r = clone(p); r._key = p.code; rows.set(p.code, r); order.push(p.code); });
  S.pe = { rows, order, dirty: new Set(), err: new Map(), limit: 300 };
}
function peFiltered() {
  const f = S.peFilter, q = norm(f.q);
  const out = [];
  for (const k of S.pe.order) {
    const r = S.pe.rows.get(k);
    if (f.status === "active" && r.active === false) continue;
    if (f.status === "inactive" && r.active !== false) continue;
    if (f.status === "noprice" && (r.active === false || r.price != null)) continue;
    if (f.group && r.group !== f.group) continue;
    if (f.glaze && r.glaze !== f.glaze) continue;
    if (f.size && r.size !== f.size) continue;
    if (q && !norm([r.code, r.name, r.size, r.group, r.pattern, r.glaze, r.note].join(" ")).includes(q)) continue;
    out.push(r);
  }
  return out;
}
function renderPrices() {
  const el = $("#view-prices");
  peInit();
  const hasAny = S.pe.order.length > 0;
  el.innerHTML = `
  <div class="view-head">
    <div><h1>Bảng giá</h1>
    <p>Sửa giá ngay ở cột <b>Đơn giá</b> (Enter để xuống dòng dưới) rồi bấm <b>Lưu thay đổi</b>. Bấm vào tên sản phẩm để sửa thông tin, ảnh hoặc xóa. Báo giá đã lưu không tự đổi theo bảng giá.</p></div>
    <div class="btn-row">
      <button class="btn primary" data-act="add">${ICON.plus} Thêm sản phẩm</button>
      <button class="btn" data-act="bulk" ${hasAny ? "" : "disabled"}>Điều chỉnh giá hàng loạt</button>
      <button class="btn" data-act="import">${ICON.upload.replace('width="30" height="30"', 'width="16" height="16"')} Nhập Excel</button>
      <button class="btn" data-act="export" ${hasAny ? "" : "disabled"}>Xuất Excel</button>
      <button class="btn ghost" data-act="template">File Excel mẫu</button>
    </div>
  </div>
  <div id="pe-body"></div>`;
  el.onclick = onPricesClick;
  renderPeBody();
}
function peDatalists(pre) {
  const dl = (id, arr) => `<datalist id="${pre}${id}">${arr.map(g => `<option value="${esc(g)}">`).join("")}</datalist>`;
  return dl("group", allGroups()) + dl("glaze", distinct("glaze", DEFAULT_GLAZES)) + dl("unit", distinct("unit", DEFAULT_UNITS)) + dl("pattern", distinct("pattern", ["Sen", "Rồng", "Công đào", "Mây"]));
}
function renderPeBody() {
  const box = $("#pe-body");
  if (!box) return;
  if (!S.pe.order.length) {
    box.innerHTML = `
    <div class="empty-state">
      <div class="panel lead">
        <h2>Bảng giá đang trống</h2>
        <p class="muted">Nạp file dữ liệu (bản sao lưu .json) lên máy chủ, hoặc nhập bảng giá từ file Excel của bạn.</p>
        <div class="btn-row"><button class="btn primary" data-act="restore">Nạp file dữ liệu</button><button class="btn" data-act="import">Nhập Excel</button><button class="btn" data-act="add">${ICON.plus} Thêm sản phẩm</button></div>
      </div>
      <div class="panel">
        <h3 style="margin:0 0 6px">Nhập từ Excel</h3>
        <p class="muted" style="margin:0 0 12px">Tải <b>file Excel mẫu</b> để xem cách điền (có sẵn 2 kiểu: mỗi dòng một biến thể, hoặc 2 cột giá theo dòng men), rồi bấm <b>Nhập Excel</b>.</p>
        <button class="btn" data-act="template">Tải file Excel mẫu</button>
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
  const nActive = rowsAll.filter(r => r.active !== false).length, nNoPrice = rowsAll.filter(r => r.active !== false && r.price == null).length, nOff = rowsAll.length - nActive;
  const gCount = new Map(); list.forEach(r => gCount.set(r.group || "", (gCount.get(r.group || "") || 0) + 1));
  let lastG = null;
  const body = shown.map(r => { const g = r.group || ""; const head = g !== lastG ? `<tr class="grp"><td colspan="9">${esc(g || "Chưa xếp nhóm")} <span>${gCount.get(g)}</span></td></tr>` : ""; lastG = g; return head + peRowHTML(r); }).join("");
  box.innerHTML = `
  <div class="toolbar">
    <input class="inp search" id="pe-q" type="search" placeholder="Tìm theo tên, mã, ghi chú…" value="${esc(f.q)}" aria-label="Tìm kiếm">
    <select class="inp" id="pe-group" aria-label="Lọc nhóm"><option value="">Tất cả nhóm</option>${opt(groups, f.group)}</select>
    <select class="inp" id="pe-glaze" aria-label="Lọc dòng men"><option value="">Mọi dòng men</option>${opt(glazes, f.glaze)}</select>
    <select class="inp" id="pe-size" aria-label="Lọc kích thước"><option value="">Mọi kích thước</option>${opt(sizes, f.size)}</select>
    <select class="inp" id="pe-status" aria-label="Lọc trạng thái">
      <option value="active" ${f.status === "active" ? "selected" : ""}>Đang dùng</option>
      <option value="noprice" ${f.status === "noprice" ? "selected" : ""}>Chưa có giá</option>
      <option value="inactive" ${f.status === "inactive" ? "selected" : ""}>Ngừng dùng</option>
      <option value="all" ${f.status === "all" ? "selected" : ""}>Tất cả trạng thái</option></select>
    ${f.q || f.group || f.glaze || f.size || f.status !== "active" ? `<button class="btn ghost" data-act="clear-filter">Bỏ lọc</button>` : ""}
  </div>
  <div class="sumrow"><span class="chip lam">${nActive} sản phẩm đang dùng</span>${nNoPrice ? `<button class="chip bad" data-act="show-noprice" title="Lọc các sản phẩm chưa có giá">${nNoPrice} chưa có giá</button>` : ""}${nOff ? `<span class="chip off">${nOff} ngừng dùng</span>` : ""}<span class="chip off">Đang hiện ${list.length}</span></div>
  <div class="tbl-wrap"><table class="grid pt" id="pe-table">
    <thead><tr><th style="width:56px">Ảnh</th><th style="min-width:240px">Sản phẩm</th><th class="c-opt" style="width:96px">Họa tiết</th><th class="c-opt" style="width:104px">Quy cách</th><th class="c-opt" style="width:150px">Dòng men</th><th class="c-opt" style="width:72px">ĐVT</th><th style="width:140px;text-align:right">Đơn giá (đ)</th><th class="c-opt" style="width:118px">Trạng thái</th><th class="c-opt" style="width:48px"><span class="sr">Sửa</span></th></tr></thead>
    <tbody>${body || `<tr><td colspan="9" class="empty">Không có sản phẩm khớp bộ lọc.</td></tr>`}</tbody>
  </table></div>
  ${list.length > shown.length ? `<div style="text-align:center;margin-top:10px"><button class="btn" data-act="more">Hiện thêm (${list.length - shown.length} dòng)</button></div>` : ""}
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
  tb.addEventListener("keydown", e => {
    if (e.key !== "Enter" || e.target.dataset.f !== "price") return;
    e.preventDefault();
    const all = $$('input[data-f="price"]', tb), i = all.indexOf(e.target), nx = all[i + (e.shiftKey ? -1 : 1)];
    if (nx) { nx.focus(); nx.select(); } else e.target.blur();
  });
  renderSavebar();
}
function peRowHTML(r) {
  const k = esc(r._key), err = S.pe.err.get(r._key) || {};
  const url = r.image ? S.imgURL.get(r.image) : null;
  if (r.image && !url) imageURL(r.image).then(u => { const t = $(`[data-thumb="${CSS.escape(r._key)}"]`); if (t && u) t.innerHTML = `<img src="${u}" alt="">`; });
  return `<tr data-k="${k}" class="${r.active === false ? "inactive" : ""} ${S.pe.dirty.has(r._key) ? "changed" : ""}">
    <td><button class="thumb" data-act="img" data-k="${k}" data-thumb="${k}" title="Thêm/đổi ảnh sản phẩm">${url ? `<img src="${url}" alt="">` : ICON.img}</button></td>
    <td><button class="pname" data-act="edit" data-k="${k}" title="Sửa sản phẩm">${esc(r.name)}</button><div class="pmeta">${esc([r.size, r.glaze, r.unit].filter(Boolean).join(" · "))}${r.active === false ? " · Ngừng dùng" : ""}</div><div class="pcode">${esc(r.code)}${r.note ? " · " + esc(r.note) : ""}</div></td>
    <td class="c-opt">${esc(r.pattern)}</td>
    <td class="c-opt">${esc(r.size)}</td>
    <td class="c-opt">${esc(r.glaze)}</td>
    <td class="c-opt">${esc(r.unit)}</td>
    <td><input class="cell-inp price ${err.price ? "err" : ""}" data-k="${k}" data-f="price" value="${esc(r._praw ?? fmt(r.price))}" inputmode="numeric" placeholder="Chưa có giá" aria-label="Đơn giá ${esc(pLabel(r))} ${esc(r.glaze)}">${err.price ? `<div class="errtxt">${esc(err.price)}</div>` : ""}</td>
    <td class="c-opt"><button class="status-btn" data-act="toggle" data-k="${k}" title="Bấm để đổi trạng thái">${r.active === false ? '<span class="chip off">Ngừng dùng</span>' : '<span class="chip ok">Đang dùng</span>'}</button></td>
    <td class="c-opt"><button class="ibtn" data-act="edit" data-k="${k}" title="Sửa sản phẩm" aria-label="Sửa ${esc(pLabel(r))}">${ICON.edit}</button></td>
  </tr>`;
}
function priceErr(raw) { const p = parsePrice(raw); return p.ok ? null : p.zero ? "Giá phải lớn hơn 0 – để trống nếu chưa có giá" : (p.reason || "Giá không hợp lệ"); }
function peValidateRow(r) {
  const e = {};
  if (r._praw != null) { const m = priceErr(r._praw); if (m) e.price = m; }
  if (Object.keys(e).length) S.pe.err.set(r._key, e); else S.pe.err.delete(r._key);
  return e;
}
function onPeInput(e) {
  const i = e.target, k = i.dataset.k;
  if (!k || i.dataset.f !== "price") return;
  const r = S.pe.rows.get(k);
  const p = parsePrice(i.value);
  if (p.ok) { r.price = p.value; r._praw = null; } else r._praw = i.value;
  S.pe.dirty.add(k);
  const er = peValidateRow(r);
  i.classList.toggle("err", !!er.price);
  const tr = i.closest("tr"); if (tr) tr.classList.add("changed");
  const old = i.parentElement.querySelector(".errtxt"); if (old) old.remove();
  if (er.price) i.insertAdjacentHTML("afterend", `<div class="errtxt">${esc(er.price)}</div>`);
  renderSavebar();
}
function renderSavebar() {
  const sb = $("#pe-savebar");
  if (!sb) return;
  const n = S.pe.dirty.size;
  if (!n) { sb.innerHTML = ""; return; }
  const ne = S.pe.err.size;
  sb.innerHTML = `<div class="savebar"><span class="grow"><b>${n}</b> dòng đã sửa, chưa lưu (đánh dấu vàng ở mép trái).${ne ? ` <span class="errtxt">${ne} dòng cần sửa lỗi trước khi lưu.</span>` : ""}</span>
    <button class="btn" data-act="discard">Hủy thay đổi</button><button class="btn primary" data-act="save" ${ne ? "disabled" : ""}>Lưu thay đổi</button></div>`;
}
async function onPricesClick(e) {
  const b = e.target.closest("[data-act]");
  if (!b) return;
  const a = b.dataset.act, k = b.dataset.k;
  if (a === "import") { if (S.pe.dirty.size) { toast("Hãy lưu hoặc hủy các thay đổi đang sửa trước khi nhập file mới", "bad"); return; } openImport(); }
  else if (a === "template") downloadTemplate();
  else if (a === "export") exportPriceExcel();
  else if (a === "restore") pickFile(".json,application/json", f => restoreBackup(f));
  else if (a === "more") { S.pe.limit += 300; renderPeBody(); }
  else if (a === "clear-filter") { Object.assign(S.peFilter, { q: "", group: "", glaze: "", size: "", status: "active" }); S.pe.limit = 300; renderPeBody(); }
  else if (a === "show-noprice") { Object.assign(S.peFilter, { q: "", group: "", glaze: "", size: "", status: "noprice" }); S.pe.limit = 300; renderPeBody(); }
  else if (a === "add") openProductForm(null);
  else if (a === "edit") openProductForm(k);
  else if (a === "bulk") openBulkPrice();
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
/* Ghi các sản phẩm vào kho (một giao dịch), cập nhật bộ nhớ và bảng đang sửa */
async function commitProducts(list) {
  const metaNext = clone(S.meta);
  metaNext.priceVersion = (metaNext.priceVersion || 0) + 1;
  const gs = new Set(allGroups());
  list.forEach(p => { if (p.group && !gs.has(p.group)) { (metaNext.groups = metaNext.groups || []).push(p.group); gs.add(p.group); } });
  await DB.run(["products", "kv"], "readwrite", t => { const os = t.objectStore("products"); list.forEach(p => os.put(p)); t.objectStore("kv").put({ k: "meta", v: metaNext }); });
  list.forEach(p => S.products.set(p.code, p));
  S.meta = metaNext; S.cardSel.clear();
  peSync(list.map(p => p.code));
}
/* Đưa các mã vừa lưu/xóa vào bảng đang sửa, giữ nguyên những dòng khác còn đang sửa dở */
function peSync(codes) {
  if (!S.pe) return;
  if (!S.pe.dirty.size) { S.pe = null; return; }
  codes.forEach(c => {
    const p = S.products.get(c);
    S.pe.dirty.delete(c); S.pe.err.delete(c);
    if (p) { const r = clone(p); r._key = c; S.pe.rows.set(c, r); } else S.pe.rows.delete(c);
  });
  S.pe.order = sortProducts([...S.pe.rows.values()]).map(r => r._key);
}
async function savePriceEdits() {
  if (!S.pe) return true;
  const keys = [...S.pe.dirty];
  keys.forEach(k => S.pe.rows.has(k) && peValidateRow(S.pe.rows.get(k)));
  if (S.pe.err.size) { renderPeBody(); toast("Còn " + S.pe.err.size + " dòng có lỗi (tô đỏ). Hãy sửa rồi lưu lại.", "bad"); return false; }
  const now = new Date().toISOString();
  const out = keys.map(k => [S.pe.rows.get(k), S.products.get(k)]).filter(([r, p]) => r && p)
    .map(([r, p]) => ({ ...p, price: r.price ?? null, active: r.active !== false, image: r.image || null, updatedAt: now }));
  if (!out.length) { S.pe = null; renderPrices(); return true; }
  busy("Đang lưu bảng giá…");
  try {
    await commitProducts(out);
    S.pe = null;
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
/* ----- Thêm / sửa / xóa sản phẩm ----- */
function openProductForm(code) {
  const p0 = code ? S.products.get(code) : null;
  if (code && !p0) { toast("Sản phẩm này không còn trong bảng giá", "bad"); return; }
  const pend = code && S.pe?.dirty.has(code) ? S.pe.rows.get(code) : null; // giá/trạng thái/ảnh đang sửa dở trong bảng
  const v = p0 ? { ...p0, ...(pend ? { price: pend.price, active: pend.active, image: pend.image } : {}) }
    : { group: S.peFilter.group || "", name: "", pattern: "", size: "", glaze: "", unit: "chiếc", note: "", image: null, active: true, price: null };
  let image = v.image;
  const glazes = distinct("glaze", DEFAULT_GLAZES);
  const fld = (id, label, val, extra = "", cls = "") => `<label class="field ${cls}"><span>${label}</span><input class="inp" id="${id}" value="${esc(val)}" ${extra}></label>`;
  const body = `${peDatalists("pfl-")}
    <div class="pform">
      <div class="pf-img"><button type="button" class="thumb lg" id="pf-img" title="Chọn ảnh sản phẩm"></button><button type="button" class="btn sm ghost" id="pf-img-rm">Bỏ ảnh</button></div>
      <div class="mapgrid">
        ${fld("pf-name", "Tên sản phẩm *", v.name, 'placeholder="Ví dụ: Bát hương rồng kĩ"', "full")}
        ${fld("pf-group", "Nhóm", v.group, 'list="pfl-group" placeholder="Ví dụ: Bát hương"')}
        ${fld("pf-pattern", "Họa tiết", v.pattern, 'list="pfl-pattern"')}
        ${fld("pf-size", "Quy cách / kích thước", v.size, 'placeholder="Ví dụ: Ø20, H40, S1"')}
        ${fld("pf-unit", "Đơn vị tính *", v.unit, 'list="pfl-unit"')}
        ${fld("pf-note", "Ghi chú", v.note, 'placeholder="Ví dụ: H:18cm"', "full")}
      </div>
    </div>
    ${p0 ? `<div class="mapgrid" style="margin-top:12px">
        ${fld("pf-glaze", "Dòng men", v.glaze, 'list="pfl-glaze"')}
        ${fld("pf-price", "Đơn giá (đ)", fmt(v.price), 'inputmode="numeric" placeholder="Chưa có giá"')}
        <label class="field"><span>Mã sản phẩm</span><input class="inp" value="${esc(p0.code)}" readonly title="Mã cố định, không đổi được"></label>
        <label class="field"><span>Trạng thái</span><label class="check"><input type="checkbox" id="pf-active" ${v.active !== false ? "checked" : ""}> Đang dùng (hiện trong danh mục)</label></label>
      </div>`
    : `<h3 class="pf-h">Dòng men và giá</h3>
      <p class="muted" style="margin:0 0 8px;font-size:12.5px">Đánh dấu các dòng men có bán – mỗi dòng men thành một sản phẩm có mã riêng. Để trống giá nếu chưa có.</p>
      <div class="pf-glazes">${glazes.map((g, i) => `<label class="pf-g"><input type="checkbox" data-g="${i}" ${i < 2 ? "checked" : ""}><span>${esc(g)}</span><input class="inp money-inp" data-gp="${i}" inputmode="numeric" placeholder="Chưa có giá"></label>`).join("")}
        <label class="pf-g"><input type="checkbox" data-g="x"><input class="inp" id="pf-gx" placeholder="Dòng men khác…" list="pfl-glaze"><input class="inp money-inp" data-gp="x" inputmode="numeric" placeholder="Chưa có giá"></label></div>`}
    <div class="errtxt" id="pf-err" style="margin-top:10px"></div>`;
  modal({ title: p0 ? "Sửa sản phẩm" : "Thêm sản phẩm", size: "mid", body,
    foot: `${p0 ? `<button class="btn ghost danger" data-del>Xóa sản phẩm</button>` : ""}<span class="grow"></span><button class="btn" data-close>Hủy</button><button class="btn primary" data-ok>${p0 ? "Lưu" : "Thêm vào bảng giá"}</button>`,
    onMount: (el, close) => {
      const drawImg = async () => { const u = image ? await imageURL(image) : null; $("#pf-img", el).innerHTML = u ? `<img src="${u}" alt="">` : `${ICON.img}<small>Thêm ảnh</small>`; $("#pf-img-rm", el).hidden = !image; };
      drawImg();
      $("#pf-img", el).onclick = () => pickFile("image/*", async f => { try { image = await storeImageFile(f, 900); drawImg(); } catch (e) { toast("Không lưu được ảnh: " + errMsg(e), "bad"); } });
      $("#pf-img-rm", el).onclick = () => { image = null; drawImg(); };
      $$("[data-gp]", el).forEach(i => {
        i.oninput = () => { const c = $(`[data-g="${i.dataset.gp}"]`, el); if (i.value.trim()) c.checked = true; };
        i.onblur = () => { const p = parsePrice(i.value); if (p.ok && p.value != null) i.value = fmt(p.value); };
      });
      const gx = $("#pf-gx", el); if (gx) gx.oninput = () => { $('[data-g="x"]', el).checked = !!gx.value.trim(); };
      const pr = $("#pf-price", el); if (pr) pr.onblur = () => { const p = parsePrice(pr.value); if (p.ok && p.value != null) pr.value = fmt(p.value); };
      const del = $("[data-del]", el); if (del) del.onclick = async () => { if (await deleteProduct(p0)) close(); };
      $("[data-ok]", el).onclick = async () => {
        $$(".inp.err", el).forEach(x => x.classList.remove("err"));
        const fail = (msg, id) => { $("#pf-err", el).textContent = msg; if (id) { const x = typeof id === "string" ? $("#" + id, el) : id; x.classList.add("err"); x.focus(); } };
        const val = id => $("#" + id, el).value.trim();
        const base = { group: val("pf-group"), name: val("pf-name"), pattern: val("pf-pattern"), size: val("pf-size"), unit: val("pf-unit"), note: val("pf-note"), image };
        if (!base.name) return fail("Cần nhập tên sản phẩm", "pf-name");
        if (!base.unit) return fail("Cần nhập đơn vị tính", "pf-unit");
        const now = new Date().toISOString();
        const clash = (x, skip) => [...S.products.values()].find(p => p.code !== skip && variantKey(p) === variantKey(x));
        let list;
        if (p0) {
          const pp = parsePrice(pr.value);
          if (!pp.ok) return fail(priceErr(pr.value), pr);
          const np = { ...p0, ...base, glaze: val("pf-glaze"), price: pp.value, active: $("#pf-active", el).checked, updatedAt: now };
          const c = clash(np, p0.code); if (c) return fail(`Đã có sản phẩm cùng tên, quy cách và dòng men (mã ${c.code})`);
          list = [np];
        } else {
          const picks = $$("[data-g]", el).filter(c => c.checked).map(c => { const k = c.dataset.g; return { glaze: k === "x" ? val("pf-gx") : glazes[+k], inp: $(`[data-gp="${k}"]`, el) }; });
          if (!picks.length) return fail("Hãy đánh dấu ít nhất một dòng men");
          if ($('[data-g="x"]', el).checked && !val("pf-gx")) return fail("Nhập tên dòng men khác hoặc bỏ đánh dấu", "pf-gx");
          const taken = new Set(S.products.keys());
          const same = sortProducts([...S.products.values()].filter(p => p.group === base.group));
          let ord = same.length ? (same[same.length - 1].ord ?? 0) : Math.max(0, ...[...S.products.values()].map(p => p.ord || 0)) + 1;
          list = [];
          for (const x of picks) {
            const pp = parsePrice(x.inp.value);
            if (!pp.ok) return fail(`${x.glaze}: ${priceErr(x.inp.value)}`, x.inp);
            const np = { ...base, glaze: x.glaze, price: pp.value, active: true, createdAt: now, updatedAt: now };
            const c = clash(np); if (c) return fail(`Đã có “${pLabel(np)} – ${np.glaze || "không dòng men"}” (mã ${c.code}). Hãy sửa sản phẩm đó thay vì thêm mới.`);
            if (list.some(y => variantKey(y) === variantKey(np))) return fail("Có hai dòng men trùng nhau");
            ord += same.length ? 0.001 : 1; np.ord = ord; np.code = makeCode(np, taken);
            list.push(np);
          }
        }
        busy("Đang lưu…");
        try {
          await commitProducts(list); busy(); close();
          toast(p0 ? `Đã lưu “${pLabel(list[0])}”` : `Đã thêm ${list.length} sản phẩm: ${pLabel(list[0])}`);
          if (S.view === "prices") { renderPrices(); flashRows(list.map(p => p.code)); }
        } catch (e) { busy(); fail("CHƯA LƯU được: " + errMsg(e)); }
      };
    } });
}
function flashRows(codes) {
  requestAnimationFrame(() => {
    const trs = codes.map(c => $(`#pe-table tr[data-k="${CSS.escape(c)}"]`)).filter(Boolean);
    if (!trs.length) { toast("Sản phẩm vừa lưu đang bị ẩn bởi bộ lọc", "ok", 2600); return; }
    trs.forEach(tr => { tr.classList.add("flash"); setTimeout(() => tr.classList.remove("flash"), 1800); });
    trs[0].scrollIntoView({ block: "center", behavior: "smooth" });
  });
}
async function deleteProduct(p) {
  const used = [...S.records.values()].filter(r => r.items.some(l => l.code === p.code)).length;
  if (!(await confirmBox({ title: "Xóa sản phẩm?", danger: true, okText: "Xóa vĩnh viễn",
    html: `<p>Xóa <b>${esc(pLabel(p))}</b> – ${esc(p.glaze || "không dòng men")} (mã ${esc(p.code)}) khỏi bảng giá?</p>
      ${used ? `<p>${used} mẫu/báo giá đã lưu có sản phẩm này – chúng vẫn giữ nguyên dòng và giá tại lúc lưu.</p>` : ""}
      <p class="muted">Nếu chỉ tạm ngừng bán, hãy dùng <b>Ngừng dùng</b> để giữ lại sản phẩm.</p>` }))) return false;
  try {
    const imgUsed = p.image && ([...S.products.values()].some(x => x.code !== p.code && x.image === p.image) || [...S.records.values()].some(r => r.imageId === p.image) || S.draft.imageId === p.image);
    await DB.run(["products", "images"], "readwrite", t => { t.objectStore("products").delete(p.code); if (p.image && !imgUsed) t.objectStore("images").delete(p.image); });
    S.products.delete(p.code); S.cardSel.clear();
    peSync([p.code]);
    toast(`Đã xóa ${pLabel(p)} (${p.code})`);
    if (S.view === "prices") renderPrices();
    return true;
  } catch (e) { toast("Không xóa được: " + errMsg(e), "bad"); return false; }
}
/* ----- Điều chỉnh giá hàng loạt: áp vào bảng đang sửa, người dùng xem lại rồi bấm Lưu ----- */
function openBulkPrice() {
  const rows = peFiltered();
  const body = `<p style="margin-top:0">Áp dụng cho các sản phẩm <b>đang hiện theo bộ lọc</b> (${rows.length} dòng). Muốn chỉ đổi một nhóm, dòng men hay kích thước thì đóng hộp này, chọn bộ lọc ở bảng rồi mở lại.</p>
    <div class="mapgrid">
      <label class="field"><span>Cách điều chỉnh</span><select class="inp" id="bk-mode"><option value="pct-up">Tăng theo %</option><option value="pct-down">Giảm theo %</option><option value="amt-up">Tăng thêm số tiền</option><option value="amt-down">Giảm bớt số tiền</option><option value="set">Đặt cùng một giá</option></select></label>
      <label class="field"><span id="bk-lbl">Mức (%)</span><input class="inp" id="bk-val" inputmode="decimal" placeholder="Ví dụ: 10"></label>
      <label class="field"><span>Làm tròn giá mới</span><select class="inp" id="bk-round"><option value="1">Không làm tròn</option><option value="1000">Đến 1.000 đ</option><option value="10000" selected>Đến 10.000 đ</option><option value="50000">Đến 50.000 đ</option><option value="100000">Đến 100.000 đ</option></select></label>
    </div>
    <div id="bk-prev" style="margin-top:12px"></div>`;
  modal({ title: "Điều chỉnh giá hàng loạt", size: "mid", body,
    foot: `<span class="grow muted" style="font-size:12.5px">Giá chỉ đổi trong bảng – bạn xem lại rồi bấm “Lưu thay đổi”.</span><button class="btn" data-close>Hủy</button><button class="btn primary" data-ok disabled>Áp dụng</button>`,
    onMount: (el, close) => {
      let plan = [];
      const draw = () => {
        const mode = $("#bk-mode", el).value, step = +$("#bk-round", el).value, raw = $("#bk-val", el).value.trim();
        const pct = mode.startsWith("pct");
        $("#bk-lbl", el).textContent = pct ? "Mức (%)" : mode === "set" ? "Giá mới (đ)" : "Số tiền (đ)";
        const x = pct ? parseFloat(raw.replace(",", ".")) : parseMoneyInput(raw);
        plan = [];
        let msg = "", bad = 0;
        if (!raw || !(x > 0) || (pct && x >= 100 && mode === "pct-down")) msg = raw ? "Mức điều chỉnh không hợp lệ" : "Nhập mức điều chỉnh để xem trước";
        else {
          for (const r of rows) {
            if (r.price == null && mode !== "set") continue;
            let n = mode === "pct-up" ? r.price * (1 + x / 100) : mode === "pct-down" ? r.price * (1 - x / 100) : mode === "amt-up" ? r.price + x : mode === "amt-down" ? r.price - x : x;
            n = Math.round(n / step) * step;
            if (n <= 0) { bad++; continue; }
            if (n !== r.price) plan.push({ r, n });
          }
        }
        const skipped = mode === "set" ? 0 : rows.filter(r => r.price == null).length;
        $("#bk-prev", el).innerHTML = msg ? `<div class="muted">${esc(msg)}</div>` : `
          <div class="sumrow"><span class="chip lam">${plan.length} dòng đổi giá</span>${skipped ? `<span class="chip off">${skipped} dòng chưa có giá – bỏ qua</span>` : ""}${bad ? `<span class="chip bad">${bad} dòng thành giá ≤ 0 – bỏ qua</span>` : ""}</div>
          <div class="tbl-wrap" style="max-height:42vh"><table class="list" style="min-width:520px"><thead><tr><th>Sản phẩm</th><th>Dòng men</th><th class="r">Giá cũ</th><th class="r">Giá mới</th></tr></thead><tbody>
          ${plan.slice(0, 60).map(({ r, n }) => `<tr><td><b>${esc(pLabel(r))}</b><div class="muted" style="font-size:12px">${esc(r.code)}</div></td><td>${esc(r.glaze)}</td><td class="r">${r.price == null ? '<span class="na">Chưa có</span>' : fmt(r.price)}</td><td class="r ${r.price == null || n > r.price ? "diff-up" : "diff-down"}"><b>${fmt(n)}</b></td></tr>`).join("") || `<tr><td colspan="4" class="empty">Không có dòng nào thay đổi.</td></tr>`}
          ${plan.length > 60 ? `<tr><td colspan="4" class="muted">… và ${plan.length - 60} dòng khác</td></tr>` : ""}</tbody></table></div>`;
        $("[data-ok]", el).disabled = !plan.length;
        $("[data-ok]", el).textContent = plan.length ? `Áp dụng ${plan.length} dòng` : "Áp dụng";
      };
      ["bk-mode", "bk-round"].forEach(id => $("#" + id, el).onchange = draw);
      $("#bk-val", el).oninput = debounce(draw, 150);
      draw();
      $("[data-ok]", el).onclick = () => {
        plan.forEach(({ r, n }) => { r.price = n; r._praw = null; S.pe.dirty.add(r._key); S.pe.err.delete(r._key); });
        close(); renderPeBody();
        toast(`Đã điều chỉnh ${plan.length} dòng (tô vàng). Kiểm tra rồi bấm “Lưu thay đổi”.`, "ok", 5000);
      };
    } });
}
const EXPORT_COLS = ["Mã", "Nhóm", "Tên sản phẩm", "Họa tiết", "Quy cách", "Dòng men", "ĐVT", "Đơn giá", "Ghi chú", "Trạng thái"];
async function exportPriceExcel() {
  if (!needLib("xlsx")) return;
  if (S.pe && S.pe.dirty.size) toast("Lưu ý: file xuất theo bảng giá ĐÃ LƯU, chưa gồm các thay đổi đang sửa.", "bad");
  const rows = sortProducts([...S.products.values()]).map(p => [p.code, p.group, p.name, p.pattern, p.size, p.glaze, p.unit, p.price ?? null, p.note, p.active === false ? "Ngừng dùng" : "Đang dùng"]);
  const ws = XLSX.utils.aoa_to_sheet([EXPORT_COLS, ...rows]);
  ws["!cols"] = [18, 18, 32, 10, 12, 18, 8, 14, 44, 12].map(w => ({ wch: w }));
  for (let r = 1; r <= rows.length; r++) { const c = ws[XLSX.utils.encode_cell({ r, c: 7 })]; if (c && typeof c.v === "number") c.z = "#,##0"; }
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Bang gia");
  const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  await saveFile(`Bang_gia_Gom_Vu_Gia_${todayISO()}.xlsx`, new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
}
async function downloadTemplate() {
  const bin = atob(TEMPLATE_XLSX_B64);
  const u8 = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  await saveFile("Bang_gia_mau_Gom_Vu_Gia.xlsx", new Blob([u8], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
}
