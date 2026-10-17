from common import *
with sync_playwright() as p:
    ctx, page, errs = new_ctx(p, user_dir=os.path.join(OUT, "profile4"))
    page.goto(URL); page.wait_for_timeout(1000)
    page.evaluate("S.framed=true; S.downloads={save:()=>Promise.reject({code:'not_granted',message:'x'})}")
    page.click("[data-act=png]"); page.wait_for_timeout(4000)
    print("PNG:", page.inner_text(".modal-h"), page.locator(".modal-b img").count())
    page.screenshot(path=f"{SHOT}/70_fallback_png.png")
    page.click(".modal-f [data-close]")
    page.click("[data-act=pdf]"); page.wait_for_timeout(5000)
    print("PDF:", page.locator(".modal-b img").count(), errs)
    ctx.close()
