# Cấu trúc dữ liệu

## Kho IndexedDB trên trình duyệt
- Dữ liệu thật: database `gom_vu_gia` (phiên bản 1)
- Dữ liệu mẫu: database `gom_vu_gia_du_lieu_mau` (tách riêng hoàn toàn)

| Store | Khóa | Nội dung |
|---|---|---|
| `products` | `code` | Mỗi dòng là một biến thể (tổ hợp tên + quy cách + dòng men) |
| `records` | `id` | Mẫu ban thờ (`kind: "template"`) và báo giá (`kind: "quote"`) |
| `images` | `id` | Ảnh (Blob): ảnh sản phẩm, ảnh ban thờ, ảnh ghép, ảnh nền |
| `kv` | `k` | `meta` (nhóm, bộ đếm mã báo giá, phiên bản bảng giá) và `draft` (bộ đang soạn) |

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
{ "id": "img_xxx", "blob": "<Blob>", "type": "image/jpeg", "w": 1600, "h": 1200, "createdAt": "ISO" }
```

## File sao lưu (.json)
```json
{ "app": "gom-vu-gia-bao-gia", "format": 1, "workspace": "real", "exportedAt": "ISO",
  "kv": [...], "products": [...], "records": [...],
  "images": [ { "id": "...", "type": "...", "w": 0, "h": 0, "createdAt": "...", "data": "data:image/...;base64,..." } ] }
```
