---
phase: 2
title: Khung mobile – bottom nav, header gọn, vùng chạm, chống zoom
status: done
---

# Giai đoạn 2 – Khung giao diện điện thoại

## Bối cảnh
Header (`src/body.html`) chứa logo, công tắc sáng/tối, chip lưu trữ, Đăng xuất và 5 tab. Ở ≤820px (`src/style.css:389`) tab xuống hàng riêng và cuộn ngang. `.mbar` (thanh tổng tiền cố định dưới) đã có trên trang Tạo bộ. Chuyển mục xử lý qua `[data-view]` trong `src/js/2_app.js:183`.

## Yêu cầu
- **Bottom nav** (chỉ ≤820px): 5 mục có icon + nhãn ngắn: "Tạo bộ", "Báo giá", "Mẫu", "Bảng giá", "Thêm" (mở sheet: Sao lưu, Cài ứng dụng, Sáng/Tối, Đăng xuất). Cao 56px + `env(safe-area-inset-bottom)`. Tab đang chọn tô màu thương hiệu. Dùng lại `data-view` để không nhân đôi logic điều hướng.
- **Header gọn** ≤820px: một hàng cao ~52px (logo nhỏ + tên mục hiện tại + chip lưu trữ dạng chấm), ẩn tabs trên và nút Đăng xuất; dính trên khi cuộn với `env(safe-area-inset-top)`.
- `.mbar` của trang Tạo bộ đặt ngay **trên** bottom nav (không chồng); `main` có padding dưới tương ứng để nội dung cuối không bị che.
- **Chống zoom iOS**: trong `@media (max-width:820px)` đặt `font-size:16px` cho `input, select, textarea, .inp, .cell-inp, .xs-btn` (không đụng `maximum-scale`, giữ khả năng phóng to cho người dùng).
- **Vùng chạm** với `(pointer:coarse)`: `.btn` ≥ 44px, `.btn.sm` ≥ 40px, `.ibtn` 40×40, `.tab`/nav ≥ 48px, checkbox có vùng nhãn rộng.
- Modal ≤820px: hiện dạng sheet từ dưới, toàn chiều rộng, nút chân modal dính đáy, tôn trọng safe area, cuộn bên trong thân modal.
- Toast nằm trên bottom nav.
- `-webkit-tap-highlight-color: transparent` + trạng thái `:active` rõ ràng; `touch-action: manipulation` cho nút để bỏ trễ chạm đôi.
- Không đổi gì ở ≥821px.

## File
- `src/body.html`: thêm `<nav class="bnav">` cuối body và tiêu đề mục trong header.
- `src/style.css`: khối `@media (max-width:820px)` và `(pointer:coarse)`.
- `src/js/2_app.js`: đồng bộ trạng thái active cho bnav + tiêu đề, sheet "Thêm".

## Các bước
1. Thêm markup bnav + icon SVG (dùng bộ `ICON` sẵn có nếu đủ, thiếu thì bổ sung ở `1_core.js`).
2. CSS header gọn, bnav, offset `.mbar`, toast, modal-sheet.
3. Quy tắc font 16px và vùng chạm.
4. Chụp 390×844 và 1440×900 cho 5 mục, so trước/sau.

## Kiểm chứng
- t6 mở rộng: bnav hiển thị ở 390px, ẩn ở 1440px; bấm từng mục đổi view; không cuộn ngang; mọi `button:visible` trong view hiện tại có `getBoundingClientRect().height >= 40` (danh sách ngoại lệ có lý do); `getComputedStyle(input).fontSize >= 16px`.
- Chạy toàn bộ test cũ để chắc desktop không đổi.

## Rủi ro / hoàn tác
- Selector test cũ dựa vào `#tab-builder` … → giữ nguyên các nút tab trên (chỉ ẩn bằng CSS ở mobile), test vẫn chạy được ở desktop; test mobile dùng bnav.
