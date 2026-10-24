"""Máy chủ ứng dụng báo giá Gốm Vũ Gia.

- Phục vụ trang đã dựng trong dist/ (chạy `python tools/build.py` trước).
- Chỉ có một tài khoản admin, khai báo bằng biến môi trường (hoặc file .env ở thư mục gốc repo):
    ADMIN_USERNAME, ADMIN_PASSWORD (tối thiểu 8 ký tự)
- Dữ liệu (bảng giá, mẫu, báo giá, ảnh, bản nháp) lưu trong SQLite: $DATA_DIR/gom_vu_gia.sqlite3
  Mỗi lần khôi phục kiểu “Thay thế toàn bộ”, bản cũ được chụp lại trong $DATA_DIR/backups/.
- Biến khác: DATA_DIR (mặc định ./var), HOST (0.0.0.0), PORT (8080).

    python server/app.py                     chạy máy chủ
    python server/app.py import FILE.json    nạp file sao lưu, thay thế toàn bộ dữ liệu
"""
import base64, gzip, hashlib, hmac, json, os, re, secrets, sqlite3, sys, threading, time
from http.cookies import SimpleCookie
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import unquote, urlsplit

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STORES = {"kv": "k", "products": "code", "records": "id", "images": "id"}
COOKIE = "gvg_session"
SESSION_SECONDS = 30 * 86400
MAX_BODY = 200 * 1024 * 1024
MAX_FAILS, FAIL_WINDOW = 5, 15 * 60
KEEP_SNAPSHOTS = 10
# Tên dòng men cũ được đổi sang tên mới (khách dễ hiểu lầm chữ “thường”); áp dụng cho dữ liệu đã lưu và mọi lần ghi.
GLAZE_RENAMES = {"Men lam thường": "Men lam"}


def load_env_file(path):
    """Đọc KEY=VALUE từ file .env; biến đã có trong môi trường được ưu tiên."""
    if not os.path.isfile(path):
        return
    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            k, v = k.strip(), v.strip()
            if len(v) >= 2 and v[0] == v[-1] and v[0] in "\"'":
                v = v[1:-1]
            os.environ.setdefault(k, v)


