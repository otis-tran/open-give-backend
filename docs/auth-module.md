### ✅ **🔐 Tạo Security HashService**

```bash
# Tạo service mã hóa hash (dùng trong xác thực)
nest g service core/security/hash --no-spec
```

---

### ✅ **🔑 Tạo Auth Module và các thành phần liên quan**

```bash
# Tạo module auth
nest g module modules/auth

# Tạo controller auth (bỏ file test)
nest g controller modules/auth --no-spec

# Tạo service auth (bỏ file test)
nest g service modules/auth --no-spec
```

---

### ✅ **🧾 Tạo DTO `register.dto.ts` bên trong Auth**

```bash
# Tạo thư mục dto (nếu chưa có)
mkdir -p src/modules/auth/dto

# Tạo file DTO cho đăng ký
touch src/modules/auth/dto/register.dto.ts
```

---

### ✅ **🛠️ Tạo PrismaService để kết nối database**

```bash
# Tạo thư mục prisma (nếu chưa có)
mkdir -p src/core/prisma

# Tạo file PrismaService
touch src/core/prisma/prisma.service.ts
```

---

### 🔥 **📌 Tổng hợp lệnh nhanh**

```bash
nest g service core/security/hash --no-spec
nest g module modules/auth
nest g controller modules/auth --no-spec
nest g service modules/auth --no-spec
mkdir -p src/modules/auth/dto
touch src/modules/auth/dto/register.dto.ts
mkdir -p src/core/prisma
touch src/core/prisma/prisma.service.ts
```

---

### ✅ **💡 Ghi chú mở rộng**

* `core/` thường chứa các module, service hoặc provider dùng chung (global hoặc shared).
* `modules/` chứa các domain/module riêng biệt (users, auth, products, ...).
* Các file DTO, interfaces, hoặc config thường được đặt trong `dto/`, `interfaces/`, `config/` tương ứng.

---
