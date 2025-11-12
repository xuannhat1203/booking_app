# API Endpoints Documentation

**Base URL:** `http://192.168.1.243:8080/api/v1/`

---

## 🔐 Authentication APIs

### 1. Đăng nhập (Login)
- **Method:** `POST`
- **URL:** `auth/login`
- **Headers:**
  ```
  Content-Type: application/json
  ```
- **Request Body:**
  ```json
  {
    "username": "your_username",
    "password": "your_password"
  }
  ```
- **cURL Example:**
  ```bash
  curl -X POST http://192.168.1.243:8080/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{
      "username": "testuser",
      "password": "password123"
    }'
  ```

### 2. Đăng ký (Register)
- **Method:** `POST`
- **URL:** `auth/register`
- **Headers:**
  ```
  Content-Type: application/json
  ```
- **Request Body:**
  ```json
  {
    "username": "newuser",
    "email": "user@example.com",
    "password": "password123"
  }
  ```
- **cURL Example:**
  ```bash
  curl -X POST http://192.168.1.243:8080/api/v1/auth/register \
    -H "Content-Type: application/json" \
    -d '{
      "username": "newuser",
      "email": "user@example.com",
      "password": "password123"
    }'
  ```

### 3. Quên mật khẩu (Forgot Password - Send OTP)
- **Method:** `POST`
- **URL:** `auth/forget-password`
- **Headers:**
  ```
  Content-Type: application/json
  ```
- **Request Body:**
  ```json
  {
    "email": "user@example.com"
  }
  ```
- **cURL Example:**
  ```bash
  curl -X POST http://192.168.1.243:8080/api/v1/auth/forget-password \
    -H "Content-Type: application/json" \
    -d '{
      "email": "user@example.com"
    }'
  ```

### 4. Xác thực OTP (Verify OTP)
- **Method:** `POST`
- **URL:** `auth/verify-otp`
- **Headers:**
  ```
  Content-Type: application/json
  ```
- **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "otp": "123456"
  }
  ```
- **cURL Example:**
  ```bash
  curl -X POST http://192.168.1.243:8080/api/v1/auth/verify-otp \
    -H "Content-Type: application/json" \
    -d '{
      "email": "user@example.com",
      "otp": "123456"
    }'
  ```

### 5. Đặt lại mật khẩu (Reset Password)
- **Method:** `POST`
- **URL:** `auth/reset-password`
- **Headers:**
  ```
  Content-Type: application/json
  ```
- **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "newPassword": "newpassword123",
    "otp": "123456"
  }
  ```
- **cURL Example:**
  ```bash
  curl -X POST http://192.168.1.243:8080/api/v1/auth/reset-password \
    -H "Content-Type: application/json" \
    -d '{
      "email": "user@example.com",
      "newPassword": "newpassword123",
      "otp": "123456"
    }'
  ```

### 6. Refresh Token
- **Method:** `POST`
- **URL:** `auth/refresh-token`
- **Headers:**
  ```
  Content-Type: application/json
  ```
- **Request Body:**
  ```json
  {
    "refreshToken": "your_refresh_token"
  }
  ```
- **cURL Example:**
  ```bash
  curl -X POST http://192.168.1.243:8080/api/v1/auth/refresh-token \
    -H "Content-Type: application/json" \
    -d '{
      "refreshToken": "your_refresh_token"
    }'
  ```

---

## 🏨 Room APIs

### 7. Lấy tất cả phòng (Get All Rooms)
- **Method:** `GET`
- **URL:** `rooms`
- **Headers:**
  ```
  Content-Type: application/json
  Authorization: Bearer {accessToken}  // (Optional - nếu cần authentication)
  ```
- **cURL Example:**
  ```bash
  curl -X GET http://192.168.1.243:8080/api/v1/rooms \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
  ```

### 8. Lấy 5 phòng tốt nhất (Get Best Rooms)
- **Method:** `GET`
- **URL:** `rooms/best-room`
- **Headers:**
  ```
  Content-Type: application/json
  Authorization: Bearer {accessToken}  // (Optional)
  ```
- **cURL Example:**
  ```bash
  curl -X GET http://192.168.1.243:8080/api/v1/rooms/best-room \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
  ```

### 9. Lọc phòng (Filter Rooms)
- **Method:** `GET`
- **URL:** `rooms/filter`
- **Headers:**
  ```
  Content-Type: application/json
  Authorization: Bearer {accessToken}  // (Optional)
  ```
