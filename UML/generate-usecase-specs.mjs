import { mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const root = dirname(fileURLToPath(import.meta.url));
const outputDir = join(root, "dac-ta-uc");

const actorHierarchy = [
  ["Student", "User"],
  ["Teacher", "Student"],
  ["Manager", "Teacher"],
  ["Admin", "Manager"],
];

const useCaseSpecs = [
  {
    number: 1,
    name: "Thanh toán khóa học",
    actors: ["User"],
    extends: ["Thực hiện thanh toán khóa học"],
    purpose: "Người dùng thanh toán khóa học đã chọn và nhận kết quả giao dịch từ hệ thống.",
    precondition: "User đã đăng nhập và khóa học còn khả dụng.",
    postcondition: "Đơn thanh toán được ghi nhận, trạng thái giao dịch được cập nhật.",
  },
  {
    number: 2,
    name: "Cập nhật thông tin tài khoản",
    actors: ["User"],
    extends: ["Cập nhật hồ sơ", "Đổi mật khẩu"],
    purpose: "User cập nhật thông tin cá nhân để hồ sơ tài khoản luôn chính xác.",
    precondition: "User đã đăng nhập và tài khoản đang hoạt động.",
    postcondition: "Thông tin tài khoản mới được lưu và hiển thị lại trên giao diện.",
  },
  {
    number: 3,
    name: "Xem lịch sử thanh toán",
    actors: ["User"],
    extends: [],
    purpose: "User xem lại các giao dịch thanh toán của tài khoản.",
    precondition: "User đã đăng nhập.",
    postcondition: "Danh sách hoặc chi tiết giao dịch thanh toán được hiển thị.",
  },
  {
    number: 4,
    name: "Xem điểm",
    actors: ["Student"],
    extends: [],
    purpose: "Student xem điểm học tập, điểm kiểm tra và kết quả tổng kết.",
    precondition: "Student đã đăng nhập và có hồ sơ học tập.",
    postcondition: "Bảng điểm của student được hiển thị theo dữ liệu hiện có.",
  },
  {
    number: 5,
    name: "Xem lịch học",
    actors: ["Student"],
    extends: [],
    purpose: "Student theo dõi lịch học, phòng học và thông tin lớp đang tham gia.",
    precondition: "Student đã đăng nhập và được gán vào lớp học.",
    postcondition: "Lịch học liên quan đến student được hiển thị.",
  },
  {
    number: 6,
    name: "Xem thông báo",
    actors: ["Student"],
    extends: [],
    purpose: "Student xem các thông báo được gửi đến tài khoản.",
    precondition: "Student đã đăng nhập.",
    postcondition: "Danh sách hoặc chi tiết thông báo được hiển thị cho student.",
  },
  {
    number: 7,
    name: "Quản lý lớp học",
    actors: ["Teacher"],
    extends: ["Thêm lớp học", "Sửa lớp học", "Khóa lớp học"],
    purpose: "Teacher quản lý thông tin lớp học bằng cách thêm mới, chỉnh sửa hoặc khóa lớp học.",
    precondition: "Teacher đã đăng nhập và có quyền quản lý lớp học.",
    postcondition: "Thông tin lớp học được tạo, cập nhật hoặc khóa theo thao tác thực hiện.",
  },
  {
    number: 8,
    name: "Quản lý lịch học",
    actors: ["Teacher"],
    extends: ["Thêm lịch học", "Sửa lịch học", "Xóa lịch học"],
    purpose: "Teacher quản lý lịch học của lớp bằng cách thêm, sửa hoặc xóa lịch học.",
    precondition: "Teacher đã đăng nhập và có quyền quản lý lịch học.",
    postcondition: "Lịch học được thêm, cập nhật hoặc xóa theo thao tác thực hiện.",
  },
  {
    number: 9,
    name: "Quản lý học viên",
    actors: ["Teacher"],
    extends: ["Thêm học viên", "Sửa học viên", "Khóa học viên"],
    purpose: "Teacher quản lý học viên bằng cách thêm mới, chỉnh sửa hoặc khóa học viên.",
    precondition: "Teacher đã đăng nhập và có quyền quản lý học viên.",
    postcondition: "Dữ liệu học viên được cập nhật theo thao tác thực hiện.",
  },
  {
    number: 10,
    name: "Quản lý thông báo",
    actors: ["Teacher"],
    extends: ["Xem thông báo", "Thêm thông báo", "Gửi thông báo", "Sửa trạng thái gửi", "Xóa thông báo"],
    purpose: "Teacher tạo và quản lý thông báo gửi đến người nhận phù hợp.",
    precondition: "Teacher đã đăng nhập và có quyền quản lý thông báo.",
    postcondition: "Thông báo được lưu, cập nhật hoặc gửi đến người nhận.",
  },
  {
    number: 11,
    name: "Đăng nhập",
    actors: ["User", "Student", "Teacher", "Manager", "Admin"],
    extends: ["Đăng kí"],
    purpose: "Người dùng hệ thống đăng nhập để truy cập chức năng theo vai trò.",
    precondition: "Tài khoản đã tồn tại và đang được phép đăng nhập.",
    postcondition: "Phiên đăng nhập được tạo và quyền truy cập được xác định.",
  },
  {
    number: 12,
    name: "Đăng kí",
    actors: ["User"],
    extends: [],
    purpose: "User tạo tài khoản mới để sử dụng các chức năng của hệ thống.",
    precondition: "User chưa có tài khoản hoặc muốn tạo tài khoản mới.",
    postcondition: "Tài khoản mới được tạo và user có thể chuyển sang đăng nhập.",
  },
  {
    number: 13,
    name: "Dashboard",
    actors: ["Manager"],
    extends: [],
    purpose: "Manager xem các chỉ số tổng quan để theo dõi hoạt động hệ thống.",
    precondition: "Manager đã đăng nhập và có quyền xem dashboard.",
    postcondition: "Các thống kê tổng quan được hiển thị trên dashboard.",
  },
  {
    number: 14,
    name: "Quản lý bài viết",
    actors: ["Manager"],
    extends: [],
    purpose: "Manager quản lý nội dung bài viết được hiển thị trong hệ thống.",
    precondition: "Manager đã đăng nhập và có quyền quản lý bài viết.",
    postcondition: "Bài viết được tạo, cập nhật hoặc thay đổi trạng thái hiển thị.",
  },
  {
    number: 15,
    name: "Audit thanh toán",
    actors: ["Manager"],
    extends: ["Xem chi tiết audit"],
    purpose: "Manager theo dõi lịch sử và trạng thái các giao dịch thanh toán.",
    precondition: "Manager đã đăng nhập và có quyền xem audit thanh toán.",
    postcondition: "Dữ liệu audit thanh toán được hiển thị theo bộ lọc.",
  },
  {
    number: 16,
    name: "Quản lý khóa học",
    actors: ["Manager"],
    extends: ["Thêm khóa học", "Cập nhật khóa học", "Ẩn khóa học"],
    purpose: "Manager quản lý thông tin khóa học trong hệ thống.",
    precondition: "Manager đã đăng nhập và có quyền quản lý khóa học.",
    postcondition: "Dữ liệu khóa học được thêm mới, cập nhật hoặc đổi trạng thái.",
  },
  {
    number: 17,
    name: "Quản lý giảng viên",
    actors: ["Manager"],
    extends: ["Thêm giảng viên", "Cập nhật giảng viên", "Khóa tài khoản"],
    purpose: "Manager quản lý hồ sơ và trạng thái tài khoản giảng viên.",
    precondition: "Manager đã đăng nhập và có quyền quản lý giảng viên.",
    postcondition: "Thông tin giảng viên được cập nhật theo thao tác quản lý.",
  },
  {
    number: 18,
    name: "Quản lý người dùng",
    actors: ["Manager"],
    extends: ["Thêm người dùng", "Cập nhật người dùng", "Khóa tài khoản"],
    purpose: "Manager quản lý tài khoản người dùng và trạng thái hoạt động.",
    precondition: "Manager đã đăng nhập và có quyền quản lý người dùng.",
    postcondition: "Tài khoản người dùng được tạo, cập nhật hoặc khóa theo yêu cầu.",
  },
  {
    number: 19,
    name: "Phân quyền RBAC",
    actors: ["Admin"],
    extends: ["Thêm vai trò", "Sửa vai trò"],
    purpose: "Admin cấu hình vai trò và quyền truy cập theo mô hình RBAC.",
    precondition: "Admin đã đăng nhập và có quyền phân quyền RBAC.",
    postcondition: "Quyền và vai trò được cập nhật trong hệ thống.",
  },
];

function slugText(value) {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replaceAll("đ", "d")
    .replaceAll("Đ", "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function useCaseCode(spec) {
  return `UC${String(spec.number).padStart(2, "0")}`;
}

function subUseCaseCode(parent, detailIndex) {
  return `${useCaseCode(parent)}.${detailIndex + 1}`;
}

function itemUseCaseCode(item) {
  return item.isGeneral ? useCaseCode(item.parent) : subUseCaseCode(item.parent, item.detailIndex);
}

function subUseCaseFile(item) {
  if (item.isGeneral) return `${useCaseCode(item.parent)}-${slugText(item.name)}.doc`;
  return `${useCaseCode(item.parent)}-${String(item.detailIndex + 1).padStart(2, "0")}-${slugText(item.name)}.doc`;
}

function subUseCases() {
  let sequence = 1;
  const items = [];

  for (const parent of useCaseSpecs) {
    if (parent.name === "Đăng nhập" || parent.name === "Đăng kí") {
      items.push({
        sequence: sequence++,
        parent,
        detailIndex: null,
        name: parent.name,
        actors: parent.actors,
        isGeneral: true,
      });
      continue;
    }

    const extendsList = parent.extends.filter(
      (name) => !(parent.name === "Đăng nhập" && name === "Đăng kí")
    );

    extendsList.forEach((name, detailIndex) => {
      items.push({
      sequence: sequence++,
      parent,
      detailIndex,
      name,
      actors: parent.actors,
      });
    });
  }

  return items;
}

function wrapText(text, width) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length <= width) {
      current = next;
      continue;
    }
    if (current) lines.push(current);
    current = word;
  }

  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

