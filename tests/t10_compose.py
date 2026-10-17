from common import *
MAP = [("Bát hương rồng kĩ Ø20","bathuong20"),("Bát hương rồng kĩ Ø18","bathuong18"),("Đế sứ bát hương","de"),("Lộc bình","binh"),("Chóe","choe"),("Đèn","den"),("Bát cơm","bat_com"),("Mâm bồng","mam"),("Bộ ấm","bo_am"),("Ống hương","ong"),("Nậm","nam"),("Chân nến","nen"),("Kỉ ngai","ki")]
PROD = os.path.join(FIX, "prod")
if not os.path.isdir(PROD):
    raise SystemExit("BỎ QUA: thiếu thư mục ảnh mẫu tests/fixtures/prod/")
with sync_playwright() as p:
    ctx, page, errs = new_ctx(p, user_dir=os.path.join(OUT, "profile4"), fresh=True)
    page.goto(URL); page.wait_for_timeout(800)
    page.click("#view-prices [data-act=demo]"); page.wait_for_timeout(1500)
    page.click("[data-act=compose]"); page.wait_for_timeout(1200)
    print("status:", page.text_content("#cmp-status"))
    for i in range(20):
        rows = page.locator(".cmp-row")
        done = False
        for r in range(rows.count()):
            row = rows.nth(r); btn = row.locator("[data-c=upload]")
            if not btn.count() or btn.text_content() != "Tải ảnh": continue
            name = row.locator("b").text_content()
            f = next((v for k, v in MAP if name.startswith(k)), None)
            if not f: continue
            btn.click(); page.set_input_files("#file-any", os.path.join(PROD, f"{f}.jpg")); page.wait_for_timeout(1200)
            done = True; break
        if not done: break
    print("status:", page.text_content("#cmp-status"))
    page.screenshot(path=f"{SHOT}/60_composer.png")
    # kéo thử một món
    box = page.locator("#cmp-cv").bounding_box()
    page.mouse.move(box["x"]+box["width"]*0.5, box["y"]+box["height"]*0.85); page.mouse.down(); page.mouse.move(box["x"]+box["width"]*0.52, box["y"]+box["height"]*0.83, steps=5); page.mouse.up()
    page.wait_for_timeout(200)
    print("chọn:", page.is_visible("#cmp-sel"), page.text_content("#cmp-sel-name"))
    page.click("[data-c=use]"); page.wait_for_timeout(1000)
    print("ảnh:", page.evaluate("[S.draft.imageId, !!S.draft.compose, S.draft.compose.items.length]"), toasts(page)[-1:])
    page.click("[data-act=save-tpl]"); page.wait_for_timeout(500)
    page.reload(); page.wait_for_timeout(1200)
    print("sau tải lại:", page.evaluate("[S.draft.imageId, !!S.draft.compose]"))
    page.click("[data-act=compose]"); page.wait_for_timeout(1500)
    print("mở lại:", page.text_content("#cmp-status"))
    page.click(".modal [data-close] >> nth=0")
    page.locator("#photo img").scroll_into_view_if_needed(); page.wait_for_timeout(300)
    page.screenshot(path=f"{SHOT}/61_builder_composed.png")
    page.evaluate("(async()=>{const u=await imageURL(S.draft.imageId); const b=await (await fetch(u)).blob(); window._b=b;})()")
    print("errs:", errs)
    ctx.close()
