/* ===================== TỰ SẮP ẢNH BAN THỜ (ghép 2D từ ảnh sản phẩm) ===================== */
const CW = 1600, CH = 1200;              // khổ ảnh ghép 4:3
const ROWS = { back: { y: 800, s: 0.86 }, mid: { y: 912, s: 0.91 }, front: { y: 1002, s: 0.95 }, fore: { y: 1122, s: 0.98 } };
/* Phân loại vật phẩm → hàng, kiểu xếp, kích thước mặc định (cm) */
const CATS = [
  { k: "skip", rx: /(bong den|chan de bo|chan de$|^chan de |dua )/ },
  { k: "de", rx: /(de su|de bat huong)/, row: "back", defW: 18, wide: true },
  { k: "dinh", rx: /(dinh)/, row: "back", defH: 50, order: 0 },
  { k: "hac", rx: /(^hac|hac$| hac )/, row: "back", defH: 60, pair: true, order: 2 },
  { k: "bathuong", rx: /(bat huong)/, row: "back", defH: 17, order: 1 },
  { k: "binh", rx: /(loc binh|lo luon|lo hue|lo hoa|binh)/, row: "back", defH: 30, pair: true, order: 9 },
  { k: "den", rx: /(den )/, row: "mid", defH: 18, pair: true, order: 1 },
  { k: "choe", rx: /(choe|hu phat thu|bat sam)/, row: "mid", defH: 16, order: 2 },
  { k: "tra", rx: /(bo am|am tra|bo nam|dia tra|chen tra)/, row: "front", defW: 24, wide: true, order: 0 },
  { k: "ong", rx: /(ong huong)/, row: "mid", defH: 20, side: true, order: 8 },
  { k: "nam", rx: /(nam )/, row: "mid", defH: 20, side: true, order: 8 },
  { k: "mam", rx: /(mam bong|mam )/, row: "front", defW: 27, wide: true, pair: true, order: 9 },
  { k: "ki", rx: /(ki cong|ki ngai|chen ki|ky )/, row: "front", defW: 20, wide: true, order: 1 },
  { k: "nen", rx: /(chan nen|khay trau)/, row: "fore", defW: 12, wide: true, pair: true, order: 3 },
  { k: "bat", rx: /(bat com|bat ga|hmt|bat )/, row: "fore", defW: 11, wide: true, order: 2 },
  { k: "khac", rx: /./, row: "mid", defH: 18, order: 5 }
];
function catOf(l) { const n = norm(l.name + " "); return CATS.find(c => c.rx.test(n)) || CATS[CATS.length - 1]; }
function dimsOf(l) {
  const p = S.products.get(l.code);
  const txt = [l.size, p?.note || ""].join(" ");
  const num = m => m ? parseFloat(m[1].replace(",", ".")) : null;
  return {
    h: num(txt.match(/H\s*:?\s*(\d+(?:[.,]\d+)?)/i)),
    d: num(txt.match(/(?:Ø|⌀|ĐK|DK|D)\s*:?\s*(\d+(?:[.,]\d+)?)/)),
    l: num(txt.match(/L\s*:?\s*(\d+(?:[.,]\d+)?)/)),
    sz: num(txt.match(/sz\s*(\d+)/i))
  };
}
/* Ảnh dùng cho dòng: ảnh của đúng mã; không có thì mượn ảnh cùng tên + dòng men, rồi cùng tên */
function imageFor(l) {
  const p = S.products.get(l.code);
  if (p?.image) return { id: p.image, how: "own" };
  const all = [...S.products.values()].filter(x => x.image && norm(x.name) === norm(l.name));
  const same = all.find(x => x.glaze === l.glaze) || all[0];
  return same ? { id: same.image, how: "borrow", from: same } : null;
}
/* Tách nền: loang từ mép ảnh, xóa vùng cùng màu nền; ảnh PNG đã trong suốt thì chỉ cắt gọn */
const CUT = new Map();
async function cutoutOf(id, opt) {
  const key = id + "|" + (opt.remove ? opt.tol : "x");
  if (CUT.has(key)) return CUT.get(key);
  const url = await imageURL(id); if (!url) return null;
  const img = await loadImg(url);
  const k = Math.min(1, 900 / Math.max(img.naturalWidth, img.naturalHeight));
  const W = Math.max(1, Math.round(img.naturalWidth * k)), H = Math.max(1, Math.round(img.naturalHeight * k));
  const c = document.createElement("canvas"); c.width = W; c.height = H;
  const g = c.getContext("2d", { willReadFrequently: true }); g.drawImage(img, 0, 0, W, H);
  const id0 = g.getImageData(0, 0, W, H), d = id0.data;
  const A = i => d[i * 4 + 3];
  const transparent = [0, W - 1, (H - 1) * W, H * W - 1].some(i => A(i) < 30);
  if (opt.remove && !transparent) {
    let r = 0, gg = 0, b = 0, n = 0;
    const border = [];
    for (let x = 0; x < W; x++) border.push(x, (H - 1) * W + x);
    for (let y = 0; y < H; y++) border.push(y * W, y * W + W - 1);
    border.forEach(i => { r += d[i * 4]; gg += d[i * 4 + 1]; b += d[i * 4 + 2]; n++; });
    r /= n; gg /= n; b /= n;
    const tol = opt.tol, tol2 = tol * tol;
    const dRef = i => { const o = i * 4, x = d[o] - r, y = d[o + 1] - gg, z = d[o + 2] - b; return x * x + y * y + z * z; };
    const dPix = (i, j) => { const o = i * 4, q = j * 4, x = d[o] - d[q], y = d[o + 1] - d[q + 1], z = d[o + 2] - d[q + 2]; return x * x + y * y + z * z; };
    const seen = new Uint8Array(W * H), q = new Int32Array(W * H);
    let qh = 0, qt = 0;
    border.forEach(i => { if (!seen[i] && dRef(i) < tol2 * 2.2) { seen[i] = 1; q[qt++] = i; } });
    while (qh < qt) {
      const p = q[qh++], x = p % W;
      const nb = [x > 0 ? p - 1 : -1, x < W - 1 ? p + 1 : -1, p - W, p + W];
      for (const j of nb) {
        if (j < 0 || j >= W * H || seen[j]) continue;
        const dr = dRef(j);
        if (dr < tol2 || (dr < tol2 * 4 && dPix(p, j) < 64)) { seen[j] = 1; q[qt++] = j; }
      }
    }
    for (let i = 0; i < W * H; i++) if (seen[i]) d[i * 4 + 3] = 0;
    for (let i = 0; i < W * H; i++) {           // làm mềm mép
      if (seen[i]) continue; const x = i % W;
      if ((x > 0 && seen[i - 1]) || (x < W - 1 && seen[i + 1]) || (i >= W && seen[i - W]) || (i + W < W * H && seen[i + W])) d[i * 4 + 3] = Math.min(d[i * 4 + 3], 150);
    }
    g.putImageData(id0, 0, 0);
  }
  // cắt sát vật phẩm
  let x0 = W, y0 = H, x1 = -1, y1 = -1;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (d[(y * W + x) * 4 + 3] > 40) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  if (x1 < 0) { CUT.set(key, null); return null; }
  const o = document.createElement("canvas"); o.width = x1 - x0 + 1; o.height = y1 - y0 + 1;
  o.getContext("2d").drawImage(c, x0, y0, o.width, o.height, 0, 0, o.width, o.height);
  CUT.set(key, o);
  return o;
}
/* Tạo danh sách hình (mỗi chiếc / mỗi đôi tách 2 hình) rồi xếp theo hàng, đối xứng hai bên */
async function autoLayout(d, opt) {
  const items = [], missing = [];
  for (const l of d.items) {
    const cat = catOf(l);
    if (cat.k === "skip") continue;
    const im = imageFor(l);
    if (!im) { missing.push(l); continue; }
    const cut = await cutoutOf(im.id, opt);
    if (!cut) { missing.push(l); continue; }
    const n = Math.min(12, l.qty * (norm(l.unit) === "doi" ? 2 : 1));
    for (let i = 0; i < n; i++) items.push({ key: l.lid + ":" + i, lid: l.lid, code: l.code, img: im.id, cut, cat, dims: dimsOf(l), ar: cut.width / cut.height, flip: false, x: 0, y: 0, w: 0, h: 0 });
  }
  // kích thước theo cm → điểm ảnh
  const tallest = Math.max(30, ...items.filter(i => i.cat.row === "back" && !i.cat.wide).map(i => i.dims.h || i.cat.defH || 20));
  const K = Math.min(13, 560 / (tallest * ROWS.back.s));
  for (const it of items) {
    const s = ROWS[it.cat.row].s * K, dm = it.dims;
    if (it.cat.wide) { const cm = dm.d || dm.l || dm.sz || it.cat.defW; it.w = cm * s; it.h = it.w / it.ar; }
    else { const cm = dm.h || (it.cat.k === "bathuong" && dm.d ? dm.d * 0.88 : null) || it.cat.defH; it.h = cm * s; it.w = it.h * it.ar; }
  }
  // đế sứ đặt dưới bát hương cùng cỡ
  const bh = items.filter(i => i.cat.k === "bathuong"), des = items.filter(i => i.cat.k === "de");
  const looseDe = [];
  des.forEach(de => { const m = bh.find(b => !b.base && b.dims.d === de.dims.d) || bh.find(b => !b.base); if (m) { m.base = de; de.on = m; } else looseDe.push(de); });
  looseDe.forEach(de => de.cat = { ...de.cat, row: "mid" });
  const gap = 18;
  for (const rowName of ["back", "mid", "front", "fore"]) {
    const R = ROWS[rowName];
    const rowItems = items.filter(i => i.cat.row === rowName && !i.on);
    const width = it => Math.max(it.w, it.base ? it.base.w : 0);
    const centers = [], pairs = [], sideSingles = [];
    if (rowName === "back") {
      const b = rowItems.filter(i => i.cat.k === "bathuong").sort((a, c) => c.h - a.h);
      if (b.length) centers.push(b.shift());
      for (let i = 0; i + 1 < b.length; i += 2) pairs.push([b[i], b[i + 1], 1]);
      if (b.length % 2) centers.push(b[b.length - 1]);
    }
    const byLine = new Map();
    rowItems.filter(i => !(rowName === "back" && i.cat.k === "bathuong")).forEach(i => { if (!byLine.has(i.lid)) byLine.set(i.lid, []); byLine.get(i.lid).push(i); });
    for (const arr of byLine.values()) {
      const c = arr[0].cat;
      if (arr.length === 1 && c.side) { sideSingles.push(arr[0]); continue; }
      const pairable = c.pair || arr.length >= 2;
      let rest = arr.slice();
      if (pairable) { while (rest.length >= 2) pairs.push([rest.shift(), rest.shift(), c.order ?? 5]); }
      rest.forEach(i => (c.side ? sideSingles : centers).push(i));
    }
    sideSingles.sort((a, b) => (a.cat.order ?? 5) - (b.cat.order ?? 5));
    for (let i = 0; i + 1 < sideSingles.length; i += 2) pairs.push([sideSingles[i], sideSingles[i + 1], sideSingles[i].cat.order ?? 8]);
    if (sideSingles.length % 2) pairs.push([sideSingles[sideSingles.length - 1], null, 8]);
    pairs.sort((a, b) => a[2] - b[2]);
    // giữa: lớn nhất ở giữa, các món khác xen kẽ trái phải
    centers.sort((a, b) => (a.cat.order ?? 5) - (b.cat.order ?? 5) || b.h - a.h);
    const line = [];
    centers.forEach((it, i) => i % 2 ? line.unshift(it) : line.push(it));
    let scale = 1;
    for (let pass = 0; pass < 2; pass++) {
      const cw = line.reduce((s, it) => s + width(it) * scale, 0) + gap * Math.max(0, line.length - 1);
      let x = CW / 2 - cw / 2;
      line.forEach(it => { const w = width(it) * scale; it.x = x + w / 2; x += w + gap; });
      let L = CW / 2 - cw / 2, Rr = CW / 2 + cw / 2;
      if (!line.length) { L = CW / 2 + gap / 2; Rr = CW / 2 - gap / 2; }
      pairs.forEach(([a, b]) => {
        const wa = width(a) * scale; a.x = L - gap - wa / 2; L = a.x - wa / 2;
        if (b) { const wb = width(b) * scale; b.x = Rr + gap + wb / 2; Rr = b.x + wb / 2; b.flip = a.code === b.code; }
      });
      const span = Math.max(CW / 2 - L, Rr - CW / 2) * 2;
      if (span <= CW * 0.94 || pass === 1) break;
      scale = (CW * 0.94) / span;
    }
    rowItems.forEach(it => {
      it.w *= scale; it.h *= scale; it.y = R.y;
      if (it.base) { it.base.w *= scale; it.base.h *= scale; it.base.x = it.x; it.base.y = R.y; it.y = R.y - it.base.h * 0.82; }
    });
  }
  // thứ tự vẽ: hàng sau trước, trong hàng: vật ở giữa vẽ sau
  const zOf = it => ({ back: 0, mid: 1, front: 2, fore: 3 }[(it.on ? it.on.cat : it.cat).row] * 10 + (it.cat.k === "de" ? 0 : 1));
  items.sort((a, b) => zOf(a) - zOf(b));
  return { items, missing };
}
/* Nền ban thờ vẽ sẵn: tường + mặt bàn gỗ */
function drawDefaultBg(g) {
  const wall = g.createLinearGradient(0, 0, 0, 760);
  wall.addColorStop(0, "#E8DCCB"); wall.addColorStop(1, "#D6C3AC");
  g.fillStyle = wall; g.fillRect(0, 0, CW, 760);
  g.strokeStyle = "rgba(60,40,25,.55)"; g.lineWidth = 10;   // khung hồi văn đơn giản
  g.strokeRect(260, 70, CW - 520, 610);
  g.lineWidth = 3; g.strokeRect(282, 92, CW - 564, 566);
  const top = g.createLinearGradient(0, 700, 0, CH);
  top.addColorStop(0, "#4B2F1E"); top.addColorStop(0.5, "#3A2316"); top.addColorStop(1, "#2B190F");
  g.fillStyle = top;
  g.beginPath(); g.moveTo(90, 700); g.lineTo(CW - 90, 700); g.lineTo(CW, 1130); g.lineTo(0, 1130); g.closePath(); g.fill();
  g.strokeStyle = "rgba(255,220,180,.06)"; g.lineWidth = 2;   // vân gỗ
  for (let i = 0; i < 26; i++) { const y = 712 + i * 16; g.beginPath(); g.moveTo(60, y); g.bezierCurveTo(500, y + 6, 1100, y - 6, CW - 60, y + 2); g.stroke(); }
  g.fillStyle = "#24140C"; g.fillRect(0, 1130, CW, CH - 1130);
  g.fillStyle = "rgba(255,230,200,.12)"; g.fillRect(0, 1130, CW, 4);
}
function drawItem(g, it) {
  g.save();
  g.filter = "blur(10px)"; g.fillStyle = "rgba(0,0,0,.38)";
  g.beginPath(); g.ellipse(it.x, it.y - 2, it.w * 0.46, Math.max(6, it.w * 0.07), 0, 0, Math.PI * 2); g.fill();
  g.restore();
  g.save();
  g.translate(it.x, it.y);
  if (it.flip) g.scale(-1, 1);
  g.drawImage(it.cut, -it.w / 2, -it.h, it.w, it.h);
  g.restore();
}
function drawScene(g, st, sel) {
  g.clearRect(0, 0, CW, CH);
  if (st.bgImg) {
    const k = Math.max(CW / st.bgImg.width, CH / st.bgImg.height);
    g.drawImage(st.bgImg, (CW - st.bgImg.width * k) / 2, (CH - st.bgImg.height * k) / 2, st.bgImg.width * k, st.bgImg.height * k);
  } else drawDefaultBg(g);
  const all = [];
  st.items.forEach(it => { if (it.base && !all.includes(it.base)) all.push(it.base); if (!all.includes(it)) all.push(it); });
  all.forEach(it => drawItem(g, it));
  if (st.caption) {
    g.font = "500 26px 'Be Vietnam Pro', Arial, sans-serif"; g.textAlign = "right";
    g.fillStyle = "rgba(0,0,0,.35)"; g.fillText("Ảnh ghép minh họa – Gốm Vũ Gia", CW - 28, CH - 26);
    g.fillStyle = "rgba(255,255,255,.85)"; g.fillText("Ảnh ghép minh họa – Gốm Vũ Gia", CW - 30, CH - 28);
  }
  if (sel) {
    g.save(); g.strokeStyle = "#E0A458"; g.lineWidth = 4; g.setLineDash([14, 8]);
    g.strokeRect(sel.x - sel.w / 2 - 6, sel.y - sel.h - 6, sel.w + 12, sel.h + 12); g.restore();
  }
}
/* ----- Giao diện ----- */
let CMP = null;
async function openComposer() {
  const d = S.draft;
  if (!d.items.length) return toast("Hãy thêm sản phẩm vào bộ trước", "bad");
  const prev = d.compose || {};
  CMP = { remove: prev.remove !== false, tol: prev.tol || 38, caption: prev.caption !== false, bgId: prev.bgId || null, bgImg: null, items: [], missing: [], sel: null };
  CMP.close = modal({
    title: "Tự sắp ảnh ban thờ", size: "wide",
    body: `<div class="cmp">
      <div class="cmp-stage"><canvas id="cmp-cv" width="${CW}" height="${CH}" aria-label="Ảnh ghép ban thờ"></canvas>
        <div class="cmp-sel" id="cmp-sel" hidden>
          <span class="muted" id="cmp-sel-name"></span>
          <button class="btn sm" data-c="smaller">Nhỏ hơn</button><button class="btn sm" data-c="bigger">To hơn</button>
          <button class="btn sm" data-c="flip">Lật ngang</button><button class="btn sm" data-c="front">Đưa lên trước</button><button class="btn sm" data-c="back">Đưa ra sau</button>
          <button class="btn sm danger" data-c="hide">Bỏ khỏi ảnh</button></div>
        <p class="muted" style="font-size:12.5px;margin:6px 0 0">Kéo từng món để chỉnh vị trí; lăn chuột trên món để phóng to/thu nhỏ. Đây là ảnh ghép minh họa từ ảnh sản phẩm, không phải ảnh chụp thật.</p></div>
      <div class="cmp-side">
        <div class="field"><span>Nền ban thờ</span><div class="btn-row"><button class="btn sm" data-c="bg-default">Nền vẽ sẵn</button><button class="btn sm" data-c="bg-upload">Tải ảnh nền (ban thờ trống)</button></div></div>
        <label class="field"><span><input type="checkbox" id="cmp-rm" ${CMP.remove ? "checked" : ""}> Tự xóa nền ảnh sản phẩm</span></label>
        <label class="field"><span>Độ mạnh xóa nền: <b id="cmp-tolv">${CMP.tol}</b></span><input type="range" id="cmp-tol" min="10" max="90" value="${CMP.tol}"></label>
        <label class="field"><span><input type="checkbox" id="cmp-cap" ${CMP.caption ? "checked" : ""}> Ghi “Ảnh ghép minh họa” ở góc ảnh</span></label>
        <div class="field"><span>Ảnh sản phẩm trong bộ</span><div id="cmp-list" class="cmp-list"></div></div>
      </div></div>`,
    foot: `<span class="grow muted" id="cmp-status"></span><button class="btn" data-c="auto">Sắp xếp lại tự động</button><button class="btn" data-close>Hủy</button><button class="btn primary" data-c="use">Dùng ảnh này cho bộ ban thờ</button>`,
    onMount: el => { el.addEventListener("click", cmpClick); },
    onClose: () => { CMP = null; }
  });
  const cv = $("#cmp-cv");
  $("#cmp-rm").onchange = e => { CMP.remove = e.target.checked; cmpRebuild(true); };
  $("#cmp-tol").oninput = e => { $("#cmp-tolv").textContent = e.target.value; };
  $("#cmp-tol").onchange = e => { CMP.tol = +e.target.value; cmpRebuild(true); };
  $("#cmp-cap").onchange = e => { CMP.caption = e.target.checked; cmpDraw(); };
  cmpPointer(cv);
  if (CMP.bgId) { try { CMP.bgImg = await loadImg(await imageURL(CMP.bgId)); } catch { CMP.bgId = null; } }
  await cmpRebuild(false, prev.items);
}
async function cmpRebuild(keepPositions, saved) {
  if (!CMP) return;
  $("#cmp-status").textContent = "Đang xử lý ảnh sản phẩm…";
  const old = new Map((saved || (keepPositions ? CMP.items.map(cmpSave) : [])).map(s => [s.key, s]));
  const hidden = new Set((saved || []).filter(s => s.hidden).map(s => s.key).concat(keepPositions ? [...(CMP.hidden || [])] : []));
  const { items, missing } = await autoLayout(S.draft, { remove: CMP.remove, tol: CMP.tol });
  if (!CMP) return;
  items.forEach(it => { const s = old.get(it.key); if (s && !s.hidden) { it.x = s.x; it.y = s.y; it.w = s.w; it.h = s.w / it.ar; it.flip = s.flip; if (it.base) { it.base.x = s.x; it.base.y = s.by ?? it.base.y; } } });
  CMP.hidden = hidden;
  CMP.items = items.filter(it => !hidden.has(it.key) && !it.on);
  CMP.missing = missing; CMP.sel = null;
  cmpList(); cmpDraw();
  const n = new Set(items.map(i => i.lid)).size;
  $("#cmp-status").textContent = missing.length ? `${n} sản phẩm đã có ảnh · ${missing.length} sản phẩm chưa có ảnh (không xuất hiện trong ảnh ghép)` : `Đã xếp ${CMP.items.length} món từ ${n} sản phẩm`;
}
const cmpSave = it => ({ key: it.key, x: Math.round(it.x), y: Math.round(it.y), w: Math.round(it.w), flip: !!it.flip, by: it.base ? Math.round(it.base.y) : undefined });
function cmpDraw() { const cv = $("#cmp-cv"); if (!cv || !CMP) return; drawScene(cv.getContext("2d"), { ...CMP }, CMP.sel); cmpSelBar(); }
function cmpSelBar() {
  const bar = $("#cmp-sel"); if (!bar) return;
  bar.hidden = !CMP.sel;
  if (CMP.sel) { const l = S.draft.items.find(x => x.lid === CMP.sel.lid); $("#cmp-sel-name").textContent = l ? lineTitle(l) : ""; }
}
async function cmpList() {
  const box = $("#cmp-list"); if (!box) return;
  const rows = [];
  for (const l of S.draft.items) {
    const cat = catOf(l), im = imageFor(l);
    const url = im ? await imageURL(im.id) : null;
    const st = cat.k === "skip" ? '<span class="chip off">Không đưa vào ảnh</span>' : !im ? '<span class="chip bad">Chưa có ảnh</span>' : im.how === "borrow" ? `<span class="chip warn" title="Dùng ảnh của ${esc(pLabel(im.from))}">Mượn ảnh cỡ khác</span>` : '<span class="chip ok">Có ảnh</span>';
    rows.push(`<div class="cmp-row"><div class="thumb">${url ? `<img src="${url}" alt="">` : ICON.img}</div><div style="min-width:0"><b>${esc(lineTitle(l))}</b><div class="muted" style="font-size:12px">${esc(l.glaze)} · ${l.qty} ${esc(l.unit)}</div>${st}</div>
      ${cat.k === "skip" ? "" : `<button class="btn sm" data-c="upload" data-code="${esc(l.code)}">${im && im.how === "own" ? "Đổi ảnh" : "Tải ảnh"}</button>`}</div>`);
  }
  box.innerHTML = rows.join("");
}
async function setProductImage(code, file) {
  const p = S.products.get(code); if (!p) return toast("Sản phẩm không còn trong bảng giá", "bad");
  busy("Đang lưu ảnh sản phẩm…");
  try {
    const id = await storeImageFile(file, 1200);
    const np = { ...p, image: id, updatedAt: new Date().toISOString() };
    await DB.put("products", np);
    S.products.set(code, np);
    if (S.pe && S.pe.rows.has(code)) S.pe.rows.get(code).image = id;
    busy(); toast("Đã lưu ảnh cho " + pLabel(np) + " – dùng lại được cho các bộ khác");
    return true;
  } catch (e) { busy(); toast("Không lưu được ảnh: " + errMsg(e), "bad"); return false; }
}
async function cmpClick(e) {
  const b = e.target.closest("[data-c]"); if (!b || !CMP) return;
  const c = b.dataset.c, s = CMP.sel;
  if (c === "upload") pickFile("image/*", async f => { if (await setProductImage(b.dataset.code, f)) { await cmpRebuild(true); } });
  else if (c === "bg-upload") pickFile("image/*", async f => { try { busy("Đang lưu ảnh nền…"); CMP.bgId = await storeImageFile(f); CMP.bgImg = await loadImg(await imageURL(CMP.bgId)); busy(); cmpDraw(); } catch (err) { busy(); toast("Không lưu được ảnh nền: " + errMsg(err), "bad"); } });
  else if (c === "bg-default") { CMP.bgId = null; CMP.bgImg = null; cmpDraw(); }
  else if (c === "auto") { CMP.hidden = new Set(); await cmpRebuild(false); }
  else if (c === "use") cmpUse();
  else if (s) {
    if (c === "bigger" || c === "smaller") cmpScale(s, c === "bigger" ? 1.08 : 1 / 1.08);
    if (c === "flip") s.flip = !s.flip;
    if (c === "front" || c === "back") { const i = CMP.items.indexOf(s); CMP.items.splice(i, 1); c === "front" ? CMP.items.push(s) : CMP.items.unshift(s); }
    if (c === "hide") { CMP.hidden.add(s.key); CMP.items = CMP.items.filter(x => x !== s); CMP.sel = null; }
    cmpDraw();
  }
}
function cmpScale(it, f) {
  const cx = it.x, by = it.y;
  it.w *= f; it.h *= f;
  if (it.base) { it.base.w *= f; it.base.h *= f; it.base.x = cx; it.y = it.base.y - it.base.h * 0.82; }
  it.x = cx; if (!it.base) it.y = by;
}
function cmpPointer(cv) {
  const pt = e => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * CW / r.width, y: (e.clientY - r.top) * CH / r.height }; };
  const hit = p => { for (let i = CMP.items.length - 1; i >= 0; i--) { const it = CMP.items[i]; const top = it.y - it.h, bot = it.base ? it.base.y : it.y; if (p.x > it.x - it.w / 2 && p.x < it.x + it.w / 2 && p.y > top && p.y < bot) return it; } return null; };
  let drag = null;
  cv.addEventListener("pointerdown", e => { if (!CMP) return; const p = pt(e); const it = hit(p); CMP.sel = it; if (it) { drag = { it, dx: p.x - it.x, dy: p.y - it.y }; cv.setPointerCapture(e.pointerId); } cmpDraw(); });
  cv.addEventListener("pointermove", e => {
    if (!drag || !CMP) return; const p = pt(e), it = drag.it;
    const nx = p.x - drag.dx, ny = p.y - drag.dy, ddx = nx - it.x, ddy = ny - it.y;
    it.x = nx; it.y = ny; if (it.base) { it.base.x += ddx; it.base.y += ddy; }
    cmpDraw();
  });
  const end = () => { drag = null; };
  cv.addEventListener("pointerup", end); cv.addEventListener("pointercancel", end);
  cv.addEventListener("wheel", e => { if (!CMP) return; const it = hit(pt(e)); if (!it) return; e.preventDefault(); CMP.sel = it; cmpScale(it, e.deltaY < 0 ? 1.05 : 1 / 1.05); cmpDraw(); }, { passive: false });
}
async function cmpUse() {
  if (!CMP.items.length) return toast("Ảnh chưa có món nào – hãy tải ảnh sản phẩm trước", "bad");
  busy("Đang tạo ảnh ban thờ…");
  try {
    const c = document.createElement("canvas"); c.width = CW; c.height = CH;
    drawScene(c.getContext("2d"), { ...CMP }, null);
    const blob = await new Promise(r => c.toBlob(r, "image/jpeg", 0.9));
    if (!blob) throw new Error("Không tạo được ảnh");
    const id = uid("img");
    await DB.put("images", { id, blob, type: "image/jpeg", w: CW, h: CH, createdAt: new Date().toISOString(), composed: true });
    S.imgURL.set(id, URL.createObjectURL(blob)); S.imgMeta.set(id, { w: CW, h: CH });
    const d = S.draft;
    d.imageId = id; d.imageSig = itemsSig(d);
    d.compose = { remove: CMP.remove, tol: CMP.tol, caption: CMP.caption, bgId: CMP.bgId, items: [...CMP.items.map(cmpSave), ...[...CMP.hidden].map(k => ({ key: k, hidden: true }))] };
    const miss = CMP.missing.length;
    busy(); CMP.close();
    renderPhoto(); touched();
    toast(miss ? "Đã dùng ảnh ghép. Lưu ý: còn sản phẩm chưa có ảnh nên không xuất hiện trong ảnh." : "Đã dùng ảnh ghép cho bộ ban thờ");
  } catch (e) { busy(); toast("Không tạo được ảnh: " + errMsg(e), "bad"); }
}
