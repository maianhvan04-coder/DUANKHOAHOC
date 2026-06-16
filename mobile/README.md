# Everest Mobile App

Ứng dụng mobile cho hệ thống Everest Education, xây dựng bằng Expo, React Native và Expo Router.

## Yêu Cầu

- Node.js 20 trở lên.
- npm.
- Backend Everest chạy local tại `http://localhost:8080`.
- Android Studio emulator, iOS Simulator hoặc Expo Go nếu chạy trên thiết bị thật.

## Cài Đặt

```bash
npm install
```

## Chạy Development

Chạy Expo dev server:

```bash
npm start
```

Chạy nhanh theo nền tảng:

```bash
npm run android
npm run ios
npm run web
```

Khi chạy trên Android emulator, app dùng API backend tại `http://10.0.2.2:8080`.
Các nền tảng khác dùng `http://localhost:8080`.

## Cấu Hình API

API base URL hiện được cấu hình trong:

```text
src/constants/api.ts
```

Nếu backend chạy ở host khác, cập nhật `API_BASE_URL` trong file này trước khi mở app.

## Cấu Trúc Chính

- `src/app`: route entry của Expo Router.
- `src/components`: component dùng chung và màn hình theo module.
- `src/services`: lớp gọi API.
- `src/hooks`: hook xử lý auth và dữ liệu.
- `src/utils`: tiện ích lưu token, format và HTTP client.
- `assets`: hình ảnh, icon và splash screen.

## Lệnh Hữu Ích

Kiểm tra lint:

```bash
npm run lint
```

Reset project Expo template nếu cần:

```bash
npm run reset-project
```

## Ghi Chú Git

- Không commit `.env` thật.
- Không commit thư mục `.expo`, `node_modules`, `android` hoặc `ios` được generate local.
- Giữ `package.json` và `package-lock.json` trong repo mobile để cài dependency ổn định.
