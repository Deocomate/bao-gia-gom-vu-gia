import os, re, sys, json, time, threading
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


# Máy chủ thật của ứng dụng (server/app.py) chạy trong tiến trình test, dữ liệu SQLite ở tests/.output/server
sys.path.insert(0, os.path.join(ROOT, "server"))
sys.path.insert(0, os.path.join(ROOT, "tools"))
import app as server
import export_data

ADMIN = ("admin", "mat-khau-test-123")
STORE = server.Store(os.path.join(OUT, "server", "gom_vu_gia.sqlite3"))
# Cổng cố định: các file test dùng chung hồ sơ trình duyệt (cookie đăng nhập, trang đang xem) theo origin
PORT = int(os.environ.get("GVG_TEST_PORT", "8765"))
_srv = server.make_server(server.App(STORE, *ADMIN, DIST, quiet=True), "127.0.0.1", PORT)
threading.Thread(target=_srv.serve_forever, daemon=True).start()
BASE = f"http://127.0.0.1:{PORT}"
URL = BASE + "/"


def reset_data(seed=True):
    """Xóa sạch dữ liệu máy chủ; seed=True thì nạp dữ liệu chính thức (giống file xuất cho production)."""
    STORE.apply(server.backup_to_ops(export_data.build()) if seed else [{"op": "clear", "store": s} for s in server.STORES])


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


def new_ctx(p, user_dir=os.path.join(OUT, "profile"), w=1440, h=900, fresh=False, seed=True, login=True):
    """fresh=True: hồ sơ trình duyệt mới và dữ liệu máy chủ đặt lại (seed: nạp sẵn dữ liệu chính thức)."""
    if fresh:
        if os.path.exists(user_dir):
            import shutil; shutil.rmtree(user_dir)
        reset_data(seed)
    ctx = p.chromium.launch_persistent_context(user_dir, headless=True, viewport={"width": w, "height": h}, accept_downloads=True)
    page = ctx.pages[0] if ctx.pages else ctx.new_page()
    route(page)
    if login:
        r = ctx.request.post(BASE + "/api/login", data={"username": ADMIN[0], "password": ADMIN[1]}, headers={"X-GVG": "1"})
        assert r.ok, r.text()
    errs = []
    page.on("pageerror", lambda e: errs.append(str(e)))
    page.on("console", lambda m: m.type == "error" and errs.append("console: " + m.text))
    return ctx, page, errs


def more(page, act):
    """Bấm một mục trong menu “Thêm” của trang tạo bộ (Tải ảnh PNG, In, Nhân bản)."""
    page.click("#b-more > summary")
    page.click(f"#b-more [data-act={act}]")


def toasts(page):
    return page.eval_on_selector_all(".toast", "els=>els.map(e=>e.textContent)")
