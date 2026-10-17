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
  el.innerHTML = `<div class="view-head"><div><h1>Mẫu ban thờ ${S.ws === "demo" ? '<span class="chip gold">Dữ liệu mẫu</span>' : ""}</h1><p>Cấu hình lưu sẵn để dùng lại. Nhân bản để thêm/bớt mà không đổi mẫu gốc; tạo báo giá cho khách từ một mẫu.</p></div>
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
  el.innerHTML = `<div class="view-head"><div><h1>Báo giá khách hàng ${S.ws === "demo" ? '<span class="chip gold">Dữ liệu mẫu</span>' : ""}</h1><p>Báo giá đã lưu giữ nguyên giá tại thời điểm lưu. Khi bảng giá đổi, mở báo giá để xem và chủ động cập nhật nếu muốn.</p></div>
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
  let est = "";
  try { const e = await navigator.storage.estimate(); est = `Đang dùng khoảng ${(e.usage / 1048576).toFixed(1)} MB bộ nhớ trình duyệt.`; } catch { }
  el.innerHTML = `<div class="view-head"><div><h1>Sao lưu & dữ liệu</h1><p>Hiện dữ liệu được lưu <b>trên trình duyệt của thiết bị này</b> (IndexedDB), gồm cả ảnh. Thiết bị hoặc trình duyệt khác sẽ không thấy dữ liệu này. Xóa dữ liệu duyệt web có thể làm mất dữ liệu – hãy xuất bản sao lưu thường xuyên.</p></div></div>
  <div class="empty-state">
    <div class="panel">
      <h3 style="margin:0 0 8px">Đang mở: ${S.ws === "demo" ? '<span class="chip gold">Dữ liệu mẫu</span>' : '<span class="chip ok">Dữ liệu thật</span>'}</h3>
      <div class="sumrow"><span class="chip lam">${S.products.size} biến thể trong bảng giá</span><span class="chip lam">${nT} mẫu ban thờ</span><span class="chip lam">${nQ} báo giá</span></div>
      <p class="muted" style="margin:0 0 14px">${esc(est)} ${S.dbOK ? "" : '<b class="na">Trình duyệt đang không cho lưu dữ liệu.</b>'}</p>
      <div class="btn-row"><button class="btn primary" data-act="backup">Xuất bản sao lưu đầy đủ</button><button class="btn" data-act="restore">Khôi phục từ bản sao lưu</button></div>
      <p class="muted" style="margin:12px 0 0;font-size:12.5px">Bản sao lưu là một file .json gồm bảng giá, ảnh sản phẩm, ảnh ban thờ, mẫu, báo giá và bản nháp đang soạn.</p>
    </div>
    <div class="panel">
      <h3 style="margin:0 0 8px">Dữ liệu mẫu</h3>
      <p class="muted" style="margin:0 0 12px">Dữ liệu mẫu (bảng giá chép từ PDF, một mẫu ban thờ có ảnh, một báo giá) nằm trong kho riêng, không trộn với dữ liệu thật.</p>
      ${S.ws === "demo" ? `<div class="btn-row"><button class="btn primary" data-act="real">Quay về dữ liệu thật</button><button class="btn danger" data-act="reset-demo">Làm mới dữ liệu mẫu</button></div>` : `<button class="btn" data-act="demo">Xem thử với dữ liệu mẫu</button>`}
      <p class="muted" style="margin:12px 0 0;font-size:12.5px">Cấu trúc dữ liệu (sản phẩm theo mã, mẫu, báo giá, ảnh) đã tách riêng để sau này chuyển lên cơ sở dữ liệu dùng chung nhiều thiết bị.</p>
    </div>
  </div>`;
  el.onclick = async e => {
    const b = e.target.closest("[data-act]"); if (!b) return;
    const a = b.dataset.act;
    if (a === "backup") exportBackup();
    else if (a === "restore") pickFile(".json,application/json", f => restoreBackup(f));
    else if (a === "demo") switchWorkspace("demo");
    else if (a === "real") switchWorkspace("real");
    else if (a === "reset-demo") { if (await confirmBox({ title: "Làm mới dữ liệu mẫu?", html: "<p>Mọi thay đổi trong dữ liệu mẫu sẽ bị xóa và nạp lại từ đầu. Dữ liệu thật không bị ảnh hưởng.</p>", okText: "Làm mới", danger: true })) { await DB.run(["kv", "products", "records", "images"], "readwrite", t => ["kv", "products", "records", "images"].forEach(s => t.objectStore(s).clear())); await openWorkspace(); show("builder", true); toast("Đã làm mới dữ liệu mẫu"); } }
  };
}
function blobToDataURL(b) { return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = () => rej(r.error); r.readAsDataURL(b); }); }
function dataURLToBlob(u) { const [h, d] = u.split(","); const type = (h.match(/data:([^;]+)/) || [])[1] || "application/octet-stream"; const bin = atob(d); const a = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i); return new Blob([a], { type }); }
async function exportBackup() {
  busy("Đang tạo bản sao lưu…");
  try {
    const [kv, products, records, images] = await Promise.all(["kv", "products", "records", "images"].map(s => DB.getAll(s)));
    const imgs = [];
    for (const im of images) imgs.push({ id: im.id, type: im.type, w: im.w, h: im.h, createdAt: im.createdAt, data: await blobToDataURL(im.blob) });
    const data = { app: "gom-vu-gia-bao-gia", format: 1, workspace: S.ws, exportedAt: new Date().toISOString(), kv, products, records, images: imgs };
    const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
    busy();
    await saveFile(`${S.ws === "demo" ? "DU-LIEU-MAU_" : ""}Sao_luu_Gom_Vu_Gia_${todayISO()}.json`, blob);
  } catch (e) { busy(); toast("Không tạo được bản sao lưu: " + errMsg(e), "bad"); }
}
async function restoreBackup(file) {
  let data;
  try { data = JSON.parse(await file.text()); } catch { return toast("File không phải bản sao lưu hợp lệ", "bad"); }
  if (!data || data.app !== "gom-vu-gia-bao-gia" || !Array.isArray(data.products)) return toast("File này không phải bản sao lưu của ứng dụng Gốm Vũ Gia", "bad");
  const nT = (data.records || []).filter(r => r.kind === "template").length, nQ = (data.records || []).filter(r => r.kind === "quote").length;
  const mode = await choiceBox({ title: "Khôi phục bản sao lưu", html: `<p>File tạo lúc <b>${esc(fmtDate(data.exportedAt))}</b>${data.workspace === "demo" ? ' (từ <b>dữ liệu mẫu</b>)' : ""}: <b>${data.products.length}</b> biến thể, <b>${nT}</b> mẫu, <b>${nQ}</b> báo giá, <b>${(data.images || []).length}</b> ảnh.</p>
    <p>Khôi phục vào: <b>${S.ws === "demo" ? "dữ liệu mẫu" : "dữ liệu thật"}</b> đang mở.</p>
    <ul style="padding-left:18px"><li><b>Thay thế toàn bộ</b>: xóa dữ liệu hiện tại rồi nạp bản sao lưu.</li><li><b>Gộp</b>: giữ dữ liệu hiện tại, thêm/ghi đè các mục trùng mã.</li></ul>`,
    choices: [{ text: "Hủy", value: null }, { text: "Gộp", value: "merge" }, { text: "Thay thế toàn bộ", value: "replace", cls: "danger" }] });
  if (!mode) return;
  busy("Đang khôi phục…");
  try {
    const imgs = (data.images || []).map(im => ({ id: im.id, type: im.type, w: im.w, h: im.h, createdAt: im.createdAt, blob: dataURLToBlob(im.data) }));
    await DB.run(["kv", "products", "records", "images"], "readwrite", t => {
      if (mode === "replace") ["kv", "products", "records", "images"].forEach(s => t.objectStore(s).clear());
      (data.kv || []).forEach(x => { if (mode === "replace" || x.k !== "draft") t.objectStore("kv").put(x); });
      data.products.forEach(p => t.objectStore("products").put(p));
      (data.records || []).forEach(r => t.objectStore("records").put(r));
      imgs.forEach(im => t.objectStore("images").put(im));
    });
    await loadAll(); busy();
    toast(`Đã khôi phục: ${data.products.length} biến thể, ${nT} mẫu, ${nQ} báo giá`);
    renderData();
  } catch (e) { busy(); toast("KHÔNG khôi phục được: " + errMsg(e) + ". Dữ liệu hiện tại giữ nguyên.", "bad"); }
}
/* ===================== DỮ LIỆU MẪU (kho riêng) ===================== */
async function ensureDemoSeed() {
  const meta = await DB.get("kv", "meta");
  if (meta) return;
  const now = new Date().toISOString();
  const prods = PDF_DATA.variants.map(v => ({ ...v, demo: true, image: null, createdAt: now, updatedAt: now }));
  const find = (name, size, glaze = "Men lam vẽ vàng") => prods.find(p => p.name === name && p.size === size && p.glaze === glaze);
  const lines = [["Bát hương rồng kĩ", "Ø20", 1], ["Đế sứ bát hương", "Ø20", 1], ["Bát hương rồng kĩ", "Ø18", 2], ["Đế sứ bát hương", "Ø18", 2], ["Lộc bình sen", "H40", 1], ["Chóe thờ sen", "S3", 3], ["Đèn tròn sen", "S1", 2], ["Bát cơm sen", "", 6], ["Mâm bồng sen Phúc", "Ø27", 2], ["Bộ ấm 5 chén cúng sen", "", 1], ["Ống hương sen", "S1", 1], ["Nậm 2 bầu sen", "S2", 1], ["Chân nến sen", "S3", 2], ["Kỉ ngai 3 sen", "", 1]];
  const items = lines.map(([n, s, q]) => { const p = find(n, s); return { lid: uid("l"), code: p.code, name: p.name, pattern: p.pattern, size: p.size, glaze: p.glaze, unit: p.unit, price: p.price, qty: q }; });
  const blob = dataURLToBlob(DEMO_IMG);
  const imgId = "img_demo_altar";
  const tpl = { ...newDraft(), id: "tpl_demo_1", kind: "template", name: "Bộ Phúc Liên Hoa – vẽ vàng (MẪU)", desc: "Dữ liệu mẫu để dùng thử – 14 vật phẩm", altarSize: "", imageId: imgId, items, createdAt: now, updatedAt: now, demo: true };
  tpl.imageSig = itemsSig(tpl);
  const q = { ...clone(tpl), id: "q_demo_1", kind: "quote", name: "Bộ Phúc Liên Hoa – vẽ vàng", quoteCode: "BG-MAU-001", customer: { name: "Khách hàng mẫu", phone: "0900 000 000", address: "Địa chỉ mẫu" }, quoteDate: todayISO(), validUntil: "", shipping: 300000, discount: { mode: "percent", value: 5 }, note: "Dữ liệu mẫu – không phải báo giá thật." };
  q.items.forEach(l => l.lid = uid("l"));
  await DB.run(["kv", "products", "records", "images"], "readwrite", t => {
    prods.forEach(p => t.objectStore("products").put(p));
    t.objectStore("images").put({ id: imgId, blob, type: "image/jpeg", w: DEMO_IMG_W, h: DEMO_IMG_H, createdAt: now });
    t.objectStore("records").put(tpl); t.objectStore("records").put(q);
    t.objectStore("kv").put({ k: "meta", v: { groups: [], counters: {}, priceVersion: 1, createdAt: now, demo: true } });
    t.objectStore("kv").put({ k: "draft", v: { draft: clone(tpl), base: contentSig(tpl) } });
  });
}
