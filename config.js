/* Tùy chỉnh nội dung tại đây trước khi chia sẻ. */
window.BIRTHDAY_CONFIG = {
  recipientName: "Thanh Hằng",
  senderName: "Anh",
  heroMessage: "Ở đây có những bức ảnh, chuyến đi, câu chuyện và thật nhiều lời chúc. Một nơi nhỏ xinh để giữ lại những điều đáng yêu nhất.",
  // === THAY NHẠC Ở ĐÂY ===
  // Cách 1: chép file nhạc vào assets/my_song.mp3, rồi đổi thành "assets/my_song.mp3".
  // Cách 2: dán URL HTTPS trỏ TRỰC TIẾP tới .mp3, .mp4, .m4a, .ogg, .wav.
  // Link trang YouTube/Facebook không phải là URL file nhạc trực tiếp.
  // Bản mặc định là giai điệu gốc do ứng dụng tạo, không có bản nhạc bên thứ ba.
  musicUrl: "assets/birthday_theme.mp3",
  musicAutoplay: true,
  remoteApi: true, // V15: backend lưu dữ liệu trực tuyến // Trình duyệt có thể yêu cầu khách chạm "Bật nhạc" lần đầu.
  // Để trống cho bản xem thử. Khi triển khai thật có thể cấu hình Supabase.
  supabaseUrl: "",
  supabaseAnonKey: ""
};
