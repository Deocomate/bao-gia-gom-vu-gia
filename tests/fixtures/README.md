# File mẫu cho kiểm thử

Các file dưới đây được tạo tự động từ dữ liệu trong repo bởi [`tests/make_fixtures.py`](../make_fixtures.py) khi test cần đến (không đưa lên git).
Tạo lại bằng tay: xóa file rồi chạy `python tests/make_fixtures.py`. Tạo file .xls cần SheetJS từ cdnjs (hoặc `GVG_LIBS`).

| File | Nội dung | Dùng bởi |
|---|---|---|
| `edge.csv` | CSV ca biên: mã X1–X4 (giá có dấu chấm, trống, sai, bằng 0), mã đã có đổi giá, tên có dấu phẩy, dòng không mã “Đĩa thử không mã” | `t2_csv.py` |
| `Bang_gia_mau_Gom_Vu_Gia.xls` | File Excel mẫu `data/Bang_gia_mau_Gom_Vu_Gia.xlsx` lưu lại dạng .xls (BIFF8) | `t2_csv.py` |
| `pdf_like.xlsx` | Bảng giá bố cục như PDF: dòng tiêu đề mục chỉ có tên (VD “BÁT HƯƠNG LIÊN HOA”), 2 cột giá Men lam / Vàng kim | `t8_pdflike.py`, `t9.py` |
| `prod/*.jpg` | Ảnh sản phẩm vẽ đơn giản trên nền trắng (`bathuong20.jpg`, `de.jpg`, `binh.jpg`…) | `t10_compose.py` |
