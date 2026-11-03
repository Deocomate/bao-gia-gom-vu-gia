---
title: Tối ưu dùng trên điện thoại và cài app lên iPhone
status: completed
created: 2026-11-03
mode: auto (medium)
branch: main
---

# Tối ưu dùng trên điện thoại + nút cài app (PWA)

## Kết quả mong muốn
Người quản trị dùng iPhone/Android có thể, chỉ bằng một tay: mở danh mục, thêm sản phẩm vào bộ, chỉnh số lượng/giá, nhập thông tin khách, xem trước và **gửi báo giá PDF cho khách (Zalo, tin nhắn…)** mà không phải phóng to, cuộn ngang hay bấm trượt nút nhỏ. Ứng dụng có nút **"Cài ứng dụng"** để đưa lên màn hình chính iPhone (và Android), mở ra toàn màn hình như app thật.

## Bằng chứng hiện trạng (ảnh chụp 390×844, dữ liệu chính thức)
- Thanh tab nằm trên đầu, cuộn ngang: "Sao lưu" và một phần "Tạo bộ ban thờ" bị khuất; header chiếm ~110px và không dính khi cuộn.
- Trang Tạo bộ: 6 nút (Danh mục, Bộ mới, Lưu mẫu, Lưu báo giá, Xem trước, Tải PDF, Thêm) chiếm 3 hàng trước khi thấy nội dung.
- Dòng vật phẩm: nút Lên/Xuống/Thay/Xóa là `.ibtn` 26×26px (`src/style.css:265`), dễ bấm nhầm; nút `.btn.sm` 30px. 391 phần tử bấm được nhỏ hơn 40px trên trang Tạo bộ.
- Cỡ chữ gốc 14px (`src/style.css:28`) → iOS Safari tự phóng to khi chạm vào ô nhập (ô < 16px).
- Tải PDF dùng `<a download>` (`src/js/1_core.js:213`): trên iPhone (nhất là khi chạy dạng app ở màn hình chính) file mở ra màn xem trước, khó lưu/gửi tiếp.
- Bảng giá: 5 ô lọc chiếm nửa màn hình trước khi thấy danh sách.
- Chưa có manifest, apple-touch-icon, meta `apple-mobile-web-app-*` → "Thêm vào MH chính" chỉ ra một lối tắt trang web có thanh Safari, icon chụp màn hình.
- Logo 463×263 (không vuông) → cần icon vuông riêng.

## Ràng buộc
- Giữ kiến trúc: một `dist/index.html` dựng từ `src/` bằng `tools/build.py`, máy chủ `server/app.py` chỉ dùng thư viện chuẩn; Pillow đã có trong `requirements.txt`.
- Mọi trang/API vẫn cần đăng nhập; chỉ mở công khai các file không nhạy cảm (manifest, icon).
- Không đổi bố cục bản xuất A4 (`.xp*`), không đổi định dạng dữ liệu/sao lưu.
- Giao diện máy tính (≥ 821px) giữ nguyên hành vi hiện tại.
- Giữ màu thương hiệu `#92431E`, chế độ sáng/tối.

## Ngoài phạm vi
- Chạy offline / đồng bộ khi mất mạng (app cần máy chủ và CDN thư viện).
- Viết lại sang framework khác, app native, thông báo đẩy.
- Đa tài khoản.

## Tiêu chí nghiệm thu
1. Ở 375–430px: không cuộn ngang; mọi nút bấm chính ≥ 44×44px; chạm vào ô nhập không làm trang tự phóng to (font ô nhập ≥ 16px).
2. Điều hướng 5 mục luôn thấy được bằng thanh dưới cùng (bottom nav), không cần cuộn ngang.
3. Tạo một bộ 5 sản phẩm từ trống tới bấm Lưu: danh mục mở dạng sheet toàn màn hình, thêm sản phẩm có phản hồi ngay (rung nhẹ/toast + số dòng), không cần đóng mở lại.
4. Từ một mẫu → Tạo báo giá → nhập tên/SĐT khách → **Gửi PDF** mở bảng chia sẻ của iOS/Android (có Zalo); trình duyệt không hỗ trợ chia sẻ file thì tải về như cũ.
5. Có nút "Cài ứng dụng": Android/Chrome/Edge gọi hộp cài đặt gốc; iPhone/iPad hiện hướng dẫn 3 bước (Chia sẻ → Thêm vào MH chính → Thêm) có hình minh họa; đã chạy dạng app thì nút ẩn.
6. Cài lên màn hình chính iPhone: icon thương hiệu, tên "Gốm Vũ Gia", mở toàn màn hình, thanh trạng thái màu thương hiệu, không bị tai thỏ/thanh home che nội dung, đăng nhập giữ được 30 ngày.
7. `python tests/run_all.py` xanh; có test mới cho bố cục mobile và PWA.

