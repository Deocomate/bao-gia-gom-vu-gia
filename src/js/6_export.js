/* ===================== XUẤT PDF / PNG / IN ===================== */
function slug(s) { return noDia(s).replace(/[^A-Za-z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 40) || "bao_gia"; }
function fileBase(d) {
  return d.kind === "quote" && d.quoteCode ? `Bao_gia_${d.quoteCode}_${slug(d.customer.name)}` : `Bo_ban_tho_${slug(d.name)}_${todayISO()}`;
}
function xpParts(d) {
  const c = calc(d), isQ = d.kind === "quote";
  const head = `<div class="xp-head"><div class="xp-brand"><img src="${LOGO_BROWN}" alt="Gốm Vũ Gia" style="height:64px;width:auto;display:block"></div>
    <div class="xp-doc"><div class="k">${isQ ? "Báo giá" : "Báo giá bộ đồ thờ"}</div>
    <div class="m">${isQ && d.quoteCode ? `Mã: <b>${esc(d.quoteCode)}</b> · ` : ""}Ngày: <b>${esc(fmtDay(isQ ? d.quoteDate : todayISO()))}</b>${isQ && d.validUntil ? ` · Hiệu lực đến: <b>${esc(fmtDay(d.validUntil))}</b>` : ""}</div></div></div>`;
  const headSmall = `<div class="xp-head" style="padding-bottom:6px"><div class="xp-brand"><img src="${LOGO_BROWN}" alt="Gốm Vũ Gia" style="height:38px;width:auto;display:block"></div><div class="xp-doc"><div class="m">${esc(d.name || "Bộ đồ thờ")}${isQ && d.quoteCode ? " · " + esc(d.quoteCode) : ""} · <i>tiếp theo</i></div></div></div>`;
  const title = `<div class="xp-title"><div><h1>${esc(d.name || "Bộ đồ thờ")}</h1>${d.desc ? `<p>${esc(d.desc)}</p>` : ""}</div>${d.altarSize ? `<p>Kích thước ban thờ: <b style="color:var(--x-ink)">${esc(d.altarSize)}</b></p>` : ""}</div>`;
  const cu = d.customer || {};
  const cust = isQ && (cu.name || cu.phone || cu.address) ? `<div class="xp-cust">${cu.name ? `<div><span>Khách hàng: </span><b>${esc(cu.name)}</b></div>` : ""}${cu.phone ? `<div><span>Điện thoại: </span><b>${esc(cu.phone)}</b></div>` : ""}${cu.address ? `<div><span>Địa chỉ: </span><b>${esc(cu.address)}</b></div>` : ""}</div>` : "";
  const colg = `<colgroup><col style="width:40px"><col><col style="width:54px"><col style="width:96px"><col style="width:44px"><col style="width:112px"></colgroup>`;
  const thead = `<thead><tr><th class="c">STT</th><th>Tên sản phẩm và quy cách</th><th class="c">ĐVT</th><th class="r">Đơn giá</th><th class="c">SL</th><th class="r">Thành tiền</th></tr></thead>`;
  const rows = d.items.map((l, i) => `<tr><td class="c">${i + 1}</td><td><b style="font-weight:600">${esc(lineTitle(l))}</b>${lineSub(l) ? `<small>${esc(lineSub(l))}</small>` : ""}</td><td class="c">${esc(l.unit)}</td><td class="r">${l.price == null ? "Chưa có giá" : fmt(l.price)}</td><td class="c">${l.qty}</td><td class="r">${l.price == null ? "—" : fmt(l.price * l.qty) + "\u00a0đ"}</td></tr>`);
  const dlabel = d.discount.mode === "percent" ? `Giảm giá ${String(d.discount.value).replace(".", ",")}%` : "Giảm giá";
  const trs = [`<div class="xp-tr"><span>Tổng tiền vật phẩm (${c.count} sản phẩm)</span><span class="v">${money(c.subtotal)}</span></div>`];
  if (c.discount) trs.push(`<div class="xp-tr"><span>${esc(dlabel)}</span><span class="v">−${money(c.discount)}</span></div>`);
  if (d.shipping) trs.push(`<div class="xp-tr"><span>Phí vận chuyển</span><span class="v">${money(d.shipping)}</span></div>`);
  if (d.install) trs.push(`<div class="xp-tr"><span>Phí lắp đặt</span><span class="v">${money(d.install)}</span></div>`);
  if (d.otherFee) trs.push(`<div class="xp-tr"><span>${esc(d.otherFeeLabel || "Phụ phí khác")}</span><span class="v">${money(d.otherFee)}</span></div>`);
  const notes = [d.note && `<div><div class="h">Ghi chú</div>${esc(d.note)}</div>`, d.vatNote && `<div style="margin-top:8px"><div class="h">VAT</div>${esc(d.vatNote)}</div>`].filter(Boolean).join("");
  const totals = `<div class="xp-totals"><div class="xp-notes">${notes}</div><div>${trs.join("")}<div class="xp-grand"><span class="l">TỔNG THANH TOÁN</span><span class="v">${money(c.total)}</span></div>${c.missing ? `<div style="text-align:right;color:#B42318;font-size:12px;font-weight:700">Tạm tính — còn sản phẩm chưa có giá</div>` : ""}</div></div>`;
  return { head, headSmall, title, cust, colg, thead, rows, totals, c };
}
async function sizeXpImage(pg, url, meta) {
  const cell = $(".xp-photo", pg); if (!cell) return;
  if (!url) { cell.innerHTML = `<span class="noimg">Chưa có ảnh ban thờ</span>`; return; }
  const img = $("img", cell);
  const bw = cell.clientWidth - 2, bh = cell.clientHeight - 2;
  let w = meta?.w || img.naturalWidth || 4, h = meta?.h || img.naturalHeight || 3;
  const k = Math.min(bw / w, bh / h);
  img.style.width = Math.floor(w * k) + "px"; img.style.height = Math.floor(h * k) + "px"; img.style.display = "block";
}
async function buildExport(d, single, opts = {}) {
  const stage = $("#xp-stage"); stage.innerHTML = "";
  try { await document.fonts.ready; } catch { }
  const P = xpParts(d);
  const url = d.imageId ? await imageURL(d.imageId) : null;
  const meta = d.imageId ? await imageMeta(d.imageId) : null;
  if (url) { try { await loadImg(url); } catch { } }
  const photo = url ? `<div class="xp-photo"><img src="${url}" alt="" style="display:none"></div>` : "";
  const footL = `Gốm Vũ Gia · ${esc(d.kind === "quote" && d.quoteCode ? "Báo giá " + d.quoteCode : (d.name || "Bộ đồ thờ"))}`;
  const stamp = opts.stamp && P.c.missing ? `<div class="xp-stamp">TẠM TÍNH</div>` : "";
  const ar = meta && meta.w && meta.h ? meta.w / meta.h : 1.33;
  const maxPh = Math.min(470, Math.round(710 / ar));
  if (single) {
    const pg = document.createElement("div"); pg.className = "xp auto";
    pg.innerHTML = `<div class="xp-in"><div class="xp-content">${P.head}${P.title}${P.cust}<div class="xp-grid ${url ? "" : "full"}">${photo}<div><table class="xp-t">${P.colg}${P.thead}<tbody>${P.rows.join("")}</tbody></table></div></div>${P.totals}</div><div class="xp-foot"><span>${footL}</span><span>Ngày xuất: ${fmtDay(todayISO())}</span></div></div>${stamp}`;
    stage.appendChild(pg);
    if ($(".xp-photo", pg)) $(".xp-photo", pg).style.height = maxPh + "px";
    await sizeXpImage(pg, url, meta);
    return [pg];
  }
  const pages = [];
  const mk = (first, withTable = true) => {
    const pg = document.createElement("div"); pg.className = "xp";
    pg.innerHTML = `<div class="xp-in"><div class="xp-content">${first ? P.head + P.title + P.cust : P.headSmall}${withTable ? `<div class="xp-grid ${first && url ? "" : "full"}">${first ? photo : ""}<div><table class="xp-t">${P.colg}${P.thead}<tbody></tbody></table></div></div>` : ""}</div><div class="xp-foot"><span>${footL}</span><span class="pn"></span></div></div>${first ? stamp : ""}`;
    stage.appendChild(pg); pages.push(pg); return pg;
  };
  const over = pg => { const c = $(".xp-content", pg); return c.scrollHeight > c.clientHeight + 1; };
  // Ưu tiên gói gọn 1 trang: thu nhỏ chữ, khoảng cách và khung ảnh theo từng mức
  // A4 dọc: ảnh trên, bảng dưới. Ưu tiên chữ thoáng (mức 0), ảnh to; thiếu chỗ thì thu ảnh rồi mới thu chữ
  for (const lv of [0, 1, 2, 3, 4]) {
    const one = mk(true);
    if (lv) one.classList.add("d" + lv);
    $("tbody", one).innerHTML = P.rows.join("");
    $(".xp-content", one).insertAdjacentHTML("beforeend", P.totals);
    const ph1 = $(".xp-photo", one);
    if (ph1) for (let h = maxPh; h >= 230; h -= 10) { ph1.style.height = h + "px"; if (!over(one)) break; }
    if (!over(one)) {
      $(".pn", one).textContent = "Trang 1/1";
      await sizeXpImage(one, url, meta);
      return pages;
    }
    one.remove(); pages.length = 0;
  }
  let pg = mk(true), tb = $("tbody", pg);
  pg.classList.add("d1");
  if ($(".xp-photo", pg)) $(".xp-photo", pg).style.height = Math.min(maxPh, 320) + "px";
  for (const r of P.rows) {
    tb.insertAdjacentHTML("beforeend", r);
    if (over(pg) && tb.children.length > 1) {
      tb.lastElementChild.remove();
      tb.insertAdjacentHTML("beforeend", `<tr class="cont"><td colspan="6" style="text-align:right">Tiếp theo ở trang sau →</td></tr>`);
      if (over(pg)) tb.lastElementChild.remove();
      pg = mk(false); pg.classList.add("d1"); tb = $("tbody", pg); tb.insertAdjacentHTML("beforeend", r);
    }
  }
  const content = $(".xp-content", pg);
  content.insertAdjacentHTML("beforeend", P.totals);
  // Nếu thiếu chỗ cho phần tổng tiền, thu nhỏ khung ảnh trang 1 (tối thiểu 230px) trước khi sang trang mới
  const ph = pages.length === 1 ? $(".xp-photo", pg) : null;
  for (let mh = 310; over(pg) && ph && mh >= 230; mh -= 10) ph.style.height = mh + "px";
  if (over(pg)) { if (ph) ph.style.height = Math.min(maxPh, 320) + "px"; content.lastElementChild.remove(); pg = mk(false, false); pg.classList.add("d1"); $(".xp-content", pg).insertAdjacentHTML("beforeend", P.totals); }
  pages.forEach((p, i) => $(".pn", p).textContent = `Trang ${i + 1}/${pages.length}`);
  await sizeXpImage(pages[0], url, meta);
  return pages;
}
function preExport(d) {
  const iss = blockingIssues(d, true);
  if (iss.length) { showIssues("Chưa thể xuất báo giá", iss); return false; }
  return true;
}
async function snap(el, scale) {
  return html2canvas(el, { scale, backgroundColor: "#ffffff", useCORS: true, logging: false, width: el.offsetWidth, height: el.offsetHeight, windowWidth: 1400, scrollX: 0, scrollY: 0 });
}
async function exportPDF(d = S.draft) {
  if (!preExport(d) || !needLib("pdf")) return;
  busy("Đang tạo PDF khổ A4 dọc…");
  try {
    const pages = await buildExport(d, false);
    const pdf = new window.jspdf.jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
    const pageImgs = [];
    for (let i = 0; i < pages.length; i++) {
      busy(`Đang tạo PDF… trang ${i + 1}/${pages.length}`);
      const cv = await snap(pages[i], 3);
      if (i) pdf.addPage("a4", "portrait");
      const jpg = cv.toDataURL("image/jpeg", 0.92); pageImgs.push(jpg);
      pdf.addImage(jpg, "JPEG", 0, 0, 210, 297, undefined, "FAST");
    }
    pdf.setProperties({ title: (d.name || "Báo giá") + " – Gốm Vũ Gia", creator: "Gốm Vũ Gia" });
    const blob = pdf.output("blob");
    $("#xp-stage").innerHTML = ""; busy();
    await saveFile(fileBase(d) + ".pdf", blob, pageImgs);
  } catch (e) { busy(); toast("Không tạo được PDF: " + errMsg(e), "bad"); }
}
async function exportPNG(d = S.draft) {
  if (!preExport(d) || !needLib("png")) return;
  busy("Đang tạo ảnh PNG…");
  try {
    const [pg] = await buildExport(d, true);
    const h = pg.offsetHeight;
    const scale = h * 2.6 > 14000 ? Math.max(1.4, 14000 / h) : 2.6;
    const cv = await snap(pg, scale);
    const blob = await new Promise(r => cv.toBlob(r, "image/png"));
    $("#xp-stage").innerHTML = ""; busy();
    if (!blob) throw new Error("Ảnh quá lớn");
    await saveFile(fileBase(d) + ".png", blob);
  } catch (e) { busy(); toast("Không tạo được ảnh: " + errMsg(e), "bad"); }
}
async function printQuote(d = S.draft) {
  if (!preExport(d)) return;
  if (S.framed) {
    modal({ title: "In báo giá", body: `<p>Khung hiển thị ứng dụng bên trong Claude không cho phép mở hộp thoại in của trình duyệt.</p><p>Cách in nhanh: bấm <b>Xuất PDF</b> rồi mở file PDF và in (khổ A4 dọc). Nếu dùng bản ứng dụng HTML tải về máy, nút In sẽ mở hộp thoại in trực tiếp.</p>`,
      foot: `<button class="btn" data-close>Đóng</button><button class="btn primary" data-ok>Xuất PDF để in</button>`, onMount: (el, close) => $("[data-ok]", el).onclick = () => { close(); exportPDF(d); } });
    return;
  }
  busy("Đang chuẩn bị bản in…");
  try {
    const pages = await buildExport(d, false);
    const root = $("#print-root"); root.innerHTML = "";
    pages.forEach(p => root.appendChild(p));
    busy();
    const done = () => { root.innerHTML = ""; window.removeEventListener("afterprint", done); };
    window.addEventListener("afterprint", done);
    setTimeout(() => window.print(), 60);
  } catch (e) { busy(); toast("Không chuẩn bị được bản in: " + errMsg(e), "bad"); }
}
async function openPreview(d = S.draft) {
  if (!d.items.length) return showIssues("Chưa có nội dung", ["Bộ chưa có vật phẩm nào"]);
  busy("Đang dựng bản xem trước…");
  let pages, single;
  try { pages = await buildExport(d, false, { stamp: true }); } catch (e) { busy(); return toast("Không dựng được bản xem trước: " + errMsg(e), "bad"); }
  busy();
  const iss = blockingIssues(d, true);
  const close = modal({ title: `Xem trước – ${pages.length} trang A4 dọc`, size: "wide",
    body: `${iss.length ? `<div class="banner bad"><span class="grow">${esc(iss.join(" "))}</span></div>` : ""}<div class="preview-pages" id="pv"></div>`,
    foot: `<span class="grow muted">Bản xuất ẩn các nút thao tác, chỉ gồm ảnh, bảng chi tiết và tổng tiền.</span><button class="btn" data-close>Đóng</button><button class="btn" data-x="print">In</button><button class="btn" data-x="png">Xuất PNG</button><button class="btn primary" data-x="pdf">Xuất PDF</button>`,
    onMount: (el, close) => {
      const pv = $("#pv", el);
      const avail = Math.min(794, (pv.clientWidth || 900) - 32);
      const s = avail / 794;
      pages.forEach(p => { const holder = document.createElement("div"); holder.className = "pg-holder"; holder.style.width = 794 * s + "px"; holder.style.height = p.offsetHeight * s + "px"; p.style.transform = `scale(${s})`; p.style.transformOrigin = "0 0"; holder.appendChild(p); pv.appendChild(holder); });
      $$("[data-x]", el).forEach(b => b.onclick = () => { const x = b.dataset.x; close(); x === "pdf" ? exportPDF(d) : x === "png" ? exportPNG(d) : printQuote(d); });
    } });
}
