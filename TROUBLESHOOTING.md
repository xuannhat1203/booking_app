# Hướng dẫn khắc phục lỗi kết nối iPhone với Expo

## ⚠️ VẤN ĐỀ PHỔ BIẾN: Đổi WiFi nhưng không quét được QR code

### Nguyên nhân chính:

Khi bạn đổi WiFi (dù vẫn cùng một mạng), có 3 nguyên nhân chính khiến QR code không hoạt động:

1. **IP Address thay đổi**: 
   - Khi đổi WiFi, IP local của máy tính có thể thay đổi (ví dụ: từ `192.168.31.143` → `192.168.1.100`)
   - QR code được tạo trước đó vẫn chứa IP cũ → không hoạt động

2. **Client Isolation (AP Isolation)**:
   - Một số router có tính năng này, ngăn các thiết bị trong cùng WiFi giao tiếp với nhau
   - Dù cùng WiFi, iPhone không thể kết nối đến máy tính

3. **Expo đang chạy với IP cũ**:
   - Nếu dùng `expo start --lan`, URL trong QR code sẽ dùng IP cũ
   - Cần restart Expo để cập nhật IP mới

### ✅ Giải pháp nhanh nhất: Dùng Tunnel Mode

**Tunnel mode hoạt động qua internet, không phụ thuộc IP local hay cùng WiFi:**

```bash
# Dừng server hiện tại (Ctrl + C)
npm run start:tunnel
# hoặc
npx expo start --tunnel
```

**Ưu điểm:**
- ✅ Hoạt động ngay cả khi đổi WiFi
- ✅ Không cần cùng mạng WiFi
- ✅ IP không thay đổi (dùng domain của Expo)
- ✅ Ổn định hơn

**Nhược điểm:**
- ⚠️ Có thể chậm hơn một chút (do đi qua internet)
- ⚠️ Cần internet để hoạt động

### Giải pháp 2: Kiểm tra và cập nhật IP mới

Nếu muốn tiếp tục dùng LAN mode:

1. **Kiểm tra IP mới của máy tính:**
```bash
# Trên Mac/Linux
ifconfig | grep "inet " | grep -v 127.0.0.1

# Hoặc
ipconfig getifaddr en0  # WiFi
ipconfig getifaddr en1  # Ethernet
```

2. **Restart Expo với IP mới:**
```bash
# Dừng server (Ctrl + C)
npm run start:lan
# hoặc
npx expo start --lan --clear
```

3. **Quét QR code mới** hoặc nhập URL thủ công trong Expo Go:
   - Mở Expo Go
   - Chọn "Enter URL manually"
   - Nhập: `exp://[IP_MỚI]:8081` (ví dụ: `exp://192.168.1.100:8081`)

### Giải pháp 3: Tắt Client Isolation trên Router

Nếu router có tính năng Client Isolation:

1. Đăng nhập vào router (thường là `192.168.1.1` hoặc `192.168.0.1`)
2. Tìm mục "Wireless Settings" hoặc "AP Isolation"
3. Tắt "Client Isolation" hoặc "AP Isolation"
4. Lưu và khởi động lại router

### Giải pháp 4: Kiểm tra Firewall

Firewall có thể chặn kết nối:

```bash
# Kiểm tra port 8081 có bị chặn không
lsof -i :8081

# Tắt Firewall tạm thời để test (trên Mac)
# System Preferences > Security & Privacy > Firewall > Turn Off Firewall
```

---

## 🔴 VẤN ĐỀ QUAN TRỌNG: Không đăng nhập được trên iPhone (báo lỗi mạng) nhưng chạy được trên Simulator

### Nguyên nhân:

**Vấn đề này xảy ra vì Backend API đang dùng IP local mà iPhone không thể truy cập được:**

1. **Simulator/Emulator hoạt động:**
   - Chạy trên máy tính, có thể truy cập `localhost` hoặc IP local `192.168.31.143:8080`
   - Backend API hoạt động bình thường

