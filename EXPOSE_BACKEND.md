# Hướng dẫn Expose Backend API khi dùng Tunnel Mode

## Vấn đề
Khi dùng `expo start --tunnel`, iPhone kết nối qua internet, không thể truy cập backend API ở local IP `192.168.31.143:8080`.

## Giải pháp: Expose Backend qua Ngrok

### Bước 1: Cài đặt Ngrok

**Cách 1: Download từ website (Khuyên dùng)**
1. Truy cập: https://ngrok.com/download
2. Download cho macOS
3. Giải nén và di chuyển vào `/usr/local/bin/`:
   ```bash
   sudo mv ngrok /usr/local/bin/
   sudo chmod +x /usr/local/bin/ngrok
   ```

**Cách 2: Sử dụng Homebrew (nếu đã cài)**
```bash
brew install ngrok/ngrok/ngrok
```

### Bước 2: Đăng ký và lấy Auth Token
1. Đăng ký tài khoản miễn phí tại: https://dashboard.ngrok.com/signup
2. Lấy Auth Token từ: https://dashboard.ngrok.com/get-started/your-authtoken
3. Cấu hình:
   ```bash
   ngrok config add-authtoken YOUR_AUTH_TOKEN
   ```

### Bước 3: Expose Backend API
Mở terminal mới và chạy:
```bash
ngrok http 8080
```

Bạn sẽ thấy output như:
```
Forwarding  https://abc123.ngrok-free.app -> http://localhost:8080
```

### Bước 4: Cập nhật .env
Cập nhật file `.env` với ngrok URL:
```bash
EXPO_PUBLIC_API_URL=https://abc123.ngrok-free.app/api/v1/
```

**Lưu ý:** Mỗi lần khởi động lại ngrok, URL sẽ thay đổi, cần cập nhật lại `.env`.

### Bước 5: Khởi động lại Expo
```bash
expo start --tunnel
```

## Giải pháp thay thế: Sử dụng localtunnel (Không cần đăng ký)

### Cài đặt localtunnel:
```bash
npm install -g localtunnel
```

### Expose backend:
```bash
lt --port 8080
```

Sẽ hiển thị URL như: `https://random-name.loca.lt`

### Cập nhật .env:
```bash
EXPO_PUBLIC_API_URL=https://random-name.loca.lt/api/v1/
```

## Lưu ý quan trọng

1. **Ngrok URL thay đổi:** Mỗi lần khởi động lại ngrok, URL mới sẽ được tạo
2. **Cập nhật .env:** Phải cập nhật `.env` mỗi khi URL thay đổi
3. **Khởi động lại app:** Sau khi cập nhật `.env`, cần khởi động lại Expo
4. **Bảo mật:** Ngrok free có giới hạn, không nên dùng cho production

## Kiểm tra

Sau khi expose backend, test bằng cách:
```bash
curl https://your-ngrok-url.ngrok-free.app/api/v1/rooms
```

Nếu trả về dữ liệu, backend đã được expose thành công!

