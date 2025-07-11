
# 🚀 Cách Format Code NestJS Trước Khi Commit

Hướng dẫn đầy đủ cách thiết lập hệ thống format code **tự động trước khi commit** cho dự án NestJS.

---

## 1️⃣ Cài đặt các công cụ cần thiết

```bash
# Cài đặt Prettier
npm install --save-dev prettier

# Cài đặt ESLint (nếu chưa có)
npm install --save-dev eslint

# Cài đặt Husky và lint-staged
npm install --save-dev husky lint-staged
````

---

## 2️⃣ Cấu hình Prettier

### `.prettierrc`

```json
{
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "semi": true
}
```

### `.prettierignore`

```
dist
node_modules
```

---

## 3️⃣ Thiết lập Husky & lint-staged

```bash
# Khởi tạo Husky
npx husky install

# Cấu hình scripts trong package.json
```

### `package.json`

```json
{
  "scripts": {
    "format": "prettier --write \"src/**/*.ts\"",
    "lint": "eslint \"{src,apps,libs,test}/**/*.ts\" --fix",
    "prepare": "husky install"
  },
  "lint-staged": {
    "*.ts": [
      "prettier --write",
      "eslint --fix"
    ]
  }
}
```

---

## 4️⃣ Tạo Git hook để format code trước khi commit

```bash
# Tạo pre-commit hook
npx husky add .husky/pre-commit "npx lint-staged"

# Đảm bảo quyền thực thi
chmod +x .husky/pre-commit
```

---

## 5️⃣ Tích hợp với VS Code (tuỳ chọn)

### `.vscode/settings.json`

```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "editor.defaultFormatter": "esbenp.prettier-vscode"
}
```

---

## 6️⃣ Thử nghiệm

```bash
git add .
git commit -m "Your commit message"
```

Quy trình khi commit:

1. Husky chặn commit
2. lint-staged format code bằng prettier + eslint
3. Nếu không lỗi → commit tiếp tục

---

## 7️⃣ Format thủ công (khi cần)

```bash
npm run format     # Format toàn bộ code
npm run lint       # Kiểm tra + sửa ESLint
```

---

## 🧰 Lưu ý quan trọng

* Nếu dùng `pnpm` hoặc `yarn`, thay `npm` bằng lệnh tương ứng
* Khi clone dự án, mỗi dev cần chạy:

  ```bash
  npm install
  npm run prepare
  ```

---

## 🐛 Lỗi thường gặp khi thiết lập Husky

### ❌ `.husky/pre-commit: 2: .: cannot open ./_/husky.sh: No such file`

### ✅ Cách khắc phục

```bash
# Xoá thư mục husky cũ
rm -rf .husky

# Cài lại husky
npm install --save-dev husky
npx husky install

# Tạo lại pre-commit hook
npx husky add .husky/pre-commit "npx lint-staged"

# Đảm bảo file có quyền thực thi
chmod +x .husky/pre-commit
```

### 🔁 Nếu vẫn lỗi:

```bash
# Cài phiên bản ổn định
npm uninstall husky
npm install --save-dev husky@8
npx husky install
```

---

## 🛠️ Kiểm tra hook đang dùng

```bash
cat .husky/pre-commit
```

Kết quả đúng:

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
```

---

## 🛠️ Nếu thư mục `.husky/_` không tồn tại

```bash
npx husky init
```

Hoặc tạo thủ công:

```bash
mkdir -p .husky/_
touch .husky/_/husky.sh

# Nội dung file husky.sh
echo '#!/usr/bin/env sh' > .husky/_/husky.sh
echo 'if [ -z "$husky_skip_init" ]; then' >> .husky/_/husky.sh
echo '  debug () { if [ "$HUSKY_DEBUG" = "1" ]; then echo "husky (debug) - $1"; fi; }' >> .husky/_/husky.sh
echo '  readonly hook_name="$(basename "$0")"' >> .husky/_/husky.sh
echo '  debug "starting $hook_name..."' >> .husky/_/husky.sh
echo 'fi' >> .husky/_/husky.sh

chmod +x .husky/_/husky.sh
```

---

## 🔁 Giải pháp thay thế đơn giản (không dùng husky)

```json
# package.json
"scripts": {
  "format-staged": "prettier --write $(git diff --cached --name-only --diff-filter=ACMR \"*.ts\" | xargs)"
}
```

```bash
# Trước khi commit:
npm run format-staged
```

---

## ✅ Commit gợi ý

```bash
chore: setup code formatting and pre-commit hook
```

---

> Với cấu hình này, bạn sẽ có một hệ thống đảm bảo mọi dòng code trước khi commit đều được format sạch sẽ và đúng chuẩn. Dễ đọc, dễ duy trì, dễ teamwork!

```

---

📁 Bạn có thể lưu file này với tên:

```

docs/format-code-before-commit.md

```

Nếu bạn cần thêm phần cấu hình `.eslintrc.js` hoặc file `tsconfig.json` chuẩn để đồng bộ, mình có thể bổ sung!
```