class Store:
    """Kho dữ liệu: mỗi store của ứng dụng (kv, products, records) là các tài liệu JSON; ảnh lưu dạng BLOB."""

    def __init__(self, path):
        os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)
        self.path = path
        self.lock = threading.Lock()
        self.db = sqlite3.connect(path, check_same_thread=False, isolation_level=None)
        self.db.execute("PRAGMA journal_mode=WAL")
        self.db.executescript("""
          CREATE TABLE IF NOT EXISTS docs(store TEXT NOT NULL, k TEXT NOT NULL, v TEXT NOT NULL, PRIMARY KEY(store, k));
          CREATE TABLE IF NOT EXISTS images(id TEXT PRIMARY KEY, meta TEXT NOT NULL, data BLOB NOT NULL);
          CREATE TABLE IF NOT EXISTS settings(k TEXT PRIMARY KEY, v TEXT NOT NULL);""")
        self._rename_glazes()

    @staticmethod
    def _glaze_pairs():
        return [(json.dumps(a, ensure_ascii=False), json.dumps(b, ensure_ascii=False)) for a, b in GLAZE_RENAMES.items()]

    @classmethod
    def _rename_text(cls, v):
        for a, b in cls._glaze_pairs():
            v = v.replace(a, b)
        return v

    def _rename_glazes(self):
        """Đổi tên dòng men cũ trong dữ liệu đã lưu (chụp lại kho trước khi đổi)."""
        pairs = self._glaze_pairs()
        if not any(self.db.execute("SELECT EXISTS(SELECT 1 FROM docs WHERE instr(v, ?) > 0)", (a,)).fetchone()[0] for a, _ in pairs):
            return
        self._snapshot("truoc-doi-ten-men-")
        self.db.execute("BEGIN IMMEDIATE")
        for a, b in pairs:
            self.db.execute("UPDATE docs SET v = replace(v, ?, ?) WHERE instr(v, ?) > 0", (a, b, a))
        self.db.execute("COMMIT")

    def setting(self, k, make):
        with self.lock:
            row = self.db.execute("SELECT v FROM settings WHERE k=?", (k,)).fetchone()
            if row:
                return row[0]
            v = make()
            self.db.execute("INSERT INTO settings(k, v) VALUES(?, ?)", (k, v))
            return v

    @staticmethod
    def _img(meta, data):
        m = json.loads(meta)
        m["data"] = f"data:{m.get('type') or 'application/octet-stream'};base64,{base64.b64encode(data).decode()}"
        return m

    def all(self, store):
        with self.lock:
            if store == "images":
                return [self._img(m, d) for m, d in self.db.execute("SELECT meta, data FROM images ORDER BY id")]
            return [json.loads(v) for (v,) in self.db.execute("SELECT v FROM docs WHERE store=? ORDER BY k", (store,))]

    def get(self, store, key):
        with self.lock:
            if store == "images":
                row = self.db.execute("SELECT meta, data FROM images WHERE id=?", (key,)).fetchone()
                return self._img(*row) if row else None
            row = self.db.execute("SELECT v FROM docs WHERE store=? AND k=?", (store, key)).fetchone()
            return json.loads(row[0]) if row else None

    @staticmethod
    def check(ops):
        """Kiểm tra và chuẩn hóa danh sách thao tác trước khi ghi; sai thì báo ValueError, không ghi gì."""
        if not isinstance(ops, list):
            raise ValueError("Thiếu danh sách thao tác")
        out = []
        for o in ops:
            if not isinstance(o, dict) or o.get("store") not in STORES:
                raise ValueError("Thao tác không hợp lệ")
            op, store = o.get("op"), o["store"]
            if op == "clear":
                out.append((op, store, None, None))
            elif op == "del":
                if not isinstance(o.get("key"), str):
                    raise ValueError("Thiếu khóa cần xóa")
                out.append((op, store, o["key"], None))
            elif op == "put":
                obj = o.get("obj")
                key = obj.get(STORES[store]) if isinstance(obj, dict) else None
                if not isinstance(key, str) or not key:
                    raise ValueError(f"Thiếu khóa “{STORES[store]}” khi ghi vào {store}")
                if store == "images":
                    m = re.match(r"data:[^;,]*;base64,(.*)$", obj.get("data") or "", re.S)
                    if not m:
                        raise ValueError("Ảnh không đúng định dạng")
                    meta = {k: v for k, v in obj.items() if k != "data"}
                    out.append((op, store, key, (json.dumps(meta, ensure_ascii=False), base64.b64decode(m.group(1)))))
                else:
                    out.append((op, store, key, Store._rename_text(json.dumps(obj, ensure_ascii=False))))
            else:
                raise ValueError("Thao tác không hợp lệ")
        return out

    def apply(self, ops):
        """Ghi một nhóm thao tác trong cùng một giao dịch: thành công hết hoặc không đổi gì."""
        ops = self.check(ops)
        with self.lock:
            if any(op == "clear" for op, *_ in ops):
                self._snapshot()
            self.db.execute("BEGIN IMMEDIATE")
            try:
                for op, store, key, val in ops:
                    if store == "images":
                        if op == "clear":
                            self.db.execute("DELETE FROM images")
                        elif op == "del":
                            self.db.execute("DELETE FROM images WHERE id=?", (key,))
                        else:
                            self.db.execute("INSERT OR REPLACE INTO images(id, meta, data) VALUES(?, ?, ?)", (key, *val))
                    elif op == "clear":
                        self.db.execute("DELETE FROM docs WHERE store=?", (store,))
                    elif op == "del":
                        self.db.execute("DELETE FROM docs WHERE store=? AND k=?", (store, key))
                    else:
                        self.db.execute("INSERT OR REPLACE INTO docs(store, k, v) VALUES(?, ?, ?)", (store, key, val))
                self.db.execute("COMMIT")
            except BaseException:
                self.db.execute("ROLLBACK")
                raise

    def _snapshot(self, prefix="truoc-khoi-phuc-"):
        """Chụp lại toàn bộ kho trước thao tác xóa sạch hoặc đổi hàng loạt; giữ 10 bản gần nhất mỗi loại."""
        if not self.db.execute("SELECT EXISTS(SELECT 1 FROM docs) OR EXISTS(SELECT 1 FROM images)").fetchone()[0]:
            return
        d = os.path.join(os.path.dirname(os.path.abspath(self.path)), "backups")
        os.makedirs(d, exist_ok=True)
        dst = sqlite3.connect(os.path.join(d, time.strftime(prefix + "%Y%m%d-%H%M%S.sqlite3")))
        try:
            self.db.backup(dst)
        finally:
            dst.close()
        for old in sorted(f for f in os.listdir(d) if f.startswith(prefix))[:-KEEP_SNAPSHOTS]:
            os.remove(os.path.join(d, old))