- **Query Parameters:**
  - `sortBy` (optional): `rating_desc`, `price_asc`, `price_desc`
  - `minPrice` (optional): số (ví dụ: 100)
  - `maxPrice` (optional): số (ví dụ: 2500)
  - `address` (optional): string (ví dụ: "Mumbai")
- **cURL Examples:**
  ```bash
  # Lọc theo giá tăng dần
  curl -X GET "http://192.168.1.243:8080/api/v1/rooms/filter?sortBy=price_asc&minPrice=100&maxPrice=500" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

  # Lọc theo giá giảm dần
  curl -X GET "http://192.168.1.243:8080/api/v1/rooms/filter?sortBy=price_desc&minPrice=100&maxPrice=500" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

  # Lọc theo đánh giá
  curl -X GET "http://192.168.1.243:8080/api/v1/rooms/filter?sortBy=rating_desc&minPrice=100&maxPrice=500" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

  # Lọc theo địa chỉ
  curl -X GET "http://192.168.1.243:8080/api/v1/rooms/filter?address=Mumbai&sortBy=price_asc" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
  ```

---

## 🏨 Hotel APIs

### 10. Lấy 5 khách sạn tốt nhất (Get Best Hotels)
- **Method:** `GET`
- **URL:** `hotels/best`
- **Headers:**
  ```
  Content-Type: application/json
  Authorization: Bearer {accessToken}  // (Optional)
  ```
- **cURL Example:**
  ```bash
  curl -X GET http://192.168.1.243:8080/api/v1/hotels/best \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
  ```

### 11. Lấy thông tin khách sạn theo ID (Get Hotel by ID)
- **Method:** `GET`
- **URL:** `hotels/{hotelId}`
- **Headers:**
  ```
  Content-Type: application/json
  Authorization: Bearer {accessToken}  // (Optional)
  ```
- **cURL Example:**
  ```bash
  curl -X GET http://192.168.1.243:8080/api/v1/hotels/1 \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
  ```

---

## 📝 Response Format

### Success Response:
```json
{
  "success": true,
  "data": {
    // Response data here
  },
  "message": "Success message"
}
```

### Error Response:
```json
{
  "success": false,
  "message": "Error message",
  "errors": {
    "field": "Error detail"
  },
  "statusCode": 400
}
```

---

## 🔑 Authentication Flow

1. **Login** → Nhận `accessToken` và `refreshToken`
2. **Lưu tokens** vào AsyncStorage
3. **Gửi requests** với header `Authorization: Bearer {accessToken}`
4. **Nếu 401** → Dùng `refreshToken` để lấy `accessToken` mới
5. **Nếu refresh fail** → Yêu cầu đăng nhập lại

---

## 🧪 Testing với Postman

### Import Collection:
1. Tạo collection mới trong Postman
2. Set base URL: `http://192.168.1.243:8080/api/v1/`
3. Tạo environment variables:
   - `base_url`: `http://192.168.1.243:8080/api/v1/`
   - `access_token`: (sẽ được set sau khi login)
   - `refresh_token`: (sẽ được set sau khi login)

### Test Flow:
1. **Login** → Lưu `accessToken` vào environment variable
2. **Get Rooms** → Sử dụng `accessToken` trong header
3. **Filter Rooms** → Test các query parameters
4. **Get Hotel** → Test với ID khác nhau

---

## 📊 Expected Data Structure

### Room Response:
```json
{
  "id": 1,
  "roomNumber": "101",
  "type": "DOUBLE",
  "pricePerNight": 150.00,
  "available": true,
  "capacity": 2,
  "hotelId": 1,
  "hotelName": "Sunrise Hotel",
  "imageUrl": "https://example.com/image.jpg",
  "rating": 4.5
}
```

### Hotel Response:
```json
{
  "id": 1,
  "name": "Sunrise Hotel",
  "address": "123 Main St, Mumbai",
  "price": 150.00,
  "rating": 4.5,
  "imageUrl": "https://example.com/image.jpg"
}
```

---

## ⚠️ Lưu ý

1. Tất cả các API authentication (login, register, forgot-password, etc.) **KHÔNG cần** Authorization header
2. Các API rooms và hotels có thể cần Authorization header tùy backend
3. `sortBy` values: `rating_desc`, `price_asc`, `price_desc`
4. OTP có độ dài 6 chữ số
5. Password reset cần cả `email`, `newPassword`, và `otp`

