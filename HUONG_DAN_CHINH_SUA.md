# Hướng dẫn quản lý website Thanh Hằng V16

## 1. Các địa chỉ

| Mục đích | Địa chỉ |
|---|---|
| Website dành cho bạn bè | https://thanh-hang-birthday.vercel.app |
| Admin | https://thanh-hang-birthday.vercel.app/admin |
| Vercel project | https://vercel.com/levanminh240899-3669/thanh-hang-birthday |
| Deployment và logs | https://vercel.com/levanminh240899-3669/thanh-hang-birthday/deployments |
| Vercel biến môi trường | https://vercel.com/levanminh240899-3669/thanh-hang-birthday/settings/environment-variables |
| Vercel Storage | https://vercel.com/levanminh240899-3669/thanh-hang-birthday/stores |
| GitHub (tạo repository) | https://github.com/new |

## 2. Nên lưu mã nguồn ở đâu?

- Lưu ZIP ngoại tuyến: lưu một bản sao trên máy cá nhân và ổ đĩa đám mây riêng.
- Lưu lịch sử sửa đổi trên **GitHub Private Repository** mang tên `thanh-hang-birthday` (khuyến nghị).
- **Không** lưu mã nguồn chỉ trên Vercel: Vercel là nơi triển khai, không thay thế kho Git.
- **Không** đưa `.env`, access token, mật khẩu thô hoặc file bí mật vào GitHub.

Giải nén ZIP. Tạo repo PRIVATE ở https://github.com/new, rồi trong thư mục source chạy:

```bash
git init
git add .
git commit -m "Initial secure birthday website V16"
git branch -M main
git remote add origin https://github.com/TAI_KHOAN_GITHUB/thanh-hang-birthday.git
git push -u origin main
```

Sau đó Vercel Dashboard > project `thanh-hang-birthday` > Settings > Git > Connect Git Repository. Chọn repo vừa tạo. Các lần push lên nhánh production sẽ kích hoạt triển khai theo cấu hình Git.

## 3. Sửa nội dung không cần code

Vào `/admin` và đăng nhập với tài khoản đã thiết lập.
- **02 / OUR JOURNEYS**: thêm / sửa / ẩn / hiện / xóa / đổi thứ tự chuyến đi; ảnh đại diện, thời gian, địa điểm và album.
- **Album ảnh/video**: chỉnh nội dung, ẩn/hiện bài; thêm URL ảnh/video hoặc tải ảnh nhỏ lên.
- **Lời chúc & bình luận**: tự công khai ngay khi gửi, Admin vẫn có thể ẩn hoặc xóa nội dung của bạn bè, người thân, đồng nghiệp.
- **Nội dung & nhạc**: thay tên, câu chuyện, lời nhắn, URL MP3 hoặc MP4 trực tiếp.
- **Sao lưu**: xuất dữ liệu JSON thường xuyên. Tệp JSON có thể chứa nội dung đã ẩn, hãy lưu ở nơi riêng tư.

Ảnh/video admin tải lên tối đa 3,5 MB/tệp ở bản này; video dài nên tải bằng công cụ Storage bên ngoài rồi dán URL HTTPS trực tiếp vào album hoặc mở rộng sang direct upload.

## 4. Sửa code

| Tệp | Chức năng |
|---|---|
| `index.html` | Cấu trúc giao diện công khai |
| `styles.css` | Màu sắc, font, bố cục desktop và mobile |
| `app.js` | Album, bài viết, lời chúc, bình luận, like |
| `particle_engine.js` | Bánh kem số 25, hạt 3D, chuyển hình, pháo hoa |
| `particle_show.html` | Màn trình diễn hạt ở trang chủ |
| `effects.js` | Pháo hoa trái tim ngoài trang |
| `music.js`, `config.js` | Phát nhạc, cấu hình mặc định |
| `admin.html`, `admin.css`, `admin.js` | Giao diện và logic Admin |
| `api/admin/*` | API quản trị yêu cầu cookie đăng nhập |
| `api/content.js`, `api/guest.js` | API nội dung công khai / gửi lời chúc |
| `api/_lib/auth.js` | Xác thực và cookie ký HMAC |
| `api/_lib/store.js` | Dữ liệu mã hóa trên Blob |

Sửa file, chạy kiểm thử, `git add . && git commit -m "..." && git push` để Vercel tự triển khai nếu đã nối Git.

## 5. Đổi mật khẩu Admin

Mật khẩu thô **không nằm trong source**. Để thay, trên máy cá nhân chạy:

```bash
# Linux/macOS (ví dụ, không đưa mật khẩu vào file source)
read -sr ADMIN_NEW_PASSWORD; export ADMIN_NEW_PASSWORD; echo
node scripts/hash-password.mjs
unset ADMIN_NEW_PASSWORD
```

Trên Windows PowerShell có thể dùng `$env:ADMIN_NEW_PASSWORD = Read-Host` (lệnh này hiện ký tự khi nhập); sử dụng phiên terminal riêng rồi xóa biến môi trường sau khi lấy hash.

Cập nhật `ADMIN_SALT` và `ADMIN_PASSWORD_HASH` trong Vercel Project > Settings > Environment Variables, sau đó Redeploy. Có thể đổi `SESSION_SECRET` để đăng xuất tất cả phiên cũ.

## 6. Bảo mật và hạn chế

- Admin được bảo vệ bởi cookie HttpOnly/Secure/SameSite=Strict, hash PBKDF2; vẫn cần rate limiting bền vững và/hoặc CAPTCHA trước khi mở rộng quảng bá.
- Blob chứa dữ liệu website được mã hóa AES-256-GCM trước khi lưu; các ảnh/video admin tải lên mặc định là tài nguyên public nếu ai biết URL.
- Lời chúc và bình luận tự đăng công khai, không chờ duyệt; tệp ảnh/video từ khách chưa được bật trên bản public vì chưa có kiểm soát upload chống spam/private staging.
- Vercel Blob không thay thế cơ sở dữ liệu giao dịch cho nhiều người cùng thao tác lớn; khi phát triển thành mạng xã hội nhỏ, chuyển sang PostgreSQL/Supabase và RLS.
- Trên Vercel Hobby, giới hạn miễn phí có thể thay đổi; kiểm tra trang Billing/Usage.
