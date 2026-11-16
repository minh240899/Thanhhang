# Thanh Hằng Birthday V16 — deployment & source backup

## Architecture
- Static website: `index.html`, `app.js`, `styles.css`, `particle_show.html`, `particle_engine.js`
- Secure Admin: `/admin` (frontend) -> `/api/admin/*` (PBKDF2 hashed credential + HttpOnly signed session)
- Persistent state: Vercel Blob (`secure/birthday-state-v15.enc`), AES-256-GCM encrypted at rest; Vercel public Blob store contains ciphertext only.
- Admin uploads: images and small files up to 3.5 MB; video larger files: use a stable HTTPS URL or extend to signed direct uploads.
- Guest wishes including photos/videos, albums, comments and likes: `/api/guest` (immediate publication); `/api/guest-upload` issues short-lived, media-scoped direct-to-Blob upload tokens. No guest login required; Admin can hide/delete later. Local best-effort throttling remains.
- HTML/CSS/JS source: best stored in a private GitHub repository; do not commit `.env*` or any secret. GitHub pushes can trigger Vercel deployments when Git is connected.

## Critical configuration
Vercel project `thanh-hang-birthday` -> Settings -> Environment Variables:
- `ADMIN_SALT` (random hex)
- `ADMIN_PASSWORD_HASH` (PBKDF2-SHA256)
- `SESSION_SECRET` (random)
- `DATA_ENC_KEY` (random 32-byte hex)
- `BLOB_READ_WRITE_TOKEN` (managed by Vercel Blob integration)

Never store raw password in JS/HTML or commit secrets to Git. Rotate credentials after disclosure.

## Key URLs
- Public: `https://thanh-hang-birthday.vercel.app`
- Admin: `https://thanh-hang-birthday.vercel.app/admin`
- Vercel project: `https://vercel.com/levanminh240899-3669/thanh-hang-birthday`
- Project env: `https://vercel.com/levanminh240899-3669/thanh-hang-birthday/settings/environment-variables`
- Storage: `https://vercel.com/levanminh240899-3669/thanh-hang-birthday/stores`
- Source: store locally or in a private GitHub repository; link the Git repo in Vercel Settings > Git for automatic deploy on push.

## Limitations
- V16 Blob JSON with optimistic ETag locking is intended for small private birthday sites, not high-traffic social networks.
- Guest rate limiting is best-effort per function instance; configure persistent anti-spam/CAPTCHA before widespread public distribution.
- Admin login is a single account, not email-based password recovery.
- For multiple uploads, concurrency, robust permissions, audit trails, and moderation, migrate to PostgreSQL/Supabase with RLS.

## V16.1 storage conflict and multi-photo update (2026-11-16)
- Admin trip editor accepts up to 12 JPG/PNG/WebP photos. Uploaded files are compressed client-side and saved to Vercel Blob; the first uploaded image becomes the cover for a new trip. Existing single-image trips are backward compatible.
- The public Journeys section offers a photo-carousel button for each trip, separate from the linked album.
- Reads of the encrypted state object check the current Blob metadata and use an uncached, versioned public URL. This is necessary because `get(..., {access:'public', useCache:false})` does **not** bypass Vercel Blob's public CDN cache.
- Writes retain `ifMatch` optimistic concurrency. A concurrent update returns HTTP 409 instead of an unhandled HTTP 500; guest changes retry using a fresh state.
- Admin image source limit: 8 MiB before compression, upload payload limited to 3.5 MB; server-side upload of MP4/WebM remains limited to 3.5 MB. Larger videos require a direct HTTPS URL or a separately developed signed-client-upload flow.
- Deployment verification: check `GET /api/content`, sign into `/admin`, create/edit a test trip with 2 images, refresh the public site and confirm the carousel. Preserve an Admin JSON export before manual data migrations.
- Concurrent writes with repeated conflicts, network failures, and unsupported file formats remain visible to users. This is still a small-site Blob-backed application, not a transactional multi-user database.

## V16.2 — Public guest media and music improvements (2026-11-16)
- Visitors can post text wishes, image/video-only wishes, and public media albums without signing in or waiting for manual approval.
- Direct uploads: browser -> Vercel Blob using a scoped client token from `/api/guest-upload`; then `/api/guest` checks Blob metadata before writing media URLs to encrypted state.
- Limits: wishes up to 5 files/1 video; albums 10 files/2 videos; JPEG/PNG/WebP <=8 MiB; MP4/WebM <=30 MiB; total <=75 MiB per post. Multiple selection supported.
- The browser imports a pinned Vercel Blob client ESM bundle from `esm.sh` on upload. Visitors require network access to that host.
- Anonymous media consumes storage/bandwidth; per-instance throttling is not a complete defense. Abandoned uploads can leave orphaned Blob objects. Review storage usage and use WAF/persistent throttling if widely shared.
- Background music already uses `assets/birthday_theme.mp3` and `musicAutoplay:true`. Playback is attempted on entry; when a browser blocks audible autoplay, it retries at the first ordinary user interaction. It cannot guarantee unmuted autoplay on every browser.
- Live smoke tests: text-only wish; JPG image-only wish; MP4 wish; 2-image album; MP4/WebM album; reload and another device; Admin hide/delete; music permissions.

## V16.3 — Upload nhạc nền cố định bằng Admin (2026-11-16)
- Vào `/admin` → **Nội dung & nhạc** → **Chọn bài nhạc** → nghe thử → **Tải nhạc lên và áp dụng** (hoặc `Lưu thay đổi`).
- Nhạc MP3/M4A/OGG/WAV tối đa 20 MiB được tải trực tiếp từ trình duyệt lên Vercel Blob bằng token ngắn hạn tại `/api/admin/music-upload`, chỉ cấp sau khi Admin xác thực.
- Sau khi upload thành công, URL được lưu trong `settings.musicUrl` của trạng thái máy chủ. Website công khai tải cấu hình từ `/api/content`; người dùng trên thiết bị khác sẽ nghe bài mới khi mở/tải lại website. Người dùng từng tự chọn nhạc riêng vẫn giữ cài đặt trên thiết bị của họ.
- Nên dùng **MP3** để có khả năng tương thích trình duyệt tốt. Trình duyệt vẫn có thể chặn tự phát nhạc có âm thanh cho đến khi người xem tương tác.
- File chọn trong **widget nhạc ở trang công khai** chỉ dùng để nghe thử tạm thời, không thay đổi bản nhạc chung và không cấp quyền chỉnh sửa cho khách.
- Kiểm tra sau triển khai: đăng nhập Admin, tải MP3 hợp lệ, xem URL nhạc được lưu; mở trình duyệt ẩn danh trên thiết bị khác, kiểm tra trình phát và khi nhấn bật nhạc; thử file vượt 20 MiB và tệp sai định dạng (phải bị từ chối).
- Tệp nhạc cũ không bị xóa tự động trên Blob khi thay bài; quản lý dung lượng tại Vercel Storage. Tải file lên không đồng nghĩa tự động có bản quyền sử dụng/phân phối nhạc.
