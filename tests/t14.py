from common import *
with sync_playwright() as p:
    ctx, page, errs = new_ctx(p, user_dir=os.path.join(OUT, "profile4"))
    page.goto(URL); page.wait_for_timeout(1200)
    page.click("#tab-builder"); page.wait_for_timeout(500)
    page.screenshot(path=f"{SHOT}/90_brand_light.png")
    page.emulate_media(color_scheme="dark"); page.wait_for_timeout(300)
    page.screenshot(path=f"{SHOT}/91_brand_dark.png")
    page.emulate_media(color_scheme="light")
    with page.expect_download(timeout=60000) as dl:
        page.click("[data-act=pdf]")
    dl.value.save_as(f"{OUT}/brand.pdf")
    print(errs); ctx.close()
