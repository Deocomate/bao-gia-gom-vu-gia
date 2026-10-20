/* ===================== MẪU BAN THỜ ===================== */
function recThumb(r, cls) {
  const u = r.imageId ? S.imgURL.get(r.imageId) : null;
  if (r.imageId && !u) imageURL(r.imageId).then(x => { $$(`[data-rimg="${r.id}"]`).forEach(el => { if (x) el.innerHTML = `<img src="${x}" alt="">`; }); });
  return `<div class="${cls}" data-rimg="${r.id}">${u ? `<img src="${u}" alt="">` : ICON.vase}</div>`;
}
function renderTemplates() {
  const el = $("#view-templates");
  const q = norm(S.tplQ);
  const list = [...S.records.values()].filter(r => r.kind === "template" && (!q || norm(r.name + " " + r.desc).includes(q))).sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));
  el.innerHTML = `<div class="view-head"><div><h1>Mẫu ban thờ</h1><p>Cấu hình lưu sẵn để dùng lại. Nhân bản để thêm/bớt mà không đổi mẫu gốc; tạo báo giá cho khách từ một mẫu.</p></div>
    <div class="btn-row"><input class="inp" type="search" id="tpl-q" placeholder="Tìm mẫu…" value="${esc(S.tplQ)}" style="width:220px"><button class="btn primary" data-act="new">${ICON.plus} Tạo bộ mới</button></div></div>
    ${list.length ? `<div class="tgrid">${list.map(r => { const c = calc(r), pd = priceDiffs(r).length; return `<article class="card tcard">
      ${recThumb(r, "tc-img")}
      <div class="tc-body"><h3>${esc(r.name || "Chưa đặt tên")}</h3>${r.desc ? `<div class="muted" style="font-size:13px">${esc(r.desc)}</div>` : ""}
        <div class="muted" style="font-size:12.5px">${r.items.length} dòng sản phẩm · ${c.count} SP · cập nhật ${fmtDate(r.updatedAt)}</div>
        <div class="tc-total">${money(c.total)} ${c.missing ? '<span class="chip bad">Tạm tính</span>' : ""}</div>
        ${pd ? `<div><span class="chip gold">Có giá mới (${pd} dòng)</span></div>` : ""}</div>
      <div class="tc-acts"><button class="btn sm primary" data-act="open" data-id="${r.id}">Mở / sửa</button><button class="btn sm" data-act="quote" data-id="${r.id}">Tạo báo giá</button><button class="btn sm" data-act="dup" data-id="${r.id}">Nhân bản</button><button class="btn sm ghost danger" data-act="del" data-id="${r.id}">Xóa</button></div>
    </article>`; }).join("")}</div>` : `<div class="panel empty">${q ? "Không có mẫu khớp tìm kiếm." : `Chưa có mẫu nào. Vào <b>Tạo bộ ban thờ</b>, chọn sản phẩm rồi bấm <b>Lưu mẫu</b>.`}</div>`}`;
  $("#tpl-q").oninput = debounce(e => { S.tplQ = e.target.value; renderTemplates(); const i = $("#tpl-q"); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }, 250);
  el.onclick = onListClick;
}
async function onListClick(e) {
  const b = e.target.closest("[data-act]"); if (!b) return;
  const id = b.dataset.id, a = b.dataset.act;
  if (a === "new") { if (await confirmDiscard()) { S.draft = newDraft(); S.draftBase = ""; persistDraft(); show("builder", true); } }
  else if (a === "open") openRecord(id);
  else if (a === "quote") quoteFromTemplate(id);
  else if (a === "dup") duplicateRecord(id);
  else if (a === "del") deleteRecord(id);
  else if (a === "pdf" || a === "png") { const r = S.records.get(id); a === "pdf" ? exportPDF(r) : exportPNG(r); }
}
async function duplicateRecord(id) {
  const r = S.records.get(id); if (!r) return;
  const now = new Date().toISOString();
  const c = clone(r);
  c.id = uid(r.kind === "quote" ? "q" : "tpl"); c.createdAt = now; c.updatedAt = now; c.items.forEach(l => l.lid = uid("l"));
  if (r.kind === "quote") { c.quoteCode = nextQuoteCode(); c.quoteDate = todayISO(); c.name = r.name; }
  else { c.name = (r.name || "Mẫu") + " (bản sao)"; c.sourceTemplateId = r.id; }
  busy("Đang nhân bản…");
  try {
    await DB.run(["records", "kv"], "readwrite", t => { t.objectStore("records").put(c); t.objectStore("kv").put({ k: "meta", v: S.meta }); });
    S.records.set(c.id, c); busy();
    toast(r.kind === "quote" ? `Đã nhân bản thành báo giá ${c.quoteCode}` : `Đã nhân bản thành “${c.name}”. Mẫu gốc không đổi.`);
    S.view === "quotes" ? renderQuotes() : renderTemplates();
  } catch (e) { busy(); toast("Không nhân bản được: " + errMsg(e), "bad"); }
}
async function deleteRecord(id) {
  const r = S.records.get(id); if (!r) return;
  const label = r.kind === "quote" ? `báo giá ${r.quoteCode} (${r.customer?.name || "khách"})` : `mẫu “${r.name}”`;
  if (!(await confirmBox({ title: "Xóa " + (r.kind === "quote" ? "báo giá" : "mẫu") + "?", html: `<p>Xóa vĩnh viễn ${esc(label)}? Thao tác này không hoàn tác được (trừ khi khôi phục từ bản sao lưu).</p>`, okText: "Xóa", danger: true }))) return;
  try {
    const stillUsed = r.imageId && ([...S.records.values()].some(x => x.id !== id && x.imageId === r.imageId) || S.draft.imageId === r.imageId || [...S.products.values()].some(p => p.image === r.imageId));
    await DB.run(["records", "images"], "readwrite", t => { t.objectStore("records").delete(id); if (r.imageId && !stillUsed) t.objectStore("images").delete(r.imageId); });
    S.records.delete(id);
    if (S.draft.id === id) { S.draft.id = null; S.draftBase = ""; persistDraft(); }
    toast("Đã xóa " + label);
    S.view === "quotes" ? renderQuotes() : renderTemplates();
  } catch (e) { toast("Không xóa được: " + errMsg(e), "bad"); }
}
/* ===================== BÁO GIÁ KHÁCH HÀNG ===================== */
function renderQuotes() {
  const el = $("#view-quotes");
  const q = norm(S.quoteQ);
  const list = [...S.records.values()].filter(r => r.kind === "quote" && (!q || norm([r.quoteCode, r.customer?.name, r.customer?.phone, r.name].join(" ")).includes(q))).sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  el.innerHTML = `<div class="view-head"><div><h1>Báo giá khách hàng</h1><p>Báo giá đã lưu giữ nguyên giá tại thời điểm lưu. Khi bảng giá đổi, mở báo giá để xem và chủ động cập nhật nếu muốn.</p></div>
    <div class="btn-row"><input class="inp" type="search" id="q-q" placeholder="Tìm mã, tên khách, SĐT…" value="${esc(S.quoteQ)}" style="width:240px"></div></div>
    ${list.length ? `<div class="tbl-wrap"><table class="list"><thead><tr><th style="width:56px"></th><th>Mã báo giá</th><th>Khách hàng</th><th>Bộ đồ thờ</th><th>Ngày</th><th>Hiệu lực</th><th class="r">Tổng thanh toán</th><th style="width:330px"></th></tr></thead><tbody>
    ${list.map(r => { const c = calc(r), expired = r.validUntil && r.validUntil < todayISO(); return `<tr>
      <td>${recThumb(r, "thumb")}</td>
      <td><b class="num">${esc(r.quoteCode)}</b></td>
      <td><b>${esc(r.customer?.name || "")}</b><div class="muted" style="font-size:12px">${esc([r.customer?.phone, r.customer?.address].filter(Boolean).join(" · "))}</div></td>
      <td>${esc(r.name)}<div class="muted" style="font-size:12px">${r.items.length} dòng · ${c.count} SP</div></td>
      <td>${esc(fmtDay(r.quoteDate))}</td>
      <td>${r.validUntil ? `${esc(fmtDay(r.validUntil))}${expired ? ' <span class="chip off">Hết hạn</span>' : ""}` : '<span class="muted">—</span>'}</td>
      <td class="r"><b>${money(c.total)}</b>${c.missing ? '<div><span class="chip bad">Tạm tính</span></div>' : ""}</td>
      <td><div class="btn-row" style="justify-content:flex-end;gap:4px"><button class="btn sm primary" data-act="open" data-id="${r.id}">Mở</button><button class="btn sm" data-act="pdf" data-id="${r.id}">PDF</button><button class="btn sm" data-act="png" data-id="${r.id}">PNG</button><button class="btn sm" data-act="dup" data-id="${r.id}">Nhân bản</button><button class="btn sm ghost danger" data-act="del" data-id="${r.id}">Xóa</button></div></td></tr>`; }).join("")}
    </tbody></table></div>` : `<div class="panel empty">${q ? "Không có báo giá khớp tìm kiếm." : `Chưa có báo giá nào. Mở một mẫu và bấm <b>Tạo báo giá</b>, hoặc soạn bộ mới rồi bấm <b>Lưu báo giá</b>.`}</div>`}`;
  $("#q-q").oninput = debounce(e => { S.quoteQ = e.target.value; renderQuotes(); const i = $("#q-q"); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }, 250);
  el.onclick = onListClick;
}
/* ===================== SAO LƯU & DỮ LIỆU ===================== */
async function renderData() {
  const el = $("#view-data");
  const nT = [...S.records.values()].filter(r => r.kind === "template").length, nQ = [...S.records.values()].filter(r => r.kind === "quote").length;
  const age = backupAge();
  el.innerHTML = `<div class="view-head"><div><h1>Sao lưu & dữ liệu</h1><p>Dữ liệu được lưu <b>trên máy chủ</b>, dùng chung cho mọi thiết bị khi đăng nhập admin. Hãy xuất bản sao lưu định kỳ và cất ở nơi an toàn (Google Drive, USB…).</p></div></div>
  ${backupDue() ? `<div class="banner warn"><span class="grow">${age == null ? "Bạn <b>chưa sao lưu</b> lần nào." : `Lần sao lưu gần nhất cách đây <b>${age} ngày</b>.`} Hãy xuất bản sao lưu và cất file ở nơi an toàn.</span><button class="btn sm primary" data-act="backup">Sao lưu ngay</button></div>` : ""}
  <div id="legacy-box"></div>
  <div class="empty-state">
    <div class="panel">
      <h3 style="margin:0 0 8px">Dữ liệu hiện có</h3>
      <div class="sumrow"><span class="chip lam">${S.products.size} sản phẩm trong bảng giá</span><span class="chip lam">${nT} mẫu ban thờ</span><span class="chip lam">${nQ} báo giá</span></div>
      <p class="muted" style="margin:0 0 14px">${age == null ? "Chưa sao lưu lần nào." : `Sao lưu gần nhất: ${esc(fmtDate(S.meta.lastBackupAt))}.`} ${S.dbOK ? "" : '<b class="na">Không kết nối được máy chủ.</b>'}</p>
      <div class="btn-row"><button class="btn primary" data-act="backup">Xuất bản sao lưu đầy đủ</button></div>
      <p class="muted" style="margin:12px 0 0;font-size:12.5px">Bản sao lưu là một file .json gồm bảng giá, ảnh sản phẩm, ảnh ban thờ, mẫu, báo giá và bản nháp đang soạn.</p>
    </div>
    <div class="panel">
      <h3 style="margin:0 0 8px">Nạp dữ liệu từ file</h3>
      <p class="muted" style="margin:0 0 12px">Nạp một bản sao lưu .json lên máy chủ: file xuất từ trang này, từ bản cũ chạy trên trình duyệt, hoặc file dữ liệu tạo bằng <code>tools/export_data.py</code>.</p>
      <button class="btn" data-act="restore" ${S.dbOK ? "" : "disabled"}>Khôi phục từ bản sao lưu</button>
      <p class="muted" style="margin:12px 0 0;font-size:12.5px">Trước khi thay thế toàn bộ, máy chủ tự giữ lại một bản của dữ liệu cũ.</p>
    </div>
    <div class="panel">
      <h3 style="margin:0 0 8px">Khôi phục dữ liệu mẫu (bản cũ)</h3>
      <p class="muted" style="margin:0 0 12px">Lấy lại những gì đã nhập ở bản cũ trên trình duyệt này, kể cả ở chế độ <b>Xem thử với dữ liệu mẫu</b> và cả khi đã bấm quay về dữ liệu thật.</p>
      <button class="btn" data-act="legacy-scan" ${S.dbOK ? "" : "disabled"}>Khôi phục dữ liệu mẫu</button>
      <p class="muted" style="margin:12px 0 0;font-size:12.5px">Phải mở trang bằng <b>đúng trình duyệt, đúng máy và đúng địa chỉ</b> đã dùng bản cũ. Dữ liệu đã bị xóa bằng “Làm mới dữ liệu mẫu” hoặc xóa dữ liệu duyệt web thì không lấy lại được.</p>
    </div>
  </div>`;
  el.onclick = async e => {
    const b = e.target.closest("[data-act]"); if (!b) return;
    const a = b.dataset.act;
    if (a === "backup") exportBackup();
    else if (a === "restore") pickFile(".json,application/json", f => restoreBackup(f));
    else if (a === "legacy") {
      const src = LEGACY_DBS.find(x => x.name === b.dataset.db), d = src && await legacyData(src);
      if (d) restoreLegacy(src, d);
    }
    else if (a === "legacy-scan") {
      const list = [];
      for (const src of LEGACY_DBS) { const d = await legacyData(src, true); if (d) list.push({ src, d }); }
      if (!list.length) return toast("Trình duyệt này không còn dữ liệu của bản cũ ở địa chỉ trang này. Hãy mở trang bằng đúng trình duyệt, đúng máy và đúng địa chỉ đã dùng bản cũ.", "bad", 9000);
      let pick = list[0];
      if (list.length > 1) {
        const v = await choiceBox({ title: "Chọn dữ liệu cần khôi phục", html: list.map(x => `<p><b>Dữ liệu ${esc(x.src.label)}</b>: ${legacySummary(x.d)}.</p>`).join("") + "<p class=\"muted\">Muốn lấy cả hai thì khôi phục lần lượt từng kho, chọn <b>Gộp</b>.</p>",
          choices: [{ text: "Hủy", value: null }, ...list.map((x, i) => ({ text: x.src.demo ? "Kho dữ liệu mẫu" : "Kho chính của bản cũ", value: String(i), cls: x.src.demo ? "primary" : "" }))] });
        if (v == null) return;
        pick = list[+v];
      }
      restoreLegacy(pick.src, pick.d);
    }
  };
  const box = $("#legacy-box");
  if (!S.dbOK || !box) return;
  const found = [];
  for (const src of LEGACY_DBS) { const d = await legacyData(src); if (d) found.push(`<div class="banner"><span class="grow">Trình duyệt này còn dữ liệu ${esc(src.label)}: ${legacySummary(d)}.</span><button class="btn sm primary" data-act="legacy" data-db="${src.name}">Đưa lên máy chủ</button></div>`); }
  box.innerHTML = found.join("");
}
async function exportBackup() {
  busy("Đang tạo bản sao lưu…");
  try {
    const [kv, products, records, images] = await Promise.all(["kv", "products", "records", "images"].map(s => DB.req("data/" + s)));
    const data = { app: "gom-vu-gia-bao-gia", format: 1, workspace: "real", exportedAt: new Date().toISOString(), kv, products, records, images };
    const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
    busy();
    if (await saveFile(`Sao_luu_Gom_Vu_Gia_${todayISO()}.json`, blob)) {
      S.meta.lastBackupAt = data.exportedAt;
      try { await saveMeta(); } catch { }
      updateStoreChip();
      if (S.view === "data") renderData();
    }
  } catch (e) { busy(); toast("Không tạo được bản sao lưu: " + errMsg(e), "bad"); }
}
async function restoreBackup(file) {
  let data;
  try { data = JSON.parse(await file.text()); } catch { return toast("File không phải bản sao lưu hợp lệ", "bad"); }
  // data/pdf_data.json (bảng giá gốc chép từ PDF): chỉ có danh sách sản phẩm
  if (data && Array.isArray(data.variants)) {
    const now = new Date().toISOString();
    const products = data.variants.filter(v => v && v.code).map(v => ({ ...v, image: v.image ?? null, createdAt: v.createdAt || now, updatedAt: now }));
    return restoreData({ app: "gom-vu-gia-bao-gia", products, records: [], images: [], kv: [] }, `bảng giá <b>${esc(file.name)}</b>`, true);
  }
  if (!data || data.app !== "gom-vu-gia-bao-gia" || !Array.isArray(data.products)) return toast("File này không phải bản sao lưu của ứng dụng Gốm Vũ Gia", "bad");
  restoreData(data, `file tạo lúc <b>${esc(fmtDate(data.exportedAt))}</b>`);
}
/* onlyProducts: file chỉ có bảng giá – “Thay thế” chỉ thay bảng giá, giữ mẫu, báo giá, ảnh */
async function restoreData(data, srcHtml, onlyProducts = false) {
  const nT = (data.records || []).filter(r => r.kind === "template").length, nQ = (data.records || []).filter(r => r.kind === "quote").length;
  const mode = await choiceBox({ title: "Nạp dữ liệu lên máy chủ", html: `<p>Nguồn: ${srcHtml} – <b>${data.products.length}</b> sản phẩm, <b>${nT}</b> mẫu, <b>${nQ}</b> báo giá, <b>${(data.images || []).length}</b> ảnh.</p>
    <ul style="padding-left:18px"><li><b>Thay thế ${onlyProducts ? "bảng giá" : "toàn bộ"}</b>: xóa ${onlyProducts ? "bảng giá" : "dữ liệu"} hiện tại trên máy chủ rồi nạp dữ liệu này.${onlyProducts ? " Mẫu, báo giá, ảnh giữ nguyên." : ""}</li><li><b>Gộp</b>: giữ dữ liệu hiện tại, thêm/ghi đè các mục trùng mã.</li></ul>`,
    choices: [{ text: "Hủy", value: null }, { text: "Gộp", value: "merge" }, { text: onlyProducts ? "Thay thế bảng giá" : "Thay thế toàn bộ", value: "replace", cls: "danger" }] });
  if (!mode) return;
  busy("Đang nạp dữ liệu…");
  try {
    await DB.run(["kv", "products", "records", "images"], "readwrite", t => {
      if (mode === "replace") (onlyProducts ? ["products"] : ["kv", "products", "records", "images"]).forEach(s => t.objectStore(s).clear());
      (data.kv || []).forEach(x => { if (mode === "replace" || x.k !== "draft") t.objectStore("kv").put(x); });
      data.products.forEach(p => t.objectStore("products").put(p));
      (data.records || []).forEach(r => t.objectStore("records").put(r));
      (data.images || []).forEach(im => t.objectStore("images").put(im));
    });
    await loadAll(); busy(); updateStoreChip();
    toast(`Đã nạp: ${data.products.length} sản phẩm, ${nT} mẫu, ${nQ} báo giá`);
    VIEWS[S.view]();
    return true;
  } catch (e) { busy(); toast("KHÔNG nạp được: " + errMsg(e) + ". Dữ liệu trên máy chủ giữ nguyên.", "bad"); }
}
/* Bản cũ lưu dữ liệu ngay trên trình duyệt (IndexedDB): kho chính và kho của chế độ “dữ liệu mẫu” (Xem thử).
   Chỉ đọc ra để đưa lên máy chủ, không sửa hay xóa gì ở kho cũ. */
