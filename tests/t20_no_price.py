"""Ảnh không giá gửi nhà xưởng chuẩn bị hàng: không có đơn giá, tiền, thông tin khách; xuất được cả khi còn sản phẩm chưa có giá."""
from common import *

# Dựng bản xuất không giá rồi đọc chữ trên trang (trước khi bị xóa khỏi #xp-stage)
NP_TEXT = "(async () => { const [pg] = await buildExport(S.draft, true, { noPrice: true }); const t = pg.innerText; document.querySelector('#xp-stage').innerHTML = ''; return t; })()"

with sync_playwright() as p:
    ctx, page, errs = new_ctx(p, user_dir=os.path.join(OUT, "profile20"), fresh=True)
    page.goto(URL); page.wait_for_timeout(1000)
    page.evaluate("quoteFromTemplate('tpl_phuc_lien_hoa')"); page.wait_for_timeout(800)
    page.fill("#c-name", "Anh Tuấn"); page.fill("#c-phone", "0987 654 321"); page.fill("#c-addr", "Hội An")
    page.evaluate("S.draft.shipping = 300000; S.draft.vatNote = 'Giá chưa gồm VAT'; S.draft.note = 'Giao trước ngày 20'")
    t = page.evaluate(NP_TEXT)
    count = page.evaluate("calc(S.draft).count")
    money = page.evaluate("[...new Set(S.draft.items.map(l => fmt(l.price)))]")
    print("có tiêu đề:", "PHIẾU CHUẨN BỊ HÀNG" in t.upper(), "tổng SL:", f"{count} SP" in t, "ghi chú:", "Giao trước ngày 20" in t)
    leaks = [x for x in [" đ", "Đơn giá", "Thành tiền", "TỔNG THANH TOÁN", "Anh Tuấn", "0987 654 321", "Hội An", "VAT", *money] if x in t]
    print("lộ thông tin:", leaks)
    assert "PHIẾU CHUẨN BỊ HÀNG" in t.upper() and f"{count} SP" in t and "Giao trước ngày 20" in t and not leaks

    # Còn sản phẩm chưa có giá: báo giá bị chặn, ảnh không giá vẫn xuất được
    page.evaluate("S.draft.items[0].price = null; S.draft.items[0].manual = true; renderItems()")
    with page.expect_download(timeout=60000) as dl:
        page.click("#b-more > summary"); page.click("#b-more [data-act=png-np]")
    print("tên file:", dl.value.suggested_filename)
    assert dl.value.suggested_filename.startswith("Phieu_chuan_bi_hang_") and "Tuan" not in dl.value.suggested_filename
    page.click("#b-more > summary"); page.click("#b-more [data-act=png]"); page.wait_for_timeout(300)
    print("ảnh có giá bị chặn:", page.locator(".modal h2:has-text('Chưa thể xuất')").count())
    assert page.locator(".modal h2:has-text('Chưa thể xuất')").count() == 1
    page.click(".modal [data-close] >> nth=0")

    # Danh sách báo giá trên máy tính: nút Ảnh không giá
    page.evaluate("S.draft.items[0].price = 2200000; delete S.draft.items[0].manual"); page.click("[data-act=save-quote]"); page.wait_for_timeout(300)
    page.click(".modal [data-ok]"); page.wait_for_timeout(800)
    page.click("#tab-quotes"); page.wait_for_timeout(400)
    with page.expect_download(timeout=60000) as dl:
        page.click("table.qlist [data-act=png-np] >> nth=0")
    print("từ danh sách:", dl.value.suggested_filename); assert dl.value.suggested_filename.startswith("Phieu_chuan_bi_hang_BG")
    print("errs:", errs); assert not errs
    ctx.close()
