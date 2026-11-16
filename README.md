# Thanh Hằng Birthday V16 · Web + Admin + tự đăng lời chúc

Đây là mã nguồn website sinh nhật và trang Admin đã triển khai lên **Vercel**.

- Website: https://thanh-hang-birthday.vercel.app
- Admin: https://thanh-hang-birthday.vercel.app/admin
- Lời chúc và bình luận **tự hiển thị ngay** sau khi gửi, không qua khâu duyệt.
- Admin vẫn có quyền **Ẩn / Hiện / Xóa** nội dung bất kỳ lúc nào; các mục đã ẩn trước khi cập nhật không tự được mở lại.
- Khách có thể đăng lời chúc kèm ảnh/video, chỉ gửi ảnh/video hoặc đăng album công khai; không cần đăng nhập hay chờ duyệt.
- Lần gửi đầu tiên vẫn giữ bộ hành trình/album mẫu.
- Dữ liệu máy chủ dùng Vercel Blob đã mã hóa AES-256-GCM. Mật khẩu Admin **không có trong mã nguồn**; cung cấp bằng Environment Variables trên Vercel.

## Tệp chính

| Tệp | Chức năng |
|---|---|
| `index.html`, `styles.css`, `app.js` | Website công khai |
| `admin.html`, `admin.css`, `admin.js` | Giao diện quản lý |
| `api/guest.js`, `api/guest-upload.js` | API nhận lời chúc, album, bình luận, lượt thích và cấp token upload cho khách |
| `api/content.js` | API đọc nội dung công khai |
| `api/admin/*` | Đăng nhập và quản lý dữ liệu từ Admin |
| `api/_lib/store.js` | Lưu trạng thái đã mã hóa vào Vercel Blob |
| `api/_lib/seed.js`, `demo-seed.js` | Dữ liệu minh họa lần đầu |
| `particle_engine.js`, `particle_show.html`, `effects.js` | Hiệu ứng hạt/3D/pháo hoa |

## Triển khai

Xem `README_DEPLOY.md` và `HUONG_DAN_CHINH_SUA.md`. Không commit các file `.env`, access token, mật khẩu, hoặc secret.

## Hạn chế

Giới hạn gửi phía server hiện chỉ là best-effort, không đảm bảo chống spam DDoS. Vì khách đăng ngay không cần duyệt, có rủi ro nội dung không phù hợp hiển thị trước khi chủ trang xử lý. Đã bật upload công khai có giới hạn loại/dung lượng tệp và token tạm thời. Tuy nhiên vẫn có rủi ro spam, chi phí lưu trữ và nội dung không phù hợp; cần theo dõi và tăng cường bảo vệ nếu chia sẻ rộng.

## V16.2 — Public guest media and music improvements (2026-11-16)
- Visitors can post text wishes, image/video-only wishes, and public media albums without signing in or waiting for manual approval.
- Direct uploads: browser -> Vercel Blob using a scoped client token from `/api/guest-upload`; then `/api/guest` checks Blob metadata before writing media URLs to encrypted state.
- Limits: wishes up to 5 files/1 video; albums 10 files/2 videos; JPEG/PNG/WebP <=8 MiB; MP4/WebM <=30 MiB; total <=75 MiB per post. Multiple selection supported.
- The browser imports a pinned Vercel Blob client ESM bundle from `esm.sh` on upload. Visitors require network access to that host.
- Anonymous media consumes storage/bandwidth; per-instance throttling is not a complete defense. Abandoned uploads can leave orphaned Blob objects. Review storage usage and use WAF/persistent throttling if widely shared.
- Background music already uses `assets/birthday_theme.mp3` and `musicAutoplay:true`. Playback is attempted on entry; when a browser blocks audible autoplay, it retries at the first ordinary user interaction. It cannot guarantee unmuted autoplay on every browser.
- Live smoke tests: text-only wish; JPG image-only wish; MP4 wish; 2-image album; MP4/WebM album; reload and another device; Admin hide/delete; music permissions.
