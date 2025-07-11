
# 🛠️ Prisma Troubleshooting trong NestJS

Tài liệu hướng dẫn xử lý các lỗi phổ biến liên quan đến Prisma khi sử dụng với NestJS.

---

## ❌ 1. Lỗi: `Cannot find module '@prisma/client'`

### 📌 Nguyên nhân:
- Chưa cài package `@prisma/client`
- Chưa chạy `generate` để tạo thư mục `node_modules/@prisma/client`

### ✅ Cách khắc phục:
```bash
# Bước 1: Cài Prisma Client
pnpm add @prisma/client

# Bước 2: Generate Prisma Client
pnpm exec prisma generate
````

---

## ❌ 2. Lỗi: `$connect()` hoặc `$disconnect()` không tồn tại trên `PrismaService`

### 📌 Nguyên nhân:

* Bạn đã `extends PrismaClient` nhưng chưa implement interface `OnModuleInit` hoặc viết sai cú pháp.

### ✅ Đảm bảo file `prisma.service.ts` có dạng sau:

```ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

> Nếu vẫn lỗi: thử xóa `node_modules`, cài lại, rồi restart VSCode.

---

## ❌ 3. Lỗi: `this.prisma.users` không tồn tại

### 📌 Nguyên nhân:

* Bạn chưa `prisma generate`, nên các model (user, post, ...) chưa có trong Prisma Client.

### ✅ Cách fix:

```bash
# Tạo migration đầu tiên (nếu chưa)
pnpm exec prisma migrate dev --name init

# Generate lại Prisma Client
pnpm exec prisma generate
```

---

## ❌ 4. Lỗi: Không import được `user_role` từ `@prisma/client`

### 📌 Nguyên nhân:

* Bạn đang import một enum/model chưa được generate.

### ✅ Giải pháp:

```bash
# Chạy generate lại
pnpm exec prisma generate

# Sau đó import:
import { user_role } from '@prisma/client';
```

---

## ✅ 5. Tổng hợp cách khắc phục toàn bộ

```bash
# 1. Cài Prisma Client
pnpm add @prisma/client

# 2. Chạy migrate và generate
pnpm exec prisma migrate dev --name init
pnpm exec prisma generate

# 3. Kiểm tra lại file `prisma.service.ts` có extend từ PrismaClient

# 4. Nếu vẫn lỗi: xóa node_modules và cài lại
rm -rf node_modules
pnpm install

# 5. Restart VSCode hoặc TypeScript Server
```

---

## ✅ Ghi chú thêm

* `@prisma/client` luôn cần được **generate** sau khi sửa schema.
* Không cần cài riêng `@types/prisma__client`, vì Prisma tự tạo types.
* Nếu dùng Yarn hoặc npm, thay `pnpm` bằng `yarn` hoặc `npx`.

---