2. **iPhone thật không hoạt động:**
   - Khi quét QR code (dùng tunnel mode hoặc LAN mode), iPhone kết nối qua internet hoặc mạng WiFi
   - **Không thể truy cập IP local** `192.168.31.143:8080` của máy tính
   - → Lỗi: "Không thể kết nối đến máy chủ" hoặc "Kiểm tra lại mạng"

### ✅ Giải pháp: Expose Backend API qua Ngrok hoặc Localtunnel

#### Cách 1: Sử dụng Ngrok (Khuyên dùng)

**Bước 1: Cài đặt Ngrok**

```bash
# Cách 1: Download từ website
# Truy cập: https://ngrok.com/download
# Download cho macOS, giải nén và di chuyển vào /usr/local/bin/

# Cách 2: Dùng Homebrew
brew install ngrok/ngrok/ngrok
```

**Bước 2: Đăng ký và lấy Auth Token**

1. Đăng ký tài khoản miễn phí: https://dashboard.ngrok.com/signup
2. Lấy Auth Token: https://dashboard.ngrok.com/get-started/your-authtoken
3. Cấu hình:
```bash
ngrok config add-authtoken YOUR_AUTH_TOKEN
```

**Bước 3: Expose Backend API**

Mở terminal mới (giữ Expo đang chạy) và chạy:
```bash
ngrok http 8080
```

Bạn sẽ thấy output:
```
Forwarding  https://abc123.ngrok-free.app -> http://localhost:8080
```

**Bước 4: Cập nhật file `.env`**

Mở file `.env` và cập nhật:
```bash
EXPO_PUBLIC_API_URL=https://abc123.ngrok-free.app/api/v1/
```

**Lưu ý:** Thay `abc123.ngrok-free.app` bằng URL thực tế từ ngrok của bạn.

**Bước 5: Khởi động lại Expo**

```bash
# Dừng Expo (Ctrl + C)
# Khởi động lại
npm run start:tunnel
# hoặc
npx expo start --tunnel
```

**Bước 6: Reload app trên iPhone**

- Shake iPhone → Chọn "Reload"
- Hoặc đóng và mở lại Expo Go

#### Cách 2: Sử dụng Localtunnel (Không cần đăng ký)

**Bước 1: Cài đặt Localtunnel**

```bash
npm install -g localtunnel
```

**Bước 2: Expose Backend**

```bash
lt --port 8080
```

Sẽ hiển thị URL như: `https://random-name.loca.lt`

**Bước 3: Cập nhật `.env`**

```bash
EXPO_PUBLIC_API_URL=https://random-name.loca.lt/api/v1/
```

**Bước 4: Khởi động lại Expo và reload app**

### ⚠️ Lưu ý quan trọng:

1. **Ngrok URL thay đổi:** Mỗi lần khởi động lại ngrok, URL mới sẽ được tạo → Cần cập nhật lại `.env`
2. **Cập nhật `.env`:** Phải cập nhật `.env` mỗi khi URL thay đổi
3. **Khởi động lại app:** Sau khi cập nhật `.env`, cần khởi động lại Expo và reload app trên iPhone
4. **Backend phải đang chạy:** Đảm bảo backend đang chạy trên port 8080 trước khi expose

### Kiểm tra:

Sau khi expose backend, test bằng cách:

```bash
# Test với ngrok
curl https://your-ngrok-url.ngrok-free.app/api/v1/rooms

# Test với localtunnel
curl https://your-localtunnel-url.loca.lt/api/v1/rooms
```

Nếu trả về dữ liệu, backend đã được expose thành công!

### Checklist:

- [ ] Backend đang chạy trên port 8080
- [ ] Đã cài đặt và cấu hình ngrok/localtunnel
- [ ] Đã expose backend (ngrok/localtunnel đang chạy)
- [ ] Đã cập nhật `.env` với URL mới
- [ ] Đã khởi động lại Expo
- [ ] Đã reload app trên iPhone
- [ ] Test API bằng curl thành công

---

## Vấn đề: Không thể quét QR code bằng iPhone

