---
phase: 4
title: Gửi báo giá – chia sẻ PDF/PNG, xem trước vừa màn hình
status: done
depends: [3]
---

# Giai đoạn 4 – Gửi báo giá cho khách từ điện thoại

## Bối cảnh
`saveBlob` trong `src/js/1_core.js:~200` tải file bằng `<a download>`. Trên iOS (đặc biệt app ở màn hình chính) thao tác này mở màn xem PDF, khó quay lại và khó gửi qua Zalo. Xuất PDF dựng bằng html2canvas + jsPDF trong `src/js/6_export.js`, mất vài giây → mất "user activation" mà `navigator.share` yêu cầu.

## Yêu cầu
- Hàm `shareOrSave(filename, blob)`: nếu `navigator.canShare?.({files:[file]})` → dùng `navigator.share({files, title})`; người dùng hủy (`AbortError`) → im lặng; lỗi `NotAllowedError` (mất activation) → hiện modal "File đã sẵn sàng" với nút **Gửi** (chạm mới tạo activation) và nút **Tải về**. Không hỗ trợ → `saveBlob` như cũ.
- Trên điện thoại, nút chính trong sheet ⋯ là **Gửi báo giá (PDF)**; trên máy tính giữ **Tải PDF**. Tên file gồm mã báo giá + tên khách (đã có quy ước trong 6_export.js – tái dùng).
- Thêm lựa chọn **Gửi ảnh (PNG)** vì khách Zalo hay xem ảnh nhanh hơn PDF.
- Xem trước: trang A4 794px thu nhỏ theo bề rộng màn hình (`transform: scale` hoặc ảnh), chạm để phóng to (lightbox sẵn có), không cuộn ngang.
- Hiện trạng thái đang tạo file (spinner trên nút, chặn bấm đôi).
- PDF gộp nhiều mẫu (trang Mẫu) cũng đi qua `shareOrSave`.

## File
- `src/js/1_core.js` (thêm `shareOrSave`, giữ `saveBlob`)
- `src/js/6_export.js` (gọi hàm mới, preview co giãn)
- `src/js/5_builder.js`, `src/js/7_lists.js` (nút gọi)
- `src/style.css`

## Các bước
1. Viết `shareOrSave` + modal dự phòng.
2. Nối vào xuất PDF/PNG/PDF gộp.
3. Preview co giãn.
4. Thử: Chrome desktop (không share file → tải về), giả lập `navigator.share` trong Playwright, iPhone thật.

## Kiểm chứng
- t4/t18 vẫn xanh (đường tải về trên desktop).
- Test mới: stub `navigator.canShare=()=>true`, `navigator.share` ghi lại tham số → bấm Gửi PDF → nhận 1 file `application/pdf`, tên đúng; stub ném `NotAllowedError` → modal có nút Gửi.
- Thử tay iPhone: Gửi → bảng chia sẻ có Zalo, file mở được bên Zalo.

## Rủi ro / hoàn tác
- Một số bản iOS cũ (< 15) không chia sẻ file được → rơi về tải về.
