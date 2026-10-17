import os, re, json, time, threading, functools
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST = os.path.join(ROOT, "dist")
DATA = os.path.join(ROOT, "data")
FIX = os.path.join(ROOT, "tests", "fixtures")
OUT = os.path.join(ROOT, "tests", ".output")
SHOT = os.path.join(OUT, "shots")
os.makedirs(SHOT, exist_ok=True)

if not os.path.exists(os.path.join(DIST, "index.html")):
    raise SystemExit("Chưa có dist/index.html – chạy `python tools/build.py` trước.")

# Thư viện chạy offline nếu đặt biến GVG_LIBS trỏ tới thư mục node_modules có xlsx, html2canvas, jspdf; nếu không thì tải từ CDN
LIB = os.environ.get("GVG_LIBS")
MAP = {
 "xlsx.full.min.js": "xlsx/dist/xlsx.full.min.js",
 "html2canvas.min.js": "html2canvas/dist/html2canvas.min.js",
 "jspdf.umd.min.js": "jspdf/dist/jspdf.umd.min.js",
} if LIB else {}


class _Quiet(SimpleHTTPRequestHandler):
    def log_message(self, *a):
        pass


# Cổng cố định: các file test dùng chung hồ sơ trình duyệt, IndexedDB chỉ giữ được khi origin không đổi
PORT = int(os.environ.get("GVG_TEST_PORT", "8765"))
_srv = ThreadingHTTPServer(("127.0.0.1", PORT), functools.partial(_Quiet, directory=DIST))
threading.Thread(target=_srv.serve_forever, daemon=True).start()
URL = f"http://127.0.0.1:{PORT}/index.html"


def route(page):
    def handle(r):
        u = r.request.url
        for k, f in MAP.items():
            if u.endswith(k):
                return r.fulfill(path=os.path.join(LIB, f), content_type="application/javascript")
        if "fonts.googleapis" in u or "fonts.gstatic" in u:
            return r.fulfill(body="", content_type="text/css")
        return r.continue_()
    page.route("**/*", handle)


def new_ctx(p, user_dir=os.path.join(OUT, "profile"), w=1440, h=900, fresh=False):
    if fresh and os.path.exists(user_dir):
        import shutil; shutil.rmtree(user_dir)
    ctx = p.chromium.launch_persistent_context(user_dir, headless=True, viewport={"width": w, "height": h}, accept_downloads=True)
    page = ctx.pages[0] if ctx.pages else ctx.new_page()
    route(page)
    errs = []
    page.on("pageerror", lambda e: errs.append(str(e)))
    page.on("console", lambda m: m.type == "error" and errs.append("console: " + m.text))
    return ctx, page, errs


def toasts(page):
    return page.eval_on_selector_all(".toast", "els=>els.map(e=>e.textContent)")
