
# Hướng dẫn xuất cây thư mục của project trên Linux

## 1. Cài đặt `tree` (nếu chưa có)

**Ubuntu/WSL:**
```bash
sudo apt update
sudo apt install tree
````

## 2. Xuất cây thư mục

Chạy lệnh sau trong thư mục gốc của project:

```bash
tree -I "node_modules|dist|.git" -L 3
```

### Giải thích:

* `-I`: Bỏ qua các thư mục có pattern tương ứng (ở đây là `node_modules`, `dist`, `.git`)
* `-L 3`: Giới hạn độ sâu hiển thị là 3 cấp. Bạn có thể thay `3` bằng số khác tùy ý.

## 3. Lưu cây thư mục vào file

```bash
tree -I "node_modules|dist|.git" -L 3 > structure.txt
```

File `structure.txt` sẽ chứa toàn bộ cấu trúc thư mục đã xuất.


* Nếu muốn xem mọi file kể cả ẩn (`.`), dùng thêm `-a`:

  ```bash
  tree -a -I ".git" -L 2
  ```