function cellLines(value, width) {
  return String(value)
    .split("\n")
    .flatMap((line) => wrapText(line, width));
}

function pad(value, width) {
  const text = String(value);
  return text + " ".repeat(Math.max(0, width - text.length));
}

function border(widths) {
  return `+${widths.map((width) => "-".repeat(width + 2)).join("+")}+`;
}

function table(rows, widths, headerRows = 0) {
  const lines = [border(widths)];

  rows.forEach((row, rowIndex) => {
    const prepared = row.map((cell, index) => cellLines(cell, widths[index]));
    const height = Math.max(...prepared.map((linesInCell) => linesInCell.length));

    for (let lineIndex = 0; lineIndex < height; lineIndex += 1) {
      const cells = prepared.map((linesInCell, cellIndex) => ` ${pad(linesInCell[lineIndex] ?? "", widths[cellIndex])} `);
      lines.push(`|${cells.join("|")}|`);
    }

    if (rowIndex === headerRows - 1) lines.push(border(widths));
  });

  if (lines[lines.length - 1] !== border(widths)) lines.push(border(widths));
  return lines.join("\n");
}

function renderList(items) {
  return items.map((item) => `- ${item}`).join("\n");
}

function renderOrdered(items) {
  return items.map((item, index) => `${index + 1}. ${item}`).join("\n");
}

function makeSpec(description, precondition, mainFlow, alternateFlow, exceptions) {
  return { description, precondition, mainFlow, alternateFlow, exceptions };
}

function readExceptions(target) {
  return [
    `Không tìm thấy ${target} hoặc dữ liệu đã bị xóa khỏi hệ thống.`,
    "Phiên đăng nhập hết hạn hoặc tài khoản không có quyền xem dữ liệu.",
    "Hệ thống không tải được dữ liệu, người dùng được thông báo thử lại sau.",
  ];
}

function writeExceptions(target) {
  return [
    `Dữ liệu ${target} không hợp lệ, hệ thống hiển thị lỗi và không lưu thay đổi.`,
    "Tài khoản không đủ quyền thực hiện thao tác.",
    "Hệ thống phát sinh lỗi khi lưu dữ liệu, dữ liệu cũ được giữ nguyên.",
  ];
}

