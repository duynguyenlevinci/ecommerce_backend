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
