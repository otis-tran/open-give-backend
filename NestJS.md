Dưới đây là **note tổng hợp các lệnh CLI** đã sử dụng trong hướng dẫn tạo Shared Notification Module, phục vụ viết **docs về NestJS** sau này:

---

### ✅ **🔧 Lệnh khởi tạo cấu trúc thư mục**

```bash
# Tạo thư mục core chứa các module dùng chung
mkdir -p src/core

# (Hoặc nếu bạn dùng thư mục shared)
# mkdir -p src/shared
```

---

### ✅ **🌟 Tạo Notification Module**

```bash
nest g module core/notification
```

---

### ✅ **🔧 Tạo services bên trong Notification Module**

```bash
# Tạo EmailService
nest g service core/notification/email --no-spec

# Tạo SmsService
nest g service core/notification/sms --no-spec

# Tạo NotificationService
nest g service core/notification/notification --no-spec
```

---

### ✅ **📁 Tạo folder interfaces và file interface**

```bash
# Tạo thư mục interfaces
mkdir -p src/core/notification/interfaces

# Tạo file interface NotificationPayload và NotificationResult
touch src/core/notification/interfaces/notification.interface.ts
```

---

### ✅ **🔧 Tạo Users Module (module sử dụng Shared Module)**

```bash
nest g module modules/users

# Tạo controller
nest g controller modules/users --no-spec

# Tạo service
nest g service modules/users --no-spec
```

---

### 🔥 **📌 Tổng hợp lệnh**

```bash
mkdir -p src/core
nest g module core/notification
nest g service core/notification/email --no-spec
nest g service core/notification/sms --no-spec
nest g service core/notification/notification --no-spec
mkdir -p src/core/notification/interfaces
touch src/core/notification/interfaces/notification.interface.ts
nest g module modules/users
nest g controller modules/users --no-spec
nest g service modules/users --no-spec
```

---

### ✅ **💡 Ghi chú**

* `nest g module <path>`: tạo module mới.
* `nest g service <path> --no-spec`: tạo service, bỏ qua file test `.spec.ts`.
* `nest g controller <path> --no-spec`: tạo controller, bỏ qua file test `.spec.ts`.
* `mkdir -p`: tạo thư mục kèm parent folder nếu chưa có.
* `touch`: tạo file rỗng nhanh chóng.

---
