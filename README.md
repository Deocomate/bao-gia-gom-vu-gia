# Gốm Vũ Gia – Ứng dụng báo giá đồ thờ

Ứng dụng web quản lý bảng giá đồ thờ, tạo bộ ban thờ, tự sắp ảnh ban thờ, lưu mẫu và xuất báo giá PDF/PNG.
Ứng dụng gồm một trang web (`src/`) và một máy chủ Python nhỏ (`server/app.py`, chỉ dùng thư viện chuẩn).
Máy chủ bắt buộc **đăng nhập admin** (một tài khoản duy nhất, khai báo trong `.env`) và lưu dữ liệu dùng chung trong **SQLite**.

## Cấu trúc thư mục
```
server/app.py        Máy chủ: đăng nhập admin, API dữ liệu, phục vụ dist/, lệnh nạp file sao lưu
src/                 Mã nguồn giao diện
  login.html         Trang đăng nhập
  body.html          Khung giao diện
  style.css          Toàn bộ giao diện + bố cục bản xuất A4 dọc (màu thương hiệu #92431E)
  js/1_core.js       Tiện ích, đọc giá tiền, gọi API dữ liệu trên máy chủ, ảnh, hộp thoại, tải file
  js/1_select.js     Dropdown tùy biến thay mọi ô chọn và ô gợi ý (tìm không dấu, phím mũi tên, hiệu ứng)
  js/2_app.js        Tính tiền, mã sản phẩm, khởi động, đăng xuất, điều hướng
  js/3_prices.js     Bảng giá: sửa giá trực tiếp, hộp thêm/sửa/xóa sản phẩm, điều chỉnh giá hàng loạt, xuất Excel
  js/4_import.js     Nhập Excel/CSV: chọn sheet, dòng tiêu đề, ghép cột, nhiều cột giá, đối chiếu
  js/5_builder.js    Tạo bộ ban thờ, danh mục, bảng chi tiết, tổng tiền, lưu mẫu/báo giá
  js/6_export.js     Dựng trang A4, tự gói 1 trang, xuất PDF/PNG, in, xem trước
  js/7_lists.js      Danh sách mẫu, báo giá, sao lưu/khôi phục, đưa dữ liệu bản cũ (trên trình duyệt) lên máy chủ
  js/8_compose.js    Tự sắp ảnh ban thờ từ ảnh sản phẩm (tách nền, xếp hàng, kéo thả)
  js/9_start.js      Khởi chạy
data/
  Bang_gia_mau_Gom_Vu_Gia.xlsx   File Excel mẫu chép từ bảng giá PDF (2 kiểu sheet), nhúng vào trang để tải về
  pdf_data.json                  228 biến thể từ PDF – bảng giá gốc, dùng khi xuất file dữ liệu
  demo_altar.jpg                 Ảnh ban thờ của mẫu “Bộ Phúc Liên Hoa – vẽ vàng” trong file dữ liệu
  logo_*.png                     Logo (logo_brown.png cũng là favicon)
tools/
  pdf_data.py        Dữ liệu chép tay từ PDF
  make_xlsx.py       Tạo lại file Excel mẫu + pdf_data.json
  build.py           Gộp src + data thành dist/ (index.html, login.html, favicon.png)
  export_data.py     Xuất file dữ liệu chính thức (.json) để nạp lên production
tests/               Kịch bản kiểm thử tự động (Python Playwright), xem mục Kiểm thử
docs/
  database_schema.md   Cấu trúc dữ liệu (SQLite trên máy chủ) và file sao lưu
  supabase_schema.sql  Gợi ý bảng PostgreSQL/Supabase nếu sau này cần cơ sở dữ liệu lớn hơn
Dockerfile           Dựng trang rồi chạy server/app.py
docker-compose.yml   Service `app`: biến admin, volume dữ liệu, chỉ `expose` cổng 80 (dùng cho Coolify)
.env.example         Mẫu file .env (tài khoản admin)
```

`dist/` (kết quả dựng), `var/` (dữ liệu khi chạy trên máy) và `exports/` (file dữ liệu xuất ra) không đưa lên git.

## Chạy trên máy
Cần Python 3.10+.
```
pip install -r requirements.txt
cp .env.example .env        # rồi đổi ADMIN_USERNAME / ADMIN_PASSWORD (mật khẩu ≥ 8 ký tự)
python tools/make_xlsx.py   # chỉ khi sửa tools/pdf_data.py
python tools/build.py       # tạo lại dist/
python server/app.py        # http://localhost:8080, dữ liệu trong var/gom_vu_gia.sqlite3
```
Mở http://localhost:8080 bằng Chrome hoặc Edge rồi đăng nhập bằng tài khoản trong `.env` (cần Internet để tải thư viện xuất file và phông chữ).
Mọi trang và API đều cần đăng nhập. Phiên đăng nhập giữ 30 ngày; đổi tên hoặc mật khẩu admin thì mọi phiên cũ hết hiệu lực.
Sai mật khẩu 5 lần thì địa chỉ đó bị khóa đăng nhập 15 phút.

