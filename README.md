# Gốm Vũ Gia – Ứng dụng báo giá đồ thờ

Ứng dụng web quản lý bảng giá đồ thờ, tạo bộ ban thờ, tự sắp ảnh ban thờ, lưu mẫu và xuất báo giá PDF/PNG.
Toàn bộ ứng dụng là **một trang HTML tĩnh** (không có máy chủ, không có cơ sở dữ liệu phía server).

## Cấu trúc thư mục
```
src/                 Mã nguồn giao diện
  body.html          Khung giao diện
  style.css          Toàn bộ giao diện + bố cục bản xuất A4 dọc (màu thương hiệu #92431E)
  js/1_core.js       Tiện ích, đọc giá tiền, IndexedDB, ảnh, hộp thoại, tải file
  js/2_app.js        Tính tiền, mã sản phẩm, khởi động, điều hướng
  js/3_prices.js     Bảng giá: sửa giá trực tiếp, hộp thêm/sửa/xóa sản phẩm, điều chỉnh giá hàng loạt, xuất Excel
  js/4_import.js     Nhập Excel/CSV: chọn sheet, dòng tiêu đề, ghép cột, nhiều cột giá, đối chiếu
  js/5_builder.js    Tạo bộ ban thờ, danh mục, bảng chi tiết, tổng tiền, lưu mẫu/báo giá
  js/6_export.js     Dựng trang A4, tự gói 1 trang, xuất PDF/PNG, in, xem trước
  js/7_lists.js      Danh sách mẫu, báo giá, sao lưu/khôi phục, nạp bảng giá gốc khi mở lần đầu
  js/8_compose.js    Tự sắp ảnh ban thờ từ ảnh sản phẩm (tách nền, xếp hàng, kéo thả)
  js/9_start.js      Khởi chạy
data/                Dữ liệu được nhúng vào trang khi dựng
  Bang_gia_mau_Gom_Vu_Gia.xlsx   File Excel mẫu chép từ bảng giá PDF (2 kiểu sheet)
  pdf_data.json                  228 biến thể từ PDF – bảng giá gốc nạp vào kho khi mở lần đầu
  demo_altar.jpg                 Ảnh ban thờ của mẫu “Bộ Phúc Liên Hoa – vẽ vàng” nạp kèm bảng giá gốc
  logo_*.png                     Logo (logo_brown.png cũng là favicon)
tools/
  pdf_data.py        Dữ liệu chép tay từ PDF
  make_xlsx.py       Tạo lại file Excel mẫu + pdf_data.json
  build.py           Gộp src + data thành dist/
tests/               Kịch bản kiểm thử tự động (Python Playwright), xem mục Kiểm thử
docs/
  database_schema.md   Cấu trúc kho IndexedDB và file sao lưu
  supabase_schema.sql  Gợi ý bảng PostgreSQL/Supabase khi chuyển lên dùng chung nhiều máy
deploy/nginx.conf    Cấu hình nginx dùng trong Docker image
Dockerfile           Dựng trang rồi phục vụ bằng nginx
docker-compose.yml   Service `app`, chỉ `expose` cổng 80 (dùng cho Coolify)
```

`dist/` là thư mục kết quả, không đưa lên git:
- `dist/index.html` – bản web đầy đủ (mở trực tiếp trên máy hoặc deploy).
- `dist/gom-vu-gia-app.html` – chỉ phần nội dung trang, dùng để đăng lên Claude (không có thẻ `<html>`/`<head>`).
- `dist/favicon.png`

## Dựng trên máy
Cần Python 3.10+.
```
pip install -r requirements.txt
python tools/make_xlsx.py   # chỉ khi sửa tools/pdf_data.py
python tools/build.py       # tạo lại dist/
```
Mở `dist/index.html` bằng Chrome hoặc Edge (cần Internet để tải thư viện xuất file và phông chữ).

## Deploy lên Coolify
1. Đẩy repo lên GitHub.
2. Trong Coolify: **New Resource → Public/Private Repository** → chọn repo, nhánh `main`.
3. **Build Pack: Docker Compose** (file `docker-compose.yml` ở thư mục gốc).
4. Ở service `app`, gắn domain (cổng `80`) rồi **Deploy**. Bật **Auto Deploy** để mỗi lần push lên `main` Coolify tự dựng lại.

