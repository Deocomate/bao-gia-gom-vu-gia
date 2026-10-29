from common import *
# Sửa đơn giá từng dòng trong bộ đang soạn: chỉ đổi bộ này, không đổi bảng giá
with sync_playwright() as p:
    ctx, page, errs = new_ctx(p, user_dir=os.path.join(OUT, "profile17"), fresh=True)
    page.goto(URL); page.wait_for_timeout(800)
    page.click("#tab-builder"); page.wait_for_timeout(300)
    page.fill("#cat-q", "Bát cơm sen"); page.wait_for_timeout(300)
    page.locator(".pcard [data-act=c-glaze][data-v='Men lam']").first.click()
    page.locator(".pcard [data-cqty]").first.fill("6")
    page.locator(".pcard [data-act=c-add]").first.click(); page.wait_for_timeout(200)
    line = "#items-body tr >> nth=0"
    inp = page.locator(f"{line} >> [data-lprice]")
    code = page.evaluate("S.draft.items[0].code")
    list_price = page.evaluate(f"S.products.get('{code}').price")
    print("ban đầu:", inp.input_value(), list_price)

    inp.fill("60.000"); page.wait_for_timeout(100)
    print("sau sửa:", page.evaluate("[S.draft.items[0].price, calc(S.draft).subtotal]"), page.locator(f"{line} >> [data-amt]").text_content())
    print("chip:", page.locator(f"{line} >> [data-tags] .chip").all_text_contents(), "banner:", page.locator("[data-act=upd-prices]").count())
    inp.blur(); page.wait_for_timeout(100)
    print("định dạng:", inp.input_value(), "bảng giá giữ nguyên:", page.evaluate(f"S.products.get('{code}').price") == list_price)
    assert page.evaluate("S.draft.items[0].price") == 60000 and page.evaluate("calc(S.draft).subtotal") == 360000

    inp.fill("abc"); page.wait_for_timeout(100); inp.blur(); page.wait_for_timeout(200)
    print("sai:", inp.input_value(), page.evaluate("S.draft.items[0].price"), page.locator(".toast").last.text_content())
    assert inp.input_value() == "60.000"

    inp.fill(""); page.wait_for_timeout(100)
    print("để trống:", page.evaluate("[S.draft.items[0].price, calc(S.draft).missing]"))
    assert page.evaluate("S.draft.items[0].price") is None

    inp.fill("75000"); inp.blur(); page.wait_for_timeout(1500)
    page.reload(); page.wait_for_timeout(1200); page.click("#tab-builder"); page.wait_for_timeout(300)
    print("sau tải lại:", page.evaluate("S.draft.items[0].price"), page.locator("#items-body [data-lprice]").first.input_value())
    assert page.evaluate("S.draft.items[0].price") == 75000

    assert page.evaluate("S.draft.items[0].manual") is True

    # Bảng giá đổi: dòng sửa tay giữ giá; thêm dòng theo bảng giá thì nhận giá mới
    page.fill("#cat-q", "Bát cơm sen"); page.wait_for_timeout(300)
    page.locator(".pcard [data-act=c-glaze][data-v='Men lam vẽ vàng']").first.click()
    page.locator(".pcard [data-act=c-add]").first.click(); page.wait_for_timeout(200)
    code2 = page.evaluate("S.draft.items[1].code")
    page.evaluate(f"commitProducts([{{...S.products.get('{code}'), price: 99000}}, {{...S.products.get('{code2}'), price: 123000}}])"); page.wait_for_timeout(300)
    print("sau đổi bảng giá:", page.evaluate("S.draft.items.map(l => [l.price, !!l.manual])"))
    assert page.evaluate("S.draft.items[0].price") == 75000 and page.evaluate("S.draft.items[1].price") == 123000
    page.click("#tab-prices"); page.wait_for_timeout(200); page.click("#tab-builder"); page.wait_for_timeout(300)
    print("chip:", page.locator(f"{line} >> [data-tags] .chip").all_text_contents())

    # Lưu giá sửa tay vào bảng giá
    page.locator(f"{line} >> [data-act=lp-save]").click(); page.wait_for_timeout(200)
    page.locator(".modal [data-ok]").click(); page.wait_for_timeout(500)
    print("lưu vào bảng giá:", page.evaluate(f"[S.products.get('{code}').price, S.draft.items[0].manual]"), page.locator("[data-act=upd-prices]").count())
    assert page.evaluate(f"S.products.get('{code}').price") == 75000 and page.evaluate("S.draft.items[0].manual") is None

    # Dùng lại giá bảng
    inp = page.locator(f"{line} >> [data-lprice]")
    inp.fill("80.000"); inp.blur(); page.wait_for_timeout(100)
    page.locator(f"{line} >> [data-act=lp-reset]").click(); page.wait_for_timeout(200)
    print("dùng giá bảng:", page.evaluate("[S.draft.items[0].price, S.draft.items[0].manual]"))
    assert page.evaluate("S.draft.items[0].price") == 75000

    # Nút trên banner đưa mọi dòng sửa tay về giá bảng
    inp = page.locator(f"{line} >> [data-lprice]")
    inp.fill("81.000"); inp.blur(); page.wait_for_timeout(100)
    page.click("[data-act=upd-prices]"); page.wait_for_timeout(300)
    page.locator(".modal [data-ok]").click(); page.wait_for_timeout(300)
    print("về giá bảng:", page.evaluate("S.draft.items[0].price"), page.locator("#items-body [data-lprice]").first.input_value())
    assert page.evaluate("S.draft.items[0].price") == 75000 and page.locator("[data-act=upd-prices]").count() == 0
    page.screenshot(path=os.path.join(OUT, "shots", "17_line_price.png"))
    print("errs:", errs)
    assert not errs
    ctx.close()