const detailData = {
  "UC01.1": makeSpec(
    "Người dùng thực hiện thanh toán khóa học từ bước chọn khóa học đến khi hệ thống ghi nhận kết quả giao dịch.",
    "Người dùng đã đăng nhập; khóa học đang hoạt động, chưa bị ẩn và còn cho phép mua.",
    [
      "Người dùng mở danh sách hoặc trang chi tiết khóa học.",
      "Người dùng chọn khóa học cần thanh toán.",
      "Hệ thống kiểm tra trạng thái khóa học và quyền mua của người dùng.",
      "Người dùng nhấn thanh toán.",
      "Hệ thống kiểm tra khóa học, giá tiền và trạng thái người dùng.",
      "Hệ thống tạo đơn thanh toán ở trạng thái chờ thanh toán.",
      "Hệ thống chuyển người dùng sang phương thức hoặc cổng thanh toán.",
      "Hệ thống nhận kết quả thanh toán từ người dùng hoặc cổng thanh toán.",
      "Hệ thống xác minh giao dịch và cập nhật trạng thái đơn.",
      "Giao diện hiển thị kết quả thanh toán cho người dùng.",
    ],
    [
      "Nếu người dùng chưa đăng nhập, hệ thống chuyển sang màn hình đăng nhập trước khi thanh toán.",
      "Nếu người dùng đã mua khóa học, hệ thống thông báo khóa học đã thuộc tài khoản.",
      "Nếu giao dịch thất bại hoặc bị hủy, hệ thống cập nhật đơn theo trạng thái tương ứng và hiển thị kết quả không thành công.",
    ],
    [
      "Khóa học không tồn tại, đã bị ẩn hoặc không còn cho phép mua.",
      "Mã đơn không tồn tại hoặc không thuộc người dùng hiện tại.",
      "Thông tin phản hồi thanh toán không hợp lệ hoặc sai chữ ký.",
      "Hệ thống không cập nhật được trạng thái đơn, giao dịch được ghi nhận để kiểm tra lại.",
    ]
  ),
  "UC02.1": makeSpec(
    "Người dùng cập nhật thông tin hồ sơ cá nhân như họ tên, email liên hệ hoặc số điện thoại.",
    "Người dùng đã đăng nhập và tài khoản đang hoạt động.",
    [
      "Người dùng mở trang thông tin tài khoản.",
      "Hệ thống hiển thị thông tin hồ sơ hiện tại.",
      "Người dùng chỉnh sửa các trường thông tin được phép.",
      "Người dùng nhấn lưu thay đổi.",
      "Hệ thống kiểm tra định dạng và dữ liệu bắt buộc.",
      "Hệ thống cập nhật hồ sơ và hiển thị lại thông tin mới.",
    ],
    [
      "Nếu người dùng hủy form, hệ thống giữ nguyên thông tin cũ.",
      "Nếu email hoặc số điện thoại bị trùng, hệ thống yêu cầu nhập giá trị khác.",
    ],
    writeExceptions("hồ sơ người dùng")
  ),
  "UC02.2": makeSpec(
    "Người dùng đổi mật khẩu đăng nhập của tài khoản.",
    "Người dùng đã đăng nhập, tài khoản đang hoạt động và biết mật khẩu hiện tại.",
    [
      "Người dùng mở trang thông tin tài khoản.",
      "Người dùng chọn chức năng đổi mật khẩu.",
      "Hệ thống hiển thị form nhập mật khẩu hiện tại, mật khẩu mới và xác nhận mật khẩu mới.",
      "Người dùng nhập đầy đủ thông tin và gửi form.",
      "Hệ thống kiểm tra mật khẩu hiện tại và chính sách mật khẩu mới.",
      "Hệ thống cập nhật mật khẩu mới cho tài khoản.",
      "Giao diện hiển thị thông báo đổi mật khẩu thành công.",
    ],
    [
      "Nếu người dùng hủy form, hệ thống giữ nguyên mật khẩu hiện tại.",
      "Nếu mật khẩu mới không đạt yêu cầu, hệ thống hiển thị quy tắc mật khẩu để người dùng nhập lại.",
    ],
    [
      "Mật khẩu hiện tại không đúng.",
      "Mật khẩu mới và xác nhận mật khẩu không khớp.",
      "Phiên đăng nhập hết hạn, hệ thống yêu cầu đăng nhập lại.",
    ]
  ),
  "UC07.1": makeSpec(
    "Giảng viên thêm lớp học mới để tổ chức khóa học, lịch học, phòng học và học viên.",
    "Giảng viên đã đăng nhập và có quyền quản lý lớp học.",
    [
      "Giảng viên mở màn hình quản lý lớp học.",
      "Giảng viên chọn chức năng thêm lớp học.",
      "Hệ thống hiển thị form nhập tên lớp, khóa học, giảng viên, lịch học, phòng học và trạng thái.",
      "Giảng viên nhập thông tin lớp học.",
      "Hệ thống kiểm tra dữ liệu bắt buộc và ràng buộc lịch học, phòng học.",
      "Hệ thống tạo lớp học mới và cập nhật danh sách.",
    ],
    [
      "Nếu thiếu khóa học hoặc giảng viên, hệ thống yêu cầu bổ sung thông tin.",
      "Nếu lịch học hoặc phòng học bị trùng, hệ thống yêu cầu chọn lại.",
    ],
    writeExceptions("lớp học")
  ),
  "UC07.2": makeSpec(
    "Giảng viên sửa thông tin lớp học đã có trong phạm vi quản lý.",
    "Giảng viên đã đăng nhập, có quyền quản lý lớp học và lớp học cần sửa đã tồn tại.",
    [
      "Giảng viên chọn lớp học cần sửa.",
      "Hệ thống hiển thị thông tin lớp hiện tại.",
      "Giảng viên chỉnh sửa tên lớp, khóa học, giảng viên, lịch học, phòng học, hình thức học hoặc trạng thái.",
      "Giảng viên nhấn lưu thay đổi.",
      "Hệ thống kiểm tra dữ liệu và quyền cập nhật.",
      "Hệ thống lưu thông tin lớp học mới và làm mới danh sách.",
    ],
    [
      "Nếu giảng viên hủy form, hệ thống giữ nguyên dữ liệu lớp.",
      "Nếu thông tin lịch học không hợp lệ, hệ thống yêu cầu chỉnh sửa.",
    ],
    writeExceptions("lớp học")
  ),
  "UC07.3": makeSpec(
    "Giảng viên khóa lớp học khi lớp tạm dừng hoặc không còn cho phép sử dụng.",
    "Giảng viên đã đăng nhập, có quyền quản lý lớp học và lớp học cần khóa đang tồn tại.",
    [
      "Giảng viên mở danh sách lớp học.",
      "Giảng viên chọn lớp học cần khóa.",
      "Hệ thống hiển thị modal xác nhận khóa lớp học.",
      "Giảng viên xác nhận thao tác.",
      "Hệ thống kiểm tra trạng thái lớp và ràng buộc dữ liệu liên quan.",
      "Hệ thống cập nhật trạng thái lớp học thành bị khóa hoặc tạm tắt.",
      "Giao diện làm mới danh sách lớp học.",
    ],
    [
      "Nếu giảng viên hủy xác nhận, hệ thống không thay đổi trạng thái.",
      "Nếu lớp đã bị khóa, hệ thống giữ nguyên trạng thái hiện tại.",
    ],
    writeExceptions("trạng thái lớp học")
  ),
  "UC08.1": makeSpec(
    "Giảng viên thêm lịch học mới cho một lớp học đã có.",
    "Giảng viên đã đăng nhập, có quyền quản lý lịch học và lớp học cần thêm lịch đã tồn tại.",
    [
      "Giảng viên mở chức năng quản lý lịch học.",
      "Giảng viên chọn chức năng thêm lịch học.",
      "Hệ thống hiển thị form chọn lớp và nhập thông tin lịch học.",
      "Giảng viên chọn lớp, nhập lịch học, hình thức học, phòng học hoặc link học.",
      "Hệ thống kiểm tra dữ liệu bắt buộc và ràng buộc thời gian.",
      "Hệ thống lưu lịch học mới cho lớp và đồng bộ dữ liệu liên quan.",
      "Giao diện làm mới danh sách lịch học.",
    ],
    [
      "Nếu chưa chọn lớp, hệ thống yêu cầu chọn lớp học.",
      "Nếu thiếu lịch học hoặc lịch sai định dạng, hệ thống yêu cầu nhập lại.",
    ],
    writeExceptions("lịch học")
  ),
  "UC08.2": makeSpec(
    "Giảng viên sửa thông tin lịch học đã có của một lớp.",
    "Giảng viên đã đăng nhập, có quyền quản lý lịch học và lịch học cần sửa đã tồn tại.",
    [
      "Giảng viên mở danh sách lịch học.",
      "Giảng viên chọn lịch học cần sửa.",
      "Hệ thống hiển thị thông tin lịch học hiện tại.",
      "Giảng viên chỉnh sửa lịch học, hình thức học, phòng học, link học hoặc thời gian áp dụng.",
      "Giảng viên nhấn lưu thay đổi.",
      "Hệ thống kiểm tra dữ liệu và quyền cập nhật.",
      "Hệ thống lưu thay đổi và đồng bộ lịch học cho lớp.",
      "Giao diện làm mới danh sách lịch học.",
    ],
    [
      "Nếu giảng viên hủy form, hệ thống giữ nguyên lịch học cũ.",
      "Nếu ngày kết thúc nhỏ hơn ngày bắt đầu, hệ thống yêu cầu chỉnh sửa.",
    ],
    writeExceptions("lịch học")
  ),
  "UC08.3": makeSpec(
    "Giảng viên xóa lịch học của một lớp khi lịch không còn áp dụng.",
    "Giảng viên đã đăng nhập, có quyền quản lý lịch học và lịch học cần xóa đã tồn tại.",
    [
      "Giảng viên mở danh sách lịch học.",
      "Giảng viên chọn lịch học cần xóa.",
      "Hệ thống hiển thị modal xác nhận xóa lịch học.",
      "Giảng viên xác nhận thao tác.",
      "Hệ thống xóa thông tin lịch học, phòng học và thời gian áp dụng khỏi lớp.",
      "Hệ thống đồng bộ dữ liệu liên quan và làm mới danh sách lịch học.",
    ],
    [
      "Nếu giảng viên hủy xác nhận, hệ thống không thay đổi lịch học.",
      "Nếu lịch học đã bị xóa trước đó, hệ thống giữ nguyên trạng thái hiện tại.",
    ],
    writeExceptions("lịch học")
  ),
  "UC09.1": makeSpec(
    "Giảng viên thêm học viên mới vào hệ thống hoặc vào lớp học cần quản lý.",
    "Giảng viên đã đăng nhập, có quyền quản lý học viên và lớp học liên quan đang tồn tại.",
    [
      "Giảng viên mở chức năng quản lý học viên.",
      "Giảng viên chọn thêm học viên.",
      "Hệ thống hiển thị form nhập thông tin học viên và thông tin lớp nếu có.",
      "Giảng viên nhập họ tên, email, số điện thoại, lớp học và trạng thái.",
      "Hệ thống kiểm tra dữ liệu bắt buộc và email học viên.",
      "Hệ thống tạo học viên hoặc hồ sơ học tập mới.",
      "Giao diện làm mới danh sách học viên.",
    ],
    [
      "Nếu email đã tồn tại, hệ thống thông báo trùng và không tạo học viên mới.",
      "Nếu chưa chọn lớp, hệ thống chỉ tạo thông tin học viên theo phạm vi được phép.",
    ],
    writeExceptions("học viên")
  ),
  "UC09.2": makeSpec(
    "Giảng viên sửa thông tin học viên đã có trong phạm vi quản lý.",
    "Giảng viên đã đăng nhập, có quyền quản lý học viên và học viên cần sửa đã tồn tại.",
    [
      "Giảng viên mở danh sách học viên trong lớp.",
      "Giảng viên chọn học viên cần sửa.",
      "Hệ thống hiển thị thông tin hiện tại của học viên.",
      "Giảng viên chỉnh sửa thông tin cá nhân, trạng thái học, ghi chú hoặc thông tin lớp liên quan.",
      "Giảng viên nhấn lưu thay đổi.",
      "Hệ thống kiểm tra dữ liệu và quyền cập nhật.",
      "Hệ thống lưu thông tin mới và làm mới danh sách học viên.",
    ],
    [
      "Nếu giảng viên hủy form, hệ thống giữ nguyên thông tin học viên.",
      "Nếu email hoặc thông tin học viên không hợp lệ, hệ thống yêu cầu chỉnh sửa.",
    ],
    writeExceptions("học viên")
  ),
  "UC09.3": makeSpec(
    "Giảng viên khóa hồ sơ học viên trong lớp khi học viên tạm dừng hoặc không còn tham gia.",
    "Giảng viên đã đăng nhập; học viên thuộc lớp và hồ sơ học tập đang hoạt động.",
    [
      "Giảng viên mở danh sách học viên.",
      "Giảng viên chọn học viên cần khóa.",
      "Hệ thống hiển thị modal xác nhận khóa học viên.",
      "Giảng viên xác nhận thao tác.",
      "Hệ thống cập nhật trạng thái học viên hoặc hồ sơ học tập thành bị khóa.",
      "Giao diện làm mới danh sách học viên.",
    ],
    [
      "Nếu giảng viên hủy xác nhận, hệ thống không thay đổi trạng thái.",
      "Nếu học viên đã bị khóa, hệ thống giữ nguyên trạng thái hiện tại.",
    ],
    writeExceptions("trạng thái học viên")
  ),
  "UC10.1": makeSpec(
    "Giảng viên xem danh sách và chi tiết thông báo trong phạm vi quản lý.",
    "Giảng viên đã đăng nhập và có quyền quản lý thông báo.",
    [
      "Giảng viên mở màn hình quản lý thông báo.",
      "Hệ thống tải danh sách thông báo theo phạm vi quyền.",
      "Giảng viên chọn thông báo cần xem.",
      "Hệ thống lấy tiêu đề, loại, nội dung, người nhận, trạng thái gửi và thời gian cập nhật.",
      "Giao diện hiển thị chi tiết thông báo.",
    ],
    [
      "Nếu không có thông báo phù hợp, hệ thống hiển thị danh sách rỗng.",
      "Nếu thông báo đã bị xóa, hệ thống tải lại danh sách mới nhất.",
    ],
    readExceptions("thông báo")
  ),
  "UC10.2": makeSpec(
    "Giảng viên tạo thông báo mới để gửi đến học viên hoặc nhóm người nhận.",
    "Giảng viên đã đăng nhập và có quyền quản lý thông báo.",
    [
      "Giảng viên mở màn hình quản lý thông báo.",
      "Giảng viên chọn thêm thông báo.",
      "Hệ thống hiển thị form nhập tiêu đề, loại thông báo, người nhận và nội dung.",
      "Giảng viên nhập thông tin thông báo.",
      "Hệ thống kiểm tra dữ liệu bắt buộc.",
      "Hệ thống lưu thông báo ở trạng thái chưa gửi.",
    ],
    [
      "Nếu chưa chọn người nhận, hệ thống yêu cầu chọn người nhận trước khi lưu.",
      "Nếu nội dung còn trống, hệ thống không cho lưu thông báo.",
    ],
    writeExceptions("thông báo")
  ),
  "UC10.3": makeSpec(
    "Giảng viên gửi thông báo đã tạo đến người nhận.",
    "Thông báo đã tồn tại, có nội dung hợp lệ và danh sách người nhận đã được chọn.",
    [
      "Giảng viên chọn thông báo chưa gửi.",
      "Giảng viên nhấn gửi thông báo.",
      "Hệ thống kiểm tra trạng thái thông báo và người nhận.",
      "Hệ thống tạo bản ghi thông báo cho từng người nhận.",
      "Hệ thống cập nhật trạng thái thông báo thành đã gửi.",
      "Giao diện hiển thị kết quả gửi thông báo.",
    ],
    [
      "Nếu một số người nhận không hợp lệ, hệ thống gửi cho người nhận hợp lệ và báo số lượng lỗi.",
      "Nếu thông báo đã gửi, hệ thống không gửi lại khi chưa có thao tác xác nhận.",
    ],
    writeExceptions("gửi thông báo")
  ),
  "UC10.4": makeSpec(
    "Giảng viên sửa trạng thái gửi của thông báo để theo dõi đã gửi hoặc chưa gửi.",
    "Giảng viên đã đăng nhập, thông báo tồn tại và thuộc phạm vi quản lý.",
    [
      "Giảng viên mở danh sách thông báo.",
      "Giảng viên chọn thông báo cần cập nhật trạng thái.",
      "Hệ thống hiển thị trạng thái hiện tại.",
      "Giảng viên xác nhận thay đổi trạng thái.",
      "Hệ thống cập nhật trạng thái gửi của thông báo.",
      "Giao diện làm mới danh sách thông báo.",
    ],
    [
      "Nếu chuyển sang đã gửi, hệ thống kiểm tra người nhận trước khi cập nhật.",
      "Nếu chuyển về chưa gửi, hệ thống chỉ cho phép khi thông báo chưa phát sinh bản ghi gửi.",
    ],
    writeExceptions("trạng thái gửi thông báo")
  ),
  "UC10.5": makeSpec(
    "Giảng viên xóa thông báo không còn cần sử dụng khỏi danh sách quản lý.",
    "Giảng viên đã đăng nhập, có quyền quản lý thông báo và thông báo cần xóa đang tồn tại.",
    [
      "Giảng viên mở danh sách thông báo.",
      "Giảng viên chọn thông báo cần xóa.",
      "Hệ thống hiển thị modal xác nhận xóa thông báo.",
      "Giảng viên xác nhận thao tác.",
      "Hệ thống kiểm tra quyền và trạng thái thông báo.",
      "Hệ thống xóa thông báo hoặc đánh dấu đã xóa theo cấu hình.",
      "Giao diện làm mới danh sách thông báo.",
    ],
    [
      "Nếu giảng viên hủy xác nhận, hệ thống không thay đổi dữ liệu.",
      "Nếu thông báo đã được gửi, hệ thống kiểm tra ràng buộc trước khi xóa.",
    ],
    writeExceptions("xóa thông báo")
  ),
  "UC11": makeSpec(
    "Người dùng đăng nhập vào hệ thống để sử dụng chức năng theo vai trò được phân quyền.",
    "Tài khoản đã tồn tại, đang hoạt động và người dùng có email cùng mật khẩu hợp lệ.",
    [
      "Người dùng mở màn hình đăng nhập.",
      "Người dùng nhập email và mật khẩu.",
      "Hệ thống kiểm tra định dạng thông tin đăng nhập.",
      "Hệ thống xác thực email, mật khẩu và trạng thái tài khoản.",
      "Hệ thống lấy vai trò và quyền truy cập của tài khoản.",
      "Hệ thống tạo phiên đăng nhập và chuyển người dùng đến giao diện phù hợp.",
    ],
    [
      "Nếu người dùng chưa có tài khoản, người dùng chuyển sang chức năng đăng kí.",
      "Nếu tài khoản thuộc nhiều vai trò, hệ thống điều hướng theo vai trò có quyền cao nhất hoặc cấu hình hiện tại.",
    ],
    [
      "Email hoặc mật khẩu không đúng.",
      "Tài khoản bị khóa hoặc không còn hoạt động.",
      "Hệ thống không tạo được phiên đăng nhập, người dùng được thông báo thử lại.",
    ]
  ),
  "UC12": makeSpec(
    "Người dùng nhập thông tin để tạo tài khoản mới trong hệ thống.",
    "Người dùng chưa đăng nhập; email đăng kí chưa tồn tại trong hệ thống.",
    [
      "Người dùng mở màn hình đăng kí.",
      "Hệ thống hiển thị form đăng kí tài khoản.",
      "Người dùng nhập họ tên, email, mật khẩu, xác nhận mật khẩu và thông tin bắt buộc khác nếu có.",
      "Người dùng gửi form đăng kí.",
      "Hệ thống kiểm tra định dạng email, độ mạnh mật khẩu và dữ liệu bắt buộc.",
      "Hệ thống tạo tài khoản mới với trạng thái hoạt động mặc định.",
      "Hệ thống thông báo đăng kí thành công và chuyển người dùng sang màn hình đăng nhập.",
    ],
    [
      "Nếu người dùng đã có tài khoản, người dùng có thể chuyển sang đăng nhập.",
      "Nếu người dùng hủy đăng kí, hệ thống không tạo tài khoản.",
    ],
    [
      "Email đã được sử dụng bởi tài khoản khác.",
      "Mật khẩu và xác nhận mật khẩu không khớp.",
      "Dữ liệu đăng kí không hợp lệ hoặc hệ thống không tạo được tài khoản.",
    ]
  ),
  "UC15.1": makeSpec(
    "Quản lý xem chi tiết một bản ghi audit thanh toán để đối chiếu giao dịch.",
    "Quản lý đã đăng nhập, có quyền xem audit thanh toán và bản ghi audit tồn tại.",
    [
      "Quản lý mở màn hình audit thanh toán.",
      "Quản lý chọn một bản ghi audit cần xem.",
      "Hệ thống kiểm tra quyền truy cập.",
      "Hệ thống lấy thông tin đơn hàng, người dùng, người tạo, phương thức thanh toán, IP, trạng thái và thời gian mua.",
      "Hệ thống lấy chi tiết số tiền, gói hoặc khóa học liên quan nếu có.",
      "Giao diện hiển thị chi tiết audit thanh toán.",
    ],
    [
      "Nếu bản ghi không còn tồn tại, hệ thống tải lại danh sách audit.",
      "Nếu dữ liệu liên quan bị thiếu, giao diện vẫn hiển thị phần audit còn lại.",
    ],
    readExceptions("audit thanh toán")
  ),
  "UC16.1": makeSpec(
    "Quản lý thêm khóa học mới vào hệ thống.",
    "Quản lý đã đăng nhập và có quyền quản lý khóa học.",
    [
      "Quản lý mở màn hình quản lý khóa học.",
      "Quản lý chọn thêm khóa học.",
      "Hệ thống hiển thị form nhập tên, danh mục, giảng viên, mô tả, học phí và trạng thái.",
      "Quản lý nhập thông tin khóa học.",
      "Hệ thống kiểm tra dữ liệu bắt buộc và giá tiền.",
      "Hệ thống lưu khóa học mới và cập nhật danh sách.",
    ],
    [
      "Nếu khóa học chưa đủ thông tin, hệ thống cho phép lưu nháp hoặc yêu cầu bổ sung tùy cấu hình.",
      "Nếu slug khóa học bị trùng, hệ thống yêu cầu đổi tên hoặc tạo slug mới.",
    ],
    writeExceptions("khóa học")
  ),
  "UC16.2": makeSpec(
    "Quản lý cập nhật thông tin khóa học đã có.",
    "Quản lý đã đăng nhập, có quyền quản lý khóa học và khóa học cần sửa đã tồn tại.",
    [
      "Quản lý chọn khóa học cần cập nhật.",
      "Hệ thống hiển thị thông tin hiện tại của khóa học.",
      "Quản lý chỉnh sửa tên, danh mục, giảng viên, mô tả, học phí, ảnh hoặc trạng thái.",
      "Quản lý nhấn lưu thay đổi.",
      "Hệ thống kiểm tra dữ liệu và cập nhật khóa học.",
      "Giao diện hiển thị khóa học đã cập nhật.",
    ],
    [
      "Nếu khóa học đã có học viên, hệ thống có thể hạn chế sửa các trường ảnh hưởng đến học phí hoặc nội dung.",
      "Nếu quản lý hủy thao tác, hệ thống giữ nguyên dữ liệu cũ.",
    ],
    writeExceptions("khóa học")
  ),
  "UC16.3": makeSpec(
    "Quản lý ẩn khóa học khỏi danh sách hiển thị công khai.",
    "Quản lý đã đăng nhập, có quyền quản lý khóa học và khóa học đang tồn tại.",
    [
      "Quản lý chọn khóa học cần ẩn.",
      "Hệ thống hiển thị modal xác nhận ẩn khóa học.",
      "Quản lý xác nhận thao tác.",
      "Hệ thống cập nhật trạng thái khóa học thành ẩn hoặc ngừng hiển thị.",
      "Giao diện làm mới danh sách khóa học.",
    ],
    [
      "Nếu khóa học đang có lớp hoạt động, hệ thống cảnh báo trước khi ẩn.",
      "Nếu quản lý hủy xác nhận, hệ thống không đổi trạng thái.",
    ],
    writeExceptions("trạng thái khóa học")
  ),
  "UC17.1": makeSpec(
    "Quản lý thêm tài khoản hoặc hồ sơ giảng viên mới.",
    "Quản lý đã đăng nhập và có quyền quản lý giảng viên.",
    [
      "Quản lý mở màn hình quản lý giảng viên.",
      "Quản lý chọn thêm giảng viên.",
      "Hệ thống hiển thị form thông tin tài khoản và hồ sơ giảng viên.",
      "Quản lý nhập họ tên, email, số điện thoại, chuyên môn và thông tin liên quan.",
      "Hệ thống kiểm tra email, dữ liệu bắt buộc và vai trò giảng viên.",
      "Hệ thống tạo tài khoản hoặc hồ sơ giảng viên và cập nhật danh sách.",
    ],
    [
      "Nếu email đã tồn tại, hệ thống yêu cầu chọn tài khoản khác hoặc cập nhật hồ sơ hiện có.",
      "Nếu thiếu thông tin chuyên môn, hệ thống yêu cầu bổ sung trước khi lưu.",
    ],
    writeExceptions("giảng viên")
  ),
  "UC17.2": makeSpec(
    "Quản lý cập nhật thông tin tài khoản hoặc hồ sơ giảng viên.",
    "Quản lý đã đăng nhập, có quyền quản lý giảng viên và giảng viên cần sửa đã tồn tại.",
    [
      "Quản lý chọn giảng viên cần cập nhật.",
      "Hệ thống hiển thị thông tin tài khoản và hồ sơ hiện tại.",
      "Quản lý chỉnh sửa họ tên, số điện thoại, chuyên môn, mô tả hoặc trạng thái.",
      "Quản lý nhấn lưu thay đổi.",
      "Hệ thống kiểm tra dữ liệu và quyền cập nhật.",
      "Hệ thống lưu thay đổi và làm mới danh sách giảng viên.",
    ],
    [
      "Nếu quản lý hủy thao tác, hệ thống giữ nguyên dữ liệu cũ.",
      "Nếu giảng viên đang phụ trách lớp, hệ thống hạn chế cập nhật các trường ảnh hưởng đến phân công.",
    ],
    writeExceptions("giảng viên")
  ),
  "UC17.3": makeSpec(
    "Quản lý khóa tài khoản giảng viên khi giảng viên tạm ngừng hoạt động.",
    "Quản lý đã đăng nhập, có quyền quản lý giảng viên và tài khoản giảng viên đang tồn tại.",
    [
      "Quản lý chọn giảng viên cần khóa.",
      "Hệ thống hiển thị modal xác nhận khóa tài khoản.",
      "Quản lý xác nhận thao tác.",
      "Hệ thống cập nhật trạng thái tài khoản giảng viên thành bị khóa hoặc tạm tắt.",
      "Hệ thống ngăn tài khoản bị khóa tiếp tục đăng nhập.",
      "Giao diện làm mới danh sách giảng viên.",
    ],
    [
      "Nếu quản lý hủy xác nhận, hệ thống không thay đổi trạng thái.",
      "Nếu giảng viên đang phụ trách lớp, hệ thống cảnh báo trước khi khóa.",
    ],
    writeExceptions("trạng thái tài khoản giảng viên")
  ),
  "UC18.1": makeSpec(
    "Quản lý thêm người dùng mới và gán vai trò hệ thống phù hợp.",
    "Quản lý đã đăng nhập và có quyền quản lý người dùng.",
    [
      "Quản lý mở màn hình quản lý người dùng.",
      "Quản lý chọn thêm người dùng.",
      "Hệ thống hiển thị form nhập thông tin tài khoản.",
      "Quản lý nhập họ tên, email, số điện thoại, trạng thái và vai trò.",
      "Hệ thống kiểm tra email, dữ liệu bắt buộc và vai trò hợp lệ.",
      "Hệ thống tạo người dùng mới và cập nhật danh sách.",
    ],
    [
      "Nếu không chọn vai trò, hệ thống gán vai trò mặc định nếu được cấu hình.",
      "Nếu email đã tồn tại, hệ thống không tạo tài khoản mới.",
    ],
    writeExceptions("người dùng")
  ),
  "UC18.2": makeSpec(
    "Quản lý cập nhật thông tin người dùng đã có trong hệ thống.",
    "Quản lý đã đăng nhập, có quyền quản lý người dùng và người dùng cần sửa đã tồn tại.",
    [
      "Quản lý chọn người dùng cần cập nhật.",
      "Hệ thống hiển thị thông tin hiện tại của người dùng.",
      "Quản lý chỉnh sửa họ tên, email, số điện thoại, trạng thái hoặc vai trò được phép.",
      "Quản lý nhấn lưu thay đổi.",
      "Hệ thống kiểm tra dữ liệu và quyền cập nhật.",
      "Hệ thống lưu thông tin người dùng và làm mới danh sách.",
    ],
    [
      "Nếu cập nhật tài khoản quản trị hệ thống, hệ thống hạn chế các thao tác không được phép.",
      "Nếu quản lý hủy form, hệ thống giữ nguyên dữ liệu cũ.",
    ],
    writeExceptions("người dùng")
  ),
  "UC18.3": makeSpec(
    "Quản lý khóa tài khoản người dùng để ngăn đăng nhập và sử dụng hệ thống.",
    "Quản lý đã đăng nhập, có quyền quản lý người dùng và tài khoản cần khóa đang tồn tại.",
    [
      "Quản lý chọn người dùng cần khóa.",
      "Hệ thống hiển thị modal xác nhận khóa tài khoản.",
      "Quản lý xác nhận thao tác.",
      "Hệ thống cập nhật trạng thái tài khoản thành bị khóa hoặc tạm tắt.",
      "Hệ thống vô hiệu hóa phiên đăng nhập hiện tại nếu cần.",
      "Giao diện làm mới danh sách người dùng.",
    ],
    [
      "Nếu tài khoản là quản trị hệ thống bắt buộc, hệ thống không cho khóa.",
      "Nếu quản lý hủy xác nhận, hệ thống không thay đổi trạng thái.",
    ],
    writeExceptions("trạng thái tài khoản người dùng")
  ),
  "UC19.1": makeSpec(
    "Admin thêm vai trò mới để sử dụng trong phân quyền RBAC.",
    "Admin đã đăng nhập, có quyền phân quyền RBAC và mã vai trò mới chưa tồn tại.",
    [
      "Admin mở màn hình phân quyền RBAC.",
      "Admin chọn thêm vai trò.",
      "Hệ thống hiển thị form nhập tên vai trò, mã vai trò, mô tả và trạng thái.",
      "Admin nhập thông tin vai trò.",
      "Hệ thống kiểm tra mã vai trò, tên vai trò và quyền hệ thống.",
      "Hệ thống tạo vai trò mới và cập nhật danh sách vai trò.",
    ],
    [
      "Nếu mã vai trò bị trùng, hệ thống yêu cầu nhập mã khác.",
      "Nếu Admin hủy form, hệ thống không tạo vai trò.",
    ],
    writeExceptions("vai trò")
  ),
  "UC19.2": makeSpec(
    "Admin sửa thông tin vai trò và cấu hình quyền liên quan trong RBAC.",
    "Admin đã đăng nhập, có quyền phân quyền RBAC và vai trò cần sửa đã tồn tại.",
    [
      "Admin mở màn hình phân quyền RBAC.",
      "Admin chọn vai trò cần sửa.",
      "Hệ thống hiển thị thông tin vai trò và danh sách quyền hiện tại.",
      "Admin cập nhật tên, mô tả, trạng thái hoặc quyền của vai trò.",
      "Hệ thống kiểm tra dữ liệu và ràng buộc vai trò hệ thống.",
      "Hệ thống lưu thay đổi và đồng bộ quyền cho các tài khoản đang dùng vai trò đó.",
    ],
    [
      "Nếu vai trò là vai trò hệ thống bị khóa chỉnh sửa, hệ thống chỉ cho sửa các trường được phép.",
      "Nếu Admin hủy thao tác, hệ thống giữ nguyên cấu hình quyền cũ.",
    ],
    writeExceptions("vai trò và quyền")
  ),
};

