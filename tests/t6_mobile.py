"""Dùng trên điện thoại (iPhone 390×844): thanh mục dưới, vùng chạm, ô nhập không phóng to, tạo bộ một tay,
gửi báo giá qua bảng chia sẻ, lọc bảng giá, chọn nhiều mẫu, thẻ báo giá, hướng dẫn cài ứng dụng."""
from common import *

# Ghi lại các lần gọi navigator.share; lần đầu có thể giả lập lỗi “không còn là thao tác người dùng” (NotAllowedError)
SHARE_STUB = """
window.__shared = []; window.__shareFailOnce = false;
navigator.canShare = d => !!(d && d.files && d.files.length);
navigator.share = async d => {
  if (window.__shareFailOnce) { window.__shareFailOnce = false; throw new DOMException('no activation', 'NotAllowedError'); }
  window.__shared.push(d.files.map(f => [f.name, f.type, f.size]));
};
"""


def visible_small(page, root):
    """Nút/ô bấm đang hiện trong màn hình mà thấp hơn 40px (bỏ qua chữ liên kết trong đoạn văn)."""
    return page.evaluate("""root => [...document.querySelectorAll(root + ' button, ' + root + ' .xs-btn, ' + root + ' input:not([type=file]):not([hidden])')]
      .filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.right > 0 && r.left < innerWidth && getComputedStyle(e).visibility !== 'hidden' && !e.closest('[hidden]'); })
      .filter(e => e.getBoundingClientRect().height < 39.5 && !e.matches('.xs-native,[type=checkbox]'))
      .map(e => (e.dataset.act || e.id || e.className) + ':' + Math.round(e.getBoundingClientRect().height))""", root)


