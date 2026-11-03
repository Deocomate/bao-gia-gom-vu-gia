"""Tạo các file mẫu cho kiểm thử trong tests/fixtures/ từ dữ liệu sẵn có của repo (không cần file gốc).

    python tests/make_fixtures.py

- edge.csv                      CSV ca biên: mã X1–X4, giá trống/sai/bằng 0, mã đã có (sản phẩm các test sau không dùng), dòng không mã
- Bang_gia_mau_Gom_Vu_Gia.xls   file Excel mẫu (data/) lưu lại dạng .xls (BIFF8) bằng SheetJS
- pdf_like.xlsx                 bảng giá bố cục như PDF: dòng tiêu đề mục chỉ có tên, 2 cột giá Men lam / Vàng kim
- prod/*.jpg                    ảnh sản phẩm vẽ đơn giản trên nền trắng cho trình tự sắp ảnh ban thờ
Các test gọi ensure() nên thường không cần chạy tay.
"""
import base64, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
FIX = os.path.join(HERE, "fixtures")
sys.path.insert(0, os.path.join(ROOT, "tools"))

XLSX_JS = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"
PROD = ["bathuong20", "bathuong18", "de", "binh", "choe", "den", "bat_com", "mam", "bo_am", "ong", "nam", "nen", "ki"]


def edge_csv():
    rows = [
        "Mã,Nhóm,Tên sản phẩm,Quy cách,Dòng men,ĐVT,Đơn giá,Ghi chú",
        'X1,Phụ kiện khác,Đĩa thử X1,Ø20,Men lam,chiếc,"1.200.000",giá có dấu chấm',
        "X2,Phụ kiện khác,Đĩa thử X2,Ø22,Men lam,chiếc,,chưa có giá",
        "X3,Phụ kiện khác,Đĩa thử X3,Ø24,Men lam,chiếc,abc,giá sai",
        "X4,Phụ kiện khác,Đĩa thử X4,Ø26,Men lam,chiếc,0,giá bằng 0",
        'MB01-D35-VV,Mâm bồng,Mâm bồng sen,Ø35,Men lam vẽ vàng,chiếc,"2,050,000",đổi giá mã đã có',
        'BH01-D18-VV,Bát hương,"Bát hương rồng kĩ, men đẹp",Ø18,Men lam vẽ vàng,chiếc,1900000 đ,tên có dấu phẩy',
        ",Phụ kiện khác,Đĩa thử không mã,Ø30,Men lam,cái,350000,không có mã",
    ]
    with open(os.path.join(FIX, "edge.csv"), "w", encoding="utf-8-sig", newline="\r\n") as f:
        f.write("\n".join(rows) + "\n")


def pdf_like_xlsx():
    from openpyxl import Workbook
    from pdf_data import wide_rows
    wb = Workbook(); ws = wb.active; ws.title = "Bảng giá"
    ws.append(["BÁO GIÁ SẢN PHẨM ĐỒ THỜ MEN LAM – BỘ ĐỒ THỜ PHÚC LIÊN HOA"])
    ws.append([])
    ws.append(["STT", "TÊN SẢN PHẨM", "KÍCH THƯỚC", "ĐVT", "MEN LAM", "VÀNG KIM", "GHI CHÚ"])
    sec, stt = None, 0
    for r in wide_rows():
        if r["section"] != sec:
            sec = r["section"]; ws.append([None, sec.upper()])
        stt += 1
        ws.append([stt, r["name"], r["size"], r["unit"], r["ml"], r["vk"], r["note"]])
    wb.save(os.path.join(FIX, "pdf_like.xlsx"))


def xls():
    """Đổi file Excel mẫu sang .xls bằng SheetJS trong trình duyệt (cùng thư viện ứng dụng dùng để đọc)."""
    from playwright.sync_api import sync_playwright
    with open(os.path.join(ROOT, "data", "Bang_gia_mau_Gom_Vu_Gia.xlsx"), "rb") as f:
        src = base64.b64encode(f.read()).decode()
    lib = os.environ.get("GVG_LIBS")
    with sync_playwright() as p:
        b = p.chromium.launch(headless=True); page = b.new_page()
        if lib: page.add_script_tag(path=os.path.join(lib, "xlsx", "dist", "xlsx.full.min.js"))
        else: page.add_script_tag(url=XLSX_JS)
        out = page.evaluate("s => XLSX.write(XLSX.read(s, { type: 'base64' }), { bookType: 'biff8', type: 'base64' })", src)
        b.close()
    with open(os.path.join(FIX, "Bang_gia_mau_Gom_Vu_Gia.xls"), "wb") as f:
        f.write(base64.b64decode(out))


def prod_images():
    """Mỗi sản phẩm một hình men lam đơn giản (thân, miệng, chân) trên nền trắng, kích thước khác nhau."""
    from PIL import Image, ImageDraw
    os.makedirs(os.path.join(FIX, "prod"), exist_ok=True)
    blue, gold = (32, 64, 150), (200, 160, 60)
    for i, n in enumerate(PROD):
        w, h = 360 + (i % 4) * 40, 420 + (i % 3) * 60
        im = Image.new("RGB", (w, h), "white"); g = ImageDraw.Draw(im)
        cx, bw = w // 2, int(w * (0.30 + 0.04 * (i % 3)))
        g.ellipse([cx - bw, h * 0.30, cx + bw, h * 0.86], fill=blue)
        g.rectangle([cx - bw // 2, h * 0.14, cx + bw // 2, h * 0.36], fill=blue)
        g.ellipse([cx - bw // 2 - 12, h * 0.10, cx + bw // 2 + 12, h * 0.18], fill=gold)
        g.rectangle([cx - bw // 2, h * 0.84, cx + bw // 2, h * 0.92], fill=gold)
        g.ellipse([cx - bw // 2, h * 0.48, cx + bw // 2, h * 0.66], outline="white", width=6)
        im.save(os.path.join(FIX, "prod", n + ".jpg"), quality=90)


MAKERS = {"edge.csv": edge_csv, "Bang_gia_mau_Gom_Vu_Gia.xls": xls, "pdf_like.xlsx": pdf_like_xlsx, "prod": prod_images}


def ensure(*names):
    """Tạo các file mẫu còn thiếu (theo tên trong MAKERS)."""
    os.makedirs(FIX, exist_ok=True)
    for n in names:
        path = os.path.join(FIX, n)
        if not os.path.exists(path) or (n == "prod" and not all(os.path.exists(os.path.join(path, x + ".jpg")) for x in PROD)):
            MAKERS[n]()


if __name__ == "__main__":
    ensure(*MAKERS)
    print("ok", FIX)
