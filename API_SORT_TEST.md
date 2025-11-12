# API Test - Sắp xếp phòng (Room Sorting)

**Base URL:** `http://192.168.1.243:8080/api/v1/`

---

## 📋 Danh sách API Test

### 1. ✅ Sắp xếp theo giá từ THẤP đến CAO (Price: Low to High)

**Method:** `GET`  
**Endpoint:** `rooms/filter`  
**Query Parameters:**
- `sortBy=price_asc` - Sắp xếp giá tăng dần
- `minPrice=0` (optional) - Giá tối thiểu
- `maxPrice=10000` (optional) - Giá tối đa

**cURL Command:**
```bash
curl -X GET "http://192.168.1.243:8080/api/v1/rooms/filter?sortBy=price_asc&minPrice=0&maxPrice=10000" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Với giới hạn giá:**
```bash
curl -X GET "http://192.168.1.243:8080/api/v1/rooms/filter?sortBy=price_asc&minPrice=100&maxPrice=500" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Postman:**
```
GET {{base_url}}/rooms/filter?sortBy=price_asc&minPrice=100&maxPrice=500
```

**Expected Result:**
- Phòng đầu tiên có `pricePerNight` thấp nhất
- Phòng cuối cùng có `pricePerNight` cao nhất trong khoảng
- Giá tăng dần từ đầu đến cuối danh sách

---

### 2. ✅ Sắp xếp theo giá từ CAO xuống THẤP (Price: High to Low)

**Method:** `GET`  
**Endpoint:** `rooms/filter`  
**Query Parameters:**
- `sortBy=price_desc` - Sắp xếp giá giảm dần
- `minPrice=0` (optional) - Giá tối thiểu
- `maxPrice=10000` (optional) - Giá tối đa

**cURL Command:**
```bash
curl -X GET "http://192.168.1.243:8080/api/v1/rooms/filter?sortBy=price_desc&minPrice=0&maxPrice=10000" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Với giới hạn giá:**
```bash
curl -X GET "http://192.168.1.243:8080/api/v1/rooms/filter?sortBy=price_desc&minPrice=100&maxPrice=500" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Postman:**
```
GET {{base_url}}/rooms/filter?sortBy=price_desc&minPrice=100&maxPrice=500
```

**Expected Result:**
- Phòng đầu tiên có `pricePerNight` cao nhất
- Phòng cuối cùng có `pricePerNight` thấp nhất trong khoảng
- Giá giảm dần từ đầu đến cuối danh sách

---

### 3. ✅ Sắp xếp theo đánh giá từ CAO xuống THẤP (Rating: High to Low)

**Method:** `GET`  
**Endpoint:** `rooms/filter`  
**Query Parameters:**
- `sortBy=rating_desc` - Sắp xếp đánh giá giảm dần
- `minPrice=0` (optional) - Giá tối thiểu
- `maxPrice=10000` (optional) - Giá tối đa

**cURL Command:**
```bash
curl -X GET "http://192.168.1.243:8080/api/v1/rooms/filter?sortBy=rating_desc&minPrice=0&maxPrice=10000" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Với giới hạn giá:**
```bash
curl -X GET "http://192.168.1.243:8080/api/v1/rooms/filter?sortBy=rating_desc&minPrice=100&maxPrice=500" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Postman:**
```
GET {{base_url}}/rooms/filter?sortBy=rating_desc&minPrice=100&maxPrice=500
```

**Expected Result:**
- Phòng đầu tiên có `rating` cao nhất (ví dụ: 5.0)
- Phòng cuối cùng có `rating` thấp nhất trong khoảng
- Rating giảm dần từ đầu đến cuối danh sách

---

## 🔍 Test Cases

### Test Case 1: Giá từ thấp đến cao
```bash
# Test với khoảng giá 100-500
curl -X GET "http://192.168.1.243:8080/api/v1/rooms/filter?sortBy=price_asc&minPrice=100&maxPrice=500" \
  -H "Content-Type: application/json"
```

**Kiểm tra:**
- [ ] Phòng đầu tiên có `pricePerNight` >= 100
- [ ] Phòng cuối cùng có `pricePerNight` <= 500
- [ ] Mỗi phòng sau có giá >= phòng trước

---

### Test Case 2: Giá từ cao xuống thấp
```bash
# Test với khoảng giá 100-500
curl -X GET "http://192.168.1.243:8080/api/v1/rooms/filter?sortBy=price_desc&minPrice=100&maxPrice=500" \
  -H "Content-Type: application/json"
```

**Kiểm tra:**
- [ ] Phòng đầu tiên có `pricePerNight` <= 500
- [ ] Phòng cuối cùng có `pricePerNight` >= 100
- [ ] Mỗi phòng sau có giá <= phòng trước

