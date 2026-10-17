from common import *
IMG = os.path.join(DATA, "demo_altar.jpg")
def card(page, name):
    return page.locator(".pcard", has=page.locator("h4", has_text=re.compile("^" + re.escape(name) + "$")))
def add(page, name, size=None, glaze="Men lam vẽ vàng", qty=None):
    page.fill("#cat-q", name); page.wait_for_timeout(300)
    c = card(page, name).first
    if size: c.locator(f"[data-act=c-size][data-v='{size}']").click()
    c = card(page, name).first
    if glaze: c.locator(f"[data-act=c-glaze][data-v='{glaze}']").click()
    c = card(page, name).first
    if qty: c.locator("[data-cqty]").fill(str(qty))
    c.locator("[data-act=c-add]").click(); page.wait_for_timeout(120)
def totals(page):
    return page.evaluate("(()=>{const c=calc(S.draft);return [c.subtotal,c.discount,c.total,c.missing,document.querySelector('#t-total').textContent,document.querySelector('#t-prov').textContent]})()")

with sync_playwright() as p:
    ctx, page, errs = new_ctx(p)
    page.goto(URL); page.wait_for_timeout(800)
    page.click("#tab-builder"); page.wait_for_timeout(300)
    add(page, "Bát hương rồng kĩ", "Ø18", qty=2)
    add(page, "Bát hương rồng kĩ", "Ø20")
    add(page, "Lộc bình sen", "H40")
    add(page, "Bộ ấm 5 chén cúng sen")
    add(page, "Bát cơm sen", qty=6)
    add(page, "Bát hương rồng kĩ", "Ø18")  # cộng dồn → 3
    print("dòng:", page.evaluate("S.draft.items.map(l=>l.name+' '+l.size+' '+l.glaze+' x'+l.qty+' '+l.unit+' @'+l.price)"))
    print("tổng:", totals(page))
    # giảm %
    page.select_option("#d-dmode", "percent"); page.fill("#d-dval", "10"); page.wait_for_timeout(100)
    page.fill("[data-fee=shipping]", "300.000"); page.fill("[data-fee=install]", "200000"); page.fill("#d-olabel", "Phí đóng thùng gỗ"); page.fill("[data-fee=otherFee]", "50000")
    print("giảm 10% + phí:", totals(page))
    page.select_option("#d-dmode", "amount"); page.fill("#d-dval", "20000000"); page.wait_for_timeout(100)
    print("giảm vượt:", totals(page), page.text_content("#t-derr"))
    page.fill("#d-dval", "870000"); page.wait_for_timeout(100)
    print("giảm 870k:", totals(page))
    # số lượng không hợp lệ
    q = page.locator("#items-body tr").nth(0).locator("[data-qty]")
    q.fill("0"); print("qty 0 err:", q.get_attribute("class"), page.evaluate("S.draft.items[0].qty"))
    q.fill("abc"); q.blur(); page.wait_for_timeout(100); print("qty abc ->", q.input_value())
    page.locator("#items-body tr").nth(0).locator("[data-act=inc]").click()
    print("sau +:", page.evaluate("S.draft.items[0].qty"), totals(page)[0])
    page.locator("#items-body tr").nth(0).locator("[data-act=dec]").click()
    # di chuyển & xóa
    page.locator("#items-body tr").nth(2).locator("[data-act=up]").click()
    print("thứ tự:", page.evaluate("S.draft.items.map(l=>l.name+' '+l.size)"))
    # ảnh
    page.set_input_files("#ph-file", IMG); page.wait_for_timeout(600)
    print("ảnh:", page.evaluate("S.draft.imageId"))
    page.fill("#d-name", "Bộ thử nghiệm ban 1m53"); page.fill("#d-note", "Giao hàng trong 5 ngày")
    page.screenshot(path=f"{SHOT}/07_builder.png", full_page=True)
    # lưu mẫu
    page.click("[data-act=save-tpl]"); page.wait_for_timeout(500)
    print("toasts:", toasts(page)[-1:])
    tid = page.evaluate("S.draft.id")
    # thêm dòng → nhắc ảnh
    add(page, "Chóe thờ sen", "S3", qty=3)
    print("nhắc ảnh:", page.locator(".stale").count())
    page.click("[data-act=save-tpl]"); page.wait_for_timeout(400)
    page.reload(); page.wait_for_timeout(1000)
    print("sau tải lại:", page.evaluate("[S.view, S.draft.id, S.draft.items.length, S.draft.imageId, !!document.querySelector('#photo img')]"), page.evaluate(f"S.records.get('{tid}').items.length"))
    page.wait_for_timeout(300)
    page.screenshot(path=f"{SHOT}/08_after_reload.png")
    # nhân bản từ danh sách mẫu
    page.click("#tab-templates"); page.wait_for_timeout(300)
    page.click(f"[data-act=dup][data-id='{tid}']"); page.wait_for_timeout(400)
    copy_id = page.evaluate(f"[...S.records.values()].find(r=>r.sourceTemplateId==='{tid}').id")
    page.screenshot(path=f"{SHOT}/09_templates.png")
    page.click(f"[data-act=open][data-id='{copy_id}']"); page.wait_for_timeout(400)
    page.locator("#items-body tr").nth(0).locator("[data-act=del]").click()
    page.locator("#items-body tr").nth(0).locator("[data-act=inc]").click()
    page.click("[data-act=save-tpl]"); page.wait_for_timeout(400)
    print("gốc vs bản sao:", page.evaluate(f"[S.records.get('{tid}').items.length, S.records.get('{copy_id}').items.length, S.records.get('{tid}').items.map(l=>l.qty).join(','), S.records.get('{copy_id}').items.map(l=>l.qty).join(',')]"))
    # báo giá từ mẫu gốc
    page.click("#tab-templates"); page.wait_for_timeout(300)
    page.click(f"[data-act=quote][data-id='{tid}']"); page.wait_for_timeout(400)
    page.click("[data-act=save-quote]"); page.wait_for_timeout(300)
    page.fill("#q-name", "Anh Minh"); page.fill("#q-phone", "0912 345 678"); page.fill("#q-addr", "Long Biên, Hà Nội"); page.fill("#q-valid", "2026-11-15")
    page.click(".modal [data-ok]"); page.wait_for_timeout(500)
    qid = page.evaluate("S.draft.id"); qcode = page.evaluate("S.draft.quoteCode")
    qtotal = page.evaluate(f"calc(S.records.get('{qid}')).total")
    print("báo giá:", qid, qcode, qtotal, toasts(page)[-1:])
    # đổi giá trong bảng giá
    page.click("#tab-prices"); page.wait_for_timeout(300)
    page.fill("#pe-q", "BH01-D20-VV"); page.wait_for_timeout(500)
    inp = page.locator("input[data-k='BH01-D20-VV'][data-f=price]")
    inp.fill("2.450.000"); page.wait_for_timeout(100)
    page.screenshot(path=f"{SHOT}/10_price_edit.png")
    page.click("[data-act=save]"); page.wait_for_timeout(500)
    print("giá mới:", page.evaluate("S.products.get('BH01-D20-VV').price"), toasts(page)[-1:])
    print("báo giá giữ nguyên:", page.evaluate(f"[calc(S.records.get('{qid}')).total, S.records.get('{qid}').items.find(l=>l.code==='BH01-D20-VV').price]"), "trước:", qtotal)
    page.click("#tab-quotes"); page.wait_for_timeout(300)
    page.screenshot(path=f"{SHOT}/11_quotes.png")
    page.click(f"[data-act=open][data-id='{qid}']"); page.wait_for_timeout(400)
    print("banner:", page.locator("[data-act=upd-prices]").count())
    page.click("[data-act=upd-prices]"); page.wait_for_timeout(300)
    page.screenshot(path=f"{SHOT}/12_update_prices.png")
    page.click(".modal [data-ok]"); page.wait_for_timeout(300)
    print("sau cập nhật (chưa lưu):", page.evaluate(f"[calc(S.draft).total, calc(S.records.get('{qid}')).total]"))
    # Xuất PDF & PNG
    with page.expect_download(timeout=60000) as dl:
        page.click("[data-act=pdf]")
    d = dl.value; d.save_as(os.path.join(OUT, "out_quote.pdf")); print("PDF:", d.suggested_filename)
    with page.expect_download(timeout=60000) as dl:
        page.click("[data-act=png]")
    d = dl.value; d.save_as(os.path.join(OUT, "out_quote.png")); print("PNG:", d.suggested_filename)
    page.click("[data-act=save-quote]"); page.wait_for_timeout(400)
    print("đã lưu cập nhật:", page.evaluate(f"calc(S.records.get('{qid}')).total"))
    print("errs:", errs)
    ctx.close()
