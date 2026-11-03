---
phase: 3
title: Tạo bộ ban thờ trên điện thoại
status: done
depends: [2]
---

# Giai đoạn 3 – Luồng Tạo bộ / soạn báo giá một tay

## Bối cảnh
`src/js/5_builder.js` dựng thanh `.b-top` (Danh mục, Bộ mới, Lưu mẫu/Lưu báo giá, Xem trước, Tải PDF, Thêm), tờ soạn (tên, mô tả, kích thước, khách hàng, ảnh, bảng vật phẩm, ghi chú, phí, tổng) và `.mbar` (tổng + Thêm SP + Lưu). Danh mục là ngăn kéo trái `width:min(420px,92vw)` (`src/style.css:382`). Dòng vật phẩm có 4 `.ibtn` 26px (`5_builder.js:233`).

## Yêu cầu
- **Thanh hành động**: ≤820px ẩn `.b-top`; `.mbar` thành: tổng tiền (chạm để cuộn tới phần Tổng) · nút **Thêm SP** · nút **Lưu** · nút **⋯** mở sheet hành động (Bộ mới, Lưu mẫu ↔ Lưu báo giá, Chuyển thành báo giá, Xem trước, Gửi/Tải PDF, Tải PNG, In, các mục trong menu "Thêm" hiện có). Không bỏ hành động nào.
- **Danh mục** ≤820px: sheet toàn màn hình (100dvh, safe area), ô tìm + bộ lọc dính trên, nút "Xong (n dòng)" dính dưới; giữ mở sau khi thêm; mỗi lần thêm: toast ngắn "Đã thêm …", nút ±/số lượng ≥44px, rung `navigator.vibrate?.(10)` nếu có; thẻ sản phẩm hiện badge "đã có ×n" nếu đã trong bộ.
- **Dòng vật phẩm**: giữ stepper số lượng (to hơn) và ô đơn giá `inputmode="numeric"`; 4 nút nhỏ gộp vào một nút **⋯** 40px mở menu: Lên, Xuống, Thay sản phẩm, Về giá bảng giá (nếu sửa tay), Xóa (màu đỏ, có hoàn tác bằng toast "Hoàn tác" thay cho xác nhận). Trên máy tính giữ nguyên 4 nút.
- **Thông tin khách**: `type="tel"` cho SĐT, `autocomplete` phù hợp, `enterkeyhint="next"`; khối khách hàng + ghi chú + phí có thể thu gọn (`<details>`) trên điện thoại, mở sẵn khi là báo giá.
- **Ô tiền** (`.money-inp`, phí, giảm giá): `inputmode="numeric"` để hiện bàn phím số.
- **Ảnh ban thờ / Tự sắp ảnh**: vùng tải ảnh thấp hơn (≈180px) trên điện thoại; `accept="image/*"` để iPhone cho chọn Chụp ảnh/Thư viện; trình tự sắp (`8_compose.js`, đã dùng pointer events) mở toàn màn hình, nút ≥44px.
- Tiêu đề bộ (font hiển thị lớn) giảm cỡ trên điện thoại để không chiếm nửa màn hình.

## File
- `src/js/5_builder.js` (markup thanh, menu dòng, sheet hành động, thuộc tính input)
- `src/style.css` (khối ≤820px / pointer:coarse)
- `src/js/8_compose.js` (chỉ CSS/kích thước nút nếu cần)
- `src/js/1_core.js` nếu cần helper `sheet()` dùng chung (tái dùng `modal()` với `size:"sheet"` thay vì viết mới)

## Các bước
1. Helper sheet/menu tái dùng `modal()`.
2. Sheet hành động + `.mbar` mới; kiểm tra mọi `data-act` của `.b-top` đều có trong sheet.
3. Danh mục toàn màn hình + phản hồi khi thêm.
4. Menu ⋯ của dòng + hoàn tác xóa.
5. Thuộc tính input, `<details>`.
6. Chạy lại t3, t10, t17 (builder/compose/line price) ở desktop; chụp mobile.

## Kiểm chứng
- Kịch bản mobile (t6): từ bộ trống, mở danh mục, tìm "bát hương", thêm 2 sản phẩm không đóng sheet, Xong, tăng số lượng dòng 1, xóa dòng 2 rồi Hoàn tác, Lưu mẫu qua sheet ⋯ → mẫu xuất hiện ở danh sách.
- Kiểm tra không phần tử bấm nào < 40px trong `#view-builder` trên 390px.

## Rủi ro / hoàn tác
- Hành động bị "lạc" khi chuyển vào sheet → bước 2 có danh sách đối chiếu `data-act`.
- Hoàn tác xóa: giữ bản sao dòng + vị trí trong 5 giây; không ghi đè nếu người dùng đã sửa khác.
