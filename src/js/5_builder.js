/* ===================== TẠO BỘ BAN THỜ ===================== */
let draftSaveFailed = false;
const persistDraft = debounce(async () => {
  if (!S.dbOK) return;
  try { await DB.put("kv", { k: "draft", v: { draft: S.draft, base: S.draftBase } }); if (draftSaveFailed) toast("Đã lưu lại được bản nháp"); draftSaveFailed = false; }
  catch (e) { if (!draftSaveFailed) toast("Không lưu được bản nháp: " + errMsg(e), "bad"); draftSaveFailed = true; }
}, 500);
function touched() { persistDraft(); updateBStatus(); }

function modeTitle(d) {
  if (d.kind === "quote") return d.id ? `Báo giá ${d.quoteCode}` : "Báo giá mới (chưa lưu)";
  if (d.kind === "template") return d.id ? `Mẫu: ${d.name || "chưa đặt tên"}` : "Bản sao mẫu (chưa lưu)";
  return "Bộ ban thờ mới";
}
function updateBStatus() {
  const el = $("#b-status"); if (!el) return;
  const d = S.draft;
  if (!d.id) el.textContent = d.items.length ? "Chưa lưu thành mẫu hoặc báo giá · bản nháp tự lưu trên trình duyệt" : "Chọn sản phẩm từ danh mục để bắt đầu";
  else el.innerHTML = draftDirty() ? `<span style="color:var(--warn);font-weight:600">Có thay đổi chưa lưu</span> · cập nhật lần cuối ${fmtDate(d.updatedAt)}` : `Đã lưu · cập nhật ${fmtDate(d.updatedAt)}`;
}
function renderBuilder() {
  const el = $("#view-builder"), d = S.draft;
  el.innerHTML = `
  <div class="b-top">
    <div class="mode"><b>${esc(modeTitle(d))}</b><span id="b-status"></span></div>
    <div class="btn-row">
      <button class="btn cat-toggle" data-act="cat-open">${ICON.plus} Danh mục sản phẩm</button>
      <button class="btn ghost" data-act="new">Bộ mới</button>
      <button class="btn" data-act="save-tpl">Lưu mẫu</button>
      <button class="btn primary" data-act="save-quote">Lưu báo giá</button>
      <button class="btn" data-act="dup">Nhân bản</button>
      <button class="btn" data-act="preview">Xem trước</button>
      <button class="btn" data-act="pdf">Xuất PDF</button>
      <button class="btn" data-act="png">Xuất ảnh PNG</button>
      <button class="btn" data-act="print">In</button>
    </div>
  </div>
  <div id="b-banners"></div>
  <div class="b-layout ${S.catHidden ? "nocat" : ""}">
    ${S.catHidden ? "" : `<aside class="catalog" id="catalog" aria-label="Danh mục sản phẩm"></aside>`}
    <div class="sheet" id="sheet"></div>
  </div>
  <div class="mbar"><div class="t"><small id="mb-sub">Tạm tính</small><b id="mb-total" class="num">0 đ</b></div>
    <button class="btn" data-act="cat-open">${ICON.plus} Thêm SP</button><button class="btn primary" data-act="save-any">Lưu</button></div>`;
  el.onclick = onBuilderClick;
  el.oninput = onBuilderInput;
  el.onchange = onBuilderChange;
  if (!S.catHidden) renderCatalog();
  renderSheet();
  updateBStatus();
}
/* ----- Danh mục ----- */
function catalogBases() {
  const map = new Map();
  for (const p of sortProducts([...S.products.values()].filter(p => p.active !== false))) {
    const key = [p.group, p.name, p.pattern].join("|");
    let b = map.get(key);
    if (!b) { b = { key, group: p.group, name: p.name, pattern: p.pattern, variants: [], sizes: [], glazes: [], image: null }; map.set(key, b); }
    b.variants.push(p);
    if (!b.sizes.includes(p.size)) b.sizes.push(p.size);
    if (!b.glazes.includes(p.glaze)) b.glazes.push(p.glaze);
    if (!b.image && p.image) b.image = p.image;
  }
  return [...map.values()];
}
function renderCatalog() {
  const box = $("#catalog"); if (!box) return;
  const bases = catalogBases();
  const groups = [...new Set(bases.map(b => b.group || "Khác"))];
  const glazes = [...new Set(bases.flatMap(b => b.glazes).filter(Boolean))];
  box.innerHTML = `<div class="cat-head">
      <h3><span>Danh mục sản phẩm</span><span class="btn-row"><button class="btn sm ghost" data-act="cat-hide" title="Ẩn danh mục">Ẩn</button><button class="btn sm cat-close" data-act="cat-close">Đóng</button></span></h3>
      <input class="inp" type="search" id="cat-q" placeholder="Tìm tên, kích thước, mã…" value="${esc(S.cat.q)}" aria-label="Tìm sản phẩm">
      ${glazes.length > 1 ? `<select class="inp" id="cat-glaze" aria-label="Dòng men"><option value="">Mọi dòng men</option>${glazes.map(g => `<option ${g === S.cat.glaze ? "selected" : ""}>${esc(g)}</option>`).join("")}</select>` : ""}
      <div class="muted" style="font-size:12px">Chọn quy cách, dòng men rồi bấm <b>Thêm vào bộ</b> (hoặc bấm vào tên sản phẩm).</div>
      ${groups.length > 8
        ? `<select class="inp" id="cat-group" aria-label="Nhóm sản phẩm"><option value="">Tất cả nhóm (${groups.length})</option>${groups.map(g => `<option ${S.cat.group === g ? "selected" : ""}>${esc(g)}</option>`).join("")}</select>`
        : `<div class="cat-groups"><button class="gchip" data-cg="" aria-pressed="${!S.cat.group}">Tất cả</button>${groups.map(g => `<button class="gchip" data-cg="${esc(g)}" aria-pressed="${S.cat.group === g}">${esc(g)}</button>`).join("")}</div>`}
    </div><div class="cat-list" id="cat-list"></div>`;
  $("#cat-q").oninput = debounce(e => { S.cat.q = e.target.value; renderCatList(); }, 200);
  const cgs = $("#cat-group"); if (cgs) cgs.onchange = () => { S.cat.group = cgs.value; renderCatList(); };
  const gs = $("#cat-glaze"); if (gs) gs.onchange = () => { S.cat.glaze = gs.value; S.cardSel.clear(); renderCatList(); };
  renderCatList();
}
function findBase(key) { return (S.catBases && S.catBases.get(key)) || catalogBases().find(x => x.key === key); }
function cardState(b) {
  let s = S.cardSel.get(b.key);
  const has = (size, glaze) => b.variants.find(v => v.size === size && v.glaze === glaze);
  if (s && !has(s.size, s.glaze)) s = null; // lựa chọn cũ không còn khớp bảng giá → chọn lại mặc định
  if (!s) {
    s = { size: b.sizes[0], glaze: null, qty: 1 };
    const prefer = [S.cat.glaze, ...b.glazes].filter(Boolean);
    s.glaze = prefer.find(g => has(s.size, g)) ?? b.variants.find(v => v.size === s.size)?.glaze ?? "";
    S.cardSel.set(b.key, s);
  }
  return s;
}
function renderCatList() {
  const box = $("#cat-list"); if (!box) return;
  if (!S.products.size) { box.innerHTML = `<div class="empty">Chưa có bảng giá.<br><button class="btn sm" data-view="prices" data-go="1" style="margin-top:8px">Nhập bảng giá Excel</button></div>`; return; }
  const q = norm(S.cat.q);
  const all = catalogBases();
  S.catBases = new Map(all.map(b => [b.key, b]));
  const list = all.filter(b => {
    if (S.cat.group && (b.group || "Khác") !== S.cat.group) return false;
    if (S.cat.glaze && !b.glazes.includes(S.cat.glaze)) return false;
    if (q && !norm([b.name, b.group, b.pattern, ...b.sizes, ...b.variants.map(v => v.code)].join(" ")).includes(q)) return false;
    return true;
  });
  box.innerHTML = list.map(cardHTML).join("") || `<div class="empty">Không tìm thấy sản phẩm.</div>`;
  list.forEach(b => { if (b.image && !S.imgURL.get(b.image)) imageURL(b.image).then(u => { const i = $(`[data-pimg="${CSS.escape(b.key)}"]`); if (i && u) i.innerHTML = `<img src="${u}" alt="">`; }); });
}
function cardHTML(b) {
  const s = cardState(b);
  const v = b.variants.find(x => x.size === s.size && x.glaze === s.glaze);
  const url = b.image ? S.imgURL.get(b.image) : null;
  const sizes = b.sizes.length > 1 || b.sizes[0] ? `<div class="opts" role="group" aria-label="Quy cách">${b.sizes.map(z => `<button class="opt" data-act="c-size" data-key="${esc(b.key)}" data-v="${esc(z)}" aria-pressed="${z === s.size}">${esc(z || "Tiêu chuẩn")}</button>`).join("")}</div>` : "";
  const glz = b.glazes.length > 1 || b.glazes[0] ? `<div class="opts" role="group" aria-label="Dòng men">${b.glazes.map(g => `<button class="opt ${/vàng/i.test(g) ? "gold" : ""}" data-act="c-glaze" data-key="${esc(b.key)}" data-v="${esc(g)}" aria-pressed="${g === s.glaze}" ${b.variants.some(x => x.size === s.size && x.glaze === g) ? "" : "disabled"}>${esc(g || "—")}</button>`).join("")}</div>` : "";
  return `<div class="pcard" data-key="${esc(b.key)}">
    <div class="pimg" data-pimg="${esc(b.key)}" data-act="c-add" data-key="${esc(b.key)}" title="Bấm để thêm vào bộ" style="cursor:pointer">${url ? `<img src="${url}" alt="">` : ICON.vase}</div>
    <div style="min-width:0"><h4 data-act="c-add" data-key="${esc(b.key)}" title="Bấm để thêm vào bộ" style="cursor:pointer">${esc(b.name)}</h4><div class="meta">${esc([b.group, b.pattern && "Họa tiết " + b.pattern.toLowerCase()].filter(Boolean).join(" · "))}</div>${sizes}${glz}</div>
    <div class="add">
      ${v ? (v.price == null ? `<span class="price na">Chưa có giá</span>` : `<span><span class="price">${money(v.price)}</span> <span class="muted">/ ${esc(v.unit)}</span></span>`) : `<span class="price na">Không có biến thể này</span>`}
      <span class="btn-row" style="gap:6px"><span class="stepper"><input aria-label="Số lượng thêm" data-cqty="${esc(b.key)}" value="${s.qty}" inputmode="numeric"></span>
      <button class="btn sm primary" data-act="c-add" data-key="${esc(b.key)}" ${v ? "" : "disabled"}>Thêm vào bộ</button></span>
    </div></div>`;
}
function addLine(p, qty = 1) {
  const d = S.draft;
  const ex = d.items.find(l => l.code === p.code);
  if (ex) ex.qty += qty;
  else d.items.push({ lid: uid("l"), code: p.code, name: p.name, pattern: p.pattern || "", size: p.size || "", glaze: p.glaze || "", unit: p.unit, price: p.price ?? null, qty });
  renderItems(); touched();
  const code = p.code;
  requestAnimationFrame(() => {
    const ln = S.draft.items.find(l => l.code === code), tr = ln && $(`tr[data-lid="${ln.lid}"]`);
    if (!tr) return;
    tr.classList.add("flash"); setTimeout(() => tr.classList.remove("flash"), 1600);
    const r = tr.getBoundingClientRect();
    if (r.top < 70 || r.bottom > innerHeight - 70) tr.scrollIntoView({ block: "center", behavior: "smooth" });
  });
  toast(`${ex ? "Đã cộng thêm" : "Đã thêm"} ${qty} ${p.unit}: ${pLabel(p)}${ex ? ` (nay ${ex.qty})` : ""}`, "ok", 1800);
}
/* ----- Phiếu ----- */
function renderSheet() {
  const box = $("#sheet"), d = S.draft;
  const isQ = d.kind === "quote";
  box.innerHTML = `
  <div class="sheet-head">
    <div class="sheet-brand"><img class="logo lt" src="${LOGO_BROWN}" alt="Gốm Vũ Gia"><img class="logo dk" src="${LOGO_CREAM}" alt="Gốm Vũ Gia"><small>${isQ ? "Báo giá đồ thờ" : "Bộ ban thờ"}</small></div>
    <div style="min-width:0">
      <input class="title-inp" id="d-name" placeholder="Nhập tên bộ ban thờ…" value="${esc(d.name)}" aria-label="Tên bộ ban thờ">
      <div class="head-fields"><input class="inp" id="d-desc" placeholder="Mô tả ngắn (không bắt buộc)" value="${esc(d.desc)}" aria-label="Mô tả"><input class="inp" id="d-altar" placeholder="Kích thước ban thờ, ví dụ 1m53" value="${esc(d.altarSize)}" aria-label="Kích thước ban thờ"></div>
      ${isQ ? "" : `<button class="btn sm ghost" data-act="to-quote" style="margin-top:6px">${ICON.plus} Thêm thông tin khách hàng (lập báo giá)</button>`}
    </div>
  </div>
  ${isQ ? `<div class="cust">
    <label class="field w2"><span>Khách hàng</span><input class="inp" id="c-name" value="${esc(d.customer.name)}" placeholder="Tên khách hàng"></label>
    <label class="field"><span>Số điện thoại</span><input class="inp" id="c-phone" value="${esc(d.customer.phone)}" inputmode="tel"></label>
    <label class="field w2"><span>Địa chỉ</span><input class="inp" id="c-addr" value="${esc(d.customer.address)}"></label>
    <label class="field"><span>Mã báo giá</span><input class="inp" id="c-code" value="${esc(d.quoteCode)}" placeholder="Tự tạo khi lưu"></label>
    <label class="field w2"><span>Ngày báo giá</span><input class="inp" type="date" id="c-date" value="${esc(d.quoteDate)}"></label>
    <label class="field w2"><span>Hiệu lực đến (nếu có)</span><input class="inp" type="date" id="c-valid" value="${esc(d.validUntil)}"></label>
  </div>` : ""}
  <div class="sheet-body">
    <div class="photo" id="photo"></div>
    <div class="items-wrap"><table class="items"><thead><tr><th style="width:34px" class="c">STT</th><th>Tên sản phẩm và quy cách</th><th style="width:46px" class="c">ĐVT</th><th style="width:88px" class="r">Đơn giá</th><th style="width:96px" class="c">Số lượng</th><th style="width:98px" class="r">Thành tiền</th><th style="width:62px"><span class="sr" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)">Thao tác</span></th></tr></thead><tbody id="items-body"></tbody></table><div id="items-empty"></div></div>
  </div>
  <div class="totals">
    <div style="display:flex;flex-direction:column;gap:10px;min-width:0">
      <label class="field"><span>Ghi chú báo giá</span><textarea class="inp" id="d-note" rows="3" placeholder="Ví dụ: Giao hàng trong 5–7 ngày, đóng gói chống vỡ…">${esc(d.note)}</textarea></label>
      <label class="field"><span>Ghi chú VAT (nếu cần)</span><input class="inp" id="d-vat" value="${esc(d.vatNote)}" placeholder="Ví dụ: Giá trên chưa bao gồm VAT"></label>
    </div>
    <div>
      <div class="trow"><span class="lbl">Tổng tiền vật phẩm <span class="muted" id="t-count"></span></span><span class="val" id="t-sub"></span></div>
      <div class="trow"><span class="lbl">Giảm giá
        <select class="inp" id="d-dmode" style="width:auto"><option value="none" ${d.discount.mode === "none" ? "selected" : ""}>Không giảm</option><option value="percent" ${d.discount.mode === "percent" ? "selected" : ""}>Giảm %</option><option value="amount" ${d.discount.mode === "amount" ? "selected" : ""}>Giảm số tiền</option></select>
        <input class="inp money-inp" id="d-dval" style="width:110px!important" inputmode="decimal" value="${d.discount.mode === "amount" ? fmt(d.discount.value) : d.discount.mode === "percent" ? String(d.discount.value).replace(".", ",") : ""}" ${d.discount.mode === "none" ? "hidden" : ""} aria-label="Mức giảm"></span>
        <span class="val" id="t-disc"></span></div>
      <div class="errtxt" id="t-derr" style="text-align:right"></div>
      <div class="trow"><span class="lbl">Phí vận chuyển</span><input class="inp money-inp" data-fee="shipping" inputmode="numeric" value="${fmt(d.shipping)}" placeholder="0"></div>
      <div class="trow"><span class="lbl">Phí lắp đặt</span><input class="inp money-inp" data-fee="install" inputmode="numeric" value="${fmt(d.install)}" placeholder="0"></div>
      <div class="trow"><span class="lbl">Phụ phí khác <input class="inp" id="d-olabel" style="width:150px" value="${esc(d.otherFeeLabel)}" placeholder="Nội dung phụ phí"></span><input class="inp money-inp" data-fee="otherFee" inputmode="numeric" value="${fmt(d.otherFee)}" placeholder="0"></div>
      <div class="trow grand"><span class="lbl">TỔNG THANH TOÁN</span><span class="val" id="t-total"></span></div>
      <div class="provisional" id="t-prov"></div>
    </div>
  </div>`;
  renderPhoto(); renderItems(); renderBanners();
}
async function renderPhoto() {
  const box = $("#photo"), d = S.draft; if (!box) return;
  const url = d.imageId ? await imageURL(d.imageId) : null;
  if (!url) {
    box.innerHTML = `<div class="photo-box"><label class="drop" id="ph-drop">${ICON.upload}<b>Tải ảnh ban thờ</b><span>Ảnh chụp ban thờ hoặc bộ đồ thờ đã sắp xếp.<br>Kéo thả hoặc bấm để chọn.</span><input type="file" accept="image/*" id="ph-file" hidden></label></div>
      <button class="btn sm primary" data-act="compose" ${d.items.length ? "" : "disabled"}>Tự sắp ảnh ban thờ từ ảnh sản phẩm</button>
      ${d.imageId ? `<div class="stale">Không đọc được ảnh đã lưu. Hãy tải lại ảnh.</div>` : ""}`;
    const inp = $("#ph-file"), dr = $("#ph-drop");
    inp.onchange = () => inp.files[0] && setPhoto(inp.files[0]);
    dr.ondragover = e => { e.preventDefault(); dr.classList.add("over"); };
    dr.ondragleave = () => dr.classList.remove("over");
    dr.ondrop = e => { e.preventDefault(); dr.classList.remove("over"); e.dataTransfer.files[0] && setPhoto(e.dataTransfer.files[0]); };
    return;
  }
  const stale = d.imageSig != null && d.imageSig !== itemsSig(d);
  box.innerHTML = `<div class="photo-box"><img src="${url}" alt="Ảnh ban thờ" data-act="zoom" title="Bấm để phóng to"></div>
    <div class="btn-row"><button class="btn sm" data-act="ph-change">Thay ảnh</button><button class="btn sm" data-act="zoom">Phóng to</button><button class="btn sm ghost danger" data-act="ph-remove">Bỏ ảnh</button><button class="btn sm primary" data-act="compose">${d.compose ? "Sửa ảnh ghép" : "Tự sắp ảnh từ ảnh sản phẩm"}</button></div>
    ${stale ? `<div class="stale"><span style="flex:1;min-width:180px">Danh sách vật phẩm đã thay đổi sau lần tải ảnh gần nhất. Ảnh có thể không còn khớp – hãy cập nhật ảnh nếu cần.</span><button class="btn sm" data-act="ph-ok">Ảnh vẫn đúng</button></div>` : ""}`;
}
async function setPhoto(file) {
  busy("Đang lưu ảnh…");
  try { const id = await storeImageFile(file); S.draft.imageId = id; S.draft.compose = null; S.draft.imageSig = itemsSig(S.draft); busy(); renderPhoto(); touched(); toast("Đã lưu ảnh ban thờ"); }
  catch (e) { busy(); toast("Không lưu được ảnh: " + errMsg(e), "bad"); }
}
function lineTags(l) {
  const p = S.products.get(l.code), t = [];
  if (!p) t.push('<span class="chip off">Không còn trong bảng giá</span>');
  else {
    if (p.active === false) t.push('<span class="chip off">Ngừng dùng</span>');
    if ((p.price ?? null) !== (l.price ?? null)) t.push(`<span class="chip gold">Giá hiện tại: ${p.price == null ? "chưa có" : money(p.price)}</span>`);
  }
  return t.length ? `<div class="btn-row" style="gap:4px;margin-top:3px">${t.join("")}</div>` : "";
}
function renderItems() {
  const tb = $("#items-body"), d = S.draft; if (!tb) return;
  tb.innerHTML = d.items.map((l, i) => `<tr data-lid="${l.lid}">
    <td class="c num">${i + 1}</td>
    <td class="it-name"><b>${esc(lineTitle(l))}</b><small>${esc(lineSub(l))}</small>${lineTags(l)}</td>
    <td class="c">${esc(l.unit)}</td>
    <td class="r">${l.price == null ? '<span class="na">Chưa có giá</span>' : fmt(l.price)}</td>
    <td class="c"><div class="stepper"><button data-act="dec" aria-label="Giảm">−</button><input data-qty value="${l.qty}" inputmode="numeric" aria-label="Số lượng"><button data-act="inc" aria-label="Tăng">+</button></div></td>
    <td class="r" data-amt>${l.price == null ? "—" : fmt(l.price * l.qty)}</td>
    <td><div class="row-acts">
      <button class="ibtn" data-act="up" title="Lên" ${i === 0 ? "disabled" : ""}>${ICON.up}</button><button class="ibtn" data-act="down" title="Xuống" ${i === d.items.length - 1 ? "disabled" : ""}>${ICON.down}</button>
      <button class="ibtn" data-act="swap" title="Thay sản phẩm">${ICON.swap}</button><button class="ibtn del" data-act="del" title="Xóa dòng">${ICON.x}</button></div></td></tr>`).join("");
  $("#items-empty").innerHTML = d.items.length ? "" : `<div class="items-empty">Chưa có vật phẩm. Chọn sản phẩm ở danh mục ${S.catHidden ? '(<button class="btn sm" data-act="cat-show">Hiện danh mục</button>)' : "bên trái"} rồi bấm “Thêm vào bộ”.</div>`;
  renderTotals();
  const ph = $("#photo"); if (ph && S.draft.imageId) { const stale = S.draft.imageSig != null && S.draft.imageSig !== itemsSig(S.draft); if (stale !== !!$(".stale", ph)) renderPhoto(); }
}
function renderTotals() {
  const d = S.draft, c = calc(d);
  const set = (id, v) => { const e = $("#" + id); if (e) e.textContent = v; };
  set("t-count", `(${c.lines} dòng, ${c.count} SP)`);
  set("t-sub", money(c.subtotal));
  set("t-disc", c.discount ? "−" + money(c.discount) : "0 đ");
  set("t-derr", c.discErr);
  $("#d-dval")?.classList.toggle("err", !!c.discErr);
  set("t-total", money(c.total));
  set("t-prov", c.missing ? `Tạm tính — còn ${c.missing} sản phẩm chưa có giá` : "");
  set("mb-total", money(c.total));
  set("mb-sub", c.missing ? "Tạm tính — còn SP chưa có giá" : `Tổng thanh toán · ${c.lines} dòng`);
}
function renderBanners() {
  const box = $("#b-banners"); if (!box) return;
  const d = S.draft, diffs = priceDiffs(d), out = [];
  if (S.ws === "demo") out.push(`<div class="banner warn"><span class="grow">Đây là <b>dữ liệu mẫu</b>, không phải bảng giá thật.</span></div>`);
  if (diffs.length) out.push(`<div class="banner info"><span class="grow"><b>Bảng giá đã thay đổi:</b> ${diffs.length} dòng trong bộ này có giá khác bảng giá hiện tại. Giá trong bộ chưa bị thay đổi.</span><button class="btn sm primary" data-act="upd-prices">Cập nhật theo bảng giá hiện tại</button></div>`);
  box.innerHTML = out.join("");
}
function lineEl(e) { const tr = e.target.closest("tr[data-lid]"); return tr ? S.draft.items.find(l => l.lid === tr.dataset.lid) : null; }
function setQty(l, q, tr) {
  l.qty = q;
  if (tr) { $("[data-qty]", tr).value = q; $("[data-qty]", tr).classList.remove("err"); $("[data-amt]", tr).textContent = l.price == null ? "—" : fmt(l.price * q); }
  renderTotals(); touched();
  const ph = $("#photo"); if (ph && S.draft.imageId && !$(".stale", ph) && S.draft.imageSig !== itemsSig(S.draft)) renderPhoto();
}
function onBuilderInput(e) {
  const t = e.target, d = S.draft;
  if (t.matches("[data-qty]")) {
    const l = lineEl(e), v = t.value.trim();
    if (/^\d+$/.test(v) && +v > 0 && +v <= 100000) setQty(l, +v, t.closest("tr")); else t.classList.add("err");
    return;
  }
  if (t.matches("[data-cqty]")) { const s = S.cardSel.get(t.dataset.cqty); const v = t.value.trim(); if (s) { if (/^\d+$/.test(v) && +v > 0) { s.qty = +v; t.classList.remove("err"); } else t.classList.add("err"); } return; }
  if (t.matches("[data-fee]")) { d[t.dataset.fee] = parseMoneyInput(t.value); renderTotals(); touched(); return; }
  const map = { "d-name": v => d.name = v, "d-desc": v => d.desc = v, "d-altar": v => d.altarSize = v, "d-note": v => d.note = v, "d-vat": v => d.vatNote = v, "d-olabel": v => d.otherFeeLabel = v,
    "c-name": v => d.customer.name = v, "c-phone": v => d.customer.phone = v, "c-addr": v => d.customer.address = v, "c-code": v => d.quoteCode = v.trim(), "c-date": v => d.quoteDate = v, "c-valid": v => d.validUntil = v };
  if (map[t.id]) { map[t.id](t.value); touched(); return; }
  if (t.id === "d-dval") {
    if (d.discount.mode === "amount") d.discount.value = parseMoneyInput(t.value);
    else { const v = parseFloat(t.value.replace(",", ".")); d.discount.value = isNaN(v) ? 0 : v; }
    renderTotals(); touched();
  }
}
function onBuilderChange(e) {
  const t = e.target, d = S.draft;
  if (t.id === "d-dmode") { d.discount = { mode: t.value, value: 0 }; const v = $("#d-dval"); v.hidden = t.value === "none"; v.value = ""; v.placeholder = t.value === "percent" ? "%" : "Số tiền"; renderTotals(); touched(); }
  if (t.matches("[data-fee]")) t.value = fmt(d[t.dataset.fee]) || "";
  if (t.id === "d-dval" && d.discount.mode === "amount") t.value = fmt(d.discount.value);
  if (t.matches("[data-qty]")) { const l = lineEl(e); if (t.classList.contains("err")) { t.value = l.qty; t.classList.remove("err"); toast("Số lượng phải là số nguyên dương", "bad"); } }
  if (t.matches("[data-cqty]")) { const s = S.cardSel.get(t.dataset.cqty); if (s) { t.value = s.qty; t.classList.remove("err"); } }
}
async function onBuilderClick(e) {
  try { await builderClick(e); }
  catch (err) { console.error(err); toast("Có lỗi khi thao tác: " + errMsg(err) + ". Hãy tải lại trang và thử lại.", "bad"); }
}
async function builderClick(e) {
  const cg = e.target.closest("[data-cg]");
  if (cg) { S.cat.group = cg.dataset.cg; $$("[data-cg]").forEach(x => x.setAttribute("aria-pressed", String(x === cg))); renderCatList(); return; }
  const b = e.target.closest("[data-act]"); if (!b) return;
  const a = b.dataset.act, d = S.draft;
  const l = lineEl(e), tr = e.target.closest("tr[data-lid]");
  switch (a) {
    case "c-size": case "c-glaze": {
      const base = findBase(b.dataset.key); if (!base) { renderCatList(); break; } const s = cardState(base);
      if (a === "c-size") { s.size = b.dataset.v; if (!base.variants.some(v => v.size === s.size && v.glaze === s.glaze)) s.glaze = base.variants.find(v => v.size === s.size)?.glaze ?? s.glaze; }
      else s.glaze = b.dataset.v;
      const card = b.closest(".pcard"); card.outerHTML = cardHTML(base); break;
    }
    case "c-add": {
      const base = findBase(b.dataset.key);
      if (!base) { renderCatList(); toast("Danh mục vừa thay đổi – đã tải lại danh sách, hãy bấm lại", "bad"); break; }
      const s = cardState(base);
      const v = base.variants.find(x => x.size === s.size && x.glaze === s.glaze);
      if (!v) { toast("Chưa chọn được quy cách / dòng men có trong bảng giá – hãy bấm chọn lại", "bad"); break; }
      addLine(v, s.qty || 1); s.qty = 1;
      const card = b.closest(".pcard"); if (card) card.outerHTML = cardHTML(base);
      break;
    }
    case "inc": setQty(l, l.qty + 1, tr); break;
    case "dec": if (l.qty > 1) setQty(l, l.qty - 1, tr); else toast("Số lượng tối thiểu là 1. Dùng nút ✕ để xóa dòng.", "ok", 2200); break;
    case "up": case "down": {
      const i = d.items.indexOf(l), j = a === "up" ? i - 1 : i + 1;
      if (j < 0 || j >= d.items.length) break;
      [d.items[i], d.items[j]] = [d.items[j], d.items[i]]; renderItems(); touched();
      setTimeout(() => { const btn = $(`tr[data-lid="${l.lid}"] [data-act="${a}"]`); btn && !btn.disabled && btn.focus(); }, 0); break;
    }
    case "del": d.items = d.items.filter(x => x !== l); renderItems(); renderBanners(); touched(); toast(`Đã xóa: ${lineTitle(l)}`, "ok", 1800); break;
    case "swap": openReplace(l); break;
    case "zoom": { const u = await imageURL(d.imageId); if (u) { const lb = document.createElement("div"); lb.className = "lightbox"; lb.innerHTML = `<img src="${u}" alt="Ảnh ban thờ">`; lb.onclick = () => lb.remove(); document.body.appendChild(lb); } break; }
    case "ph-change": pickFile("image/*", f => setPhoto(f)); break;
    case "ph-remove": d.imageId = null; d.imageSig = null; renderPhoto(); touched(); break;
    case "ph-ok": d.imageSig = itemsSig(d); renderPhoto(); touched(); break;
    case "upd-prices": openPriceUpdate(); break;
    case "compose": openComposer(); break;
    case "to-quote": d.kind = "quote"; if (!d.quoteDate) d.quoteDate = todayISO(); renderBuilder(); touched(); setTimeout(() => $("#c-name")?.focus(), 0); break;
    case "cat-hide": S.catHidden = true; renderBuilder(); break;
    case "cat-show": S.catHidden = false; renderBuilder(); break;
    case "cat-open": if (S.catHidden) { S.catHidden = false; renderBuilder(); } $("#catalog")?.classList.add("open"); break;
    case "cat-close": $("#catalog")?.classList.remove("open"); break;
    case "new": newSet(); break;
    case "dup": duplicateDraft(); break;
    case "save-tpl": saveTemplate(); break;
    case "save-quote": saveQuote(); break;
    case "save-any": d.kind === "quote" ? saveQuote() : saveTemplate(); break;
    case "preview": openPreview(); break;
    case "pdf": exportPDF(); break;
    case "png": exportPNG(); break;
    case "print": printQuote(); break;
  }
}
function openReplace(line) {
  const p0 = S.products.get(line.code);
  const same = p0 ? sortProducts([...S.products.values()].filter(p => p.active !== false && p.name === p0.name && p.group === p0.group)) : [];
  const body = `<input class="inp" id="rp-q" type="search" placeholder="Tìm sản phẩm khác…" style="margin-bottom:10px"><div id="rp-list"></div>`;
  modal({ title: "Thay sản phẩm: " + lineTitle(line), size: "mid", body, onMount: (el, close) => {
    const draw = () => {
      const q = norm($("#rp-q", el).value);
      const list = q ? sortProducts([...S.products.values()].filter(p => p.active !== false && norm([p.code, p.name, p.size, p.glaze, p.group].join(" ")).includes(q))).slice(0, 80) : same;
      $("#rp-list", el).innerHTML = `<div class="tbl-wrap"><table class="list" style="min-width:560px"><thead><tr><th>Sản phẩm</th><th>Dòng men</th><th>ĐVT</th><th class="r">Đơn giá</th><th></th></tr></thead><tbody>${list.map(p => `<tr><td><b>${esc(pLabel(p))}</b><div class="muted" style="font-size:12px">${esc(p.code)}</div></td><td>${esc(p.glaze)}</td><td>${esc(p.unit)}</td><td class="r">${p.price == null ? '<span class="na">Chưa có giá</span>' : fmt(p.price)}</td><td><button class="btn sm ${p.code === line.code ? "" : "primary"}" data-code="${esc(p.code)}" ${p.code === line.code ? "disabled" : ""}>${p.code === line.code ? "Đang chọn" : "Chọn"}</button></td></tr>`).join("") || `<tr><td colspan="5" class="empty">Nhập từ khóa để tìm sản phẩm.</td></tr>`}</tbody></table></div>`;
    };
    draw();
    $("#rp-q", el).oninput = debounce(draw, 180);
    el.addEventListener("click", e => {
      const btn = e.target.closest("[data-code]"); if (!btn) return;
      const p = S.products.get(btn.dataset.code), d = S.draft;
      const other = d.items.find(x => x.code === p.code && x !== line);
      if (other) { other.qty += line.qty; d.items = d.items.filter(x => x !== line); toast("Sản phẩm này đã có trong bộ – đã cộng số lượng vào dòng đó"); }
      else Object.assign(line, { code: p.code, name: p.name, pattern: p.pattern || "", size: p.size || "", glaze: p.glaze || "", unit: p.unit, price: p.price ?? null });
      close(); renderItems(); renderBanners(); touched();
    });
  } });
}
function openPriceUpdate() {
  const d = S.draft, diffs = priceDiffs(d);
  if (!diffs.length) { toast("Giá trong bộ đã khớp bảng giá hiện tại"); renderBanners(); return; }
  const before = calc(d);
  const after = calc({ ...d, items: d.items.map(l => { const df = diffs.find(x => x.line === l); return df ? { ...l, price: df.newP } : l; }) });
  const delta = after.total - before.total;
  const body = `<div class="tbl-wrap"><table class="list" style="min-width:620px"><thead><tr><th>Sản phẩm</th><th class="r">SL</th><th class="r">Giá cũ</th><th class="r">Giá mới</th><th class="r">Chênh lệch dòng</th></tr></thead><tbody>
    ${diffs.map(x => { const dl = (x.newP ?? 0) * x.line.qty - (x.oldP ?? 0) * x.line.qty; return `<tr><td><b>${esc(lineTitle(x.line))}</b><div class="muted" style="font-size:12px">${esc(x.line.glaze)}</div></td><td class="r">${x.line.qty} ${esc(x.line.unit)}</td><td class="r">${x.oldP == null ? '<span class="na">Chưa có</span>' : fmt(x.oldP)}</td><td class="r">${x.newP == null ? '<span class="na">Chưa có</span>' : fmt(x.newP)}</td><td class="r ${dl > 0 ? "diff-up" : dl < 0 ? "diff-down" : ""}">${x.oldP == null || x.newP == null ? "—" : (dl > 0 ? "+" : "") + fmt(dl)}</td></tr>`; }).join("")}
    </tbody></table></div>
    <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:14px">
      <div class="panel"><div class="muted">Tổng thanh toán hiện tại</div><b class="num" style="font-size:18px">${money(before.total)}</b>${before.missing ? '<div class="na" style="font-size:12px">Tạm tính</div>' : ""}</div>
      <div class="panel"><div class="muted">Sau khi cập nhật</div><b class="num" style="font-size:18px">${money(after.total)}</b>${after.missing ? '<div class="na" style="font-size:12px">Tạm tính</div>' : ""}</div>
      <div class="panel"><div class="muted">Chênh lệch</div><b class="num ${delta > 0 ? "diff-up" : delta < 0 ? "diff-down" : ""}" style="font-size:18px">${(delta > 0 ? "+" : "") + money(delta)}</b></div>
    </div>
    ${d.discount.mode === "amount" && d.discount.value > after.subtotal ? `<div class="banner bad" style="margin-top:10px">Sau cập nhật, số tiền giảm vượt tổng tiền vật phẩm – cần sửa mức giảm.</div>` : ""}`;
  modal({ title: "Cập nhật theo bảng giá hiện tại", size: "mid", body,
    foot: `<button class="btn" data-close>Giữ giá cũ</button><button class="btn primary" data-ok>Cập nhật ${diffs.length} dòng</button>`,
    onMount: (el, close) => $("[data-ok]", el).onclick = () => { diffs.forEach(x => x.line.price = x.newP); close(); renderItems(); renderBanners(); touched(); toast(`Đã cập nhật giá ${diffs.length} dòng theo bảng giá hiện tại`); } });
}
/* ----- Lưu / mở / nhân bản ----- */
async function confirmDiscard() {
  if (!draftDirty()) return true;
  return confirmBox({ title: "Bỏ nội dung đang soạn?", html: `<p>${S.draft.id ? "Bộ đang mở có thay đổi chưa lưu." : "Bộ đang soạn chưa được lưu thành mẫu hoặc báo giá."} Nội dung này sẽ bị thay thế.</p>`, okText: "Tiếp tục", danger: true, cancelText: "Quay lại" });
}
async function newSet() { if (!(await confirmDiscard())) return; S.draft = newDraft(); S.draftBase = ""; renderBuilder(); touched(); }
function duplicateDraft() {
  const d = clone(S.draft);
  d.id = null; d.name = (d.name || "Bộ ban thờ") + " (bản sao)"; d.createdAt = null; d.updatedAt = null;
  if (d.kind === "quote") { d.quoteCode = ""; d.quoteDate = todayISO(); }
  if (S.draft.kind === "template" && S.draft.id) d.sourceTemplateId = S.draft.id;
  if (d.kind === "new") d.kind = "template";
  d.items.forEach(l => l.lid = uid("l"));
  S.draft = d; S.draftBase = "";
  renderBuilder(); touched();
  toast("Đã tạo bản sao (chưa lưu). Bản gốc không bị thay đổi.");
}
function blockingIssues(d, forExport) {
  const c = calc(d), out = [];
  if (!d.items.length) out.push("Bộ chưa có vật phẩm nào");
  if (c.discErr) out.push(c.discErr);
  if (c.qtyBad) out.push("Có dòng số lượng không hợp lệ");
  if (forExport && c.missing) out.push(`Còn ${c.missing} sản phẩm chưa có giá – đây mới là tạm tính, chưa thể xuất thành báo giá chính thức. Hãy nhập giá trong bảng giá rồi bấm “Cập nhật theo bảng giá hiện tại”, hoặc thay/xóa dòng đó.`);
  return out;
}
function showIssues(title, issues) { modal({ title, body: `<ul style="margin:0;padding-left:18px;display:flex;flex-direction:column;gap:6px">${issues.map(x => `<li>${esc(x)}</li>`).join("")}</ul>`, foot: `<button class="btn primary" data-close>Đã hiểu</button>` }); }
function askName(title, current) {
  return new Promise(res => {
    let done = false;
    modal({ title, body: `<label class="field"><span>Tên bộ ban thờ</span><input class="inp" id="ask-name" value="${esc(current)}" placeholder="Ví dụ: Bộ Phúc Liên Hoa ban 1m53"></label>`,
      foot: `<button class="btn" data-close>Hủy</button><button class="btn primary" data-ok>Lưu</button>`, onClose: () => { if (!done) res(null); },
      onMount: (el, close) => { const go = () => { const v = $("#ask-name", el).value.trim(); if (!v) { $("#ask-name", el).classList.add("err"); return; } done = true; close(); res(v); }; $("[data-ok]", el).onclick = go; $("#ask-name", el).onkeydown = e => e.key === "Enter" && go(); } });
  });
}
function recordFromDraft(d, kind) {
  const r = clone(d);
  r.kind = kind;
  delete r._tmp;
  return r;
}
async function commitRecord(rec, msg, extraKV) {
  busy("Đang lưu…");
  try {
    await DB.run(["records", "kv"], "readwrite", t => { t.objectStore("records").put(rec); t.objectStore("kv").put({ k: "draft", v: { draft: rec, base: contentSig(rec) } }); if (extraKV) t.objectStore("kv").put(extraKV); });
    S.records.set(rec.id, rec);
    S.draft = clone(rec); S.draftBase = contentSig(rec);
    busy(); renderBuilder(); toast(msg);
    return true;
  } catch (e) { busy(); toast("CHƯA LƯU được: " + errMsg(e), "bad"); return false; }
}
async function saveTemplate() {
  const d = S.draft, iss = blockingIssues(d, false);
  if (iss.length) return showIssues("Chưa lưu được mẫu", iss);
  let name = d.name.trim();
  if (!name) { name = await askName("Đặt tên mẫu ban thờ", ""); if (!name) return; }
  const now = new Date().toISOString();
  let rec;
  if (d.kind === "template" && d.id) rec = { ...recordFromDraft(d, "template"), name, updatedAt: now };
  else {
    rec = { ...recordFromDraft(d, "template"), id: uid("tpl"), name, createdAt: now, updatedAt: now, quoteCode: "", customer: { name: "", phone: "", address: "" }, validUntil: "" };
    rec.items.forEach(l => l.lid = uid("l"));
  }
  if (S.ws === "demo") rec.demo = true;
  await commitRecord(rec, d.kind === "template" && d.id ? "Đã lưu thay đổi mẫu" : `Đã lưu mẫu “${name}”`);
}
async function saveQuote() {
  const d = S.draft, iss = blockingIssues(d, false);
  if (iss.length) return showIssues("Chưa lưu được báo giá", iss);
  const now = new Date().toISOString();
  if (d.kind === "quote" && d.id) {
    if (!d.customer.name.trim()) return showIssues("Chưa lưu được báo giá", ["Hãy nhập tên khách hàng"]);
    const dup = [...S.records.values()].find(r => r.id !== d.id && r.kind === "quote" && r.quoteCode && r.quoteCode === d.quoteCode);
    if (!d.quoteCode || dup) return showIssues("Chưa lưu được báo giá", [dup ? `Mã báo giá ${d.quoteCode} đã được dùng` : "Mã báo giá không được để trống"]);
    return commitRecord({ ...recordFromDraft(d, "quote"), updatedAt: now }, "Đã lưu thay đổi báo giá " + d.quoteCode);
  }
  const info = await askCustomer(d);
  if (!info) return;
  const code = info.code || nextQuoteCode();
  const rec = { ...recordFromDraft(d, "quote"), ...info.fields, id: uid("q"), quoteCode: code, createdAt: now, updatedAt: now, sourceTemplateId: d.sourceTemplateId || (d.kind === "template" ? d.id : null) };
  if (!rec.name) rec.name = "Bộ đồ thờ";
  rec.items.forEach(l => l.lid = uid("l"));
  if (S.ws === "demo") rec.demo = true;
  const c = calc(rec);
  await commitRecord(rec, `Đã lưu báo giá ${code}${c.missing ? " (tạm tính – còn sản phẩm chưa có giá)" : ""}`, { k: "meta", v: S.meta });
}
function askCustomer(d) {
  return new Promise(res => {
    let done = false;
    const c = d.customer || {};
    modal({ title: "Lưu báo giá cho khách", size: "mid", onClose: () => { if (!done) res(null); },
      body: `<div class="mapgrid">
        <label class="field"><span>Tên khách hàng *</span><input class="inp" id="q-name" value="${esc(c.name)}"></label>
        <label class="field"><span>Số điện thoại</span><input class="inp" id="q-phone" value="${esc(c.phone)}" inputmode="tel"></label>
        <label class="field" style="grid-column:1/-1"><span>Địa chỉ</span><input class="inp" id="q-addr" value="${esc(c.address)}"></label>
        <label class="field"><span>Ngày báo giá</span><input class="inp" type="date" id="q-date" value="${esc(d.quoteDate || todayISO())}"></label>
        <label class="field"><span>Hiệu lực đến (nếu có)</span><input class="inp" type="date" id="q-valid" value="${esc(d.validUntil)}"></label>
        <label class="field"><span>Tên bộ trên báo giá</span><input class="inp" id="q-title" value="${esc(d.name)}" placeholder="Ví dụ: Bộ đồ thờ Phúc Liên Hoa"></label>
        <label class="field"><span>Mã báo giá</span><input class="inp" id="q-code" placeholder="Để trống để tự tạo" value="${esc(d.quoteCode)}"></label>
      </div><p class="muted" style="margin:10px 0 0">Báo giá lưu lại sẽ giữ nguyên tên, quy cách, đơn giá, số lượng, giảm giá và phí tại thời điểm lưu – không tự đổi khi bảng giá thay đổi.</p>`,
      foot: `<button class="btn" data-close>Hủy</button><button class="btn primary" data-ok>Lưu báo giá</button>`,
      onMount: (el, close) => $("[data-ok]", el).onclick = () => {
        const name = $("#q-name", el).value.trim(), code = $("#q-code", el).value.trim();
        if (!name) { $("#q-name", el).classList.add("err"); $("#q-name", el).focus(); return; }
        if (code && [...S.records.values()].some(r => r.quoteCode === code)) { $("#q-code", el).classList.add("err"); toast("Mã báo giá này đã được dùng", "bad"); return; }
        done = true; close();
        res({ code, fields: { customer: { name, phone: $("#q-phone", el).value.trim(), address: $("#q-addr", el).value.trim() }, quoteDate: $("#q-date", el).value || todayISO(), validUntil: $("#q-valid", el).value, name: $("#q-title", el).value.trim() } });
      } });
  });
}
async function openRecord(id) {
  const r = S.records.get(id); if (!r) return;
  if (!(S.draft.id === id) && !(await confirmDiscard())) return;
  S.draft = clone(r); S.draftBase = contentSig(S.draft); S.cardSel.clear();
  persistDraft();
  show("builder", true);
}
async function quoteFromTemplate(id) {
  const t = S.records.get(id); if (!t) return;
  if (!(await confirmDiscard())) return;
  const d = clone(t);
  Object.assign(d, { id: null, kind: "quote", sourceTemplateId: t.id, quoteCode: "", customer: { name: "", phone: "", address: "" }, quoteDate: todayISO(), validUntil: "", createdAt: null, updatedAt: null });
  d.items.forEach(l => l.lid = uid("l"));
  S.draft = d; S.draftBase = ""; persistDraft();
  show("builder", true);
  toast("Đã tạo báo giá từ mẫu. Nhập thông tin khách rồi bấm “Lưu báo giá”. Mẫu gốc không đổi.");
}
