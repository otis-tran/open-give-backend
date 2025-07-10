
# 📌 Ghi chú lỗi thường gặp TypeScript trong dự án NestJS

## 1. Lỗi: `TS4053` - Không thể sử dụng kiểu trả về `User` từ một module không export rõ ràng

### Mô tả lỗi

```ts
Return type of public method from exported class has or is using name 'User' from external module "...users.service" but cannot be named.
````

### Nguyên nhân

* Interface/type `User` được khai báo bên trong một file (thường là `users.service.ts`) nhưng **không export**, hoặc **không được import đúng cách** trong controller.
* Khi dùng interface đó làm kiểu trả về cho API (public), TypeScript yêu cầu kiểu dữ liệu phải được export rõ ràng.

### Cách khắc phục

**✅ Cách tốt nhất: Tách interface/type `User` ra file riêng**

#### Bước 1. Tạo file định nghĩa kiểu

File: `src/modules/users/entities/user.entity.ts`

```ts
export interface User {
  id: number;
  name: string;
  email: string;
}
```

#### Bước 2. Import vào service

File: `users.service.ts`

```ts
import { User } from './entities/user.entity';

// Sử dụng như bình thường
create(dto: CreateUserDto): User { ... }
```

#### Bước 3. Import vào controller

File: `users.controller.ts`

```ts
import { User } from './entities/user.entity';

@Get()
findAll(): User[] {
  return this.usersService.findAll();
}
```

### ✅ Kết quả

* Hết lỗi `TS4053`
* Code sạch, rõ ràng, dễ bảo trì

---

### 📎 Ghi nhớ

* Luôn **tách** các `interface`, `type`, `class` ra các file riêng trong thư mục `entities/`, `models/`...
* Luôn **export** chúng rõ ràng.
* Ở các **controller/service/...**, luôn **import đúng nguồn gốc** của type.

---

### 🧠 Vì sao cần làm vậy?

* TypeScript chỉ cho phép export kiểu dữ liệu nếu:

  * Nó được `export` công khai.
  * Nó nằm trong module được xác định rõ (import/export chuẩn).
* Điều này giúp tránh lỗi runtime và tăng tính rõ ràng của cấu trúc ứng dụng.

---

✅ **Tóm lại:**

> *"Tách model ra riêng – Import rõ ràng – Không lỗi vặt!"*

