---
phase: 5
title: Danh sách mẫu, báo giá, bảng giá, sao lưu trên điện thoại
status: done
depends: [2]
---

# Giai đoạn 5 – Các trang danh sách

## Bối cảnh
- Mẫu ban thờ (`src/js/7_lists.js`): thẻ có ảnh lớn ~270px và 4 nút (Mở/sửa, Tạo báo giá, Nhân bản, Xóa) xuống hàng; khối "Chọn tất cả / Xuất PDF gộp" chiếm đầu trang.
- Báo giá khách hàng: ô tìm + danh sách.
- Bảng giá (`src/js/3_prices.js`): 5 nút + 5 ô lọc + chip trạng thái trước bảng; sửa giá trực tiếp trong ô.

## Yêu cầu
- **Mẫu**: ≤820px ảnh thấp hơn (tỉ lệ 16:10, ≈200px); nút chính "Tạo báo giá" to, "Mở/sửa" thứ hai, "Nhân bản" và "Xóa" vào nút ⋯. Chế độ chọn nhiều cho PDF gộp bật bằng nút "Chọn" trên đầu; khi đang chọn, thanh dưới hiện "Đã chọn n · Gửi PDF gộp".
- **Báo giá**: mỗi báo giá là thẻ: tên khách, SĐT (chạm để gọi `tel:`), tổng, ngày; hành động chính "Mở", phụ "Gửi PDF", ⋯ cho phần còn lại. Ô tìm dính trên khi cuộn.
- **Bảng giá**: ≤820px gom bộ lọc vào nút **Lọc (n)** mở sheet; chỉ để ô tìm + nút Lọc + nút "+" thêm sản phẩm; Nhập/Xuất Excel, Điều chỉnh hàng loạt, File mẫu vào ⋯. Ô đơn giá `inputmode="numeric"`, nút "Lưu thay đổi" dính đáy khi có thay đổi chưa lưu.
- **Sao lưu**: nút ≥44px, chữ giải thích ngắn gọn; không đổi logic.
- Ô tìm `type="search"`, `enterkeyhint="search"`.

## File
- `src/js/7_lists.js`, `src/js/3_prices.js`, `src/style.css`

## Các bước
1. Mẫu: thẻ + chế độ chọn.
2. Báo giá: thẻ + tel.
3. Bảng giá: sheet lọc, menu ⋯, thanh Lưu dính.
4. Chạy t5, t11–t16, t18 ở desktop; chụp mobile từng trang.

## Kiểm chứng
- t6 mở rộng: ở 390px, trang Bảng giá thấy dòng sản phẩm đầu tiên trong màn hình đầu (không cần cuộn); mở Lọc chọn nhóm → danh sách lọc đúng; trang Mẫu chọn 2 mẫu → nút Gửi PDF gộp bật.

## Rủi ro / hoàn tác
- Test cũ bấm thẳng nút bộ lọc ở desktop → desktop giữ nguyên markup, chỉ ẩn/hiện bằng CSS + sheet tái dùng cùng phần tử (di chuyển node vào sheet và trả lại khi đóng) để không trùng id.