`docker-compose.yml` chỉ dùng `expose: 80`, không có `ports:`, nên container không chiếm port nào trên host và không thể trùng port với ứng dụng khác; Coolify (Traefik) định tuyến domain vào cổng nội bộ.
Không cần biến môi trường. Container có healthcheck tại `/healthz`.

Chạy thử trên máy (vì không publish port, truy cập bằng cách tạm map cổng):
```
docker compose up -d --build
docker compose run --rm --no-deps -p 8080:80 app   # hoặc: docker run --rm -p 8080:80 gom-vu-gia:latest
```
Mở http://localhost:8080. Dừng bằng `docker compose down`.

## Dữ liệu nằm ở đâu
Ứng dụng lưu dữ liệu **trong trình duyệt của từng máy** (IndexedDB), gắn với **địa chỉ trang**.
Repo này **không chứa** các thay đổi bảng giá, mẫu, báo giá và ảnh bạn đã nhập.

Lần đầu mở ở một địa chỉ mới (kho trống), ứng dụng tự nạp **bảng giá gốc Gốm Vũ Gia** (228 sản phẩm chép từ PDF, `data/pdf_data.json`)
và mẫu ban thờ “Bộ Phúc Liên Hoa – vẽ vàng” có ảnh. Đây là dữ liệu chính thức, sửa trực tiếp được – không còn chế độ “dữ liệu mẫu” riêng.
Máy nào đã dùng chế độ dữ liệu mẫu của bản cũ thì lần mở đầu tiên sẽ chuyển dữ liệu đó sang kho chính (bỏ báo giá giả “Khách hàng mẫu”).
Mục **Sao lưu → Thêm sản phẩm còn thiếu** bổ sung các sản phẩm gốc chưa có, không đổi giá đang có.

Mỗi địa chỉ là một kho riêng: file HTML mở trên máy, bản trong Claude, `https://<domain-coolify>` – và cả khi bạn **đổi domain** sau này.
Khi chuyển sang địa chỉ mới, trang sẽ trống; dữ liệu cũ vẫn còn ở địa chỉ cũ. Chuyển dữ liệu bằng file sao lưu:
1. Mở bản cũ → mục **Sao lưu** → **Xuất bản sao lưu đầy đủ** (file `.json` gồm bảng giá, ảnh, mẫu, báo giá, bản nháp).
2. Mở bản mới → **Khôi phục từ bản sao lưu** → chọn file vừa xuất.

Nhãn góc phải thanh trên cùng cho biết lần sao lưu gần nhất và chuyển màu vàng khi đã quá 7 ngày chưa sao lưu.

## Quản trị bảng giá
- **Sửa giá**: gõ ngay ở cột Đơn giá (Enter xuống dòng dưới), dòng đã sửa đánh dấu vàng, bấm **Lưu thay đổi**.
- **Sửa thông tin / ảnh / xóa**: bấm vào tên sản phẩm. Xóa không ảnh hưởng mẫu và báo giá đã lưu (chúng giữ giá tại lúc lưu).
- **Thêm sản phẩm**: một hộp thoại, đánh dấu các dòng men có bán – mỗi dòng men thành một mã riêng.
- **Điều chỉnh giá hàng loạt**: tăng/giảm theo % hoặc số tiền, hay đặt cùng một giá, cho các dòng đang hiện theo bộ lọc, có làm tròn; xem trước rồi mới lưu.

Cấu trúc file sao lưu: [docs/database_schema.md](docs/database_schema.md).

## Kiểm thử
```
pip install -r requirements-dev.txt
python -m playwright install chromium
python tools/build.py
python tests/run_all.py          # hoặc: python tests/run_all.py t1 t7
```
Các test chạy theo thứ tự và dùng chung hồ sơ trình duyệt (t1 nhập bảng giá cho các test sau).
Test tự mở máy chủ tĩnh ở cổng `8765` (đổi bằng biến `GVG_TEST_PORT`); kết quả, ảnh chụp nằm trong `tests/.output/`.
Một số test cần file mẫu chưa có trong repo, xem [tests/fixtures/README.md](tests/fixtures/README.md).
Muốn chạy không cần Internet: đặt `GVG_LIBS` trỏ tới thư mục `node_modules` có `xlsx`, `html2canvas`, `jspdf`.

## Thư viện dùng (tải từ cdnjs khi chạy)
SheetJS xlsx 0.18.5 · html2canvas 1.4.1 · jsPDF 2.5.1 · phông Be Vietnam Pro, Cormorant Garamond (Google Fonts).
