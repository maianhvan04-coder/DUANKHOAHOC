# UML

Bộ sơ đồ gồm use case tổng quát rút gọn theo actor chính và 31 đặc tả chức năng chi tiết của hệ thống.

## Mở nhanh

- `xem-bieu-do.html`: xem use case tổng quát và danh sách use case phân rã.
- `tong-the/index.html`: xem sơ đồ hoạt động, trình tự và lớp tổng thể toàn hệ thống.
- `trien-khai/index.html`: xem biểu đồ triển khai frontend, backend, database và dịch vụ ngoài.
- `hoat-dong-quan-ly/index.html`: xem các sơ đồ hoạt động tổng hợp cho nhóm use case Quản lý.
- `usecase-phan-ra/index.html`: xem toàn bộ use case phân rã theo sơ đồ tổng quát.
- `usecase-phan-ra/<ma-use-case>.svg`: sơ đồ phân rã kèm bảng đặc tả cho một use case.
- `chuc-nang/index.html`: xem 31 đặc tả chức năng; mỗi mục có `hoat-dong.svg`, `lop.svg`, `trinh-tu.svg`.
- `dac-ta-uc/`: bảng danh sách tác nhân - UseCase và các file đặc tả use case dạng bảng văn bản.

## Danh sách đặc tả chức năng

UC01.1. Thực hiện thanh toán khóa học
UC02.1. Cập nhật hồ sơ
UC02.2. Đổi mật khẩu
UC07.1. Thêm lớp học
UC07.2. Sửa lớp học
UC07.3. Khóa lớp học
UC08.1. Thêm lịch học
UC08.2. Sửa lịch học
UC08.3. Xóa lịch học
UC09.1. Thêm học viên
UC09.2. Sửa học viên
UC09.3. Khóa học viên
UC10.1. Xem thông báo
UC10.2. Thêm thông báo
UC10.3. Gửi thông báo
UC10.4. Sửa trạng thái gửi
UC10.5. Xóa thông báo
UC11. Đăng nhập
UC12. Đăng kí
UC15.1. Xem chi tiết audit
UC16.1. Thêm khóa học
UC16.2. Cập nhật khóa học
UC16.3. Ẩn khóa học
UC17.1. Thêm giảng viên
UC17.2. Cập nhật giảng viên
UC17.3. Khóa tài khoản
UC18.1. Thêm người dùng
UC18.2. Cập nhật người dùng
UC18.3. Khóa tài khoản
UC19.1. Thêm vai trò
UC19.2. Sửa vai trò

## Sinh lại

Chạy `node UML/generate-20-uml.mjs` để sinh lại toàn bộ ảnh SVG và HTML.

Chạy `node UML/generate-usecase-specs.mjs` để sinh lại bảng danh sách tác nhân và các file đặc tả use case.
