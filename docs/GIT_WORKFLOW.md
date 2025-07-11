## 📌 Git Workflow Guidelines

Quy trình quản lý và cộng tác trên GitHub để đảm bảo dự án luôn rõ ràng, sạch sẽ và dễ bảo trì.

### 🗂️ Quản lý các nhánh (Branches)

* **`main` / `master`**: Nhánh chính, luôn ở trạng thái deployable (có thể triển khai).
* **`dev`**: Nhánh phát triển chính, nơi tổng hợp các tính năng đã được kiểm thử.
* **`feature/ten-tinh-nang`**: Thêm tính năng mới.
* **`bugfix/ten-loi`**: Sửa lỗi (bug fix).
* **`refactor/ten-thanh-phan`**: Cải tổ lại mã nguồn, không làm thay đổi hành vi.
* **`docs/update-readme`**: Cập nhật tài liệu như README.md.

> 💡 Dùng lệnh `git checkout -b feature/my-feature` để tạo và chuyển sang nhánh mới.

### 🛠️ Commit Convention (Quy ước commit)

Sử dụng cấu trúc commit rõ ràng theo [Conventional Commits](https://www.conventionalcommits.org):

```bash
<type>: <short description>
```

Một số `type` phổ biến:

* `feat`: thêm tính năng
* `fix`: sửa lỗi
* `refactor`: cải tổ code
* `docs`: cập nhật tài liệu
* `chore`: các công việc phụ, không ảnh hưởng logic
* `style`: thay đổi về style (formatting, space, v.v.)
* `test`: thêm hoặc cập nhật test

Ví dụ:

```bash
feat: add dark mode toggle
fix: prevent crash on invalid input
docs: update usage section in README
refactor: simplify user validation logic
```

### 📄 Cập nhật README

Tạo nhánh riêng cho việc cập nhật tài liệu:

```bash
git checkout -b docs/update-readme
```

Thực hiện cập nhật README và commit:

```bash
docs: update installation steps in README
```

### 🚀 Thêm tính năng (Feature)

```bash
git checkout -b feature/new-login-flow
```

Commit code như sau:

```bash
feat: implement new login flow with validation
```

### 🐛 Sửa lỗi (Bug fix)

```bash
git checkout -b bugfix/fix-navbar-overlap
```

```bash
fix: fix navbar overlap issue on mobile
```

### 🧹 Refactor code

```bash
git checkout -b refactor/clean-auth-module
```

```bash
refactor: extract auth logic into separate hook
```
