/* ===================== NHẬP BẢNG GIÁ TỪ EXCEL ===================== */
const IMP_FIELDS = [
  ["code", "Mã sản phẩm"], ["group", "Nhóm sản phẩm"], ["name", "Tên sản phẩm *"], ["pattern", "Họa tiết"],
  ["size", "Quy cách / kích thước"], ["glaze", "Dòng men"], ["unit", "Đơn vị tính *"], ["note", "Ghi chú"], ["status", "Trạng thái"]
];
const HDR_RX = {
  code: /^(ma|ma sp|ma san pham|ma bien the|sku|code)$/,
  group: /^(nhom|nhom san pham|nhom sp|danh muc|loai|loai san pham)$/,
  name: /^(ten|ten san pham|ten sp|san pham|ten hang)/,
  pattern: /(hoa tiet|hoa van)/,
  size: /(quy cach|kich thuoc|kich co|size)/,
  glaze: /^(dong men|loai men|men)$/,
  unit: /^(dvt|don vi|don vi tinh)$/,
  note: /(ghi chu|mo ta)/,
  status: /(trang thai|tinh trang)/
};
const PRICE_RX = /(gia|men lam|vang kim|ve vang|price)/;
function guessGlazeFromHeader(h) {
  const n = norm(h);
  if (/(ve vang|vang kim|vang)/.test(n)) return "Men lam vẽ vàng";
  if (/(men lam|thuong)/.test(n)) return "Men lam thường";
  return "";
}
const cellStr = v => v == null ? "" : (typeof v === "number" ? String(v) : String(v).replace(/\s+/g, " ").trim());