---

### Test Case 3: Đánh giá từ cao xuống thấp
```bash
# Test với khoảng giá 100-500
curl -X GET "http://192.168.1.243:8080/api/v1/rooms/filter?sortBy=rating_desc&minPrice=100&maxPrice=500" \
  -H "Content-Type: application/json"
```

**Kiểm tra:**
- [ ] Phòng đầu tiên có `rating` cao nhất
- [ ] Mỗi phòng sau có `rating` <= phòng trước
- [ ] Rating trong khoảng 0-5

---

## 📊 Response Format Example

### Success Response:
```json
{
  "success": true,
  "data": [
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
    },
    {
      "id": 2,
      "roomNumber": "102",
      "type": "SINGLE",
      "pricePerNight": 200.00,
      "available": true,
      "capacity": 1,
      "hotelId": 1,
      "hotelName": "Sunrise Hotel",
      "imageUrl": "https://example.com/image2.jpg",
      "rating": 4.2
    }
  ],
  "message": "Success"
}
```

---

## 🧪 Test Script (JavaScript - cho Postman Tests)

```javascript
// Test cho price_asc (giá tăng dần)
pm.test("Price should be ascending", function () {
    const jsonData = pm.response.json();
    const rooms = jsonData.data || [];
    
    for (let i = 1; i < rooms.length; i++) {
        pm.expect(rooms[i].pricePerNight).to.be.at.least(rooms[i-1].pricePerNight);
    }
});

// Test cho price_desc (giá giảm dần)
pm.test("Price should be descending", function () {
    const jsonData = pm.response.json();
    const rooms = jsonData.data || [];
    
    for (let i = 1; i < rooms.length; i++) {
        pm.expect(rooms[i].pricePerNight).to.be.at.most(rooms[i-1].pricePerNight);
    }
});

// Test cho rating_desc (rating giảm dần)
pm.test("Rating should be descending", function () {
    const jsonData = pm.response.json();
    const rooms = jsonData.data || [];
    
    for (let i = 1; i < rooms.length; i++) {
        pm.expect(rooms[i].rating || 0).to.be.at.most(rooms[i-1].rating || 0);
    }
});

// Test status code
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

// Test response structure
pm.test("Response has data array", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('data');
    pm.expect(jsonData.data).to.be.an('array');
});
```

---

## 🔗 Quick Test Links

### 1. Giá thấp → cao (không giới hạn giá)
```
GET http://192.168.1.243:8080/api/v1/rooms/filter?sortBy=price_asc
```

### 2. Giá cao → thấp (không giới hạn giá)
```
GET http://192.168.1.243:8080/api/v1/rooms/filter?sortBy=price_desc
```

### 3. Đánh giá cao → thấp (không giới hạn giá)
```
GET http://192.168.1.243:8080/api/v1/rooms/filter?sortBy=rating_desc
```

### 4. Kết hợp: Đánh giá + giới hạn giá
```
GET http://192.168.1.243:8080/api/v1/rooms/filter?sortBy=rating_desc&minPrice=100&maxPrice=500
```

---

## ⚠️ Lưu ý

1. **sortBy values:**
   - `price_asc` - Giá tăng dần (thấp → cao)
   - `price_desc` - Giá giảm dần (cao → thấp)
   - `rating_desc` - Đánh giá giảm dần (cao → thấp)

2. **Query Parameters:**
   - `sortBy` - Bắt buộc để sắp xếp
   - `minPrice` - Tùy chọn, mặc định 0
   - `maxPrice` - Tùy chọn, không giới hạn nếu không có
   - `address` - Tùy chọn, lọc theo địa chỉ

3. **Authentication:**
   - Có thể cần `Authorization: Bearer {token}` tùy backend
   - Nếu không cần auth, bỏ qua header Authorization

4. **Response:**
   - Backend trả về đã được sắp xếp
   - Frontend cũng có client-side sorting như fallback
   - Nếu backend không sort, frontend sẽ tự sort

---

## 📝 Test Checklist

- [ ] Test 1: `sortBy=price_asc` - Kiểm tra giá tăng dần
- [ ] Test 2: `sortBy=price_desc` - Kiểm tra giá giảm dần
- [ ] Test 3: `sortBy=rating_desc` - Kiểm tra rating giảm dần
- [ ] Test 4: Kết hợp với `minPrice` và `maxPrice`
- [ ] Test 5: Kết hợp với `address` filter
- [ ] Test 6: Empty result (không có phòng nào)
- [ ] Test 7: Invalid `sortBy` value (kiểm tra error handling)

