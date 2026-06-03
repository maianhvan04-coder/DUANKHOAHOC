# Everest Education Platform

Dự án gồm 2 ứng dụng chính:

- `backend`: REST API Express + TypeScript + MongoDB.
- `frontend`: Next.js client/admin/student portal.

## Yêu Cầu

- Node.js 20 trở lên.
- npm.
- MongoDB đang chạy local hoặc MongoDB Atlas.
- Tài khoản dịch vụ nếu dùng các tính năng liên quan: Cloudinary, VNPAY, Gemini.

## Cấu Hình Môi Trường

Tạo file env thật từ file mẫu:

```powershell
Copy-Item backend\.env.example backend\.env
Copy-Item frontend\.env.example frontend\.env
```

Cập nhật các giá trị quan trọng trong `backend/.env`:

- `MONGODB_URI`: chuỗi kết nối MongoDB.
- `JWT_ACCESS_SECRET`: chuỗi bí mật dài, không dùng giá trị mẫu.
- `CORS_ORIGIN`: URL frontend, mặc định `http://localhost:3000`.
- `PUBLIC_API_URL`: URL public của backend, cần dùng khi thanh toán VNPAY.
- `CLOUDINARY_*`: bắt buộc nếu upload ảnh qua Cloudinary.
- `VNPAY_*`: bắt buộc nếu dùng thanh toán VNPAY.
- `GEMINI_API_KEY` hoặc `GEMINI_API_KEYS`: bắt buộc nếu dùng AI.

Cập nhật `frontend/.env`:

- `NEXT_PUBLIC_API_URL`: URL backend, mặc định `http://localhost:8080`.
- `NEXT_PUBLIC_API_BASE_URL`: alias cho một số trang cũ, nên để giống `NEXT_PUBLIC_API_URL`.

## Cài Đặt Dependency

```powershell
npm install --prefix backend
npm install --prefix frontend
```

## Chạy Development

Mở 2 terminal riêng.

Terminal 1 - backend:

```powershell
npm run dev --prefix backend
```

Backend mặc định chạy tại:

```text
http://localhost:8080
```

Terminal 2 - frontend:

```powershell
npm run dev --prefix frontend
```

Frontend mặc định chạy tại:

```text
http://localhost:3000
```

Chạy nhanh từ root nếu máy local vẫn có `package.json` ở root:

```powershell
npm install
npm run dev
```

Lệnh root `npm run dev` sẽ chạy cả backend và frontend cùng lúc. Nếu clone repo mới mà không có root `package.json`, hãy chạy 2 lệnh `--prefix` riêng như trên.

## Seed RBAC

Sau khi backend kết nối MongoDB thành công, cần seed RBAC để có role và permission mặc định.

Nếu đã có tài khoản admin có quyền `rbac:manage`, gọi endpoint:

```text
POST /api/rbac/seed
```

Hoặc chạy seed trực tiếp trong backend:

```powershell
cd backend
npx ts-node src/seeds/seed.rbac.base.ts
```

Lưu ý: script seed đọc `MONGO_DB_URL` hoặc `MONGO_URI`, nên file `backend/.env` nên có các biến này nếu chạy script trực tiếp.

## Build

Build backend:

```powershell
npm run build --prefix backend
```

Build frontend:

```powershell
npm run build --prefix frontend
```

## Lint Frontend

```powershell
npm run lint --prefix frontend
```

## Lệnh Cơ Bản Khi Gặp Lỗi

Kiểm tra phiên bản Node và npm:

```powershell
node -v
npm -v
```

Cài lại dependency cho từng phần:

```powershell
npm install --prefix backend
npm install --prefix frontend
```

Nếu chạy từ root bị thiếu `concurrently` hoặc dependency root:

```powershell
npm install
```

Kiểm tra lỗi TypeScript/backend:

```powershell
npm run build --prefix backend
```

Kiểm tra lỗi build/frontend:

```powershell
npm run build --prefix frontend
```

Kiểm tra lint frontend:

```powershell
npm run lint --prefix frontend
```

Xóa cache build Next.js khi frontend hiện lỗi cache lạ:

```powershell
Remove-Item -Recurse -Force frontend\.next
npm run dev --prefix frontend
```

Kiểm tra port 3000 hoặc 8080 đang bị ứng dụng nào chiếm:

```powershell
Get-NetTCPConnection -LocalPort 3000,8080 | Select-Object LocalAddress,LocalPort,OwningProcess
```

Dừng process đang chiếm port, thay `<PID>` bằng `OwningProcess` tìm được:

```powershell
Stop-Process -Id <PID> -Force
```

Kiểm tra backend có đọc đúng env và kết nối MongoDB không:

```powershell
npm run dev --prefix backend
```

Seed lại RBAC khi role/permission bị thiếu:

```powershell
cd backend
npx ts-node src/seeds/seed.rbac.base.ts
```

## Ghi Chú Git

- Không commit `.env` thật.
- Được commit `backend/.env.example` và `frontend/.env.example`.
- Các file log dev `frontend-dev.err.log`, `frontend-dev.out.log` không đưa lên Git.
- Root `package.json` và `package-lock.json` không đưa lên Git.
- Các file root-level local/config trong `backend` và `frontend` cũng không đưa lên Git theo yêu cầu, chỉ giữ lại `.env.example` cho mỗi phần.
- Khi chạy trên máy khác, cần có lại các file package/config local từ bản sao lưu riêng trước khi cài dependency và build.