def backup_to_ops(data):
    """File sao lưu (.json) của ứng dụng → các thao tác thay thế toàn bộ dữ liệu.
    Nhận cả data/pdf_data.json (chỉ có bảng giá): khi đó chỉ thay bảng giá, giữ mẫu, báo giá, ảnh."""
    if isinstance(data, dict) and isinstance(data.get("variants"), list):
        now = time.strftime("%Y-%m-%dT%H:%M:%S.000Z", time.gmtime())
        return [{"op": "clear", "store": "products"}] + [
            {"op": "put", "store": "products", "obj": {**v, "image": v.get("image"), "createdAt": v.get("createdAt") or now, "updatedAt": now}}
            for v in data["variants"] if isinstance(v, dict) and v.get("code")]
    if not isinstance(data, dict) or data.get("app") != "gom-vu-gia-bao-gia" or not isinstance(data.get("products"), list):
        raise ValueError("File này không phải bản sao lưu của ứng dụng Gốm Vũ Gia")
    ops = [{"op": "clear", "store": s} for s in STORES]
    for s in STORES:
        ops += [{"op": "put", "store": s, "obj": o} for o in data.get(s) or []]
    return ops


class App:
    def __init__(self, store, username, password, dist, quiet=False):
        if not username or len(password or "") < 8:
            raise SystemExit("Cần đặt ADMIN_USERNAME và ADMIN_PASSWORD (tối thiểu 8 ký tự) trong biến môi trường hoặc file .env")
        self.store, self.username, self.password, self.dist, self.quiet = store, username, password, dist, quiet
        secret = store.setting("session_secret", lambda: secrets.token_hex(32))
        # Đổi tài khoản hoặc mật khẩu admin thì mọi phiên đăng nhập cũ tự hết hiệu lực
        self.key = hashlib.sha256("\0".join([secret, username, password]).encode()).digest()
        self.fails = {}
        self.fails_lock = threading.Lock()

    def sign(self, exp):
        return hmac.new(self.key, f"{self.username}|{exp}".encode(), hashlib.sha256).hexdigest()

    def new_token(self):
        exp = int(time.time()) + SESSION_SECONDS
        return f"{exp}.{self.sign(exp)}"

    def valid(self, token):
        try:
            exp, sig = token.split(".", 1)
            return int(exp) > time.time() and hmac.compare_digest(sig, self.sign(int(exp)))
        except (ValueError, AttributeError):
            return False

    def check_login(self, username, password):
        u = hmac.compare_digest(str(username).encode(), self.username.encode())
        p = hmac.compare_digest(str(password).encode(), self.password.encode())
        return u and p

    def locked(self, ip):
        with self.fails_lock:
            n, t0 = self.fails.get(ip, (0, 0))
            if time.time() - t0 > FAIL_WINDOW:
                self.fails.pop(ip, None)
                return 0
            return max(0, int(t0 + FAIL_WINDOW - time.time())) if n >= MAX_FAILS else 0

    def failed(self, ip):
        with self.fails_lock:
            n, t0 = self.fails.get(ip, (0, 0))
            self.fails[ip] = (n + 1, t0 if n else time.time())


