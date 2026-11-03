"""Cài ứng dụng lên màn hình chính: manifest và icon mở công khai, thẻ head, nút cài (Chrome/Android), ẩn khi đã chạy dạng app."""
from common import *
import json

with sync_playwright() as p:
    # Chưa đăng nhập: manifest và icon vẫn tải được, trang chính vẫn đòi đăng nhập
    req = p.request.new_context(base_url=BASE)
    r = req.get("/manifest.webmanifest"); m = json.loads(r.text())
    print("manifest:", r.status, r.headers.get("content-type"), m["short_name"], m["display"], m["start_url"], [i["src"] for i in m["icons"]])
    assert r.ok and m["display"] == "standalone" and m["start_url"] == "/" and any(i.get("purpose") == "maskable" for i in m["icons"])
    for n in ["icon-180.png", "icon-192.png", "icon-512.png", "icon-maskable-512.png"]:
        ri = req.get("/" + n); assert ri.ok and ri.headers["content-type"] == "image/png", n
    home = req.get("/", max_redirects=0); print("trang chính chưa đăng nhập:", home.status, home.headers.get("location"))
    assert home.status == 302 and home.headers["location"] == "/login"
    assert req.get("/api/me").status == 401
    login = req.get("/login").text()
    tags = ['rel="manifest"', 'rel="apple-touch-icon"', 'apple-mobile-web-app-capable', 'apple-mobile-web-app-title']
    print("thẻ ở trang đăng nhập:", all(t in login for t in tags)); assert all(t in login for t in tags)
    req.dispose()

    # Máy tính Chrome: nút cài chỉ hiện khi trình duyệt báo cài được (beforeinstallprompt)
    ctx, page, errs = new_ctx(p, user_dir=os.path.join(OUT, "profile_pwa"), fresh=True)
    page.goto(URL); page.wait_for_timeout(1000)
    html = page.content(); assert all(t in html for t in tags)
    before = page.is_visible("#install-btn")
    page.evaluate("""() => { const e = new Event('beforeinstallprompt'); e.prompt = () => { window.__prompted = 1; return Promise.resolve(); };
      e.userChoice = Promise.resolve({ outcome: 'accepted' }); window.dispatchEvent(e); }""")
    page.wait_for_timeout(200)
    shown = page.is_visible("#install-btn")
    page.click("#install-btn"); page.wait_for_timeout(300)
    print("nút cài trước/sau sự kiện:", before, shown, "đã gọi prompt:", page.evaluate("window.__prompted"), "ẩn sau khi cài:", not page.is_visible("#install-btn"))
    assert not before and shown and page.evaluate("window.__prompted") == 1 and not page.is_visible("#install-btn")
    print("errs:", errs); assert not errs
    ctx.close()

    # iPhone đã mở từ màn hình chính (standalone): không còn nút/nhắc cài
    ctx, page, errs = new_ctx(p, user_dir=os.path.join(OUT, "profile_pwa"), w=390, h=844, iphone=True)
    page.add_init_script("Object.defineProperty(navigator, 'standalone', { value: true })")
    page.goto(URL); page.wait_for_timeout(1000)
    page.click(".bn[data-view=builder]"); page.wait_for_timeout(300)
    page.click("#bnav-more"); page.wait_for_timeout(300)
    items = page.eval_on_selector_all(".act", "els=>els.map(e=>e.textContent)")
    print("menu Thêm (standalone):", items, "nhắc cài:", page.locator("#b-banners [data-act=install]").count())
    assert not any("Cài ứng dụng" in t for t in items) and page.locator("#b-banners [data-act=install]").count() == 0
    print("errs:", errs); assert not errs
    ctx.close()