const alternateStepMap = {
  "UC01.1": [1, 3, 8],
  "UC02.1": [3, 5],
  "UC02.2": [4, 5],
  "UC03.1": [3, 3],
  "UC04.1": [1, 3],
  "UC05.1": [3, 4],
  "UC06.1": [4, 5],
  "UC07.1": [5, 5],
  "UC07.2": [4, 5],
  "UC07.3": [4, 6],
  "UC08.1": [3, 5],
  "UC08.2": [5, 6],
  "UC08.3": [4, 5],
  "UC09.1": [5, 6],
  "UC09.2": [6, 5],
  "UC09.3": [4, 5],
  "UC10.1": [3, 4],
  "UC10.2": [5, 5],
  "UC10.3": [4, 3],
  "UC10.4": [5, 5],
  "UC10.5": [4, 5],
  "UC11": [2, 5],
  "UC12": [1, 4],
  "UC15.1": [4, 5],
  "UC16.1": [5, 5],
  "UC16.2": [3, 4],
  "UC16.3": [2, 3],
  "UC17.1": [5, 5],
  "UC17.2": [4, 3],
  "UC17.3": [3, 2],
  "UC18.1": [5, 5],
  "UC18.2": [3, 4],
  "UC18.3": [4, 3],
  "UC19.1": [5, 4],
  "UC19.2": [4, 4],
};

