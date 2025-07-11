## 📝 **Prisma ORM**

**Prisma ORM** là ORM thế hệ mới cho **Node.js và TypeScript**, mang lại trải nghiệm phát triển tuyệt vời khi làm việc với cơ sở dữ liệu nhờ:

- Mô hình dữ liệu trực quan  
- Migrations tự động  
- Type-safety (an toàn kiểu dữ liệu)  
- Tự động gợi ý (auto-completion) trong IDE

✅ **Cách bắt đầu nhanh với Prisma ORM**

1. **Cài đặt Prisma CLI và client**

```bash
npm install prisma --save-dev
npm install @prisma/client
npx prisma init
````

2. **Cấu hình `DATABASE_URL` trong file `.env`**

```env
DATABASE_URL="postgresql://username:password@localhost:5432/mydb?schema=public"
```

3. **Định nghĩa schema trong `prisma/schema.prisma`**

Ví dụ:

```prisma
model User {
  id    Int     @id @default(autoincrement())
  email String  @unique
  name  String?
}
```

4. **Chạy migration**

```bash
npx prisma migrate dev --name init
```

5. **Sử dụng Prisma Client trong code**

```ts
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const users = await prisma.user.findMany()
  console.log(users)
}

main()
```

---

## 🗄️ **Prisma Postgres**

**Prisma Postgres** là dịch vụ PostgreSQL được quản lý (managed service) với:

* Database luôn sẵn sàng (always-on)
* Thanh toán theo mức sử dụng (pay-as-you-go)

---

## ⚡ **Prisma Optimize**

**Prisma Optimize** giúp bạn:

* Phân tích các truy vấn (queries)
* Tạo insights
* Đưa ra gợi ý để **tối ưu tốc độ truy vấn**

---

## 🌍 **Prisma Accelerate**

**Prisma Accelerate** cung cấp:

* Global database cache (bộ nhớ đệm toàn cầu)
* Scalable connection pooling (kết nối pool mở rộng)

✅ **Kết quả:** Truy vấn nhanh hơn trên các kiến trúc phân tán.

---

## 🎯 **Tóm tắt**

1. Cài đặt Prisma ORM cho dự án.
2. Định nghĩa schema, chạy migration, và query data.
3. Khám phá các sản phẩm khác của Prisma để tối ưu hiệu năng và mở rộng khi hệ thống phát triển.

🔗 **Tham khảo chi tiết:** [Tài liệu Prisma tiếng Anh](https://www.prisma.io/docs)

---

> ✨ **Tip:** Luôn chạy `npx prisma format` để format schema của bạn cho đẹp và dễ đọc.

```

---

### 🔨🤖🔧 **Step-by-step tóm tắt**

✔️ **Bước 1:** Cài Prisma  
✔️ **Bước 2:** Tạo file schema + config `.env`  
✔️ **Bước 3:** Viết schema models  
✔️ **Bước 4:** Chạy migrate  
✔️ **Bước 5:** Import Prisma Client vào code và truy vấn