const LEGACY_DBS = [{ name: "gom_vu_gia", label: "của bản cũ" }, { name: "gom_vu_gia_du_lieu_mau", label: "nhập ở chế độ dữ liệu mẫu (Xem thử) của bản cũ", demo: true }];
const legacySummary = d => `<b>${d.products.length}</b> sản phẩm, <b>${d.records.filter(r => r.kind === "template").length}</b> mẫu, <b>${d.records.filter(r => r.kind === "quote").length}</b> báo giá, <b>${d.images.length}</b> ảnh`;
async function restoreLegacy(src, d) {
  if (await restoreData(d, `dữ liệu ${src.label} trên trình duyệt này`)) { try { localStorage.setItem("gvg_legacy_done:" + src.name, "1"); } catch { } renderData(); }
}
/* force: đọc cả khi đã đưa lên máy chủ trước đó (nút “Khôi phục dữ liệu mẫu”); không thì thông báo chỉ hiện một lần */
async function legacyData(src, force = false) {
  try { if (!window.indexedDB || (!force && localStorage.getItem("gvg_legacy_done:" + src.name))) return null; } catch { return null; }
  const db = await new Promise(res => {
    let r;
    try { r = indexedDB.open(src.name); } catch { return res(null); }
    r.onupgradeneeded = e => { if (e.oldVersion === 0) r.transaction.abort(); }; // chưa từng có thì không tạo kho mới
    r.onsuccess = () => res(r.result);
    r.onerror = () => res(null);
    r.onblocked = () => res(null);
  });
  if (!db) return null;
  try {
    const all = st => new Promise((res, rej) => { const q = db.transaction(st).objectStore(st).getAll(); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); });
    const [kv, products, records, images] = await Promise.all(["kv", "products", "records", "images"].map(all));
    if (!products.length && !records.length) return null;
    if (src.demo) { // bỏ cờ “dữ liệu mẫu” để thành dữ liệu thật
      products.forEach(p => delete p.demo);
      records.forEach(r => { delete r.demo; r.name = String(r.name || "").replace(/\s*\(MẪU\)\s*$/, ""); });
      kv.forEach(x => { if (x.v && typeof x.v === "object") delete x.v.demo; if (x.k === "draft" && x.v?.draft) delete x.v.draft.demo; });
    }
    return { kv, products, records, images };
  } catch { return null; } finally { db.close(); }
}