let W = null;
function openImport() {
  if (!needLib("xlsx")) return;
  W = { step: 1 };
  W.close = modal({ title: "Nhập bảng giá từ Excel", size: "wide", body: `<div id="imp"></div>`, foot: `<span class="grow muted" id="imp-foot-note"></span><button class="btn" data-close>Đóng</button><button class="btn" id="imp-back" hidden>Quay lại</button><button class="btn primary" id="imp-next" hidden>Tiếp tục</button>`,
    onMount: el => { $("#imp-back", el).onclick = () => impGo(W.step - 1); $("#imp-next", el).onclick = () => impNext(); } });
  impRender();
}
function impSteps() {
  const names = ["Chọn file", "Sheet & dòng tiêu đề", "Ghép cột", "Kiểm tra & xác nhận"];
  return `<div class="wsteps">${names.map((n, i) => `<span class="${i + 1 === W.step ? "on" : i + 1 < W.step ? "done" : ""}">${i + 1}. ${n}</span>`).join("")}</div>`;
}
function impGo(s) { W.step = Math.max(1, s); impRender(); }
function impRender() {
  const box = $("#imp"); if (!box) return;
  $("#imp-back").hidden = W.step <= 1;
  $("#imp-next").hidden = W.step === 1;
  $("#imp-foot-note").textContent = W.fileName ? "File: " + W.fileName : "";
  if (W.step === 1) {
    box.innerHTML = impSteps() + `
      <label class="drop" id="imp-drop" style="min-height:220px">${ICON.upload}<b>Chọn hoặc kéo thả file bảng giá</b><span>Hỗ trợ .xlsx, .xls, .csv</span>
      <input type="file" id="imp-file" accept=".xlsx,.xls,.csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv" hidden></label>
      <p class="muted" style="margin-top:12px">Chưa có file? <button class="btn sm" id="imp-tpl">Tải file Excel mẫu</button> – đã chép từ bảng giá PDF, có 2 kiểu: theo biến thể và 2 cột giá.</p>`;
    const inp = $("#imp-file"), drop = $("#imp-drop");
    inp.onchange = () => inp.files[0] && impReadFile(inp.files[0]);
    $("#imp-tpl").onclick = e => { e.preventDefault(); downloadTemplate(); };
    drop.ondragover = e => { e.preventDefault(); drop.classList.add("over"); };
    drop.ondragleave = () => drop.classList.remove("over");
    drop.ondrop = e => { e.preventDefault(); drop.classList.remove("over"); const f = e.dataTransfer.files[0]; f && impReadFile(f); };
  } else if (W.step === 2) impRenderSheet(box);
  else if (W.step === 3) impRenderMap(box);
  else if (W.step === 4) impRenderReview(box);
}
async function impReadFile(file) {
  if (!/\.(xlsx|xls|csv)$/i.test(file.name)) { toast("Chỉ nhận file .xlsx, .xls hoặc .csv", "bad"); return; }
  busy("Đang đọc file…");
  try {
    const buf = await file.arrayBuffer();
    let wb;
    if (/\.csv$/i.test(file.name)) {
      let text = new TextDecoder("utf-8").decode(buf);
      if (text.includes("\uFFFD")) { try { text = new TextDecoder("windows-1258").decode(buf); } catch { } }
      text = text.replace(/^﻿/, "");
      wb = XLSX.read(text, { type: "string", raw: true });
    } else wb = XLSX.read(buf, { type: "array" });
    W.fileName = file.name;
    W.sheets = wb.SheetNames.map(n => ({ name: n, rows: XLSX.utils.sheet_to_json(wb.Sheets[n], { header: 1, raw: true, defval: null, blankrows: true }) }))
      .filter(s => s.rows.some(r => r && r.some(c => cellStr(c))));
    if (!W.sheets.length) throw new Error("File không có dữ liệu");
    // Chọn sẵn sheet trông giống bảng giá nhất (có dòng tiêu đề khớp nhiều cột nhất)
    let best = 0, bestSc = -1;
    W.sheets.forEach((s, i) => { const sc = headerScore(s.rows).score * 1000 + Math.min(s.rows.length, 999); if (sc > bestSc) { bestSc = sc; best = i; } });
    W.sheetIdx = best;
    impAutoHeader();
    busy();
    impGo(2);
  } catch (e) { busy(); toast("Không đọc được file: " + errMsg(e), "bad"); }
}
function impSheet() { return W.sheets[W.sheetIdx]; }
function headerScore(rows) {
  let best = 0, bestScore = -1;
  for (let i = 0; i < Math.min(25, rows.length); i++) {
    const r = rows[i] || [];
    let sc = 0;
    r.forEach(c => { const n = norm(cellStr(c)); if (!n || n.length > 40) return; if (Object.values(HDR_RX).some(rx => rx.test(n)) || PRICE_RX.test(n) || n === "stt") sc++; });
    if (sc > bestScore) { best = i; bestScore = sc; }
  }
  return { row: best, score: bestScore };
}
function impAutoHeader() {
  W.headerRow = headerScore(impSheet().rows).row;
  impAutoMap();
}
function impCols() {
  const rows = impSheet().rows;
  const n = Math.max(...rows.slice(0, 400).map(r => (r || []).length), 1);
  const hdr = rows[W.headerRow] || [];
  return Array.from({ length: n }, (_, i) => cellStr(hdr[i]) || `Cột ${XLSX.utils.encode_col(i)}`);
}
function impAutoMap() {
  const cols = impCols(), rows = impSheet().rows.slice(W.headerRow + 1);
  W.map = {}; IMP_FIELDS.forEach(([f]) => W.map[f] = -1);
  const used = new Set();
  cols.forEach((h, i) => {
    const n = norm(h);
    for (const [f] of IMP_FIELDS) if (W.map[f] < 0 && HDR_RX[f].test(n) && !(f === "name" && PRICE_RX.test(n) && /gia/.test(n))) { W.map[f] = i; used.add(i); return; }
  });
  W.priceCols = [];
  cols.forEach((h, i) => {
    if (used.has(i)) return;
    const n = norm(h);
    const vals = rows.map(r => r && r[i]).filter(v => cellStr(v));
    const okRatio = vals.length ? vals.filter(v => parsePrice(v).ok || parsePrice(v).zero).length / vals.length : 0;
    const looks = PRICE_RX.test(n) && n !== "stt";
    if (looks) W.priceCols.push({ col: i, use: okRatio > 0.5, glaze: guessGlazeFromHeader(h) });
  });
  W.sectionMode = W.map.group < 0;
  W.defaultGlaze = "";
}
function impRenderSheet(box) {
  const s = impSheet(), cols = impCols();
  const view = s.rows.slice(0, 40);
  box.innerHTML = impSteps() + `
    <div class="mapgrid" style="margin-bottom:12px">
      ${W.sheets.length > 1 ? `<label class="field"><span>Sheet trong file (${W.sheets.length})</span><select class="inp" id="imp-sheet">${W.sheets.map((x, i) => `<option value="${i}" ${i === W.sheetIdx ? "selected" : ""}>${esc(x.name)} – ${x.rows.length} dòng</option>`).join("")}</select></label>` : `<div class="field"><span>Sheet</span><b>${esc(s.name)}</b></div>`}
      <label class="field"><span>Dòng tiêu đề cột</span><select class="inp" id="imp-hdr">${view.map((r, i) => `<option value="${i}" ${i === W.headerRow ? "selected" : ""}>Dòng ${i + 1}: ${esc((r || []).map(cellStr).filter(Boolean).slice(0, 5).join(" | ").slice(0, 70))}</option>`).join("")}</select></label>
    </div>
    <p class="muted" style="margin:0 0 6px">Bấm vào một dòng trong bản xem trước để chọn làm dòng tiêu đề. Dòng tiêu đề đang được tô xanh.</p>
    <div class="prev-wrap"><table class="prev"><thead><tr><th class="rn">#</th>${cols.map((c, i) => `<th>${esc(XLSX.utils.encode_col(i))}</th>`).join("")}</tr></thead>
    <tbody>${view.map((r, i) => `<tr class="pick ${i === W.headerRow ? "hdr" : ""}" data-r="${i}"><td class="rn">${i + 1}</td>${cols.map((_, j) => `<td>${esc(cellStr((r || [])[j]))}</td>`).join("")}</tr>`).join("")}</tbody></table></div>
    <p class="muted" style="margin-top:8px">Xem trước 40 dòng đầu / tổng ${s.rows.length} dòng.</p>`;
  const sh = $("#imp-sheet");
  if (sh) sh.onchange = () => { W.sheetIdx = +sh.value; impAutoHeader(); impRender(); };
  $("#imp-hdr").onchange = e => { W.headerRow = +e.target.value; impAutoMap(); impRender(); };
  $$("tr.pick", box).forEach(tr => tr.onclick = () => { W.headerRow = +tr.dataset.r; impAutoMap(); impRender(); });
}
function impRenderMap(box) {
  const cols = impCols();
  const sel = f => `<select class="inp" data-map="${f}"><option value="-1">— Không có —</option>${cols.map((c, i) => `<option value="${i}" ${W.map[f] === i ? "selected" : ""}>${esc(c)}</option>`).join("")}</select>`;
  const pcSet = new Set(W.priceCols.map(p => p.col));
  const candidates = cols.map((c, i) => i).filter(i => !Object.values(W.map).includes(i) || pcSet.has(i));
  box.innerHTML = impSteps() + `
    <h3 style="margin:0 0 8px;font-size:15px">Ghép cột trong file với thông tin sản phẩm</h3>
    <div class="mapgrid">${IMP_FIELDS.map(([f, label]) => `<label class="field"><span>${esc(label)}</span>${sel(f)}</label>`).join("")}</div>
    <h3 style="margin:18px 0 4px;font-size:15px">Cột giá bán</h3>
    <p class="muted" style="margin:0">Tích các cột dùng làm giá bán. Nếu chọn nhiều cột (ví dụ giá men lam thường và men lam vẽ vàng), mỗi dòng sẽ tách thành các biến thể theo dòng men, giữ đúng giá từng cột.</p>
    <div class="pricecols">${candidates.map(i => { const pc = W.priceCols.find(p => p.col === i) || { col: i, use: false, glaze: guessGlazeFromHeader(cols[i]) };
      return `<div class="pricecol"><input type="checkbox" data-pc="${i}" ${pc.use ? "checked" : ""} id="pc-${i}" aria-label="Dùng cột ${esc(cols[i])} làm giá"><label for="pc-${i}"><b>${esc(cols[i])}</b> <span class="muted">– ví dụ: ${esc(impSample(i))}</span></label>
        <input class="inp" data-pcg="${i}" placeholder="Dòng men cho cột này" value="${esc(pc.glaze)}" list="dl-glaze-imp"></div>`; }).join("")}</div>
    <datalist id="dl-glaze-imp">${distinct("glaze", DEFAULT_GLAZES).map(g => `<option value="${esc(g)}">`).join("")}</datalist>
    <div class="mapgrid" style="margin-top:14px">
      <label class="field"><span>Dòng men mặc định (khi không có cột dòng men và cột giá chưa ghi dòng men)</span><input class="inp" id="imp-dglaze" value="${esc(W.defaultGlaze)}" list="dl-glaze-imp" placeholder="Có thể để trống"></label>
      <label class="field" style="justify-content:flex-end"><span><input type="checkbox" id="imp-sec" ${W.sectionMode ? "checked" : ""}> Dòng chỉ có tên (không giá, không ĐVT) là tiêu đề nhóm cho các dòng bên dưới</span></label>
    </div>`;
  $$("[data-map]", box).forEach(s => s.onchange = () => { W.map[s.dataset.map] = +s.value; });
  $$("[data-pc]", box).forEach(c => c.onchange = () => impSetPC(+c.dataset.pc, { use: c.checked }));
  $$("[data-pcg]", box).forEach(c => c.oninput = () => impSetPC(+c.dataset.pcg, { glaze: c.value.trim() }));
  $("#imp-dglaze").oninput = e => W.defaultGlaze = e.target.value.trim();
  $("#imp-sec").onchange = e => W.sectionMode = e.target.checked;
}
function impSetPC(i, patch) {
  let pc = W.priceCols.find(p => p.col === i);
  if (!pc) { pc = { col: i, use: false, glaze: guessGlazeFromHeader(impCols()[i]) }; W.priceCols.push(pc); }
  Object.assign(pc, patch);
}
function impSample(i) { const r = impSheet().rows.slice(W.headerRow + 1).find(r => r && cellStr(r[i])); return r ? cellStr(r[i]).slice(0, 30) : "(trống)"; }
function impNext() {
  if (W.step === 2) return impGo(3);
  if (W.step === 3) {
    if (W.map.name < 0) return toast("Hãy chọn cột Tên sản phẩm", "bad");
    const used = W.priceCols.filter(p => p.use);
    if (!used.length) return toast("Hãy tích ít nhất một cột giá bán", "bad");
    if (used.length > 1 && used.some(p => !p.glaze)) return toast("Khi dùng nhiều cột giá, mỗi cột cần ghi dòng men để phân biệt biến thể", "bad");
    if (used.length > 1 && new Set(used.map(p => norm(p.glaze))).size < used.length) return toast("Các cột giá phải có dòng men khác nhau", "bad");
    impParse();
    return impGo(4);
  }
  if (W.step === 4) impApply();
}
function impParse() {
  const rows = impSheet().rows, m = W.map, used = W.priceCols.filter(p => p.use).sort((a, b) => a.col - b.col);
  const g = (r, f) => m[f] >= 0 ? cellStr(r[m[f]]) : "";
  const hdrName = norm(cellStr((rows[W.headerRow] || [])[m.name]));
  let curGroup = "";
  const vs = [];
  for (let i = W.headerRow + 1; i < rows.length; i++) {
    const r = rows[i] || [];
    if (!r.some(c => cellStr(c))) continue;
    const name = g(r, "name");
    if (name && norm(name) === hdrName) continue;
    const praws = used.map(p => r[p.col]);
    const noPrice = praws.every(v => !cellStr(v));
    if (W.sectionMode && name && noPrice && !g(r, "unit") && !g(r, "size") && !g(r, "code")) { curGroup = name; continue; }
    if (!name && noPrice) continue;
    const glazeCol = g(r, "glaze");
    used.forEach((pc, j) => {
      const glaze = used.length === 1 ? (glazeCol || pc.glaze || W.defaultGlaze) : pc.glaze;
      let code = g(r, "code");
      if (code && used.length > 1) code = code + "-" + (initials(glaze) || j + 1);
      vs.push({ row: i + 1, code, group: g(r, "group") || curGroup, name, pattern: g(r, "pattern"), size: g(r, "size"), glaze, unit: g(r, "unit"), note: g(r, "note"), status: g(r, "status"), priceRaw: praws[j], pr: parsePrice(praws[j]) });
    });
  }
  // Đối chiếu
  const byKey = new Map(); for (const p of S.products.values()) byKey.set(variantKey(p), p);
  const taken = new Set([...S.products.keys(), ...vs.map(v => v.code).filter(Boolean)]);
  const seenCode = new Map(), seenKey = new Map();
  vs.forEach(v => {
    v.issues = []; v.importable = true; v.checked = true;
    const key = variantKey(v);
    if (!v.name) { v.issues.push("Thiếu tên sản phẩm"); v.importable = false; }
    let ex = v.code ? S.products.get(v.code) : byKey.get(key);
    if (!v.code && ex) v.code = ex.code;
    if (!v.unit) { if (ex && ex.unit) v.unit = ex.unit; else { v.issues.push("Thiếu đơn vị tính"); v.importable = false; } }
    if (!v.pr.ok) { v.issues.push((v.pr.reason || "Giá không hợp lệ") + ` (“${cellStr(v.priceRaw)}”)` + (ex && ex.price != null ? " – nếu áp dụng sẽ giữ giá cũ" : " – nếu áp dụng sẽ ghi Chưa có giá")); v.checked = false; v.kind = "error"; }
    const dk = v.code || key;
    if (seenCode.has(dk) || seenKey.has(key)) { const first = seenCode.get(dk) || seenKey.get(key); v.issues.push(`Trùng ${v.code ? "mã " + v.code : "sản phẩm"} với dòng ${first.row} trong file`); first.dupWarn = true; v.checked = false; v.kind = "error"; }
    else { seenCode.set(dk, v); seenKey.set(key, v); }
    v.ex = ex || null;
    if (ex) {
      const idDiff = norm(ex.name) !== norm(v.name) || norm(ex.size) !== norm(v.size) || norm(ex.glaze) !== norm(v.glaze);
      if (idDiff) { v.issues.push(`Xung đột: mã ${ex.code} đang là “${pLabel(ex)} – ${ex.glaze}”`); v.checked = false; v.kind = "error"; v.conflict = true; }
      v.oldPrice = ex.price ?? null;
      v.newPrice = v.pr.ok ? (v.pr.value == null && ex.price != null ? ex.price : v.pr.value) : (ex.price ?? null);
      if (v.pr.ok && v.pr.value == null && ex.price != null) v.issues.push("File để trống giá – giữ giá cũ");
      const infoDiff = (m.group >= 0 && v.group && v.group !== ex.group) || (m.unit >= 0 && v.unit !== ex.unit) || (m.note >= 0 && v.note !== (ex.note || "")) || (m.pattern >= 0 && v.pattern !== (ex.pattern || "")) || (m.status >= 0 && v.status && parseStatus(v.status) !== (ex.active !== false));
      if (!v.kind) v.kind = v.newPrice !== v.oldPrice ? "price" : infoDiff ? "info" : "same";
      if (v.kind === "same") v.checked = false;
    } else {
      if (!v.code) v.code = makeCode(v, taken);
      v.oldPrice = null; v.newPrice = v.pr.ok ? v.pr.value : null;
      if (v.pr.ok && v.pr.value == null) v.issues.push("Chưa có giá");
      if (!v.kind) v.kind = "new";
    }
    if (!v.importable) { v.checked = false; v.kind = "error"; }
  });
  vs.forEach(v => { if (v.dupWarn && !v.issues.some(x => x.startsWith("Có dòng trùng"))) v.issues.push("Có dòng trùng ở phía dưới – kiểm tra lại"); });
  W.vs = vs; W.filter = "all";
}
function parseStatus(s) { const n = norm(s); return !(/(ngung|khong|inactive|tam dung|het)/.test(n) || n === "0"); }
function impRenderReview(box) {
  const vs = W.vs;
  const cnt = k => vs.filter(v => v.kind === k).length;
  const inFile = new Set(vs.map(v => v.code));
  const notInFile = [...S.products.values()].filter(p => !inFile.has(p.code)).length;
  const noPrice = vs.filter(v => v.kind !== "error" && v.newPrice == null).length;
  const flt = { all: () => true, new: v => v.kind === "new", price: v => v.kind === "price", info: v => v.kind === "info", error: v => v.kind === "error" || v.issues.length, same: v => v.kind === "same" }[W.filter];
  const list = vs.filter(flt);
  const tag = v => ({ new: '<span class="chip ok">Mới</span>', price: '<span class="chip gold">Đổi giá</span>', info: '<span class="chip lam">Cập nhật thông tin</span>', same: '<span class="chip off">Không đổi</span>', error: '<span class="chip bad">Cần kiểm tra</span>' }[v.kind]);
  const nChecked = vs.filter(v => v.checked).length;
  box.innerHTML = impSteps() + `
    <div class="sumrow">
      ${[["all", "Tất cả", vs.length], ["new", "Mới", cnt("new")], ["price", "Đổi giá", cnt("price")], ["info", "Cập nhật thông tin", cnt("info")], ["error", "Lỗi / cảnh báo", vs.filter(v => v.kind === "error" || v.issues.length).length], ["same", "Không đổi", cnt("same")]]
      .map(([k, l, n]) => `<button class="gchip" aria-pressed="${W.filter === k}" data-f="${k}">${l}: ${n}</button>`).join("")}
    </div>
    <div class="banner info"><span class="grow">${notInFile ? `<b>${notInFile}</b> sản phẩm đang có trong bảng giá không nằm trong file này – sẽ <b>giữ nguyên</b>, không bị xóa.` : "Không xóa sản phẩm nào."} ${noPrice ? `<b>${noPrice}</b> dòng sẽ ghi “Chưa có giá”.` : ""} Chỉ cập nhật sau khi bạn bấm xác nhận.</span></div>
    <div class="prev-wrap" style="max-height:50vh"><table class="prev"><thead><tr><th><input type="checkbox" id="imp-all" aria-label="Chọn tất cả"></th><th>Dòng</th><th>Mã</th><th>Sản phẩm</th><th>ĐVT</th><th style="text-align:right">Giá cũ</th><th style="text-align:right">Giá mới</th><th style="text-align:right">Chênh lệch</th><th>Kết quả</th><th>Ghi chú kiểm tra</th></tr></thead>
    <tbody>${list.map(v => { const i = vs.indexOf(v); const d = v.oldPrice != null && v.newPrice != null ? v.newPrice - v.oldPrice : null;
      return `<tr><td><input type="checkbox" data-i="${i}" ${v.checked ? "checked" : ""} ${v.importable && v.kind !== "same" ? "" : "disabled"} aria-label="Áp dụng dòng ${v.row}"></td><td class="rn">${v.row}</td><td>${esc(v.code)}</td>
        <td title="${esc(v.group)}">${esc([v.name, v.size].filter(Boolean).join(" "))} <span class="muted">· ${esc(v.glaze || "—")}</span></td><td>${esc(v.unit)}</td>
        <td style="text-align:right">${v.ex ? (v.oldPrice == null ? '<span class="na">Chưa có giá</span>' : fmt(v.oldPrice)) : ""}</td>
        <td style="text-align:right">${v.pr.ok ? (v.newPrice == null ? '<span class="na">Chưa có giá</span>' : fmt(v.newPrice)) : `<span class="na">${esc(cellStr(v.priceRaw))}</span>`}</td>
        <td style="text-align:right" class="${d > 0 ? "diff-up" : d < 0 ? "diff-down" : ""}">${d ? (d > 0 ? "+" : "") + fmt(d) : ""}</td>
        <td>${tag(v)}</td><td style="white-space:normal;min-width:240px;color:${v.issues.length ? "var(--danger)" : "inherit"}">${esc(v.issues.join("; "))}</td></tr>`; }).join("") || `<tr><td colspan="10" class="empty">Không có dòng nào.</td></tr>`}</tbody></table></div>`;
  $("#imp-next").textContent = `Xác nhận nhập ${nChecked} dòng`;
  $("#imp-next").disabled = !nChecked;
  $$("[data-f]", box).forEach(b => b.onclick = () => { W.filter = b.dataset.f; impRender(); });
  $$("input[data-i]", box).forEach(c => c.onchange = () => { W.vs[+c.dataset.i].checked = c.checked; const n = W.vs.filter(v => v.checked).length; $("#imp-next").textContent = `Xác nhận nhập ${n} dòng`; $("#imp-next").disabled = !n; });
  $("#imp-all").onchange = e => { list.forEach(v => { if (v.importable && v.kind !== "same") v.checked = e.target.checked; }); impRender(); };
}
async function impApply() {
  const pick = W.vs.filter(v => v.checked && v.importable);
  if (!pick.length) return;
  const m = W.map, now = new Date().toISOString();
  let maxOrd = Math.max(0, ...[...S.products.values()].map(p => p.ord || 0));
  const out = new Map();
  for (const v of pick) {
    const ex = v.ex && !v.conflict ? v.ex : (v.conflict ? v.ex : null);
    const p = ex ? clone(ex) : { code: v.code, createdAt: now, ord: ++maxOrd, image: null, active: true, note: "", pattern: "", group: "" };
    p.name = v.name; p.size = v.size; p.glaze = v.glaze; p.unit = v.unit || p.unit;
    if (m.group >= 0 || W.sectionMode) p.group = v.group || p.group || "";
    if (m.pattern >= 0) p.pattern = v.pattern;
    if (m.note >= 0) p.note = v.note;
    if (m.status >= 0 && v.status) p.active = parseStatus(v.status);
    p.price = v.pr.ok ? (v.pr.value == null ? (ex ? ex.price ?? null : null) : v.pr.value) : (ex ? ex.price ?? null : null);
    p.updatedAt = now;
    out.set(p.code, p);
  }
  busy("Đang lưu bảng giá…");
  try {
    const metaNext = clone(S.meta);
    metaNext.priceVersion = (metaNext.priceVersion || 0) + 1;
    const gs = new Set(allGroups());
    out.forEach(p => { if (p.group && !gs.has(p.group)) { (metaNext.groups = metaNext.groups || []).push(p.group); gs.add(p.group); } });
    await DB.run(["products", "kv"], "readwrite", t => { const os = t.objectStore("products"); out.forEach(p => os.put(p)); t.objectStore("kv").put({ k: "meta", v: metaNext }); });
    out.forEach(p => S.products.set(p.code, p));
    S.meta = metaNext; S.pe = null; S.cardSel.clear();
    busy();
    const nNew = pick.filter(v => !v.ex).length;
    toast(`Đã nhập bảng giá: ${nNew} sản phẩm mới, ${pick.length - nNew} cập nhật`);
    W.close(); W = null;
    renderPrices();
  } catch (e) { busy(); toast("CHƯA LƯU được bảng giá: " + errMsg(e), "bad"); }
}
