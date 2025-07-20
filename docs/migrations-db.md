# 📚 **Reset Prisma Migrations**

> ✅ **Mục đích:** Xóa và tạo lại migrations khi cần chỉnh sửa database schema lớn (thay đổi enum, xóa field, đổi type…)

---

## ⚡ **Cách nhanh nhất – Xóa và tạo lại**

### 🚀 **Cách 1. Reset Prisma migrations**

```bash
# ❗ Xóa toàn bộ data và migrations trong DB
pnpm prisma migrate reset

# Tạo migration mới từ schema hiện tại
pnpm prisma migrate dev --name init_with_2fa
```

✅ **Khi nào dùng?**

* Khi đang DEV, dữ liệu không quan trọng
* Muốn clean toàn bộ migrations history

⚠️ **Lưu ý:** Mất hết dữ liệu trong DB.

---

### 🚀 **Cách 2. Xóa migration folder và tạo lại**

```bash
# Xóa folder migrations
rm -rf prisma/migrations

# Tạo migration mới từ đầu dựa trên schema hiện tại
pnpm prisma migrate dev --name init_with_2fa_and_tokens
```

✅ **Khi nào dùng?**

* Khi muốn reset migration history **mà không reset DB**
* Dữ liệu vẫn còn nhưng migration history mới clean

⚠️ **Lưu ý:** Nếu DB và schema không khớp, có thể bị lỗi migrate.

---

### 🚀 **Cách 3. Giữ dữ liệu (Backup – Reset – Restore)**

```bash
# 🔄 Backup dữ liệu quan trọng (vd: refresh_tokens)
pg_dump -h 192.168.1.4 -U postgres -t refresh_tokens open_give > tokens_backup.sql

# ❗ Reset migrations (xóa hết dữ liệu DB)
pnpm prisma migrate reset

# 🔄 Restore dữ liệu đã backup
psql -h 192.168.1.4 -U postgres open_give < tokens_backup.sql
```

✅ **Khi nào dùng?**

* Muốn reset DB + migration nhưng giữ lại **một số bảng quan trọng**
* Thường dùng khi:

  * Có seed data lâu import
  * Có bảng cache token cần giữ

⚠️ **Lưu ý:**

* `prisma migrate reset` **xóa toàn bộ dữ liệu DB** rồi migrate lại từ đầu.
* Backup + restore chỉ giữ dữ liệu đã export thủ công.

---

## 💡 **Tóm tắt quyết định**

| ❓                               | ✔️                  |
| ------------------------------- | ------------------- |
| **Dữ liệu test có quan trọng?** | Không → reset thẳng |
|                                 | Có → backup trước   |
| **Muốn xóa migration history?** | Dùng Cách 1 hoặc 2  |

---

### 🔑 **Ghi nhớ**

* Luôn commit schema trước khi reset để tránh mất lịch sử.
* Không chạy migrate reset trên production database.
* Backup Postgres định kỳ với `pg_dump`.

---
