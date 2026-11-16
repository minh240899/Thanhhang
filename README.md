# Thanh Hằng Birthday V16 · Web + Admin + tự đăng lời chúc

Đây là mã nguồn website sinh nhật và trang Admin đã triển khai lên **Vercel**.

- Website: https://thanh-hang-birthday.vercel.app
- Admin: https://thanh-hang-birthday.vercel.app/admin
- Lời chúc và bình luận **tự hiển thị ngay** sau khi gửi, không qua khâu duyệt.
- Admin vẫn có quyền **Ẩn / Hiện / Xóa** nội dung bất kỳ lúc nào; các mục đã ẩn trước khi cập nhật không tự được mở lại.
- Khách chưa thể tải album ảnh/video; Admin có thể quản lý album và nội dung khác.
- Lần gửi đầu tiên vẫn giữ bộ hành trình/album mẫu.
- Dữ liệu máy chủ dùng Vercel Blob đã mã hóa AES-256-GCM. Mật khẩu Admin **không có trong mã nguồn**; cung cấp bằng Environment Variables trên Vercel.

## Tệp chính

| Tệp | Chức năng |
|---|---|
| `index.html`, `styles.css`, `app.js` | Website công khai |
| `admin.html`, `admin.css`, `admin.js` | Giao diện quản lý |
| `api/guest.js` | API nhận lời chúc, bình luận và like |
| `api/content.js` | API đọc nội dung công khai |
| `api/admin/*` | Đăng nhập và quản lý dữ liệu từ Admin |
| `api/_lib/store.js` | Lưu trạng thái đã mã hóa vào Vercel Blob |
| `api/_lib/seed.js`, `demo-seed.js` | Dữ liệu minh họa lần đầu |
| `particle_engine.js`, `particle_show.html`, `effects.js` | Hiệu ứng hạt/3D/pháo hoa |

## Triển khai

Xem `README_DEPLOY.md` và `HUONG_DAN_CHINH_SUA.md`. Không commit các file `.env`, access token, mật khẩu, hoặc secret.

## Hạn chế

Giới hạn gửi phía server hiện chỉ là best-effort, không đảm bảo chống spam DDoS. Vì khách đăng ngay không cần duyệt, có rủi ro nội dung không phù hợp hiển thị trước khi chủ trang xử lý. Không bật upload ảnh/video từ khách khi chưa có hạn ngạch, chính sách upload và kiểm tra tệp.
