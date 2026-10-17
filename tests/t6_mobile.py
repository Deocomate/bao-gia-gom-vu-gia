from common import *
with sync_playwright() as p:
    ctx, page, errs = new_ctx(p, w=390, h=844)
    page.goto(URL); page.wait_for_timeout(900)
    page.click("#tab-builder"); page.wait_for_timeout(500)
    page.evaluate("document.querySelector('.items-wrap').scrollIntoView()"); page.wait_for_timeout(200)
    page.screenshot(path=f"{SHOT}/30_mobile_items.png")
    page.evaluate("document.querySelector('.totals').scrollIntoView()"); page.wait_for_timeout(200)
    page.screenshot(path=f"{SHOT}/31_mobile_totals.png")
    page.click("[data-act=cat-open] >> nth=0"); page.wait_for_timeout(400)
    page.screenshot(path=f"{SHOT}/32_mobile_catalog.png")
    print("tràn:", page.evaluate("document.documentElement.scrollWidth > window.innerWidth"), errs)
    ctx.close()