function detailSpec(item) {
  return detailData[itemUseCaseCode(item)] ?? makeSpec(
    `${item.actors.join(", ")} thực hiện thao tác ${item.name} trong chức năng ${item.parent.name}.`,
    item.parent.precondition,
    [
      `${item.actors.join(", ")} mở chức năng ${item.parent.name}.`,
      `${item.actors.join(", ")} thực hiện ${item.name}.`,
      "Hệ thống kiểm tra quyền truy cập và dữ liệu đầu vào.",
      "Hệ thống thực hiện thao tác và cập nhật dữ liệu liên quan.",
      "Giao diện hiển thị kết quả thao tác.",
    ],
    ["Nếu người dùng hủy thao tác, hệ thống giữ nguyên dữ liệu cũ."],
    writeExceptions(item.name.toLowerCase())
  );
}

function detailPurpose(item) {
  return detailSpec(item).description;
}

function detailPrecondition(item) {
  return detailSpec(item).precondition;
}

function detailMainFlow(item) {
  return renderOrdered(detailSpec(item).mainFlow);
}

function detailAlternateFlow(item) {
  const alternateFlow = detailSpec(item).alternateFlow ?? [];
  const stepNumbers = alternateStepMap[itemUseCaseCode(item)] ?? [];
  const counters = new Map();

  return alternateFlow
    .map((flow, index) => {
      const mainStep = stepNumbers[index] ?? index + 1;
      const subStep = (counters.get(mainStep) ?? 0) + 1;
      counters.set(mainStep, subStep);
      return `${mainStep}.${subStep} ${flow}`;
    })
    .join("\n");
}

