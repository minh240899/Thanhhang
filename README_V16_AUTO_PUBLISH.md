# V16 · Tự động công khai lời chúc và bình luận

- Khách gửi lời chúc hoặc bình luận bằng chữ qua `/api/guest`: API lưu `approved: true`, trả `pending:false`. Không cần Admin duyệt.
- Website nạp lại dữ liệu trực tuyến ngay sau khi gửi, vì vậy người gửi thấy nội dung trên trang mà không cần F5. Thiết bị khác cập nhật khi mở/tải lại trang.
- Admin vẫn có nút **Ẩn**, **Hiện** và **Xóa**. Những mục Admin đã chủ động ẩn trước đó vẫn giữ trạng thái ẩn; không tự công khai dữ liệu cũ.
- Album ảnh/video từ khách **chưa bật**; Admin vẫn có thể thêm album. Đây là giới hạn hiện có, không phải tính năng kiểm duyệt.
- V16 vẫn giữ honeypot, kiểm tra Origin, giới hạn tốc độ mức best-effort và giới hạn chiều dài chữ. Không có CAPTCHA, kiểm soát spam mạnh, hoặc bộ lọc nội dung tự động. Nội dung không phù hợp có thể hiện công khai ngay.
- Để bật duyệt lại về sau: thay logic duyệt ở API và trạng thái giao diện; không thể chỉ thay một nhãn giao diện.
