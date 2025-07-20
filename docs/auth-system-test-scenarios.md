# 🧪 Hướng Dẫn Test Authentication System với Postman – Hoàn Chỉnh

Hướng dẫn này chứa tất cả test cases từ registration → 2FA → logout, kèm Postman scripts tự động lưu variables (accessToken, refreshToken, userId, twoFactorSecret).  
Nếu gặp lỗi 500 Internal Error, 401 Unauthorized, v.v. hãy kiểm tra console server để debug (thường do env thiếu hoặc DB).

---

## 📋 Setup Postman Collection

### 1. Tạo Collection
- Postman ➜ New Collection  
  **Name**: OpenGive Auth API  
  **Description**: Complete auth flow test suite

### 2. Tạo Environment
- Gear icon ➜ Add Environment  
  **Name**: OpenGive Local

| Variable        | Value               | Ghi chú                           |
|----------------|---------------------|-----------------------------------|
| baseUrl         | http://localhost:3000/api |                                   |
| accessToken     | (Auto-fill sau login)     |                                   |
| refreshToken    | (Auto-fill sau login)     |                                   |
| userId          | (Auto-fill sau register)  |                                   |
| twoFactorSecret | (Auto-fill sau setup 2FA) |                                   |

### 3. Collection Pre-request Script (tuỳ chọn)
```js
if (!pm.environment.get('baseUrl')) {
    pm.environment.set('baseUrl', 'http://localhost:3000/api');
}
````

---

## 🔧 Test Scenarios – Theo Thứ Tự

**Lưu ý**:
– Sau mỗi lần test dài, xóa môi trường hoặc đổi email để tránh duplicate.
– Nếu 2FA bật, OTP phải được tạo từ secret hoặc scan QR.

---

### ✅ Test 1 – Registration

**POST** `{{baseUrl}}/auth/register`

**Headers**

```http
Content-Type: application/json
```

**Body**

```json
{
  "email": "test@example.com",
  "password": "testpassword123",
  "confirmPassword": "testpassword123",
  "full_name": "Test User",
  "phone": "0123456789",
  "role": "donor"
}
```

**Expected 201**

```json
{
  "message": "Đăng ký thành công",
  "user": { "id": "...", "email": "test@example.com", ... }
}
```

**Tests Script**

```js
pm.test("201 Created", () => pm.response.to.have.status(201));
const res = pm.response.json();
pm.expect(res.message).to.equal("Đăng ký thành công");
pm.environment.set("userId", res.user.id);
```

---

### ✅ Test 2 – Login (chưa 2FA)

**POST** `{{baseUrl}}/auth/login`

**Body**

```json
{
  "email": "test@example.com",
  "password": "testpassword123"
}
```

**Expected 200**

```json
{
  "message": "Đăng nhập thành công",
  "access_token": "...",
  "refresh_token": "...",
  "user": { "id": "...", "email": "test@example.com", ... }
}
```

**Tests Script**

```js
pm.test("200 OK", () => pm.response.to.have.status(200));
const res = pm.response.json();
pm.expect(res.message).to.equal("Đăng nhập thành công");
pm.environment.set("accessToken", res.access_token);
pm.environment.set("refreshToken", res.refresh_token);
```

---

### ✅ Test 3 – Get Profile

**GET** `{{baseUrl}}/auth/profile`

**Headers**

```
Authorization: Bearer {{accessToken}}
```

**Expected 200**

```json
{
  "sub": "...",
  "email": "test@example.com",
  "full_name": "Test User",
  "role": "donor",
  "is_verified": false
}
```

**Tests**

```js
pm.test("200 OK", () => pm.response.to.have.status(200));
pm.expect(pm.response.json().email).to.equal("test@example.com");
```

---

### ✅ Test 4 – Setup 2FA

**POST** `{{baseUrl}}/auth/2fa/setup`

**Headers**

```
Authorization: Bearer {{accessToken}}
```

**Expected 200**

```json
{
  "secret": "JBSWY3DPEHPK3PXP",
  "qrCodeUrl": "data:image/png;base64,iVBORw0KGgoAAA..."
}
```

**Tests**

```js
pm.test("200 OK", () => pm.response.to.have.status(200));
pm.environment.set("twoFactorSecret", pm.response.json().secret);
```

---

### ✅ Test 5 – Enable 2FA

**POST** `{{baseUrl}}/auth/2fa/enable`

**Headers**

```
Authorization: Bearer {{accessToken}}
```

**Body**

```json
{ "code": "123456" }
```

**Expected 200**

```json
{ "message": "2FA đã được kích hoạt thành công" }
```

---

### ✅ Test 6 – Login with 2FA

**POST** `{{baseUrl}}/auth/login?twoFactorCode=123456`

**Body**: giống Test 2
**Expected 200**: giống Test 2 nhưng có token mới → update variables

---

### ✅ Test 7 – Refresh Token

**POST** `{{baseUrl}}/auth/refresh`

**Headers**

```
Authorization: Bearer {{refreshToken}}
```

**Expected 200**

```json
{
  "access_token": "...",
  "refresh_token": "..."
}
```

**Tests**

```js
pm.environment.set("accessToken", pm.response.json().access_token);
pm.environment.set("refreshToken", pm.response.json().refresh_token);
```

---

### ✅ Test 8 – Login History

**GET** `{{baseUrl}}/auth/login-history?limit=5`

**Headers**

```
Authorization: Bearer {{accessToken}}
```

**Expected 200**

```json
{ "data": [...], "total": 1 }
```

---

### ✅ Test 9 – Disable 2FA

**POST** `{{baseUrl}}/auth/2fa/disable`

**Headers**

```
Authorization: Bearer {{accessToken}}
```

**Body**

```json
{ "code": "123456" }
```

**Expected 200**

```json
{ "message": "2FA đã được tắt thành công" }
```

---

### ✅ Test 10 – Logout Current Device

**POST** `{{baseUrl}}/auth/logout`

**Headers**

```
Authorization: Bearer {{accessToken}}
```

**Body**

```json
{ "refreshToken": "{{refreshToken}}" }
```

**Expected 200**

```json
{ "message": "Đăng xuất thành công khỏi thiết bị hiện tại" }
```

**Tests**

```js
pm.environment.unset("accessToken");
pm.environment.unset("refreshToken");
```

---

### ✅ Test 11 – Logout All Devices

**POST** `{{baseUrl}}/auth/logout-all`

**Headers**

```
Authorization: Bearer {{accessToken}}
```

**Expected 200**

```json
{ "message": "Đăng xuất thành công khỏi tất cả thiết bị" }
```

---

## ❌ Error Testing

| Test | Endpoint                                          | Expected Code | Mô tả                            |
| ---- | ------------------------------------------------- | ------------- | -------------------------------- |
| 12   | POST `/auth/login` với sai password               | 401           | Thông tin đăng nhập không hợp lệ |
| 13   | GET `/auth/profile` với token hết hạn             | 401           | Token đã hết hạn                 |
| 14   | POST `/auth/register` confirm password không khớp | 400           | Mật khẩu xác nhận không khớp     |
| 15   | POST `/auth/register` role sai                    | 400           | Vai trò không hợp lệ             |
| 16   | POST `/auth/register` email duplicate             | 409           | Email đã được sử dụng            |

---

## 🚀 TOTP Tool cho Testing

* **Online**: [totp.danhersam.com](https://totp.danhersam.com)
  → Nhập secret từ Test 4 → lấy code 6 chữ số.
* **App**: Google Authenticator / Microsoft Authenticator
  → Scan QR từ `qrCodeUrl`.

---

## 💡 Pro Tips

* **Run All**: Collection ➜ Run Collection ➜ chọn “OpenGive Auth API” ➜ Run.
* **Clean Up**: Sau mỗi lần test dài → Environment ➜ Reset hoặc đổi email (`test${Date.now()}@example.com`).
* **Debug 500**: Kiểm tra `.env`, `DATABASE_URL`, `JWT_*`, `NODE_ENV`.
* **Security**: Không dùng production data; đổi secret mỗi lần test.

---
