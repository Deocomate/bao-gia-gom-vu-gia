---
phase: 6
title: Kiểm thử và tài liệu
status: done
depends: [1, 2, 3, 4, 5]
---

# Giai đoạn 6 – Kiểm thử, tài liệu

## Yêu cầu
- `tests/t6_mobile.py` thành kịch bản đầy đủ ở 390×844 với `is_mobile=True, has_touch=True` (UA iPhone): điều hướng bnav, không cuộn ngang ở 5 mục, vùng chạm ≥40px, font ô nhập ≥16px, luồng tạo bộ (phase 3), lọc bảng giá + chọn nhiều mẫu (phase 5), chia sẻ PDF với stub (phase 4).
- `tests/t19_pwa.py`: manifest/icon công khai, thẻ head, nút cài và modal iOS, ẩn ở standalone (phase 1).
- Chạy `python tools/build.py && python tests/run_all.py` – tất cả xanh.
- Ảnh chụp trước/sau ở 390px và 1440px lưu `tests/.output/shots` để so (không commit).
- Thử tay trên iPhone thật (Safari + app ở màn hình chính) và một máy Android Chrome qua bản deploy HTTPS: cài app, đăng nhập, tạo bộ, gửi PDF qua Zalo. Ghi kết quả vào `plans/reports/`.
- `README.md`: mục mới "Dùng trên điện thoại / cài app" (cách cài iPhone/Android, phải đăng nhập lại một lần trong app, gửi báo giá qua Zalo); cập nhật cây thư mục (`tools/make_icons.py`, `data/icon-*.png`) và danh sách test.

## Kiểm chứng
- Đầu ra `run_all.py` không có FAIL.
- Đối chiếu 7 tiêu chí nghiệm thu trong `plan.md`.