## Deploy lên Coolify
1. Đẩy repo lên GitHub.
2. Trong Coolify: **New Resource → Public/Private Repository** → chọn repo, nhánh `main`.
3. **Build Pack: Docker Compose** (file `docker-compose.yml` ở thư mục gốc).
4. Mục **Environment Variables**: thêm `ADMIN_USERNAME` và `ADMIN_PASSWORD` (mật khẩu ≥ 8 ký tự). Thiếu hai biến này thì deploy báo lỗi.
5. Ở service `app`, gắn domain (cổng `80`) rồi **Deploy**. Bật **Auto Deploy** để mỗi lần push lên `main` Coolify tự dựng lại.

Dữ liệu nằm trong volume `gvg-data` (thư mục `/data` trong container), giữ nguyên qua các lần deploy. Đừng xóa volume này.
`docker-compose.yml` chỉ dùng `expose: 80`, không có `ports:`, nên container không chiếm port nào trên host và không thể trùng port với ứng dụng khác; Coolify (Traefik) định tuyến domain vào cổng nội bộ.
Container có healthcheck tại `/healthz`.

Chạy thử trên máy (vì không publish port, truy cập bằng cách tạm map cổng):
```
docker compose up -d --build                        # đọc ADMIN_USERNAME / ADMIN_PASSWORD từ .env
docker compose run --rm --no-deps -p 8080:80 app
```
Mở http://localhost:8080. Dừng bằng `docker compose down`.

## Dữ liệu nằm ở đâu
Toàn bộ bảng giá, mẫu, báo giá, ảnh và bản nháp lưu **trên máy chủ** (SQLite trong `DATA_DIR`), dùng chung cho mọi thiết bị đăng nhập.
Máy chủ mới **không có sẵn dữ liệu nào**: không còn kiểu tự nạp hay hiện dữ liệu mẫu. Dữ liệu được nạp bằng file sao lưu `.json`.

### Đưa dữ liệu lên production
1. Tạo file dữ liệu chính thức (bảng giá gốc 228 sản phẩm + mẫu “Bộ Phúc Liên Hoa – vẽ vàng” kèm ảnh):
   ```
   python tools/export_data.py      # -> exports/gom-vu-gia-du-lieu-<ngày>.json
   ```
2. Mở trang production, đăng nhập → **Sao lưu** → **Khôi phục từ bản sao lưu** → chọn file → **Thay thế toàn bộ**.
   Hoặc chạy trong terminal của container: `python server/app.py import <file.json>`.

Chỉ cần bảng giá thì chọn thẳng `data/pdf_data.json` ở bước 2 (hoặc `python server/app.py import data/pdf_data.json`): khi đó chỉ bảng giá bị thay, mẫu, báo giá và ảnh giữ nguyên.

Nếu đã sửa bảng giá, mẫu, báo giá trên **bản cũ** (bản lưu ngay trong trình duyệt), có hai cách giữ lại:
- Trước khi deploy bản mới: mở bản cũ → **Sao lưu** → **Xuất bản sao lưu đầy đủ**, rồi nạp file đó ở bước 2 thay cho file ở bước 1.
- Sau khi deploy: mở trang **bằng chính trình duyệt đã dùng bản cũ, cùng địa chỉ**. Mục **Sao lưu** sẽ báo còn dữ liệu cũ (cả dữ liệu nhập ở chế độ “dữ liệu mẫu / Xem thử”) và có nút **Đưa lên máy chủ** cho từng kho. Kho cũ trong trình duyệt không bị xóa.
  Nút **Sao lưu → Khôi phục dữ liệu mẫu** luôn có sẵn để lấy lại dữ liệu này bất cứ lúc nào (kể cả khi đã bấm “Quay về dữ liệu thật” ở bản cũ hoặc đã đưa lên một lần).

Mỗi lần **Thay thế toàn bộ**, máy chủ tự chụp lại dữ liệu cũ vào `DATA_DIR/backups/` (giữ 10 bản gần nhất).
Nhãn góc phải thanh trên cùng cho biết lần xuất sao lưu gần nhất và chuyển màu vàng khi đã quá 7 ngày chưa sao lưu.

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
Các test chạy theo thứ tự và dùng chung dữ liệu máy chủ (t1 đăng nhập, nạp file dữ liệu rồi nhập bảng giá cho các test sau).
Test tự chạy `server/app.py` ở cổng `8765` (đổi bằng biến `GVG_TEST_PORT`) với tài khoản admin riêng cho test, dữ liệu trong `tests/.output/server/`; kết quả, ảnh chụp nằm trong `tests/.output/`.
Một số test cần file mẫu chưa có trong repo, xem [tests/fixtures/README.md](tests/fixtures/README.md).
Muốn chạy không cần Internet: đặt `GVG_LIBS` trỏ tới thư mục `node_modules` có `xlsx`, `html2canvas`, `jspdf`.

## Thư viện dùng (tải từ cdnjs khi chạy)
SheetJS xlsx 0.18.5 · html2canvas 1.4.1 · jsPDF 2.5.1 · phông Be Vietnam Pro, Cormorant Garamond (Google Fonts).
