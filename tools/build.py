"""Gộp src/ + data/ thành các file trong dist/ (máy chủ server/app.py phục vụ thư mục này).

- dist/index.html  ứng dụng (chỉ mở được sau khi đăng nhập admin; dữ liệu lấy từ máy chủ)
- dist/login.html  trang đăng nhập
- dist/favicon.png biểu tượng tab trình duyệt
"""
import base64, glob, os, shutil

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
A = os.path.join(ROOT, "src")
D = os.path.join(ROOT, "data")
OUT = os.path.join(ROOT, "dist")


def read(path):
    with open(path, encoding="utf-8") as f:
        return f.read()


def write(name, text):
    with open(os.path.join(OUT, name), "w", encoding="utf-8", newline="\n") as f:
        f.write(text)


def b64(name):
    with open(os.path.join(D, name), "rb") as f:
        return base64.b64encode(f.read()).decode()


css = read(os.path.join(A, "style.css"))
body = read(os.path.join(A, "body.html"))
js = "\n".join(read(f) for f in sorted(glob.glob(os.path.join(A, "js", "*.js"))))
logo_b = b64("logo_brown.png")
logo_c = b64("logo_cream.png")
body = body.replace("__LOGO_BROWN__", "data:image/png;base64," + logo_b).replace("__LOGO_CREAM__", "data:image/png;base64," + logo_c)
xlsx = b64("Bang_gia_mau_Gom_Vu_Gia.xlsx")

LIBS = [
 "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js",
 "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js",
 "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js",
]
TITLE = "<title>Báo giá Gốm Vũ Gia</title>\n"
FONTS = """<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&family=Cormorant+Garamond:wght@600;700&display=swap&subset=vietnamese">
"""
app = (f"<style>\n{css}\n</style>\n" + body +
  "".join(f'<script src="{u}" defer></script>\n' for u in LIBS) +
  "<script>\n" +
  f"const LOGO_BROWN = 'data:image/png;base64,{logo_b}', LOGO_CREAM = 'data:image/png;base64,{logo_c}';\n" +
  "/* File Excel mẫu (cách điền bảng giá) để tải về */\n" +
  f"const TEMPLATE_XLSX_B64 = '{xlsx}';\n</script>\n" +
  f"<script>\n{js}\n</script>\n")

if os.path.isdir(OUT):
    shutil.rmtree(OUT)
os.makedirs(OUT)

standalone = ('<!doctype html>\n<html lang="vi">\n<head>\n<meta charset="utf-8">\n'
  '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'
  '<meta name="description" content="Ứng dụng báo giá đồ thờ Gốm Vũ Gia: quản lý bảng giá, tạo bộ ban thờ, xuất báo giá PDF/PNG.">\n'
  '<meta name="robots" content="noindex">\n'
  '<meta name="theme-color" content="#92431E">\n'
  '<link rel="icon" type="image/png" href="favicon.png">\n'
  + TITLE + FONTS +
  '<style>:root{padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom)}body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style>\n'
  '</head>\n<body>\n' + app + "</body>\n</html>\n")
write("index.html", standalone)
write("login.html", read(os.path.join(A, "login.html")).replace("__FONTS__", FONTS.strip()).replace("__LOGO_BROWN__", "data:image/png;base64," + logo_b))
shutil.copyfile(os.path.join(D, "logo_brown.png"), os.path.join(OUT, "favicon.png"))
print("ok", len(standalone.encode("utf-8")) // 1024, "KB ->", OUT)
