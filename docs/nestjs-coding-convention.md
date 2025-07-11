# 🧠 NestJS Coding Convention Guide

Một số quy chuẩn giúp bạn viết code NestJS nhất quán, dễ đọc và dễ maintain trong team.

---

## 1. 📂 Quy Ước Đặt Tên File

| Loại File       | Quy Ước             | Ví Dụ                          |
|------------------|----------------------|---------------------------------|
| Controller       | kebab-case.type.ts   | `user.controller.ts`           |
| Service          | kebab-case.type.ts   | `user.service.ts`              |
| Interface/Type   | kebab-case.interface.ts | `user.interface.ts`         |
| Module           | kebab-case.module.ts | `users.module.ts`              |
| DTO              | kebab-case.dto.ts    | `create-user.dto.ts`           |
| Entity           | kebab-case.entity.ts | `user.entity.ts`               |
| Config           | kebab-case.config.ts | `database.config.ts`           |
| Validation       | kebab-case.validation.ts | `env.validation.ts`       |

---

## 2. 🏷️ Quy Ước Đặt Tên Class

| Loại Class      | Quy Ước            | Ví Dụ                   |
|------------------|---------------------|--------------------------|
| Controller       | PascalCase + `Controller` | `UsersController` |
| Service          | PascalCase + `Service`    | `UsersService`     |
| Module           | PascalCase + `Module`     | `UsersModule`      |
| DTO              | PascalCase + `Dto`        | `CreateUserDto`    |
| Entity           | PascalCase                | `User`             |
| Interface        | PascalCase                | `User`, `UserService` |
| Guard            | PascalCase + `Guard`      | `AuthGuard`        |
| Decorator        | camelCase                 | `@isAuthenticated()` |

---

## 3. 🔠 Tên Biến, Hàm và Properties

| Loại              | Quy Ước        | Ví Dụ                         |
|--------------------|----------------|-------------------------------|
| Property/Field     | camelCase      | `firstName`, `createdAt`     |
| Method/Function    | camelCase      | `findAll()`, `createUser()`  |
| Constants          | UPPER_SNAKE_CASE | `MAX_USERS`, `API_KEY`     |
| Enum               | PascalCase     | `UserRole.Admin`             |
| Private/Protected  | camelCase (prefix `_`) | `_userRepository`   |

---

## 4. 🌐 Biến Môi Trường

| Loại               | Quy Ước           | Ví Dụ                          |
|---------------------|--------------------|-------------------------------|
| Biến môi trường     | UPPER_SNAKE_CASE   | `DATABASE_URL`, `API_KEY`     |
| Tên file `.env`     | kebab-case         | `.env.development`            |

---

## 5. 🗂️ Cấu Trúc Thư Mục Chuẩn

```

src/
├── app.module.ts
├── main.ts
├── common/                      # Mã chia sẻ
│   ├── constants/
│   ├── decorators/
│   ├── filters/
│   ├── guards/
│   ├── interfaces/
│   ├── middlewares/
│   └── pipes/
├── config/                     # Cấu hình
│   ├── database.config.ts
│   └── validation.ts
├── modules/                    # Các module tính năng
│   └── users/
│       ├── dto/
│       ├── entities/
│       ├── users.controller.ts
│       ├── users.module.ts
│       └── users.service.ts
└── providers/                  # Các provider riêng

```

---

## 6. ⚠️ Lý Do Có Sự Khác Biệt

- **Database**: thường dùng `snake_case`
- **JS/TS**: dùng `camelCase` cho biến & hàm
- **REST API**: URL nên dùng `kebab-case` → dễ đọc và thân thiện SEO

---

## 7. ✅ Nguyên Tắc Cốt Lõi

- Nhất quán trong toàn bộ codebase
- Tuân theo chuẩn NestJS + TypeScript
- Ưu tiên đọc hiểu dễ, giảm bugs và tăng maintainability

---

## 8. 🧾 Tổng Kết

| Trường Hợp         | Quy Ước             |
|---------------------|----------------------|
| Biến, method, property | `camelCase`       |
| Class, Interface, Enum | `PascalCase`      |
| Tên file, route URL     | `kebab-case`      |
| Biến môi trường, constants | `UPPER_SNAKE_CASE` |

---

> **Ghi nhớ:** Một dự án tốt là một dự án **nhất quán**. Hãy tuân thủ các quy ước ngay từ đầu!
```