with sync_playwright() as p:
    ctx, page, errs = new_ctx(p, user_dir=os.path.join(OUT, "profile_m"), w=390, h=844, fresh=True, iphone=True)
    page.add_init_script(SHARE_STUB)
    page.goto(URL); page.wait_for_timeout(1200)

    # Thanh mục dưới thay tab trên; không tràn ngang ở mọi mục
    assert page.is_visible("#bnav") and not page.is_visible("#tab-builder")
    for v in ["builder", "quotes", "templates", "prices"]:
        page.click(f".bn[data-view={v}]"); page.wait_for_timeout(400)
        sel = page.get_attribute(f".bn[data-view={v}]", "aria-selected")
        over = page.evaluate("document.documentElement.scrollWidth > innerWidth")
        print("mục", v, "chọn:", sel, "tiêu đề:", page.text_content("#appbar-title"), "tràn:", over)
        assert sel == "true" and not over
        page.screenshot(path=f"{SHOT}/30_mobile_{v}.png")

    # Ô nhập ≥16px (iPhone không tự phóng to)
    small_font = page.evaluate("[...document.querySelectorAll('input:not([type=file]):not([type=checkbox]),textarea,.xs-btn')].filter(e=>e.offsetParent).filter(e=>parseFloat(getComputedStyle(e).fontSize)<16).map(e=>e.id||e.className)")
    print("ô nhập < 16px:", small_font); assert not small_font

    # Hướng dẫn cài ứng dụng trên iPhone (menu Thêm)
    page.click("#bnav-more"); page.wait_for_timeout(300)
    page.click(".act:has-text('Cài ứng dụng')"); page.wait_for_timeout(300)
    guide = page.text_content(".modal")
    print("hướng dẫn cài:", "Thêm vào MH chính" in guide, "đăng nhập lại" in guide)
    assert "Thêm vào MH chính" in guide
    page.screenshot(path=f"{SHOT}/31_mobile_install.png")
    page.click(".modal [data-close] >> nth=0"); page.wait_for_timeout(200)

    # Lời nhắc cài app ở trang Tạo bộ, “Để sau” thì không hiện lại
    page.click(".bn[data-view=builder]"); page.wait_for_timeout(400)
    assert page.is_visible("#b-banners [data-act=install]")
    page.click("[data-act=install-hide]"); page.reload(); page.wait_for_timeout(1000)
    print("nhắc cài sau khi tắt:", page.locator("#b-banners [data-act=install]").count())
    assert page.locator("#b-banners [data-act=install]").count() == 0

    # Tạo bộ từ trống: danh mục toàn màn hình, thêm 2 sản phẩm không đóng danh mục
    page.click(".mbar [data-act=b-more]"); page.click(".act:has-text('Bộ mới')"); page.wait_for_timeout(300)
    if page.locator(".modal [data-ok]").count(): page.click(".modal [data-ok]"); page.wait_for_timeout(300)
    page.click(".mbar [data-act=cat-open]"); page.wait_for_timeout(400)
    page.fill("#cat-q", "bát hương"); page.wait_for_timeout(400)
    page.click("#cat-list .pcard >> nth=0 >> button[data-act=c-add]"); page.wait_for_timeout(300)
    page.click("#cat-list .pcard >> nth=1 >> button[data-act=c-add]"); page.wait_for_timeout(300)
    cat_open = page.evaluate("document.querySelector('#catalog').classList.contains('open')")
    print("danh mục vẫn mở:", cat_open, "dòng:", page.evaluate("S.draft.items.length"), "nút Xong:", page.text_content(".cat-foot .btn").strip(), "đã có:", page.locator("#cat-list .chip.lam").count())
    assert cat_open and page.evaluate("S.draft.items.length") == 2 and page.locator("#cat-list .chip.lam").count() >= 2
    page.screenshot(path=f"{SHOT}/32_mobile_catalog.png")
    small = visible_small(page, "#catalog"); print("nút nhỏ trong danh mục:", small); assert not small
    page.click(".cat-foot .btn"); page.wait_for_timeout(400)

    # Dòng vật phẩm: tăng số lượng, xóa qua menu ⋯ rồi Hoàn tác
    page.click("tr[data-lid] >> nth=0 >> [data-act=inc]"); page.wait_for_timeout(200)
    page.click("tr[data-lid] >> nth=1 >> [data-act=row-more]"); page.wait_for_timeout(300)
    page.click(".act.danger"); page.wait_for_timeout(300)
    after_del = page.evaluate("S.draft.items.length")
    page.click(".toast button:has-text('Hoàn tác')"); page.wait_for_timeout(300)
    print("SL dòng 1:", page.evaluate("S.draft.items[0].qty"), "xóa:", after_del, "hoàn tác:", page.evaluate("S.draft.items.length"))
    assert page.evaluate("S.draft.items[0].qty") == 2 and after_del == 1 and page.evaluate("S.draft.items.length") == 2
    small = visible_small(page, "#view-builder"); print("nút nhỏ trang Tạo bộ:", small); assert not small
    page.screenshot(path=f"{SHOT}/33_mobile_items.png")

    # Lưu thành mẫu qua menu ⋯
    n_tpl = page.evaluate("[...S.records.values()].filter(r=>r.kind==='template').length")
    page.click(".mbar [data-act=b-more]"); page.click(".act:has-text('Lưu thành mẫu')"); page.wait_for_timeout(300)
    page.fill("#ask-name", "Bộ thử điện thoại"); page.click(".modal [data-ok]"); page.wait_for_timeout(800)
    print("mẫu:", n_tpl, "->", page.evaluate("[...S.records.values()].filter(r=>r.kind==='template').length"))
    assert page.evaluate("[...S.records.values()].filter(r=>r.kind==='template').length") == n_tpl + 1

    # Lập báo giá, gửi PDF qua bảng chia sẻ (lần đầu trình duyệt từ chối → bấm Gửi lần nữa), gửi ảnh PNG
    page.click(".mbar [data-act=b-more]"); page.click(".act:has-text('Lập báo giá cho khách')"); page.wait_for_timeout(400)
    page.fill("#c-name", "Chị Lan"); page.fill("#c-phone", "0912 345 678")
    print("ô SĐT:", page.get_attribute("#c-phone", "type"))
    page.evaluate("window.__shareFailOnce = true")
    page.click(".mbar [data-act=b-more]"); page.click(".act:has-text('Gửi báo giá (PDF)')")
    page.wait_for_selector(".modal [data-sh]", timeout=60000); page.click(".modal [data-sh]"); page.wait_for_timeout(500)
    page.click(".mbar [data-act=b-more]"); page.click(".act:has-text('Gửi ảnh báo giá')")
    page.wait_for_function("window.__shared.length >= 2", timeout=60000)
    shared = page.evaluate("window.__shared"); print("đã gửi:", shared)
    assert shared[0][0][1] == "application/pdf" and shared[0][0][0].endswith(".pdf") and shared[1][0][1] == "image/png"

    # Lưu báo giá (hỏi thông tin khách) → trang Báo giá hiện dạng thẻ, có gọi điện, có Gửi PDF
    page.click(".mbar [data-act=save-any]"); page.wait_for_timeout(300)
    page.click(".modal [data-ok]"); page.wait_for_timeout(800)
    page.click(".bn[data-view=quotes]"); page.wait_for_timeout(500)
    card = page.evaluate("getComputedStyle(document.querySelector('table.qlist tbody tr')).display")
    tel = page.get_attribute("table.qlist a.tel", "href")
    print("thẻ báo giá:", card, "gọi:", tel, "nút gửi:", page.is_visible("table.qlist [data-act=pdf-send]"))
    assert card == "grid" and tel == "tel:0912345678" and page.is_visible("table.qlist [data-act=pdf-send]")
    small = visible_small(page, "#view-quotes"); print("nút nhỏ trang Báo giá:", small); assert not small
    page.screenshot(path=f"{SHOT}/34_mobile_quotes.png")

    # Bảng giá: bộ lọc gọn sau nút Lọc, thấy sản phẩm ngay màn hình đầu
    page.click(".bn[data-view=prices]"); page.wait_for_timeout(500)
    first = page.evaluate("document.querySelector('#pe-table tbody tr[data-k]').getBoundingClientRect().top")
    print("lọc ẩn:", not page.is_visible("#pe-group + .xs-btn"), "dòng đầu ở:", round(first))
    assert not page.is_visible("#pe-group + .xs-btn") and first < 844 - 58 - 40
    page.click("[data-act=pe-filters]"); page.wait_for_timeout(200)
    page.click("#pe-group + .xs-btn"); page.wait_for_timeout(300); page.click(".xs-opt >> nth=2"); page.wait_for_timeout(400)
    print("lọc nhóm:", page.evaluate("S.peFilter.group"), "nút:", page.text_content("[data-act=pe-filters]").strip())
    assert page.evaluate("S.peFilter.group") and "(1)" in page.text_content("[data-act=pe-filters]")
    page.screenshot(path=f"{SHOT}/35_mobile_prices.png")

    # Mẫu: chọn 2 mẫu → thanh gửi PDF gộp dính dưới
    page.click(".bn[data-view=templates]"); page.wait_for_timeout(500)
    page.click(".tcard >> nth=0 >> .tc-sel"); page.click(".tcard >> nth=1 >> .tc-sel"); page.wait_for_timeout(300)
    btn = page.text_content("[data-act=pdf-sel] .m-only").strip() + page.evaluate("document.querySelector('[data-act=pdf-sel]').lastChild.textContent")
    print("thanh chọn:", page.locator(".sel-bar.on").count(), btn)
    assert page.locator(".sel-bar.on").count() == 1 and "(2)" in btn
    small = visible_small(page, "#view-templates"); print("nút nhỏ trang Mẫu:", small); assert not small
    page.screenshot(path=f"{SHOT}/36_mobile_templates.png")

    # Máy tính: giữ giao diện cũ
    page.set_viewport_size({"width": 1440, "height": 900}); page.wait_for_timeout(300)
    page.click("#tab-builder"); page.wait_for_timeout(400)
    desk = [page.is_visible("#bnav"), page.is_visible("#tab-builder"), page.is_visible(".mbar"), page.is_visible(".b-top [data-act=pdf]")]
    print("máy tính (bnav, tab, mbar, nút PDF):", desk); assert desk == [False, True, False, True]
    print("errs:", errs); assert not errs
    ctx.close()
