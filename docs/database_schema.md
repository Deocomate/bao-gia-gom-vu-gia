# Cấu trúc dữ liệu

## Kho SQLite trên máy chủ
File `$DATA_DIR/gom_vu_gia.sqlite3` do `server/app.py` tạo. Máy chủ mới không có dữ liệu; dữ liệu được nạp bằng file sao lưu (xem README).
- `docs(store, k, v)`: mỗi dòng là một tài liệu JSON thuộc store `kv`, `products` hoặc `records`, khóa `k` là khóa của store.
- `images(id, meta, data)`: ảnh; `meta` là JSON (`type`, `w`, `h`, `createdAt`…), `data` là nội dung ảnh (BLOB).
- `settings(k, v)`: khóa ký phiên đăng nhập (`session_secret`), tạo tự động.

API (cần đăng nhập): `GET /api/data/<store>`, `GET /api/data/<store>/<khóa>`, `POST /api/tx` với `{"ops": [{"op": "put|del|clear", "store", "obj"|"key"}]}`.
Mỗi `tx` ghi trong một giao dịch; ảnh gửi/nhận dạng data URL trong trường `data`.
Trước thao tác `clear` (khôi phục “Thay thế toàn bộ”), bản cũ được chụp vào `$DATA_DIR/backups/`.

Bản cũ lưu dữ liệu ngay trên trình duyệt (IndexedDB `gom_vu_gia`, cùng các store bên dưới). Ứng dụng chỉ đọc kho này để đưa lên máy chủ khi người dùng bấm **Đưa lên máy chủ**.

| Store | Khóa | Nội dung |
|---|---|---|
| `products` | `code` | Mỗi dòng là một biến thể (tổ hợp tên + quy cách + dòng men) |
| `records` | `id` | Mẫu ban thờ (`kind: "template"`) và báo giá (`kind: "quote"`) |
| `images` | `id` | Ảnh: ảnh sản phẩm, ảnh ban thờ, ảnh ghép, ảnh nền |
| `kv` | `k` | `meta` (nhóm, bộ đếm mã báo giá, phiên bản bảng giá, `lastBackupAt` – lần sao lưu gần nhất) và `draft` (bộ đang soạn) |

### products
```json
{ "code": "BH01-D20-VV", "group": "Bát hương", "name": "Bát hương rồng kĩ", "pattern": "Rồng",
  "size": "Ø20", "glaze": "Men lam vẽ vàng", "unit": "chiếc", "price": 2200000,
  "note": "H:18cm", "image": "img_xxx", "active": true, "ord": 18,
  "createdAt": "ISO", "updatedAt": "ISO" }
```
`price: null` nghĩa là “Chưa có giá” (không bao giờ đổi thành 0).

### records (mẫu / báo giá)
```json
{ "id": "tpl_xxx | q_xxx", "kind": "template | quote", "name": "...", "desc": "...", "altarSize": "1m53",
  "imageId": "img_xxx", "imageSig": "chữ ký danh sách lúc tải ảnh",
  "items": [ { "lid": "l_xxx", "code": "BH01-D20-VV", "name": "...", "pattern": "...", "size": "Ø20",
               "glaze": "...", "unit": "chiếc", "price": 2200000, "qty": 1 } ],
  "discount": { "mode": "none | percent | amount", "value": 0 },
  "shipping": 0, "install": 0, "otherFee": 0, "otherFeeLabel": "", "note": "", "vatNote": "",
  "customer": { "name": "", "phone": "", "address": "" },
  "quoteCode": "BG261016-001", "quoteDate": "2026-10-16", "validUntil": "",
  "compose": { "remove": true, "tol": 38, "caption": true, "bgId": null, "items": [ ... vị trí ảnh ghép ... ] },
  "sourceTemplateId": null, "createdAt": "ISO", "updatedAt": "ISO" }
```
Mỗi dòng `items` lưu **ảnh chụp giá tại thời điểm lưu** (tên, quy cách, ĐVT, đơn giá), nên báo giá cũ không đổi khi bảng giá thay đổi.

### images
```json
{ "id": "img_xxx", "data": "data:image/jpeg;base64,...", "type": "image/jpeg", "w": 1600, "h": 1200, "createdAt": "ISO" }
```
Trong trình duyệt, `DB.get("images", id)` đổi `data` thành `blob` (Blob) để hiển thị.

## File sao lưu (.json)
```json
{ "app": "gom-vu-gia-bao-gia", "format": 1, "workspace": "real", "exportedAt": "ISO",
  "kv": [...], "products": [...], "records": [...],
  "images": [ { "id": "...", "type": "...", "w": 0, "h": 0, "createdAt": "...", "data": "data:image/...;base64,..." } ] }
```