### Giải pháp 1: Đảm bảo cùng mạng WiFi

1. **Kiểm tra iPhone và máy tính cùng WiFi:**
   - iPhone: Settings > WiFi > Xem tên mạng
   - Mac: System Preferences > Network > Xem tên mạng
   - **Phải cùng một mạng WiFi**

2. **Nếu khác mạng:**
   - Kết nối cả 2 vào cùng một WiFi
   - Hoặc dùng **Tunnel mode** (xem giải pháp 2)

### Giải pháp 2: Sử dụng Tunnel Mode (Khuyên dùng)

Tunnel mode hoạt động ngay cả khi iPhone và máy tính khác mạng:

```bash
# Dừng server hiện tại (Ctrl + C)
# Chạy lại với tunnel mode
npx expo start --tunnel
```

Hoặc cập nhật script trong `package.json`:
```json
"start": "expo start --tunnel"
```

**Lưu ý:** Tunnel mode có thể chậm hơn một chút nhưng ổn định hơn.

### Giải pháp 3: Kiểm tra Firewall

**Trên Mac:**

1. System Preferences > Security & Privacy > Firewall
2. Tắt Firewall tạm thời để test
3. Hoặc thêm exception cho Node.js

**Kiểm tra port 8081:**
```bash
# Kiểm tra xem port có bị chặn không
lsof -i :8081
```

### Giải pháp 4: Cài đặt Expo Go

1. Mở App Store trên iPhone
2. Tìm và cài **"Expo Go"**
3. Mở app Expo Go
4. Quét QR code từ terminal

### Giải pháp 5: Nhập URL thủ công

Nếu quét QR không được, thử nhập URL thủ công:

1. Trong terminal, bạn sẽ thấy URL như:
   ```
   exp://192.168.31.143:8081
   ```
2. Mở Expo Go app
3. Chọn "Enter URL manually"
4. Nhập URL từ terminal

### Giải pháp 6: Sử dụng LAN mode

```bash
npx expo start --lan
```

Sau đó:
1. Mở Expo Go
2. Chọn "Enter URL manually"  
3. Nhập: `exp://192.168.31.143:8081` (thay bằng IP của bạn)

### Giải pháp 7: Kiểm tra IP Address

IP hiện tại của bạn: `192.168.31.143`

Đảm bảo iPhone có thể ping được IP này:
- Trên iPhone, mở Safari
- Nhập: `http://192.168.31.143:8081`
- Nếu không mở được, có thể firewall đang chặn

### Giải pháp 8: Reset Metro Bundler

```bash
# Dừng server (Ctrl + C)
# Xóa cache và chạy lại
npx expo start --clear
```

### Giải pháp 9: Kiểm tra Expo CLI version

```bash
npx expo --version
# Nên là version 54.x hoặc mới hơn
```

Nếu cũ, cập nhật:
```bash
npm install -g expo-cli@latest
```

### Giải pháp 10: Sử dụng Development Build (Nếu có native modules)

Nếu project có native modules (như `@react-native-community/datetimepicker`), bạn cần build development build:

```bash
# iOS
npx expo run:ios

# Hoặc build và cài đặt trên device
eas build --profile development --platform ios
```

## Checklist nhanh

- [ ] iPhone và Mac cùng WiFi
- [ ] Đã cài Expo Go trên iPhone
- [ ] Firewall không chặn port 8081
- [ ] Đã thử tunnel mode: `npx expo start --tunnel`
- [ ] Đã thử clear cache: `npx expo start --clear`
- [ ] Expo Go app đã được mở trước khi quét QR

## Lệnh khuyến nghị

```bash
# Tốt nhất: Dùng tunnel mode
npx expo start --tunnel

# Hoặc LAN mode với clear cache
npx expo start --lan --clear
```

## Liên hệ hỗ trợ

Nếu vẫn không được, cung cấp thông tin:
1. Lỗi cụ thể khi quét QR
2. IP address của Mac (đã có: 192.168.31.143)
3. Version Expo Go trên iPhone
4. Có dùng VPN không?

