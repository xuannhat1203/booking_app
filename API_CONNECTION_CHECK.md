# Kiểm tra kết nối API với Backend

## 📋 Tổng quan

Tài liệu này mô tả cách kiểm tra xem ứng dụng đã kết nối được với các API backend hay chưa.

## 🔍 Phân tích code hiện tại

### ✅ Những gì đã được cấu hình đúng:

1. **Axios Instance** (`utils/axiosInstance.ts`):
   - ✅ Base URL: `http://192.168.31.143:8080/api/v1/`
   - ✅ Có interceptor để tự động thêm token vào request
   - ✅ Có interceptor để xử lý refresh token khi 401
   - ✅ Có error handling để hiển thị thông báo thân thiện

2. **API Functions**:
   - ✅ `apis/authApi.ts`: Login, Register, Forgot Password, OTP, Reset Password
   - ✅ `apis/roomApi.ts`: Get Rooms, Filter Rooms, Get Best Rooms, Get Room Details, Reviews
   - ✅ `apis/bookingApi.ts`: Get Bookings by User ID

3. **Error Handling**:
   - ✅ `utils/errorHandler.ts`: Sanitize error messages
   - ✅ Các màn hình đều có try/catch và hiển thị error messages

4. **React Query Integration**:
   - ✅ Sử dụng `@tanstack/react-query` để quản lý API calls
   - ✅ Có loading states và error handling

### ⚠️ Cần kiểm tra:

1. **Base URL**: 
   - Hiện tại: `http://192.168.31.143:8080/api/v1/`
   - Cần đảm bảo IP này đúng với IP của máy chạy backend
   - Có thể cấu hình qua biến môi trường `EXPO_PUBLIC_API_URL`

2. **Response Structure**:
   - Code đang xử lý nhiều format response khác nhau:
     - `response.data.data`
     - `response.data.content`
     - `response.data` (trực tiếp)
   - Cần đảm bảo format response từ backend khớp với code

3. **Authentication**:
   - Token được lưu trong AsyncStorage
   - Cần kiểm tra xem token có được gửi đúng trong headers không

## 🧪 Cách test kết nối API

### Phương pháp 1: Sử dụng màn hình Test API (Khuyến nghị)

1. Mở màn hình test API trong app:
   ```typescript
   // Trong app, navigate đến:
   router.push('/test-api');
   ```

2. Nhập thông tin đăng nhập (nếu cần)
3. Nhấn "Chạy tất cả test" hoặc test từng endpoint riêng
4. Xem kết quả trong console và trên màn hình

### Phương pháp 2: Test thủ công từng API

#### Test 1: Kiểm tra kết nối cơ bản

```typescript
import { testBasicConnection } from '@/test-api-connection';

// Chạy trong component hoặc console
await testBasicConnection();
```

#### Test 2: Test API đăng ký

```typescript
import { testRegisterAPI } from '@/test-api-connection';

await testRegisterAPI();
```

#### Test 3: Test API đăng nhập

```typescript
import { testLoginAPI } from '@/test-api-connection';

const token = await testLoginAPI('username', 'password');
```

#### Test 4: Test API lấy danh sách phòng

```typescript
import { testGetRoomsAPI } from '@/test-api-connection';

await testGetRoomsAPI(token);
```

### Phương pháp 3: Kiểm tra trong code thực tế

1. **Kiểm tra Login**:
   - Mở màn hình Login (`app/login.tsx`)
   - Nhập username/password
   - Xem console log để kiểm tra:
     - Request có được gửi không?
     - Response có về không?
     - Token có được lưu không?

2. **Kiểm tra Home Screen**:
   - Mở màn hình Home (`app/(tabs)/index.tsx`)
   - Xem có load được hotels không?
   - Kiểm tra console log

3. **Kiểm tra Bookings**:
   - Mở màn hình Bookings (`app/(tabs)/bookings.tsx`)
   - Xem có load được bookings không?

## 🔧 Các lỗi thường gặp và cách xử lý

### 1. Lỗi ECONNREFUSED hoặc ENOTFOUND

**Nguyên nhân**: Không thể kết nối đến backend server

**Cách xử lý**:
- Kiểm tra backend server có đang chạy không
- Kiểm tra IP và port trong `utils/axiosInstance.ts`
- Đảm bảo device/emulator có thể truy cập được IP đó
- Nếu dùng emulator Android: dùng `10.0.2.2` thay vì localhost
- Nếu dùng iOS Simulator: có thể dùng `localhost` hoặc IP thực

### 2. Lỗi 401 Unauthorized

**Nguyên nhân**: API yêu cầu authentication nhưng không có token hoặc token hết hạn

**Cách xử lý**:
- Đăng nhập lại để lấy token mới
- Kiểm tra token có được lưu trong AsyncStorage không
- Kiểm tra token có được gửi trong header Authorization không

### 3. Lỗi 404 Not Found

**Nguyên nhân**: Endpoint không tồn tại hoặc đường dẫn sai

**Cách xử lý**:
- Kiểm tra endpoint trong `API_ENDPOINTS.md`
- So sánh với endpoint thực tế của backend
- Kiểm tra base URL có đúng không

### 4. Response structure không khớp

**Nguyên nhân**: Format response từ backend khác với code đang expect

**Cách xử lý**:
- Kiểm tra response thực tế từ backend (dùng Postman hoặc console.log)
- Cập nhật code trong các file API để match với response structure
- Xem các file trong `apis/` để hiểu cách parse response

## 📊 Checklist kiểm tra

- [ ] Backend server đang chạy
- [ ] IP và port trong `axiosInstance.ts` đúng
- [ ] Có thể ping được IP backend từ device/emulator
- [ ] API đăng ký hoạt động (test với user mới)
- [ ] API đăng nhập hoạt động (test với user đã có)
- [ ] Token được lưu vào AsyncStorage sau khi login
- [ ] API lấy danh sách phòng hoạt động
- [ ] API lấy best rooms hoạt động
- [ ] API lấy best hotels hoạt động
- [ ] API filter rooms hoạt động
- [ ] API lấy bookings hoạt động (cần đăng nhập)
- [ ] Error messages hiển thị đúng và thân thiện

## 🛠️ Debug Tips

1. **Bật console logs**:
   - Code đã có `__DEV__` checks để log trong development
   - Xem console để thấy request/response details

2. **Kiểm tra Network tab**:
   - Dùng React Native Debugger hoặc Flipper
   - Xem network requests và responses

3. **Kiểm tra AsyncStorage**:
   ```typescript
   import AsyncStorage from '@react-native-async-storage/async-storage';
   
   // Xem token
   const token = await AsyncStorage.getItem('accessToken');
   console.log('Token:', token);
   
   // Xem userId
   const userId = await AsyncStorage.getItem('userId');
   console.log('UserId:', userId);
   ```

4. **Test với Postman**:
   - Import collection từ `API_ENDPOINTS.md`
   - Test các endpoints trực tiếp
   - So sánh response với code

## 📝 Ghi chú

- Base URL có thể được override bằng biến môi trường `EXPO_PUBLIC_API_URL`
- Tất cả API calls đều có error handling
- Token được tự động refresh khi hết hạn (401)
- Error messages được sanitize để hiển thị thân thiện với user

## 🚀 Next Steps

1. Chạy test API screen để kiểm tra tất cả endpoints
2. Kiểm tra console logs khi sử dụng app
3. So sánh response structure với code
4. Cập nhật code nếu cần để match với backend response