## Các giai đoạn
| # | Giai đoạn | File chính | Phụ thuộc | Trạng thái |
|---|---|---|---|---|
| 1 | [PWA: manifest, icon, nút cài app](phase-01-pwa-install.md) | `tools/make_icons.py`, `tools/build.py`, `server/app.py`, `src/login.html`, `src/js/2_app.js`, `src/js/1_core.js` | — | done |
| 2 | [Khung mobile: bottom nav, header gọn, chạm ≥44px, chống zoom](phase-02-mobile-shell.md) | `src/body.html`, `src/style.css`, `src/js/2_app.js` | — | done |
| 3 | [Tạo bộ ban thờ trên điện thoại](phase-03-builder-mobile.md) | `src/js/5_builder.js`, `src/style.css` | 2 | done |
| 4 | [Gửi báo giá: chia sẻ PDF, xem trước](phase-04-share-quote.md) | `src/js/1_core.js`, `src/js/6_export.js`, `src/js/5_builder.js` | 3 | done |
| 5 | [Danh sách mẫu, báo giá, bảng giá trên điện thoại](phase-05-lists-prices-mobile.md) | `src/js/7_lists.js`, `src/js/3_prices.js`, `src/style.css` | 2 | done |
| 6 | [Kiểm thử và tài liệu](phase-06-tests-docs.md) | `tests/t6_mobile.py`, `tests/t19_pwa.py`, `README.md` | 1–5 | done |

Giai đoạn 1 độc lập, có thể làm song song với 2. Giai đoạn 3–5 đều sửa `src/style.css` nên làm tuần tự.

## Rủi ro chính
- iOS không có `beforeinstallprompt` → chỉ hướng dẫn được, không tự cài. Đã chấp nhận trong tiêu chí 5.
- App ở màn hình chính iOS có kho cookie riêng với Safari → phải đăng nhập lại một lần sau khi cài. Ghi vào hướng dẫn cài.
- `navigator.share({files})` cần thao tác người dùng trực tiếp; tạo PDF bằng html2canvas mất vài giây có thể làm mất "user activation" → giai đoạn 4 tạo PDF trước rồi hiện nút "Gửi" thứ hai (xem phase-04).
- Thay đổi CSS dùng chung có thể ảnh hưởng máy tính → mọi quy tắc mới nằm trong `@media (max-width:820px)` hoặc `(pointer:coarse)`; t6 + ảnh chụp desktop để so.

## Quyết định đã chốt (2026-11-03)
- Icon: nền nâu `#92431E`, logo kem.
- Gửi báo giá: cả PDF và ảnh PNG.
- Xóa dòng trên điện thoại: xóa ngay + toast Hoàn tác 5 giây.

## Kết quả triển khai (2026-11-03)
- Đạt tiêu chí 1–5 và 7 qua test tự động (`t6_mobile`, `t19_pwa`, các test cũ). Tiêu chí 6 (cài thật trên iPhone qua HTTPS) cần thử tay sau khi deploy.
- Khác plan: không gập khối khách hàng/ghi chú/phí bằng `<details>` (ẩn ô cần nhập khi lập báo giá); thay vào đó phiếu gọn hơn và bỏ logo trong phiếu trên điện thoại. Không dùng service worker.
- Sửa thêm lỗi có sẵn: mở một mẫu đã lưu rồi bấm "Lập báo giá" nay thành báo giá mới (trước đây bị chặn khi lưu vì còn mang mã của mẫu). Tên file báo giá chưa lưu dùng tên khách.
- Test t2, t8, t9, t10 vẫn lỗi như trước vì thiếu file mẫu trong `tests/fixtures/`.
