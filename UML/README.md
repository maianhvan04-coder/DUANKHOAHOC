# UML

Bộ sơ đồ được sinh lại theo 23 chức năng trong `usecase-tong-quat/usecase-tong-quat.svg`.

## Mở nhanh

- `xem-bieu-do.html`: xem use case tổng quát và danh sách use case phân rã theo từng actor.
- `tong-the/index.html`: xem sơ đồ hoạt động, trình tự và lớp tổng thể toàn hệ thống.
- `trien-khai/index.html`: xem biểu đồ triển khai frontend, backend, database và dịch vụ ngoài.
- `usecase-phan-ra/<Actor>/index.html`: xem toàn bộ sơ đồ phân rã riêng của một actor.
- `usecase-phan-ra/<Actor>/<ma-chuc-nang>.svg`: sơ đồ phạm vi riêng của actor trong một chức năng cụ thể.
- `chuc-nang/index.html`: xem 23 chức năng; mỗi chức năng có `hoat-dong.svg`, `lop.svg`, `trinh-tu.svg`.
- `dac-ta-uc/`: bảng danh sách tác nhân - UseCase và 23 file đặc tả use case dạng bảng văn bản.

## Danh sách 23 chức năng

UC01. Xem nội dung công khai
UC02. Thanh toán khóa học
UC03. Cập nhật thông tin tài khoản
UC04. Xem lịch sử thanh toán
UC05. Đổi mật khẩu
UC06. Xem điểm
UC07. Xem lớp / lịch học
UC08. Xem thông báo
UC09. Quản lý lớp học
UC10. Quản lý lịch học
UC11. Quản lý học viên
UC12. Quản lý thông báo
UC13. Đăng ký, đăng nhập
UC14. Dashboard thống kê
UC15. Quản lý bài viết
UC16. Quản lý danh mục bài viết
UC17. Xem audit bảo mật
UC18. Xem audit thanh toán
UC19. Quản lý danh mục khóa học
UC20. Quản lý khóa học
UC21. Quản lý giảng viên
UC22. Quản lý người dùng
UC23. Phân quyền RBAC

## Sinh lại

Chạy `node UML/generate-20-uml.mjs` để sinh lại toàn bộ ảnh SVG và HTML.

Chạy `node UML/generate-usecase-specs.mjs` để sinh lại bảng danh sách tác nhân và 23 file đặc tả use case.
