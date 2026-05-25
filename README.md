# Ecommerce Backend

Backend cho hệ thống thương mại điện tử, xây dựng bằng [NestJS](https://nestjs.com/) (TypeScript, strict mode) với:

- **TypeORM + PostgreSQL** – Database & ORM
- **JWT + Passport** – Authentication
- **class-validator + class-transformer** – Validation
- **Swagger (OpenAPI)** – API documentation tự động
- **@nestjs/config** – Quản lý biến môi trường

---

## Mục lục

- [Yêu cầu hệ thống](#yêu-cầu-hệ-thống)
- [Cài đặt nhanh](#cài-đặt-nhanh)
- [Cấu hình biến môi trường](#cấu-hình-biến-môi-trường)
- [Khởi động PostgreSQL](#khởi-động-postgresql)
- [Chạy ứng dụng](#chạy-ứng-dụng)
- [Swagger / API Docs](#swagger--api-docs)
- [Kiểm thử](#kiểm-thử)
- [Cấu trúc thư mục](#cấu-trúc-thư-mục)
- [Danh sách endpoint](#danh-sách-endpoint)
- [Phân quyền (RBAC)](#phân-quyền-rbac)
- [Bảng lệnh đầy đủ](#bảng-lệnh-đầy-đủ)
- [Workflow ví dụ](#workflow-ví-dụ)
- [Shell / Zsh (tuỳ chọn)](#shell--zsh-tuỳ-chọn)
- [Troubleshooting](#troubleshooting)

---

## Yêu cầu hệ thống

| Phần mềm | Phiên bản |
|---|---|
| Node.js | 20.x trở lên (đã test v24.16.0) |
| npm | 10.x trở lên |
| PostgreSQL | 13 trở lên |
| Git | bất kỳ |

(Tuỳ chọn) Cài NestJS CLI toàn cục:

```bash
npm install -g @nestjs/cli
```

---

## Cài đặt nhanh

```bash
# 1. Clone & cài dependencies
git clone <your-repo-url> ecommerce_backend
cd ecommerce_backend
npm install

# 2. Tạo file .env
copy .env.example .env       # Windows
# cp .env.example .env       # macOS / Linux

# 3. Tạo database PostgreSQL "ecommerce" (xem mục Khởi động PostgreSQL)

# 4. Khởi động dev server
npm run start:dev
```

Mở http://localhost:3000/api/v1 và http://localhost:3000/docs (Swagger).

---

## Cấu hình biến môi trường

Tất cả biến nằm trong file `.env` (xem mẫu trong `.env.example`):

| Biến | Mặc định | Mô tả |
|---|---|---|
| `NODE_ENV` | `development` | Môi trường: `development` \| `production` \| `test` |
| `PORT` | `3000` | Cổng HTTP server |
| `API_PREFIX` | `api` | Prefix REST API (kết quả: `/api/v1/...`) |
| `CORS_ORIGIN` | `*` | CORS origin (vd `http://localhost:5173`) |
| `DB_HOST` | `localhost` | Host PostgreSQL |
| `DB_PORT` | `5432` | Port PostgreSQL |
| `DB_USERNAME` | `postgres` | User DB |
| `DB_PASSWORD` | `postgres` | Mật khẩu DB |
| `DB_NAME` | `ecommerce` | Tên database |
| `DB_SYNCHRONIZE` | `true` | Tự sync entity → schema (chỉ dùng dev) |
| `DB_LOGGING` | `false` | Bật log SQL |
| `JWT_SECRET` | _(bắt buộc)_ | Secret để ký JWT (đặt chuỗi mạnh trong prod) |
| `JWT_EXPIRES_IN` | `1d` | Thời gian sống token (vd `15m`, `1h`, `7d`) |
| `BCRYPT_SALT_ROUNDS` | `10` | Số vòng bcrypt khi hash mật khẩu |
| `SWAGGER_ENABLED` | `true` | Bật/tắt UI Swagger |
| `SWAGGER_PATH` | `docs` | Đường dẫn Swagger (vd `/docs`) |

> ⚠️ **Sản xuất:** đặt `DB_SYNCHRONIZE=false`, tạo migration thay vì auto-sync, và đổi `JWT_SECRET` thành chuỗi random ≥ 32 ký tự.

---

## Khởi động PostgreSQL

### Cách 1: Docker (nhanh nhất)

```bash
docker run --name pg-ecommerce -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=ecommerce -p 5432:5432 -d postgres:16
```

### Cách 2: Cài native rồi tạo DB

```sql
-- Đăng nhập psql với user postgres
CREATE DATABASE ecommerce;
```

Đảm bảo `DB_HOST/PORT/USERNAME/PASSWORD/NAME` trong `.env` khớp với DB của bạn.

Khi `DB_SYNCHRONIZE=true`, TypeORM sẽ tự tạo các bảng (`users`, `products`, `orders`, `order_items`) khi app khởi động.

---

## Chạy ứng dụng

```bash
npm run start              # build + start một lần
npm run start:dev          # watch + hot reload (khuyến nghị khi dev)
npm run start:debug        # watch + gắn debugger
npm run start:prod         # chạy bản đã build từ dist/
```

Mặc định:
- API base: **http://localhost:3000/api/v1**
- Swagger:  **http://localhost:3000/docs**

---

## Swagger / API Docs

Truy cập `http://localhost:3000/docs` để xem tài liệu API tương tác. Có thể:

- Đăng ký / đăng nhập trực tiếp trên UI
- Nhấn **Authorize** → dán `accessToken` → gọi các endpoint cần xác thực
- Token được ghi nhớ qua các request (đã bật `persistAuthorization`)

---

## Kiểm thử

```bash
npm run test            # unit tests
npm run test:watch      # watch mode
npm run test:cov        # coverage
npm run test:e2e        # end-to-end
```

---

## Cấu trúc thư mục

```
src/
├── main.ts                          # Bootstrap (ValidationPipe, Swagger, CORS)
├── app.module.ts                    # Root module (ConfigModule, DB, Guards)
├── config/
│   └── configuration.ts             # Map biến .env → object typed
├── database/
│   └── database.module.ts           # TypeOrmModule.forRootAsync
├── common/
│   ├── decorators/
│   │   ├── current-user.decorator.ts  # @CurrentUser()
│   │   ├── roles.decorator.ts         # @Roles(UserRole.ADMIN)
│   │   └── public.decorator.ts        # @Public()
│   └── enums/
│       ├── user-role.enum.ts
│       └── order-status.enum.ts
└── modules/
    ├── auth/
    │   ├── auth.module.ts
    │   ├── auth.controller.ts       # /auth/register, /auth/login, /auth/profile
    │   ├── auth.service.ts
    │   ├── dto/ (login, register)
    │   ├── guards/ (JwtAuthGuard, RolesGuard)
    │   ├── interfaces/jwt-payload.interface.ts
    │   └── strategies/jwt.strategy.ts
    ├── users/
    │   ├── users.module.ts
    │   ├── users.controller.ts      # /users CRUD (admin), /users/me
    │   ├── users.service.ts
    │   ├── dto/ (create, update)
    │   └── entities/user.entity.ts
    ├── products/
    │   ├── products.module.ts
    │   ├── products.controller.ts   # /products CRUD (admin), GET public
    │   ├── products.service.ts
    │   ├── dto/ (create, update, query)
    │   └── entities/product.entity.ts
    └── orders/
        ├── orders.module.ts
        ├── orders.controller.ts     # /orders create, my, cancel; admin: list, status
        ├── orders.service.ts
        ├── dto/ (create-order, update-status)
        └── entities/ (order, order-item)
```

---

## Danh sách endpoint

> Mặc định mọi endpoint đều **yêu cầu JWT** (do `JwtAuthGuard` đang được khai báo ở `APP_GUARD`).
> Các route có decorator `@Public()` thì truy cập tự do.

### Auth (`/api/v1/auth`)

| Method | Path | Auth | Mô tả |
|---|---|---|---|
| `POST` | `/register` | public | Đăng ký tài khoản, trả về `{ accessToken, user }` |
| `POST` | `/login` | public | Đăng nhập, trả về `{ accessToken, user }` |
| `GET` | `/profile` | JWT | Thông tin user hiện tại |

### Users (`/api/v1/users`)

| Method | Path | Auth | Mô tả |
|---|---|---|---|
| `GET` | `/me` | JWT | Profile của user đang đăng nhập |
| `POST` | `/` | admin | Tạo user mới |
| `GET` | `/` | admin | Danh sách user |
| `GET` | `/:id` | admin | Chi tiết user |
| `PATCH` | `/:id` | admin | Cập nhật user |
| `DELETE` | `/:id` | admin | Xoá user |

### Products (`/api/v1/products`)

| Method | Path | Auth | Mô tả |
|---|---|---|---|
| `GET` | `/?search=&page=&limit=` | public | Danh sách sản phẩm (phân trang, tìm theo `name`) |
| `GET` | `/:id` | public | Chi tiết sản phẩm |
| `POST` | `/` | admin | Tạo sản phẩm |
| `PATCH` | `/:id` | admin | Cập nhật sản phẩm |
| `DELETE` | `/:id` | admin | Xoá sản phẩm |

### Orders (`/api/v1/orders`)

| Method | Path | Auth | Mô tả |
|---|---|---|---|
| `POST` | `/` | JWT | Tạo đơn hàng (trừ stock + transaction) |
| `GET` | `/my` | JWT | Danh sách đơn của user hiện tại |
| `GET` | `/` | admin | Danh sách tất cả đơn |
| `GET` | `/:id` | owner/admin | Chi tiết một đơn |
| `PATCH` | `/:id/status` | admin | Cập nhật trạng thái đơn (`pending`, `paid`, `shipped`, `delivered`, `cancelled`) |
| `PATCH` | `/:id/cancel` | owner/admin | Huỷ đơn (chỉ khi đang `pending`) |

---

## Phân quyền (RBAC)

Có 2 role được định nghĩa trong `UserRole`:

- `customer` (mặc định khi đăng ký)
- `admin`

Để tạo admin lần đầu, có 2 cách:

1. **Cập nhật trực tiếp DB:**

   ```sql
   UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
   ```

2. **Đăng ký rồi tự promote bằng SQL** (chấp nhận được trong dev).

Sau đó dùng tài khoản admin để gọi `POST /api/v1/users` tạo thêm admin khác nếu cần.

---

## Bảng lệnh đầy đủ

| Lệnh | Mô tả |
|---|---|
| `npm install` | Cài tất cả dependencies |
| `npm run build` | Build TypeScript → `dist/` |
| `npm run start` | Chạy server (không watch) |
| `npm run start:dev` | Chạy server + hot reload |
| `npm run start:debug` | Chạy server + debugger + watch |
| `npm run start:prod` | Chạy `node dist/main` |
| `npm run test` | Unit tests |
| `npm run test:watch` | Unit tests watch mode |
| `npm run test:cov` | Coverage report |
| `npm run test:e2e` | End-to-end tests |
| `npm run lint` | ESLint + auto-fix |
| `npm run format` | Prettier format `src/` và `test/` |

---

## Workflow ví dụ

> Toàn bộ ví dụ dùng `curl`. Bạn có thể thay bằng Postman, Insomnia, hoặc UI Swagger ở `/docs`.

### 1. Đăng ký

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"StrongPass123!","fullName":"Alice"}'
```

Phản hồi:

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { "id": "...", "email": "alice@example.com", "role": "customer", ... }
}
```

### 2. Đăng nhập

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"StrongPass123!"}'
```

### 3. Tạo sản phẩm (cần token admin)

```bash
curl -X POST http://localhost:3000/api/v1/products \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"name":"iPhone 16 Pro","price":1299.99,"stock":50}'
```

### 4. Đặt hàng

```bash
curl -X POST http://localhost:3000/api/v1/orders \
  -H "Authorization: Bearer <USER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"items":[{"productId":"<PRODUCT_UUID>","quantity":2}]}'
```

### 5. Xem đơn của mình

```bash
curl http://localhost:3000/api/v1/orders/my \
  -H "Authorization: Bearer <USER_TOKEN>"
```

---

## Shell / Zsh (tuỳ chọn)

Project có sẵn script tự động cài [Oh My Zsh](https://ohmyz.sh/) **toàn hệ thống Windows** (PowerShell + Git Bash + MSYS2, tất cả share chung `~/.zshrc` ở `%USERPROFILE%`). Mục đích: prompt đẹp, autosuggestion, syntax highlight và alias sẵn cho npm / git / docker / postgres.

> Cài 1 lần dùng cho mọi project, không chỉ riêng repo này. Project NestJS chạy bình thường mà không cần zsh.

### Yêu cầu

| Phần mềm | Ghi chú |
|---|---|
| Windows 10/11 | |
| Git for Windows | đã có Git Bash (`C:\Program Files\Git\bin\bash.exe`) |
| winget | có sẵn trong Windows 11 hoặc cài "App Installer" từ Microsoft Store |
| PowerShell Admin | cần để sửa Machine PATH + copy file vào `C:\Program Files\Git` |

### Cài tự động (1 script)

Mở **PowerShell as Administrator** và chạy:

```powershell
cd C:\ecommerce_projects\ecommerce_backend
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\scripts\install-zsh-windows.ps1
```

Script làm tuần tự:
1. `winget install MSYS2.MSYS2` (skip nếu đã có ở `C:\msys64`).
2. `pacman -S zsh ncurses git curl wget` trong MSYS2.
3. Sửa `C:\msys64\etc\nsswitch.conf` → `db_home: windows cygwin desc` để MSYS2 dùng `HOME = %USERPROFILE%` (Oh My Zsh nằm ở `C:\Users\<user>\.oh-my-zsh`, dùng được cho mọi shell).
4. Copy `zsh.exe`, `msys-2.0.dll`, `wget.exe`, `share/zsh`, `etc/zsh` từ MSYS2 → Git Bash.
5. **Thêm vào system PATH (Machine, idempotent):**
   - `C:\msys64\usr\bin` — để `zsh` chạy được từ PowerShell / cmd.
   - `C:\Program Files\Git\bin` — đảm bảo `git`, `bash` từ Git for Windows luôn có.
6. Refresh PATH trong session hiện tại.
7. Verify `zsh --version` chạy được từ cả PowerShell và Git Bash.
8. Tự gọi `bash scripts/install-oh-my-zsh.sh`, dùng **lệnh `wget` chính thức** từ [ohmyz.sh](https://ohmyz.sh/) để cài Oh My Zsh (unattended), rồi thêm powerlevel10k + 3 plugin + `~/.zshrc` từ template.

   ```bash
   sh -c "$(wget https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh -O -)"
   ```

   Script bash dùng cờ `--unattended` + `RUNZSH=no CHSH=no KEEP_ZSHRC=yes` để cài không cần tương tác và không tự đổi default shell.

Sau khi xong, **mở terminal MỚI** (PowerShell, cmd, Git Bash đều được) và gõ:

```powershell
zsh
```

Lần đầu sẽ hiện wizard powerlevel10k cấu hình prompt → kết quả lưu vào `~/.p10k.zsh`.

> Lưu ý: MSYS2 được đặt ở **cuối** Machine PATH để không shadow các lệnh Windows (`ls`, `find`, `where`...) trong PowerShell. Nếu muốn dùng phiên bản Unix của những lệnh đó trong PowerShell, gõ đường dẫn đầy đủ hoặc dùng trực tiếp trong zsh.

### Tích hợp Cursor / VSCode

Mở **Settings → search "terminal profiles"** (hoặc sửa `settings.json`) và thêm profile dưới đây để Cursor có thể mở terminal là `zsh` thay vì `bash`:

```json
{
  "terminal.integrated.profiles.windows": {
    "Git Bash (zsh)": {
      "path": "C:\\Program Files\\Git\\bin\\bash.exe",
      "args": ["--login", "-i", "-c", "exec zsh"],
      "icon": "terminal-bash"
    }
  },
  "terminal.integrated.defaultProfile.windows": "Git Bash (zsh)"
}
```

Sau đó Ctrl+Shift+` để mở terminal mới — sẽ vào thẳng zsh.

### Cài thủ công (không dùng script)

Nếu muốn tự làm từng bước (PowerShell admin):

```powershell
# 1. Cài MSYS2
winget install --id MSYS2.MSYS2 --silent

# 2. Trong MSYS2 shell (C:\msys64\msys2.exe):
#    pacman -Sy
#    pacman -S --needed zsh ncurses git curl

# 3. Sửa C:\msys64\etc\nsswitch.conf, đổi/thêm dòng:
#    db_home: windows cygwin desc

# 4. Thêm vào system PATH (Machine):
$old = [Environment]::GetEnvironmentVariable("Path", "Machine")
$add = "C:\msys64\usr\bin;C:\Program Files\Git\bin"
[Environment]::SetEnvironmentVariable("Path", "$old;$add", "Machine")

# 5. Mở PowerShell mới, kiểm tra:
zsh --version

# 6. Cài Oh My Zsh:
sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"
```

### Alias có sẵn

File `scripts/zshrc.template` đã định nghĩa các alias hay dùng với project:

| Alias | Lệnh thật |
|---|---|
| `nrd` | `npm run start:dev` |
| `nrb` | `npm run build` |
| `nrt` | `npm test` |
| `nrl` | `npm run lint` |
| `nrf` | `npm run format` |
| `pg-up` | `docker run --name pg-ecommerce ... postgres:16` |
| `pg-start` / `pg-stop` / `pg-logs` | quản lý container Postgres |
| `gs`, `gd`, `gco`, `gcm`, `gp`, `gpu`, `gl` | git shortcuts |

### Troubleshooting (zsh)

**Lỗi `zsh: command not found` sau khi chạy script PowerShell:**
- Mở **terminal mới** (session cũ chưa load PATH mới).
- Kiểm tra trong PowerShell mới: `Get-Command zsh` → phải trỏ tới `C:\msys64\usr\bin\zsh.exe`.
- Kiểm tra PATH: `[Environment]::GetEnvironmentVariable("Path","Machine") -split ';'` — phải có `C:\msys64\usr\bin`.

**Oh My Zsh được cài 2 lần (1 trong `C:\msys64\home\<user>`, 1 trong `C:\Users\<user>`):**
- Xảy ra nếu chạy zsh **trước** khi sửa nsswitch.conf. Xoá bản trong `C:\msys64\home\<user>` và chạy lại script PowerShell (sẽ tự sửa nsswitch).

**Wizard powerlevel10k hiển thị ký tự lạ (□, ?):**
- Cài font [MesloLGS NF](https://github.com/romkatv/powerlevel10k#meslo-nerd-font-patched-for-powerlevel10k) và đặt làm font terminal (Cursor / Windows Terminal / VSCode).

**Lệnh `ls` / `find` / `where` trong PowerShell trả kết quả lạ:**
- MSYS2 trong PATH có các binary cùng tên. Vì script đặt MSYS2 ở **cuối** PATH nên thường không xảy ra. Nếu vẫn bị, gọi đầy đủ: `Get-ChildItem` thay vì `ls`, hoặc xoá `C:\msys64\usr\bin` khỏi PATH và chỉ dùng `zsh` qua đường dẫn trực tiếp.

**Muốn gỡ hoàn toàn:**

```powershell
# PowerShell admin
# 1. Xoá khỏi PATH
$paths = [Environment]::GetEnvironmentVariable("Path","Machine") -split ';' |
    Where-Object { $_ -notmatch 'msys64' }
[Environment]::SetEnvironmentVariable("Path", ($paths -join ';'), "Machine")

# 2. Gỡ MSYS2
winget uninstall MSYS2.MSYS2

# 3. Xoá Oh My Zsh
Remove-Item -Recurse -Force $env:USERPROFILE\.oh-my-zsh, $env:USERPROFILE\.zshrc, $env:USERPROFILE\.p10k.zsh -ErrorAction SilentlyContinue
```

---

## Troubleshooting

**1. `ECONNREFUSED` khi start app**

PostgreSQL chưa chạy hoặc sai port/host. Kiểm tra:

```bash
# Windows
Test-NetConnection -ComputerName localhost -Port 5432
```

**2. Lỗi `password authentication failed for user "postgres"`**

`DB_PASSWORD` trong `.env` không khớp với mật khẩu thật của user `postgres`.

**3. Lỗi `role "postgres" does not exist`**

Tạo user và database:

```sql
CREATE USER postgres WITH SUPERUSER PASSWORD 'postgres';
CREATE DATABASE ecommerce OWNER postgres;
```

**4. Cần đổi sang MySQL?**

Đổi trong `src/database/database.module.ts`:

```ts
type: 'mysql',
```

Và đổi driver:

```bash
npm uninstall pg
npm install mysql2
```

**5. Cần Migration thay vì auto-sync?**

```bash
npm install -D typeorm
```

Đặt `DB_SYNCHRONIZE=false`, thêm `dataSource.ts`, rồi dùng:

```bash
npx typeorm-ts-node-commonjs migration:generate ./src/database/migrations/Init -d src/database/data-source.ts
npx typeorm-ts-node-commonjs migration:run -d src/database/data-source.ts
```

**6. Port 3000 bị chiếm**

```powershell
Get-NetTCPConnection -LocalPort 3000 | Select-Object OwningProcess
Stop-Process -Id <PID> -Force
```

---

## Tài liệu tham khảo

- [NestJS Docs](https://docs.nestjs.com)
- [TypeORM](https://typeorm.io/)
- [Passport JWT](https://docs.nestjs.com/security/authentication)
- [class-validator](https://github.com/typestack/class-validator)
- [Swagger / OpenAPI](https://docs.nestjs.com/openapi/introduction)

---

## License

UNLICENSED — private project.
