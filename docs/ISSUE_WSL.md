# Hướng dẫn kết nối PostgreSQL từ WSL tới Windows

## ✅ Mục tiêu
Thiết lập kết nối từ môi trường WSL (Ubuntu) đến PostgreSQL đang chạy trên máy Windows.

---

## Bước 1: Cài đặt `psql` trên WSL

```bash
sudo apt update
sudo apt install postgresql-client
````

---

## Bước 2: Kiểm tra dịch vụ PostgreSQL trên Windows

* Mở `services.msc`
* Tìm dịch vụ PostgreSQL (ví dụ: **PostgreSQL 15**)
* Đảm bảo nó đang chạy
* Ghi nhớ **IP của Windows** (dùng `ipconfig` trên CMD, thường là `192.168.x.x`)

---

## Bước 3: Cho phép PostgreSQL lắng nghe kết nối ngoài

### 3.1 Mở file `postgresql.conf`

**Đường dẫn** (tuỳ phiên bản):

```
C:\Program Files\PostgreSQL\<version>\data\postgresql.conf
```

Tìm dòng:

```conf
# listen_addresses = 'localhost'
```

→ Sửa thành:

```conf
listen_addresses = '*'
```

> (\* hoặc nhập IP cụ thể của máy Windows để bảo mật hơn)

---

### 3.2 Sửa file `pg_hba.conf`

**Đường dẫn**:

```
C:\Program Files\PostgreSQL\<version>\data\pg_hba.conf
```

Thêm dòng sau (nên thêm đầu file để ưu tiên):

```conf
host    all             all             192.168.1.0/24        md5
```

> Bạn có thể thay `192.168.1.0/24` bằng `0.0.0.0/0` nếu đang test nội bộ (kém bảo mật).

---

## Bước 4: Mở cổng 5432 trên Windows

### 4.1 Tạm tắt tường lửa (để test nhanh)

* Mở **Windows Defender Firewall**
* Chọn: **Turn Windows Defender Firewall on or off**
* Tạm **Turn off** cho cả Private và Public

> (Nhớ bật lại sau khi hoàn tất setup)

### 4.2 Kiểm tra cổng bằng `netcat` trong WSL

```bash
nc -zv <Windows-IP> 5432
```

Ví dụ:

```bash
nc -zv 192.168.1.5 5432
```

> Nếu báo `Connection timed out`, Windows đang chặn.

### 4.3 Mở port chính xác bằng Firewall rule (nên làm nếu muốn bật lại firewall)

* Mở `Windows Defender Firewall`
* Chọn: **Advanced Settings** → Inbound Rules → New Rule
* Loại rule: `Port` → TCP → 5432 → Allow the connection → Apply.

---

## Bước 5: Khởi động lại PostgreSQL

* Mở `services.msc`
* Click chuột phải dịch vụ PostgreSQL → **Restart**

---

## Bước 6: Kiểm tra kết nối từ WSL

```bash
psql -h <Windows-IP> -p 5432 -U postgres <database-name>
```

Ví dụ:

```bash
psql -h 192.168.1.5 -p 5432 -U postgres open_give
```

---

## 🔐 Bảo mật (Sau khi kết nối OK)

* **Bật lại tường lửa** Windows
* Chỉ cho phép IP cần thiết truy cập PostgreSQL
* Không nên để `listen_addresses = '*'` và `pg_hba.conf` với `0.0.0.0/0` ở môi trường production

---

## 🎉 Hoàn tất!

Giờ bạn có thể kết nối đến PostgreSQL từ WSL hoặc bất kỳ công cụ nào như `Prisma`, `DBeaver`, `pgAdmin`, v.v...

---

## Gợi ý thêm:

Nếu bạn dùng `Prisma`:

```env
DATABASE_URL="postgresql://postgres:<password>@192.168.1.5:5432/open_give"
```

