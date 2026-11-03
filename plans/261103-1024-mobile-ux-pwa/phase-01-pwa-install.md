---
phase: 1
title: PWA – manifest, icon, nút cài app
status: done
---

# Giai đoạn 1 – Cài ứng dụng lên iPhone/Android

## Bối cảnh
`tools/build.py` chỉ sinh `index.html`, `login.html`, `favicon.png`. `server/app.py` chỉ phục vụ công khai `/favicon.png` và `/healthz`; mọi đường khác chuyển về `/` hoặc `/login`. Logo `data/logo_brown.png` 463×263, không vuông.

## Yêu cầu
- Icon vuông: 180 (apple-touch-icon), 192, 512, 512 maskable (vùng an toàn 80%). Nền `#92431E`, logo màu kem (`data/logo_cream.png`) căn giữa – đã chốt.
- `manifest.webmanifest`: `name` "Gốm Vũ Gia – Báo giá đồ thờ", `short_name` "Gốm Vũ Gia", `start_url` "/", `scope` "/", `display` "standalone", `theme_color`/`background_color`, `lang` "vi", icon ở trên.
- Thẻ head trong `index.html` và `login.html`: `<link rel="manifest">`, `<link rel="apple-touch-icon">`, `apple-mobile-web-app-capable`, `mobile-web-app-capable`, `apple-mobile-web-app-title`, `apple-mobile-web-app-status-bar-style` = `black-translucent` (đã có `viewport-fit=cover` + safe-area).
- Máy chủ phục vụ công khai (không cần đăng nhập): `/manifest.webmanifest` (`application/manifest+json`), `/icon-*.png`, `/apple-touch-icon.png`. Không chứa dữ liệu nhạy cảm.
- Không dùng service worker (app cần mạng; Chrome ≥ 108 và iOS không bắt buộc SW để cài). Nếu kiểm thử Android cho thấy Chrome không hiện cài đặt, thêm SW tối thiểu chỉ `fetch` thẳng mạng, không cache.
- Nút **Cài ứng dụng** (biểu tượng tải xuống + chữ):
  - Vị trí: header bên cạnh Đăng xuất trên máy tính; trên điện thoại nằm trong menu "Thêm" của bottom nav (giai đoạn 2) và một banner nhỏ có thể tắt ở trang Tạo bộ lần đầu mở trên điện thoại.
  - Ẩn khi `matchMedia('(display-mode: standalone)').matches || navigator.standalone`.
  - Có `beforeinstallprompt` → lưu sự kiện, bấm nút gọi `prompt()`; `appinstalled` → ẩn nút + toast.
  - iOS/iPadOS (kể cả iPad báo là Mac: `navigator.maxTouchPoints > 1`) → modal hướng dẫn: biểu tượng Chia sẻ (SVG) → "Thêm vào MH chính" → "Thêm"; lưu ý đăng nhập lại một lần trong app. Trình duyệt trong app (Zalo/Facebook) → nhắc mở bằng Safari trước.
  - Trình duyệt khác không hỗ trợ → modal hướng dẫn chung theo menu trình duyệt.
  - Nhớ việc tắt banner bằng `localStorage` (bọc try/catch).
- Trang đăng nhập cũng có manifest để cài được ngay từ màn đăng nhập.

## File
- Tạo `tools/make_icons.py` (Pillow) → sinh `data/icon-180.png`, `data/icon-192.png`, `data/icon-512.png`, `data/icon-maskable-512.png`; commit ảnh kết quả để `build.py` không cần Pillow khi deploy.
- Sửa `tools/build.py`: chép icon vào `dist/`, ghi `dist/manifest.webmanifest`, thêm thẻ head (dùng chung một chuỗi cho cả hai trang).
- Sửa `src/login.html`: thêm chỗ chèn thẻ head PWA.
- Sửa `server/app.py`: danh sách file công khai cố định (whitelist), không đọc đường dẫn tùy ý.
- Sửa `src/body.html`, `src/js/2_app.js` (logic cài đặt), `src/style.css` (nút, banner).
- `Dockerfile`: kiểm tra `data/icon-*.png` được COPY.

## Các bước
1. Viết `make_icons.py`, chạy, xem 4 ảnh.
2. Cập nhật `build.py` + `login.html`; chạy build, kiểm tra `dist/`.
3. Whitelist file tĩnh trong `server/app.py`; `curl -I` không cookie trả 200 cho manifest/icon, `/` vẫn 302 về `/login`.
4. Viết logic nút cài + modal hướng dẫn iOS.
5. Kiểm tra Chrome DevTools → Application → Manifest không lỗi; Lighthouse "Installable".

## Kiểm chứng
- `tests/t19_pwa.py`: manifest hợp lệ JSON, đủ trường, icon trả 200 khi chưa đăng nhập; thẻ head có mặt ở `/login` và `/`; giả lập UA iPhone → bấm nút → modal hướng dẫn hiện; giả lập `display-mode: standalone` (`page.emulate_media` không hỗ trợ → stub `matchMedia`) → nút ẩn.
- Thử tay trên iPhone thật qua HTTPS (Coolify) – ghi kết quả vào báo cáo.

## Rủi ro / hoàn tác
- Lộ manifest/icon công khai: chỉ là thương hiệu, chấp nhận được.
- Hoàn tác: bỏ route whitelist và thẻ head; không ảnh hưởng dữ liệu.
