"""Xuất dữ liệu chính thức thành file sao lưu .json để nạp lên máy chủ production.

Gồm bảng giá gốc Gốm Vũ Gia (data/pdf_data.json, chép từ PDF) và mẫu “Bộ Phúc Liên Hoa – vẽ vàng” kèm ảnh.

    python tools/export_data.py [file.json]     mặc định: exports/gom-vu-gia-du-lieu-<ngày>.json

Nạp lên production: đăng nhập → Sao lưu → Khôi phục từ bản sao lưu → Thay thế toàn bộ
(hoặc trong container: python server/app.py import <file.json>).
"""
import base64, json, os, secrets, sys
from datetime import date, datetime, timezone
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
D = os.path.join(ROOT, "data")
# Vật phẩm của mẫu Phúc Liên Hoa (men lam vẽ vàng): tên, quy cách, số lượng
TEMPLATE_SET = [["Bát hương rồng kĩ", "Ø20", 1], ["Đế sứ bát hương", "Ø20", 1], ["Bát hương rồng kĩ", "Ø18", 2], ["Đế sứ bát hương", "Ø18", 2],
                ["Lộc bình sen", "H40", 1], ["Chóe thờ sen", "S3", 3], ["Đèn tròn sen", "S1", 2], ["Bát cơm sen", "", 6], ["Mâm bồng sen Phúc", "Ø27", 2],
                ["Bộ ấm 5 chén cúng sen", "", 1], ["Ống hương sen", "S1", 1], ["Nậm 2 bầu sen", "S2", 1], ["Chân nến sen", "S3", 2], ["Kỉ ngai 3 sen", "", 1]]


def build():
    now = datetime.now(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")
    with open(os.path.join(D, "pdf_data.json"), encoding="utf-8") as f:
        variants = json.load(f)["variants"]
    products = [{**v, "image": None, "createdAt": now, "updatedAt": now} for v in variants]
    by_key = {(p["name"], p["size"]): p for p in products if p["glaze"] == "Men lam vẽ vàng"}
    items = []
    for name, size, qty in TEMPLATE_SET:
        p = by_key[(name, size)]
        items.append({"lid": "l_" + secrets.token_hex(6), "code": p["code"], "name": p["name"], "pattern": p["pattern"], "size": p["size"],
                      "glaze": p["glaze"], "unit": p["unit"], "price": p["price"], "qty": qty})
    img_path = os.path.join(D, "demo_altar.jpg")
    with Image.open(img_path) as im:
        w, h = im.size
    with open(img_path, "rb") as f:
        img = {"id": "img_phuc_lien_hoa", "type": "image/jpeg", "w": w, "h": h, "createdAt": now,
               "data": "data:image/jpeg;base64," + base64.b64encode(f.read()).decode()}
    template = {
        "id": "tpl_phuc_lien_hoa", "kind": "template", "name": "Bộ Phúc Liên Hoa – vẽ vàng", "desc": f"{len(items)} vật phẩm men lam vẽ vàng",
        "altarSize": "", "imageId": img["id"], "imageSig": "|".join(f"{i['code']}x{i['qty']}" for i in items), "items": items,
        "discount": {"mode": "none", "value": 0}, "shipping": 0, "install": 0, "otherFee": 0, "otherFeeLabel": "", "note": "", "vatNote": "",
        "customer": {"name": "", "phone": "", "address": ""}, "quoteCode": "", "quoteDate": date.today().isoformat(), "validUntil": "",
        "sourceTemplateId": None, "createdAt": now, "updatedAt": now}
    meta = {"k": "meta", "v": {"groups": [], "counters": {}, "priceVersion": 1, "createdAt": now}}
    return {"app": "gom-vu-gia-bao-gia", "format": 1, "workspace": "real", "exportedAt": now,
            "kv": [meta], "products": products, "records": [template], "images": [img]}


if __name__ == "__main__":
    out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "exports", f"gom-vu-gia-du-lieu-{date.today().isoformat()}.json")
    os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
    data = build()
    with open(out, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False)
    print(f"Đã xuất {len(data['products'])} sản phẩm, {len(data['records'])} mẫu, {len(data['images'])} ảnh -> {out}")