function exceptionFlow(item) {
  return renderList(detailSpec(item).exceptions);
}

function actorUseCaseRows() {
  const rows = [["Tác nhân", "Mã UC", "Use case phân rã", "Use case cha"]];
  const actorOrder = ["User", "Student", "Teacher", "Manager", "Admin"];
  const items = subUseCases();

  for (const actorName of actorOrder) {
    const actorItems = items.filter((item) => item.actors.includes(actorName));
    actorItems.forEach((item, index) => {
      rows.push([
        index === 0 ? actorName : "",
        itemUseCaseCode(item),
        item.name,
        item.isGeneral ? "Use case tổng quát" : item.parent.name,
      ]);
    });
  }

  return rows;
}

function actorUseCaseListDoc() {
  const hierarchyNote = actorHierarchy.map(([child, parent]) => `${child} kế thừa ${parent}`).join("; ");

  return `Bảng 2-1: Bảng danh sách các tác nhân và UseCase phân rã

Ghi chú: Bảng dưới đây liệt kê các use case con trong sơ đồ phân rã. Quan hệ kế thừa actor trên sơ đồ tổng quát: ${hierarchyNote}.

${table(actorUseCaseRows(), [14, 10, 34, 30], 1)}
`;
}

function textDoc(item) {
  const caption = `Bảng 2-${item.sequence + 1}: Bảng đặc tả chức năng "${item.name}"`;
  const rows = [
    ["Mã UseCase", itemUseCaseCode(item)],
    ["Tên UseCase", item.name],
    ["Mô tả", detailPurpose(item)],
    ["Tiền điều kiện", detailPrecondition(item)],
    ["Luồng chính", detailMainFlow(item)],
    ["Luồng phụ", detailAlternateFlow(item)],
    ["Ngoại lệ", exceptionFlow(item)],
  ];

  return `${caption}

${table(rows, [16, 92])}
`;
}

function cleanDocOutput() {
  const target = resolve(outputDir);
  const allowedRoot = resolve(root) + sep;
  if (!target.startsWith(allowedRoot)) {
    throw new Error(`Refuse to clean outside UML: ${target}`);
  }

  mkdirSync(target, { recursive: true });
  for (const file of readdirSync(target)) {
    if (file.endsWith(".doc")) rmSync(join(target, file), { force: true });
  }
}

cleanDocOutput();
writeFileSync(join(outputDir, "bang-danh-sach-tac-nhan-usecase.doc"), `\ufeff${actorUseCaseListDoc()}`, "utf8");

const details = subUseCases();
for (const item of details) {
  writeFileSync(join(outputDir, subUseCaseFile(item)), `\ufeff${textDoc(item)}`, "utf8");
}

console.log(`Generated ${details.length} decomposed use case specification documents and 1 actor-usecase list in ${outputDir}`);
