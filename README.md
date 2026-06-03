# Everest Education Platform

Du an gom 2 ung dung chinh:

- `backend`: REST API Express + TypeScript + MongoDB.
- `frontend`: Next.js client/admin/student portal.

## Yeu Cau

- Node.js 20 tro len.
- npm.
- MongoDB dang chay local hoac MongoDB Atlas.
- Tai khoan dich vu neu dung cac tinh nang lien quan: Cloudinary, VNPAY, Gemini.

## Cau Hinh Moi Truong

Tao file env that tu file mau:

```powershell
Copy-Item backend\.env.example backend\.env
Copy-Item frontend\.env.example frontend\.env
```

Cap nhat cac gia tri quan trong trong `backend/.env`:

- `MONGODB_URI`: chuoi ket noi MongoDB.
- `JWT_ACCESS_SECRET`: chuoi bi mat dai, khong dung gia tri mau.
- `CORS_ORIGIN`: URL frontend, mac dinh `http://localhost:3000`.
- `PUBLIC_API_URL`: URL public cua backend, can dung khi thanh toan VNPAY.
- `CLOUDINARY_*`: bat buoc neu upload anh qua Cloudinary.
- `VNPAY_*`: bat buoc neu dung thanh toan VNPAY.
- `GEMINI_API_KEY` hoac `GEMINI_API_KEYS`: bat buoc neu dung AI.

Cap nhat `frontend/.env`:

- `NEXT_PUBLIC_API_URL`: URL backend, mac dinh `http://localhost:8080`.
- `NEXT_PUBLIC_API_BASE_URL`: alias cho mot so trang cu, nen de giong `NEXT_PUBLIC_API_URL`.

## Cai Dat Dependency

```powershell
npm install --prefix backend
npm install --prefix frontend
```

## Chay Development

Mo 2 terminal rieng.

Terminal 1 - backend:

```powershell
npm run dev --prefix backend
```

Backend mac dinh chay tai:

```text
http://localhost:8080
```

Terminal 2 - frontend:

```powershell
npm run dev --prefix frontend
```

Frontend mac dinh chay tai:

```text
http://localhost:3000
```

## Seed RBAC

Sau khi backend ket noi MongoDB thanh cong, can seed RBAC de co role va permission mac dinh.

Neu da co tai khoan admin co quyen `rbac:manage`, goi endpoint:

```text
POST /api/rbac/seed
```

Hoac chay seed truc tiep trong backend:

```powershell
cd backend
npx ts-node src/seeds/seed.rbac.base.ts
```

Luu y: script seed doc `MONGO_DB_URL` hoac `MONGO_URI`, nen file `backend/.env` nen co cac bien nay neu chay script truc tiep.

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

## Ghi Chu Git

- Khong commit `.env` that.
- Duoc commit `backend/.env.example` va `frontend/.env.example`.
- Cac file log dev `frontend-dev.err.log`, `frontend-dev.out.log` khong dua len Git.
- Root `package.json` va `package-lock.json` khong dua len Git.
- Cac file root-level local/config trong `backend` va `frontend` cung khong dua len Git theo yeu cau, chi giu lai `.env.example` cho moi phan.
- Khi chay tren may khac, can co lai cac file package/config local tu ban sao luu rieng truoc khi cai dependency va build.