class Handler(BaseHTTPRequestHandler):
    server_version = "gvg"
    sys_version = ""

    @property
    def app(self):
        return self.server.app

    def log_message(self, fmt, *args):
        if not self.app.quiet:
            sys.stderr.write("%s %s\n" % (self.client_ip(), fmt % args))

    def client_ip(self):
        # Sau Traefik (Coolify): địa chỉ khách là phần tử cuối trong X-Forwarded-For
        xff = self.headers.get("X-Forwarded-For", "")
        return xff.split(",")[-1].strip() or self.client_address[0]

    def authed(self):
        c = SimpleCookie(self.headers.get("Cookie", ""))
        return COOKIE in c and self.app.valid(c[COOKIE].value)

    def send(self, code, body=b"", ctype="text/plain; charset=utf-8", headers=(), cache="no-store"):
        if isinstance(body, str):
            body = body.encode()
        if len(body) > 1024 and "gzip" in self.headers.get("Accept-Encoding", "") and not ctype.startswith("image/"):
            body = gzip.compress(body, 5)
            headers = [*headers, ("Content-Encoding", "gzip"), ("Vary", "Accept-Encoding")]
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", cache)
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("X-Frame-Options", "SAMEORIGIN")
        self.send_header("Referrer-Policy", "strict-origin-when-cross-origin")
        for k, v in headers:
            self.send_header(k, v)
        self.end_headers()
        if self.command != "HEAD":
            self.wfile.write(body)

    def json(self, code, obj, headers=()):
        self.send(code, json.dumps(obj, ensure_ascii=False), "application/json; charset=utf-8", headers)

    def file(self, name, ctype, cache="no-cache"):
        path = os.path.join(self.app.dist, name)
        if not os.path.isfile(path):
            return self.send(503, "Chưa dựng trang: chạy python tools/build.py")
        with open(path, "rb") as f:
            self.send(200, f.read(), ctype, cache=cache)

    def redirect(self, to):
        self.send(302, "", headers=[("Location", to)])

    def cookie(self, value, max_age):
        secure = "; Secure" if self.headers.get("X-Forwarded-Proto", "") == "https" else ""
        return ("Set-Cookie", f"{COOKIE}={value}; Path=/; Max-Age={max_age}; HttpOnly; SameSite=Strict{secure}")

    def do_HEAD(self):
        self.do_GET()

    def do_GET(self):
        path = unquote(urlsplit(self.path).path)
        if path == "/healthz":
            return self.send(200, "ok\n")
        if path == "/favicon.png":
            return self.file("favicon.png", "image/png", cache="public, max-age=604800")
        if path == "/login":
            return self.redirect("/") if self.authed() else self.file("login.html", "text/html; charset=utf-8")
        if path.startswith("/api/"):
            if not self.authed():
                return self.json(401, {"error": "Chưa đăng nhập"})
            if path == "/api/me":
                return self.json(200, {"user": self.app.username})
            m = re.fullmatch(r"/api/data/(\w+)(?:/(.+))?", path)
            if not m or m.group(1) not in STORES:
                return self.json(404, {"error": "Không tìm thấy"})
            store, key = m.groups()
            return self.json(200, self.app.store.get(store, key) if key else self.app.store.all(store))
        if path in ("/", "/index.html"):
            return self.file("index.html", "text/html; charset=utf-8") if self.authed() else self.redirect("/login")
        return self.redirect("/")

    def do_POST(self):
        path = urlsplit(self.path).path
        if not path.startswith("/api/"):
            return self.send(405, "Method Not Allowed")
        # Header riêng: trang web khác không gửi được (buộc qua CORS) – chống giả mạo yêu cầu
        if self.headers.get("X-GVG") != "1":
            return self.json(403, {"error": "Yêu cầu không hợp lệ"})
        try:
            n = int(self.headers.get("Content-Length") or 0)
        except ValueError:
            n = -1
        if n < 0 or n > MAX_BODY:
            return self.json(413, {"error": "Dữ liệu gửi lên quá lớn"})
        try:
            body = json.loads(self.rfile.read(n) or b"{}")
        except ValueError:
            return self.json(400, {"error": "Dữ liệu gửi lên không đúng định dạng"})
        if path == "/api/login":
            ip = self.client_ip()
            wait = self.app.locked(ip)
            if wait:
                return self.json(429, {"error": f"Sai quá nhiều lần. Thử lại sau {wait // 60 + 1} phút."})
            if isinstance(body, dict) and self.app.check_login(body.get("username", ""), body.get("password", "")):
                with self.app.fails_lock:
                    self.app.fails.pop(ip, None)
                return self.json(200, {"user": self.app.username}, [self.cookie(self.app.new_token(), SESSION_SECONDS)])
            self.app.failed(ip)
            time.sleep(0.5)
            return self.json(401, {"error": "Sai tên đăng nhập hoặc mật khẩu"})
        if path == "/api/logout":
            return self.json(200, {}, [self.cookie("", 0)])
        if not self.authed():
            return self.json(401, {"error": "Chưa đăng nhập"})
        if path == "/api/tx":
            try:
                self.app.store.apply(body.get("ops") if isinstance(body, dict) else None)
            except ValueError as e:
                return self.json(400, {"error": str(e)})
            return self.json(200, {"ok": True})
        return self.json(404, {"error": "Không tìm thấy"})


def make_server(app, host, port):
    srv = ThreadingHTTPServer((host, port), Handler)
    srv.daemon_threads = True
    srv.app = app
    return srv


def main(argv):
    load_env_file(os.path.join(ROOT, ".env"))
    data_dir = os.environ.get("DATA_DIR") or os.path.join(ROOT, "var")
    store = Store(os.path.join(data_dir, "gom_vu_gia.sqlite3"))
    if len(argv) >= 2 and argv[0] == "import":
        with open(argv[1], encoding="utf-8") as f:
            data = json.load(f)
        ops = backup_to_ops(data)
        store.apply(ops)
        n = lambda s: sum(o["op"] == "put" and o["store"] == s for o in ops)
        print(f"Đã nạp {argv[1]}: {n('products')} sản phẩm, {n('records')} mẫu/báo giá, {n('images')} ảnh")
        return
    if argv:
        raise SystemExit(__doc__)
    app = App(store, os.environ.get("ADMIN_USERNAME", "").strip(), os.environ.get("ADMIN_PASSWORD", ""), os.environ.get("DIST_DIR") or os.path.join(ROOT, "dist"))
    host, port = os.environ.get("HOST", "0.0.0.0"), int(os.environ.get("PORT", "8080"))
    srv = make_server(app, host, port)
    print(f"Gốm Vũ Gia đang chạy tại http://{host}:{port} – dữ liệu: {store.path}", flush=True)
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main(sys.argv[1:])
