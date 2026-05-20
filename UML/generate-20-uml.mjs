import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { actorGroups, actorHierarchy, useCaseByCode, useCases } from "./usecase-data.mjs";

const root = dirname(fileURLToPath(import.meta.url));

function esc(value) {
  return cleanText(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function cleanText(value) {
  const text = String(value);
  if (/[ÃÂÄÆ][\u0080-\u00ff]?|á[º»]/.test(text)) {
    return Buffer.from(text, "latin1").toString("utf8");
  }
  return text;
}

function ensureClean(relativePath) {
  const target = resolve(root, relativePath);
  const allowedRoot = resolve(root) + sep;
  if (!target.startsWith(allowedRoot)) {
    throw new Error(`Refuse to clean outside UML: ${target}`);
  }
  rmSync(target, { recursive: true, force: true });
  mkdirSync(target, { recursive: true });
}

function save(relativePath, content) {
  const target = join(root, relativePath);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, content, "utf8");
}

function short(text, max = 30) {
  return text.length <= max ? text : `${text.slice(0, max - 3)}...`;
}

function wrapLabel(value, maxChars = 36, maxLines = 2) {
  const words = cleanText(value).split(/\s+/).filter(Boolean);
  const lines = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length <= maxChars) {
      current = next;
      continue;
    }
    if (current) {
      lines.push(current);
      current = word;
    } else {
      lines.push(word);
      current = "";
    }
    if (lines.length === maxLines) break;
  }

  if (current && lines.length < maxLines) lines.push(current);

  const usedWords = lines.join(" ").split(/\s+/).filter(Boolean).length;
  if (usedWords < words.length && lines.length > 0) {
    lines[lines.length - 1] = short(lines[lines.length - 1], Math.max(10, maxChars - 2));
  }

  return lines.join("|");
}

function slugText(value) {
  return cleanText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replaceAll("đ", "d")
    .replaceAll("Đ", "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function oneLine(value) {
  return cleanText(value).replace(/\s+/g, " ").trim();
}

function compactUseCaseCode(code) {
  return oneLine(code).replace(/\./g, "-").toLowerCase();
}

function parseNumberedItems(value) {
  const text = oneLine(value);
  const items = [];
  const pattern = /(?:^|\s)([1-9]\d*(?:\.\d+)*)(?:\.)?\s+(.+?)(?=\s+[1-9]\d*(?:\.\d+)*(?:\.)?\s+|$)/g;
  let match;
  while ((match = pattern.exec(text)) !== null) {
    items.push({ code: match[1], text: oneLine(match[2]) });
  }
  return items;
}

function parseBulletItems(value) {
  const text = oneLine(value);
  const items = [];
  const pattern = /-\s+(.+?)(?=\s+-\s+|$)/g;
  let match;
  while ((match = pattern.exec(text)) !== null) {
    items.push(oneLine(match[1]));
  }
  return items;
}

function fieldName(value) {
  const key = slugText(value).replaceAll("-", "");
  const map = new Map([
    ["mausecase", "code"],
    ["tenusecase", "name"],
    ["mota", "description"],
    ["tiendieukien", "precondition"],
    ["luongchinh", "mainFlow"],
    ["luongphu", "alternateFlows"],
    ["ngoaile", "exceptions"],
  ]);
  return map.get(key) ?? "";
}

function parseUseCaseSpecDoc(fileName) {
  const fullPath = join(root, "dac-ta-uc", fileName);
  const text = readFileSync(fullPath, "utf8");
  const fields = new Map();
  let currentField = "";

  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("|")) continue;
    const cells = trimmed
      .split("|")
      .slice(1, -1)
      .map((cell) => oneLine(cell));
    if (cells.length < 2) continue;

    const nextField = fieldName(cells[0]);
    const value = cells.slice(1).join(" ").trim();
    if (nextField) {
      currentField = nextField;
      fields.set(currentField, [value].filter(Boolean));
      continue;
    }

    if (currentField && value) {
      fields.get(currentField).push(value);
    }
  }

  const code = oneLine(fields.get("code")?.join(" ") ?? "");
  const name = oneLine(fields.get("name")?.join(" ") ?? "");
  const mainFlow = parseNumberedItems(fields.get("mainFlow")?.join(" ") ?? "").map((item) => item.text);
  const alternateFlows = parseNumberedItems(fields.get("alternateFlows")?.join(" ") ?? "").map((item) => ({
    code: item.code,
    title: item.text,
    steps: [item.text],
  }));
  const exceptions = parseBulletItems(fields.get("exceptions")?.join(" ") ?? "");

  return {
    fileName,
    code,
    slug: basename(fileName, ".doc").toLowerCase(),
    name,
    details: [name],
    description: oneLine(fields.get("description")?.join(" ") ?? ""),
    preconditions: [oneLine(fields.get("precondition")?.join(" ") ?? "")].filter(Boolean),
    mainFlow,
    alternateFlows,
    exceptions,
    fromSpecDoc: true,
  };
}

function findBaseUseCaseForSpecDoc(spec) {
  const parentNumber = Number(spec.fileName.match(/^UC(\d+)/i)?.[1] ?? 0);
  const parentName = cleanText(generalUseCaseSpecs.find((item) => item.number === parentNumber)?.name ?? "");
  const names = [spec.name, parentName].filter(Boolean).map((name) => slugText(name));

  return (
    useCases.find((item) => names.includes(slugText(item.name))) ??
    useCases.find((item) => names.some((name) => slugText(item.name).includes(name) || name.includes(slugText(item.name)))) ??
    useCases.find((item) => item.details.some((detail) => names.includes(slugText(detail)))) ??
    null
  );
}

function actorFromSpecDoc(spec, baseSpec) {
  const firstSubjects = spec.mainFlow.map((step) => oneLine(step)).filter(Boolean);
  if (firstSubjects.some((step) => /^Admin\b/i.test(step))) return ["Admin"];
  if (firstSubjects.some((step) => /^(Teacher|Giảng viên)\b/i.test(step))) return ["Giảng viên"];
  if (firstSubjects.some((step) => /^(Student|Học viên)\b/i.test(step))) return ["Học viên"];
  if (firstSubjects.some((step) => /^(Manager|Quản lý)\b/i.test(step))) return ["Quản lý"];
  if (firstSubjects.some((step) => /^(User|Người dùng)\b/i.test(step))) return ["Người dùng"];
  return baseSpec?.actors?.map(cleanText) ?? ["Người dùng"];
}

function buildFunctionSpecsFromSpecDocs() {
  const files = readdirSync(join(root, "dac-ta-uc"))
    .filter((fileName) => fileName.endsWith(".doc") && !fileName.startsWith("bang-danh-sach"))
    .sort((a, b) => a.localeCompare(b, "vi"));

  return files.map((fileName) => {
    const parsed = parseUseCaseSpecDoc(fileName);
    const baseSpec = findBaseUseCaseForSpecDoc(parsed);
    const actors = actorFromSpecDoc(parsed, baseSpec);
    const participants = baseSpec?.participants?.map(cleanText) ?? [
      actors.join("/"),
      "Frontend",
      "Controller",
      "Service",
      "Repository",
      "CSDL",
    ];

    return {
      ...(baseSpec ?? {}),
      ...parsed,
      code: parsed.code || compactUseCaseCode(fileName),
      name: parsed.name || baseSpec?.name || basename(fileName, ".doc"),
      slug: parsed.slug,
      actors,
      details: [parsed.name || baseSpec?.name || basename(fileName, ".doc")],
      classes: baseSpec?.classes ?? ["User", "Permission", "SecurityAudit"],
      participants,
      mainFlow: parsed.mainFlow.length ? parsed.mainFlow : baseSpec?.mainFlow ?? [],
      alternateFlows: parsed.alternateFlows,
      sequenceMessages: undefined,
    };
  });
}

let chucNangSpecs = useCases;

function getChucNangSpecs() {
  return chucNangSpecs;
}

function svgStart(width, height, title, showTitle = true) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <title>${esc(title)}</title>
  <defs>
    <marker id="arrow" viewBox="0 0 12 10" markerWidth="12" markerHeight="10" refX="12" refY="5" orient="auto" markerUnits="userSpaceOnUse">
      <path d="M0 0 L12 5 L0 10 Z" fill="#111"/>
    </marker>
    <style>
      text { font-family: "Segoe UI", Arial, sans-serif; fill: #111; }
      .title { font-size: 24px; font-weight: 700; }
      .label { font-size: 14px; }
      .small { font-size: 12px; }
      .tiny { font-size: 10px; }
      .boundary { fill: #fff; stroke: #111; stroke-width: 1.5; }
      .usecase { fill: #fff; stroke: #111; stroke-width: 1.3; }
      .actor { stroke: #111; stroke-width: 1.25; fill: none; }
      .line { stroke: #111; stroke-width: 1.15; fill: none; marker-end: url(#arrow); }
      .dashed { stroke: #111; stroke-width: 1; stroke-dasharray: 5 4; fill: none; marker-end: url(#arrow); }
      .box { fill: #fff; stroke: #111; stroke-width: 1.25; }
      .soft { fill: #f7f7f7; stroke: #111; stroke-width: 1.1; }
      .decision { fill: #fff; stroke: #111; stroke-width: 1.25; }
      .class { fill: #fff; stroke: #111; stroke-width: 1.2; }
      .classHead { fill: #efefef; stroke: #111; stroke-width: 1.2; }
      .relation { stroke: #111; stroke-width: 1; fill: none; }
      .participant { fill: #fff; stroke: #111; stroke-width: 1.2; }
      .lifeline { stroke: #888; stroke-width: 1; stroke-dasharray: 6 5; }
      .note { fill: #fffbe6; stroke: #111; stroke-width: 1; }
    </style>
  </defs>
  <rect width="100%" height="100%" fill="#fff"/>
  ${showTitle ? `<text x="${Math.round(width / 2)}" y="34" text-anchor="middle" class="title">${esc(title)}</text>` : ""}`;
}

function svgEnd() {
  return "</svg>\n";
}

function textBlock(x, y, text, cls = "label", lineHeight = 15, anchor = "middle") {
  const lines = String(text).split("|");
  const start = Math.round(y - ((lines.length - 1) * lineHeight) / 2 + 5);
  return `<text x="${x}" y="${start}" text-anchor="${anchor}" class="${cls}">${lines
    .map((line, index) => `<tspan x="${x}" y="${start + index * lineHeight}">${esc(line)}</tspan>`)
    .join("")}</text>`;
}

function actor(x, y, label) {
  return `<circle class="actor" cx="${x}" cy="${y - 36}" r="10"/>
<path class="actor" d="M${x} ${y - 26} L${x} ${y + 18} M${x - 22} ${y - 8} L${x + 22} ${y - 8} M${x} ${y + 18} L${x - 20} ${y + 52} M${x} ${y + 18} L${x + 20} ${y + 52}"/>
<text x="${x}" y="${y + 73}" text-anchor="middle" class="small">${esc(label)}</text>`;
}

function usecase(x, y, rx, ry, text) {
  return `<ellipse class="usecase" cx="${x}" cy="${y}" rx="${rx}" ry="${ry}"/>
${textBlock(x, y, text, "small", 13)}`;
}

function arrow(x1, y1, x2, y2, label = "", cls = "line") {
  const midX = Math.round((x1 + x2) / 2);
  const midY = Math.round((y1 + y2) / 2 - 5);
  const labelSvg = label ? `<text x="${midX}" y="${midY}" text-anchor="middle" class="tiny">${esc(label)}</text>` : "";
  return `<path class="${cls}" d="M${x1} ${y1} L${x2} ${y2}"/>${labelSvg}`;
}

function rectBox(x, y, w, h, text, cls = "box") {
  return `<rect class="${cls}" x="${x}" y="${y}" width="${w}" height="${h}" rx="8"/>
${textBlock(Math.round(x + w / 2), Math.round(y + h / 2), text, "small", 13)}`;
}

function diamond(x, y, w, h, text) {
  const cx = Math.round(x + w / 2);
  const cy = Math.round(y + h / 2);
  return `<path class="decision" d="M${cx} ${y} L${x + w} ${cy} L${cx} ${y + h} L${x} ${cy} Z"/>
${textBlock(cx, cy, text, "tiny", 12)}`;
}

function classAttrs(name) {
  const map = {
    User: ["+name", "+email", "+passwordHash", "+avatar", "+role", "+active"],
    Session: ["+user", "+refreshTokenHash", "+expiresAt", "+revokedAt", "+lastUsedAt"],
    AccessToken: ["+user", "+session", "+jti", "+tokenHash", "+expiresAt", "+revokedAt"],
    Role: ["+code", "+type", "+name", "+priority", "+isSystem", "+isActive"],
    Permission: ["+key", "+resource", "+action", "+groupKey", "+groupLabel", "+order"],
    UserRole: ["+userId", "+roleId", "+isDeleted", "+deletedAt"],
    RolePermission: ["+roleId", "+permissionKey", "+scope", "+field", "+isDeleted"],
    SecurityAudit: ["+user", "+userEmail", "+action", "+method", "+path", "+success"],
    Product: ["+title", "+slug", "+category", "+teacher", "+level", "+price"],
    Category: ["+name", "+slug", "+description", "+isActive", "+isDeleted"],
    Teacher: ["+user", "+specialty", "+phone", "+degree", "+experience", "+rating"],
    ClassRoom: ["+course", "+teacher", "+className", "+mode", "+scheduleText", "+room"],
    StudentStudy: ["+student", "+classRoom", "+course", "+teacher", "+status", "+score"],
    StudySession: ["+sessionNo", "+date", "+attendanceStatus", "+homeworkStatus", "+progressScore"],
    Cart: ["+user", "+items", "+createdAt", "+updatedAt"],
    CartItem: ["+course", "+quantity", "+unitPrice", "+originalPrice", "+selected"],
    PaymentOrder: ["+user", "+provider", "+status", "+paymentCode", "+amount", "+paidAt"],
    OrderItemSnapshot: ["+courseId", "+title", "+quantity", "+unitPrice", "+subtotal"],
    Blog: ["+title", "+slug", "+category", "+tags", "+createdBy", "+isPublished"],
    BlogCategory: ["+name", "+slug", "+description", "+isActive", "+isDeleted"],
    Notification: ["+userId", "+title", "+message", "+type", "+isRead", "+createdBy"],
    DashboardResponse: ["+overviewCards", "+statCards", "+enrollmentData", "+revenueData", "+quickRows"],
  };
  return map[name] ?? ["+id", "+createdAt", "+updatedAt"];
}

const generalActors = [
  { name: "User", x: 55, y: 115 },
  { name: "Student", x: 55, y: 300 },
  { name: "Teacher", x: 55, y: 530 },
  { name: "Manager", x: 55, y: 820 },
  { name: "Admin", x: 55, y: 1030 },
];

const generalActorHierarchy = [
  ["Student", "User"],
  ["Teacher", "Student"],
  ["Manager", "Teacher"],
  ["Admin", "Manager"],
];

const generalUseCaseSpecs = [
  {
    number: 1,
    name: "Thanh toán khóa học",
    actors: ["User"],
    diagramY: 70,
    extends: ["Thực hiện thanh toán khóa học"],
    purpose: "Người dùng thanh toán khóa học đã chọn và nhận kết quả giao dịch từ hệ thống.",
    precondition: "User đã đăng nhập và khóa học còn khả dụng.",
    postcondition: "Đơn thanh toán được ghi nhận, trạng thái giao dịch được cập nhật.",
  },
  {
    number: 2,
    name: "Cập nhật thông tin tài khoản",
    actors: ["User"],
    diagramY: 120,
    extends: ["Cập nhật hồ sơ", "Đổi mật khẩu"],
    purpose: "User cập nhật thông tin cá nhân để hồ sơ tài khoản luôn chính xác.",
    precondition: "User đã đăng nhập và tài khoản đang hoạt động.",
    postcondition: "Thông tin tài khoản mới được lưu và hiển thị lại trên giao diện.",
  },
  {
    number: 3,
    name: "Xem lịch sử thanh toán",
    actors: ["User"],
    diagramY: 170,
    extends: [],
    purpose: "User xem lại các giao dịch thanh toán của tài khoản.",
    precondition: "User đã đăng nhập.",
    postcondition: "Danh sách hoặc chi tiết giao dịch thanh toán được hiển thị.",
  },
  {
    number: 4,
    name: "Xem điểm",
    actors: ["Student"],
    diagramY: 275,
    extends: [],
    purpose: "Student xem điểm học tập, điểm kiểm tra và kết quả tổng kết.",
    precondition: "Student đã đăng nhập và có hồ sơ học tập.",
    postcondition: "Bảng điểm của student được hiển thị theo dữ liệu hiện có.",
  },
  {
    number: 5,
    name: "Xem lịch học",
    actors: ["Student"],
    diagramY: 325,
    extends: [],
    purpose: "Student theo dõi lịch học, phòng học và thông tin lớp đang tham gia.",
    precondition: "Student đã đăng nhập và được gán vào lớp học.",
    postcondition: "Lịch học liên quan đến student được hiển thị.",
  },
  {
    number: 6,
    name: "Xem thông báo",
    actors: ["Student"],
    diagramY: 375,
    extends: [],
    purpose: "Student xem các thông báo được gửi đến tài khoản.",
    precondition: "Student đã đăng nhập.",
    postcondition: "Danh sách hoặc chi tiết thông báo được hiển thị cho student.",
  },
  {
    number: 7,
    name: "Quản lý lớp học",
    actors: ["Teacher"],
    diagramY: 485,
    extends: ["Thêm lớp học", "Sửa lớp học", "Khóa lớp học"],
    purpose: "Teacher quản lý thông tin lớp học bằng cách thêm mới, chỉnh sửa hoặc khóa lớp học.",
    precondition: "Teacher đã đăng nhập và có quyền quản lý lớp học.",
    postcondition: "Thông tin lớp học được tạo, cập nhật hoặc khóa theo thao tác thực hiện.",
  },
  {
    number: 8,
    name: "Quản lý lịch học",
    actors: ["Teacher"],
    diagramY: 535,
    extends: ["Thêm lịch học", "Sửa lịch học", "Xóa lịch học"],
    purpose: "Teacher quản lý lịch học của lớp bằng cách thêm, sửa hoặc xóa lịch học.",
    precondition: "Teacher đã đăng nhập và có quyền quản lý lịch học.",
    postcondition: "Lịch học được thêm, cập nhật hoặc xóa theo thao tác thực hiện.",
  },
  {
    number: 9,
    name: "Quản lý học viên",
    actors: ["Teacher"],
    diagramY: 585,
    extends: ["Thêm học viên", "Sửa học viên", "Khóa học viên"],
    purpose: "Teacher quản lý học viên bằng cách thêm mới, chỉnh sửa hoặc khóa học viên.",
    precondition: "Teacher đã đăng nhập và có quyền quản lý học viên.",
    postcondition: "Dữ liệu học viên được cập nhật theo thao tác thực hiện.",
  },
  {
    number: 10,
    name: "Quản lý thông báo",
    actors: ["Teacher"],
    diagramY: 635,
    extends: ["Xem thông báo", "Thêm thông báo", "Gửi thông báo", "Sửa trạng thái gửi", "Xóa thông báo"],
    purpose: "Teacher tạo và quản lý thông báo gửi đến người nhận phù hợp.",
    precondition: "Teacher đã đăng nhập và có quyền quản lý thông báo.",
    postcondition: "Thông báo được lưu, cập nhật hoặc gửi đến người nhận.",
  },
  {
    number: 11,
    name: "Đăng nhập",
    actors: ["User", "Student", "Teacher", "Manager", "Admin"],
    diagramY: 705,
    extends: ["Đăng kí"],
    purpose: "Người dùng hệ thống đăng nhập để truy cập chức năng theo vai trò.",
    precondition: "Tài khoản đã tồn tại và đang được phép đăng nhập.",
    postcondition: "Phiên đăng nhập được tạo và quyền truy cập được xác định.",
  },
  {
    number: 12,
    name: "Đăng kí",
    actors: ["User"],
    diagramY: 755,
    extends: ["Nhập thông tin đăng kí"],
    purpose: "User tạo tài khoản mới để sử dụng các chức năng của hệ thống.",
    precondition: "User chưa có tài khoản hoặc muốn tạo tài khoản mới.",
    postcondition: "Tài khoản mới được tạo và user có thể chuyển sang đăng nhập.",
  },
  {
    number: 13,
    name: "Dashboard",
    actors: ["Manager"],
    diagramY: 830,
    extends: [],
    purpose: "Manager xem các chỉ số tổng quan để theo dõi hoạt động hệ thống.",
    precondition: "Manager đã đăng nhập và có quyền xem dashboard.",
    postcondition: "Các thống kê tổng quan được hiển thị trên dashboard.",
  },
  {
    number: 14,
    name: "Quản lý bài viết",
    actors: ["Manager"],
    diagramY: 880,
    extends: [],
    purpose: "Manager quản lý nội dung bài viết được hiển thị trong hệ thống.",
    precondition: "Manager đã đăng nhập và có quyền quản lý bài viết.",
    postcondition: "Bài viết được tạo, cập nhật hoặc thay đổi trạng thái hiển thị.",
  },
  {
    number: 15,
    name: "Audit thanh toán",
    actors: ["Manager"],
    diagramY: 930,
    extends: ["Xem chi tiết audit"],
    purpose: "Manager theo dõi lịch sử và trạng thái các giao dịch thanh toán.",
    precondition: "Manager đã đăng nhập và có quyền xem audit thanh toán.",
    postcondition: "Dữ liệu audit thanh toán được hiển thị theo bộ lọc.",
  },
  {
    number: 16,
    name: "Quản lý khóa học",
    actors: ["Manager"],
    diagramY: 980,
    extends: ["Thêm khóa học", "Cập nhật khóa học", "Ẩn khóa học"],
    purpose: "Manager quản lý thông tin khóa học trong hệ thống.",
    precondition: "Manager đã đăng nhập và có quyền quản lý khóa học.",
    postcondition: "Dữ liệu khóa học được thêm mới, cập nhật hoặc đổi trạng thái.",
  },
  {
    number: 17,
    name: "Quản lý giảng viên",
    actors: ["Manager"],
    diagramY: 1030,
    extends: ["Thêm giảng viên", "Cập nhật giảng viên", "Khóa tài khoản"],
    purpose: "Manager quản lý hồ sơ và trạng thái tài khoản giảng viên.",
    precondition: "Manager đã đăng nhập và có quyền quản lý giảng viên.",
    postcondition: "Thông tin giảng viên được cập nhật theo thao tác quản lý.",
  },
  {
    number: 18,
    name: "Quản lý người dùng",
    actors: ["Manager"],
    diagramY: 1080,
    extends: ["Thêm người dùng", "Cập nhật người dùng", "Khóa tài khoản"],
    purpose: "Manager quản lý tài khoản người dùng và trạng thái hoạt động.",
    precondition: "Manager đã đăng nhập và có quyền quản lý người dùng.",
    postcondition: "Tài khoản người dùng được tạo, cập nhật hoặc khóa theo yêu cầu.",
  },
  {
    number: 19,
    name: "Phân quyền RBAC",
    actors: ["Admin"],
    diagramY: 1130,
    extends: ["Thêm vai trò", "Sửa vai trò"],
    purpose: "Admin cấu hình vai trò và quyền truy cập theo mô hình RBAC.",
    precondition: "Admin đã đăng nhập và có quyền phân quyền RBAC.",
    postcondition: "Quyền và vai trò được cập nhật trong hệ thống.",
  },
];

const decomposedUseCaseSpecs = generalUseCaseSpecs;

function drawGeneralUsecase() {
  const width = 620;
  const height = 1180;
  const ucX = 405;
  const ucRx = 140;
  const parts = [svgStart(width, height, "Use case tổng quát", false)];
  parts.push(`<rect class="boundary" x="120" y="20" width="470" height="1135"/>`);

  const actorPos = Object.fromEntries(generalActors.map(({ name, x, y }) => [name, { x, y }]));

  generalActors.forEach(({ name, x, y }) => parts.push(actor(x, y, name)));

  generalActorHierarchy.forEach(([child, parent]) => {
    const c = actorPos[child];
    const p = actorPos[parent];
    if (!c || !p) return;
    const x = c.x;
    const startY = c.y - 58;
    const endY = p.y + 42;
    parts.push(`<path class="relation" d="M${x} ${startY} L${x} ${endY}"/>`);
    parts.push(`<path d="M${x} ${endY} L${x - 9} ${endY + 17} L${x + 9} ${endY + 17} Z" fill="#fff" stroke="#111" stroke-width="1.1"/>`);
  });

  generalUseCaseSpecs.forEach((row) => {
    parts.push(usecase(ucX, row.diagramY, ucRx, 18, wrapLabel(row.name, 34, 2)));
    row.actors.forEach((actorName) => {
      const from = actorPos[actorName];
      if (!from) return;
      parts.push(`<path class="relation" d="M${from.x + 25} ${from.y} L${ucX - ucRx} ${row.diagramY}"/>`);
    });
  });

  parts.push(svgEnd());
  save("usecase-tong-quat/usecase-tong-quat.svg", parts.join("\n"));
}

function activitySvg(spec) {
  const width = 1120;
  const height = 960;
  const steps = [
    `${spec.actors.join("/")} chọn chức năng ${spec.code}`,
    "Frontend mở màn hình và gửi yêu cầu",
    "Backend kiểm tra phiên đăng nhập và quyền truy cập",
    "Validate tham số, query hoặc body",
    `Xử lý nghiệp vụ: ${spec.details.slice(0, 3).join(", ")}`,
    `Truy vấn/cập nhật dữ liệu: ${spec.classes.slice(0, 4).join(", ")}`,
    "Trả response cho frontend",
    "Giao diện hiển thị kết quả hoặc thông báo lỗi",
  ];
  const parts = [svgStart(width, height, `Hoạt động - ${spec.code}. ${spec.name}`)];
  parts.push(`<circle cx="560" cy="75" r="12" fill="#111"/>`);
  let prevY = 87;

  steps.forEach((step, index) => {
    const y = 125 + index * 95;
    if (index === 3) {
      parts.push(diamond(430, y, 260, 74, "Dữ liệu hợp lệ?"));
      parts.push(arrow(560, prevY, 560, y));
      parts.push(rectBox(755, y + 10, 250, 50, "Trả lỗi validate/quyền", "soft"));
      parts.push(arrow(690, y + 37, 755, y + 35, "Không"));
      prevY = y + 74;
      return;
    }
    parts.push(rectBox(300, y, 520, 60, wrapLabel(step, 58, 2)));
    parts.push(arrow(560, prevY, 560, y));
    prevY = y + 60;
  });

  parts.push(arrow(560, prevY, 560, 905));
  parts.push(`<circle cx="560" cy="925" r="13" fill="#fff" stroke="#111" stroke-width="1.5"/><circle cx="560" cy="925" r="8" fill="#111"/>`);
  parts.push(svgEnd());
  return parts.join("\n");
}

function activityManageSvg(spec) {
  const width = 980;
  const height = 760;
  const featureName = cleanText(spec.name);
  const details = spec.details.map(cleanText);
  const name = `${spec.code}. ${featureName}`;
  const addLabel = details.find((item) => /thêm|tạo/i.test(item)) ?? `Thêm ${featureName.replace(/^Quản lý\s+/i, "")}`;
  const viewLabel = details.find((item) => /xem|danh sách/i.test(item)) ?? "Xem danh sách";
  const selectLabel = details.find((item) => /chọn|lọc|tìm/i.test(item)) ?? "Chọn bản ghi";
  const editLabel = details.find((item) => /sửa|cập nhật|gán/i.test(item)) ?? "Sửa thông tin";
  const deleteLabel = details.find((item) => /xóa|hủy/i.test(item)) ?? "Xóa bản ghi";
  const parts = [svgStart(width, height, `Hoạt động - ${name}`)];
  const flowPath = (points, label = "", labelX = 0, labelY = 0) => {
    const pathPoints =
      points.length === 2 && points[0][0] !== points[1][0] && points[0][1] !== points[1][1]
        ? [points[0], [points[1][0], points[0][1]], points[1]]
        : points;
    const d = pathPoints
      .map(([x, y], index) => {
        if (index === 0) return `M${x} ${y}`;
        const [prevX, prevY] = pathPoints[index - 1];
        if (x === prevX) return `V${y}`;
        if (y === prevY) return `H${x}`;
        return `L${x} ${y}`;
      })
      .join(" ");
    const labelSvg = label ? `<text x="${labelX}" y="${labelY}" text-anchor="middle" class="tiny">${esc(label)}</text>` : "";
    return `<path class="line" d="${d}"/>${labelSvg}`;
  };
  const actionBox = (x, y, w, h, text) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="#aee8ff" stroke="#111" stroke-width="1.2"/>
${textBlock(x + Math.round(w / 2), y + Math.round(h / 2), wrapLabel(text, 20, 2), "tiny", 12)}`;
  const groupBox = (x, y, w, h, label) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="#fff" stroke="#111" stroke-width="1.2"/>
<text x="${x + 14}" y="${y + 22}" class="small" font-weight="700">${esc(label)}</text>`;

  const startX = 95;
  parts.push(`<circle cx="${startX}" cy="72" r="12" fill="#111"/>`);
  parts.push(actionBox(35, 115, 120, 44, `Chọn ${featureName}`));
  parts.push(flowPath([[startX, 84], [startX, 115]]));
  parts.push(diamond(65, 185, 60, 46, ""));
  parts.push(flowPath([[startX, 159], [startX, 185]]));

  parts.push(actionBox(18, 270, 94, 46, "Lưu"));
  parts.push(actionBox(137, 270, 94, 46, "Hủy"));
  parts.push(flowPath([[80, 231], [65, 250], [65, 270]], "thêm", 44, 248));
  parts.push(flowPath([[110, 231], [184, 250], [184, 270]], "hủy", 158, 248));
  parts.push(diamond(81, 365, 55, 42, ""));
  parts.push(flowPath([[65, 316], [65, 386], [81, 386]]));
  parts.push(flowPath([[184, 316], [184, 386], [136, 386]]));
  parts.push(`<circle cx="108" cy="455" r="13" fill="#fff" stroke="#111" stroke-width="1.5"/><circle cx="108" cy="455" r="8" fill="#111"/>`);
  parts.push(flowPath([[108, 407], [108, 442]]));

  parts.push(groupBox(285, 115, 210, 430, "Xem / xóa"));
  parts.push(`<circle cx="390" cy="165" r="11" fill="#111"/>`);
  parts.push(actionBox(320, 220, 140, 42, viewLabel));
  parts.push(flowPath([[390, 176], [390, 220]]));
  parts.push(actionBox(320, 290, 140, 42, selectLabel));
  parts.push(flowPath([[390, 262], [390, 290]]));
  parts.push(diamond(360, 360, 60, 46, ""));
  parts.push(flowPath([[390, 332], [390, 360]]));
  parts.push(actionBox(320, 435, 140, 48, deleteLabel));
  parts.push(flowPath([[390, 406], [390, 435]], "delete", 421, 425));
  parts.push(`<circle cx="390" cy="522" r="13" fill="#fff" stroke="#111" stroke-width="1.5"/><circle cx="390" cy="522" r="8" fill="#111"/>`);
  parts.push(flowPath([[390, 483], [390, 509]]));

  parts.push(groupBox(590, 315, 300, 315, "Sửa"));
  parts.push(`<circle cx="740" cy="365" r="11" fill="#111"/>`);
  parts.push(actionBox(670, 420, 140, 42, editLabel));
  parts.push(flowPath([[740, 376], [740, 420]]));
  parts.push(diamond(710, 490, 60, 46, ""));
  parts.push(flowPath([[740, 462], [740, 490]]));
  parts.push(actionBox(625, 565, 110, 42, "Lưu thay đổi"));
  parts.push(actionBox(775, 565, 90, 42, "Hủy"));
  parts.push(flowPath([[725, 536], [680, 555], [680, 565]], "true", 681, 548));
  parts.push(flowPath([[755, 536], [820, 555], [820, 565]], "false", 819, 548));
  parts.push(diamond(722, 665, 55, 42, ""));
  parts.push(flowPath([[680, 607], [680, 686], [722, 686]]));
  parts.push(flowPath([[820, 607], [820, 686], [777, 686]]));
  parts.push(`<circle cx="750" cy="735" r="13" fill="#fff" stroke="#111" stroke-width="1.5"/><circle cx="750" cy="735" r="8" fill="#111"/>`);
  parts.push(flowPath([[750, 707], [750, 722]]));

  parts.push(flowPath([[125, 208], [285, 208], [285, 165], [390, 165]], "xem", 230, 198));
  parts.push(flowPath([[420, 383], [590, 383], [590, 365], [740, 365]], "edit", 515, 374));
  parts.push(svgEnd());
  return parts.join("\n");
}

function activityManageFrameSvg(spec) {
  const width = 980;
  const height = 760;
  const featureName = cleanText(spec.name);
  const specCode = spec.code ?? `UC${String(spec.number).padStart(2, "0")}`;
  const objectName = featureName.includes("Phân quyền") ? "RBAC" : featureName.replace(/^Quản lý\s+/i, "");
  const details = (spec.details ?? spec.extends ?? []).map(cleanText);
  const addLabel = details.find((item) => /thêm|tạo/i.test(item)) ?? `Thêm ${objectName}`;
  const viewLabel = details.find((item) => /xem|danh sách/i.test(item)) ?? `Xem ${objectName}`;
  const selectLabel = details.find((item) => /chọn|lọc|tìm/i.test(item)) ?? `Chọn ${objectName}`;
  const editLabel = details.find((item) => /sửa|cập nhật|gán/i.test(item)) ?? `Sửa ${objectName}`;
  const deleteLabel = details.find((item) => /xóa|hủy|khóa|ẩn/i.test(item)) ?? `Xóa ${objectName}`;
  const parts = [svgStart(width, height, `Hoạt động - ${specCode}. ${featureName}`, false)];
  const flowPath = (points, label = "", labelX = 0, labelY = 0) => {
    const d = points.map(([x, y], index) => `${index === 0 ? "M" : "L"}${x} ${y}`).join(" ");
    const displayLabel = label === "true" ? "Có" : label === "false" ? "Không" : label;
    const labelWidth = Math.max(36, displayLabel.length * 7 + 14);
    const labelSvg = displayLabel
      ? `<rect x="${Math.round(labelX - labelWidth / 2)}" y="${labelY - 13}" width="${labelWidth}" height="18" rx="4" fill="#fff"/>
<text x="${labelX}" y="${labelY}" text-anchor="middle" class="tiny">${esc(displayLabel)}</text>`
      : "";
    return `<path class="line" d="${d}"/>${labelSvg}`;
  };
  const actionBox = (x, y, w, h, text) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="#aee8ff" stroke="#111" stroke-width="1.2"/>
${textBlock(x + Math.round(w / 2), y + Math.round(h / 2), wrapLabel(text, 18, 2), "tiny", 12)}`;
  const groupBox = (x, y, w, h, label) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="#fff" stroke="#111" stroke-width="1.2"/>
<text x="${x + 14}" y="${y + 22}" class="small" font-weight="700">${esc(label)}</text>`;

  parts.push(`<rect class="boundary" x="25" y="18" width="930" height="725" rx="16"/>`);
  parts.push(`<text x="42" y="43" class="small" font-weight="700">${esc(featureName)}</text>`);

  const startX = 105;
  parts.push(`<circle cx="${startX}" cy="92" r="12" fill="#111"/>`);
  parts.push(actionBox(45, 135, 120, 44, addLabel));
  parts.push(flowPath([[startX, 104], [startX, 135]]));
  parts.push(diamond(75, 205, 60, 46, ""));
  parts.push(flowPath([[startX, 179], [startX, 205]]));
  parts.push(actionBox(28, 290, 94, 46, "Lưu"));
  parts.push(actionBox(147, 290, 94, 46, "Hủy"));
  parts.push(flowPath([[90, 251], [75, 270], [75, 290]], "true", 50, 262));
  parts.push(flowPath([[120, 251], [194, 270], [194, 290]], "false", 205, 262));
  parts.push(diamond(91, 385, 55, 42, ""));
  parts.push(flowPath([[75, 336], [75, 406], [91, 406]]));
  parts.push(flowPath([[194, 336], [194, 406], [146, 406]]));
  parts.push(`<circle cx="118" cy="477" r="13" fill="#fff" stroke="#111" stroke-width="1.5"/><circle cx="118" cy="477" r="8" fill="#111"/>`);
  parts.push(flowPath([[118, 427], [118, 464]]));

  parts.push(groupBox(285, 135, 210, 455, "Xem / thao tác"));
  parts.push(`<circle cx="390" cy="185" r="11" fill="#111"/>`);
  parts.push(actionBox(320, 240, 140, 42, viewLabel));
  parts.push(flowPath([[390, 196], [390, 240]]));
  parts.push(actionBox(320, 310, 140, 42, selectLabel));
  parts.push(flowPath([[390, 282], [390, 310]]));
  parts.push(diamond(360, 380, 60, 46, ""));
  parts.push(flowPath([[390, 352], [390, 380]]));
  parts.push(actionBox(320, 455, 140, 48, deleteLabel));
  parts.push(flowPath([[390, 426], [390, 455]], "true", 435, 445));
  parts.push(`<circle cx="390" cy="543" r="13" fill="#fff" stroke="#111" stroke-width="1.5"/><circle cx="390" cy="543" r="8" fill="#111"/>`);
  parts.push(flowPath([[390, 503], [390, 530]]));

  parts.push(groupBox(590, 345, 300, 380, "Sửa"));
  parts.push(`<circle cx="740" cy="392" r="11" fill="#111"/>`);
  parts.push(actionBox(670, 432, 140, 42, editLabel));
  parts.push(flowPath([[740, 403], [740, 432]]));
  parts.push(diamond(710, 500, 60, 46, ""));
  parts.push(flowPath([[740, 474], [740, 500]]));
  parts.push(actionBox(625, 575, 110, 42, "Lưu thay đổi"));
  parts.push(actionBox(775, 575, 90, 42, "Hủy"));
  parts.push(flowPath([[725, 546], [680, 565], [680, 575]], "true", 650, 558));
  parts.push(flowPath([[755, 546], [820, 565], [820, 575]], "false", 850, 558));
  parts.push(diamond(722, 640, 55, 42, ""));
  parts.push(flowPath([[680, 617], [680, 661], [722, 661]]));
  parts.push(flowPath([[820, 617], [820, 661], [777, 661]]));
  parts.push(`<circle cx="750" cy="704" r="13" fill="#fff" stroke="#111" stroke-width="1.5"/><circle cx="750" cy="704" r="8" fill="#111"/>`);
  parts.push(flowPath([[750, 682], [750, 691]]));

  parts.push(flowPath([[135, 228], [285, 228], [285, 185], [390, 185]], "xem", 230, 218));
  parts.push(flowPath([[420, 403], [590, 403], [590, 392], [740, 392]], "edit", 515, 393));
  parts.push(svgEnd());
  return parts.join("\n");
}

function authActivityFrameSvg(spec) {
  const width = 980;
  const height = 760;
  const featureName = cleanText(spec.name);
  const specCode = spec.code ?? `UC${String(spec.number).padStart(2, "0")}`;
  const isLogin = featureName.includes("Đăng nhập");
  const parts = [svgStart(width, height, `Hoạt động - ${specCode}. ${featureName}`, false)];
  const flowPath = (points, label = "", labelX = 0, labelY = 0) => {
    const d = points.map(([x, y], index) => `${index === 0 ? "M" : "L"}${x} ${y}`).join(" ");
    const displayLabel = label === "true" ? "Có" : label === "false" ? "Không" : label;
    const labelWidth = Math.max(36, displayLabel.length * 7 + 14);
    const labelSvg = displayLabel
      ? `<rect x="${Math.round(labelX - labelWidth / 2)}" y="${labelY - 13}" width="${labelWidth}" height="18" rx="4" fill="#fff"/>
<text x="${labelX}" y="${labelY}" text-anchor="middle" class="tiny">${esc(displayLabel)}</text>`
      : "";
    return `<path class="line" d="${d}"/>${labelSvg}`;
  };
  const actionBox = (x, y, w, h, text) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="#aee8ff" stroke="#111" stroke-width="1.2"/>
${textBlock(x + Math.round(w / 2), y + Math.round(h / 2), wrapLabel(text, 26, 2), "tiny", 12)}`;

  parts.push(`<rect class="boundary" x="25" y="18" width="930" height="725" rx="16"/>`);
  parts.push(`<text x="42" y="43" class="small" font-weight="700">${esc(featureName)}</text>`);
  parts.push(`<line x1="270" y1="60" x2="270" y2="720" stroke="#bbb" stroke-width="1"/>`);
  parts.push(`<line x1="610" y1="60" x2="610" y2="720" stroke="#bbb" stroke-width="1"/>`);
  parts.push(`<text x="145" y="78" text-anchor="middle" class="small" font-weight="700">Người dùng</text>`);
  parts.push(`<text x="440" y="78" text-anchor="middle" class="small" font-weight="700">Frontend</text>`);
  parts.push(`<text x="785" y="78" text-anchor="middle" class="small" font-weight="700">Backend / CSDL</text>`);

  if (isLogin) {
    parts.push(`<circle cx="145" cy="115" r="12" fill="#111"/>`);
    parts.push(actionBox(78, 150, 134, 44, "Mở màn hình đăng nhập"));
    parts.push(actionBox(78, 220, 134, 48, "Nhập email và mật khẩu"));
    parts.push(actionBox(360, 220, 160, 48, "Gửi thông tin đăng nhập"));
    parts.push(actionBox(705, 220, 160, 48, "Kiểm tra định dạng"));
    parts.push(actionBox(705, 305, 160, 48, "Xác thực email và mật khẩu"));
    parts.push(diamond(755, 390, 80, 56, "Hợp lệ?"));
    parts.push(actionBox(700, 485, 170, 50, "Xóa phiên cũ, tạo phiên mới và token"));
    parts.push(actionBox(350, 485, 180, 50, "Lưu token, quyền và điều hướng"));
    parts.push(actionBox(340, 610, 200, 48, "Hiển thị lỗi đăng nhập"));
    parts.push(`<circle cx="440" cy="704" r="13" fill="#fff" stroke="#111" stroke-width="1.5"/><circle cx="440" cy="704" r="8" fill="#111"/>`);
    parts.push(flowPath([[145, 127], [145, 150]]));
    parts.push(flowPath([[145, 194], [145, 220]]));
    parts.push(flowPath([[212, 244], [360, 244]]));
    parts.push(flowPath([[520, 244], [705, 244]]));
    parts.push(flowPath([[785, 268], [785, 305]]));
    parts.push(flowPath([[785, 353], [795, 390]]));
    parts.push(flowPath([[795, 446], [795, 485]], "Đúng", 830, 470));
    parts.push(flowPath([[700, 510], [530, 510]]));
    parts.push(flowPath([[440, 535], [440, 691]]));
    parts.push(flowPath([[755, 418], [440, 418], [440, 610]], "Sai", 570, 408));
    parts.push(flowPath([[440, 658], [440, 691]]));
  } else {
    parts.push(`<circle cx="145" cy="115" r="12" fill="#111"/>`);
    parts.push(actionBox(78, 150, 134, 44, "Mở màn hình đăng kí"));
    parts.push(actionBox(76, 220, 138, 54, "Nhập họ tên, email, mật khẩu và xác nhận"));
    parts.push(actionBox(360, 225, 160, 48, "Gửi form đăng kí"));
    parts.push(actionBox(705, 220, 160, 54, "Kiểm tra email, mật khẩu và dữ liệu bắt buộc"));
    parts.push(diamond(755, 340, 80, 56, "Hợp lệ?"));
    parts.push(actionBox(705, 440, 160, 50, "Tạo tài khoản USER, phiên và token"));
    parts.push(actionBox(345, 440, 190, 50, "Lưu token, quyền và điều hướng"));
    parts.push(actionBox(340, 595, 200, 48, "Hiển thị lỗi đăng kí"));
    parts.push(`<circle cx="440" cy="704" r="13" fill="#fff" stroke="#111" stroke-width="1.5"/><circle cx="440" cy="704" r="8" fill="#111"/>`);
    parts.push(flowPath([[145, 127], [145, 150]]));
    parts.push(flowPath([[145, 194], [145, 220]]));
    parts.push(flowPath([[214, 247], [360, 247]]));
    parts.push(flowPath([[520, 249], [705, 249]]));
    parts.push(flowPath([[785, 274], [795, 340]]));
    parts.push(flowPath([[795, 396], [795, 440]], "Đúng", 830, 420));
    parts.push(flowPath([[705, 465], [535, 465]]));
    parts.push(flowPath([[440, 490], [440, 691]]));
    parts.push(flowPath([[755, 368], [440, 368], [440, 595]], "Sai", 570, 358));
    parts.push(flowPath([[440, 643], [440, 691]]));
  }

  parts.push(svgEnd());
  return parts.join("\n");
}

function authActivitySwimlaneSvgOld(spec) {
  const width = 980;
  const height = 850;
  const featureName = cleanText(spec.name);
  const specCode = spec.code ?? `UC${String(spec.number).padStart(2, "0")}`;
  const isLogin = spec.number === 11 || featureName.includes("Đăng nhập");
  const parts = [svgStart(width, height, `Hoạt động - ${specCode}. ${featureName}`, false)];
  const flowPath = (points, label = "", labelX = 0, labelY = 0) => {
    const d = points.map(([x, y], index) => `${index === 0 ? "M" : "L"}${x} ${y}`).join(" ");
    const labelWidth = Math.max(36, label.length * 7 + 14);
    const labelSvg = label
      ? `<rect x="${Math.round(labelX - labelWidth / 2)}" y="${labelY - 13}" width="${labelWidth}" height="18" rx="4" fill="#fff"/>
<text x="${labelX}" y="${labelY}" text-anchor="middle" class="tiny">${esc(label)}</text>`
      : "";
    return `<path class="line" d="${d}"/>${labelSvg}`;
  };
  const actionBox = (x, y, w, h, text) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="16" fill="#fff" stroke="#111" stroke-width="1.2"/>
${textBlock(x + Math.round(w / 2), y + Math.round(h / 2), wrapLabel(text, 24, 3), "tiny", 12)}`;
  const noteLabel = (x, y, text) => `<rect x="${x - 34}" y="${y - 13}" width="68" height="18" rx="4" fill="#fff"/>
<text x="${x}" y="${y}" text-anchor="middle" class="tiny">${esc(text)}</text>`;

  const frame = { x: 45, y: 35, w: 890, h: 725 };
  const splitX = 370;
  const userX = 205;
  const systemX = 665;

  parts.push(`<rect class="boundary" x="${frame.x}" y="${frame.y}" width="${frame.w}" height="${frame.h}" rx="16"/>`);
  parts.push(`<line x1="${splitX}" y1="${frame.y}" x2="${splitX}" y2="${frame.y + frame.h}" stroke="#777" stroke-width="1.2"/>`);
  parts.push(`<text x="${frame.x + 12}" y="${frame.y + 22}" class="tiny" font-weight="700">User</text>`);
  parts.push(`<text x="${splitX + 12}" y="${frame.y + 22}" class="tiny" font-weight="700">System</text>`);
  parts.push(`<circle cx="${systemX}" cy="92" r="12" fill="#111"/>`);

  if (isLogin) {
    parts.push(actionBox(585, 140, 160, 48, "Hiện form đăng nhập"));
    parts.push(diamond(125, 150, 56, 48, ""));
    parts.push(actionBox(145, 245, 120, 52, "Nhập email và password"));
    parts.push(actionBox(145, 350, 120, 48, "Nhấn đăng nhập"));
    parts.push(actionBox(585, 350, 160, 48, "Kiểm tra thông tin"));
    parts.push(diamond(630, 455, 70, 54, ""));
    parts.push(actionBox(545, 560, 160, 54, "Lưu thông tin người dùng"));
    parts.push(actionBox(755, 560, 130, 54, "Hiện thông báo"));
    parts.push(actionBox(535, 650, 180, 54, "Điều hướng về trang chủ và hiện thông báo"));
    parts.push(`<circle cx="${systemX}" cy="725" r="13" fill="#fff" stroke="#111" stroke-width="1.5"/><circle cx="${systemX}" cy="725" r="8" fill="#111"/>`);
    parts.push(flowPath([[systemX, 104], [systemX, 140]]));
    parts.push(flowPath([[585, 164], [181, 164]]));
    parts.push(flowPath([[153, 198], [userX, 245]], "Tiếp tục", 250, 218));
    parts.push(flowPath([[userX, 297], [userX, 350]]));
    parts.push(flowPath([[265, 374], [585, 374]]));
    parts.push(flowPath([[665, 398], [665, 455]]));
    parts.push(flowPath([[665, 509], [625, 560]], "Hợp lệ", 610, 535));
    parts.push(flowPath([[700, 482], [820, 482], [820, 560]], "Không hợp lệ", 805, 468));
    parts.push(flowPath([[625, 614], [625, 650]]));
    parts.push(flowPath([[625, 704], [665, 725]]));
    parts.push(flowPath([[820, 614], [820, 735], [105, 735], [105, 174], [125, 174]]));
    parts.push(noteLabel(105, 220, "Thoát"));
  } else {
    parts.push(actionBox(585, 140, 160, 48, "Hiện form đăng kí"));
    parts.push(diamond(125, 150, 56, 48, ""));
    parts.push(actionBox(135, 235, 140, 66, "Nhập họ tên, email, password và xác nhận"));
    parts.push(actionBox(145, 350, 120, 48, "Nhấn đăng kí"));
    parts.push(actionBox(585, 350, 160, 58, "Kiểm tra email, password và dữ liệu"));
    parts.push(diamond(630, 465, 70, 54, ""));
    parts.push(actionBox(545, 565, 160, 58, "Tạo tài khoản USER, phiên và token"));
    parts.push(actionBox(755, 565, 130, 54, "Hiện thông báo"));
    parts.push(actionBox(535, 655, 180, 54, "Lưu thông tin và điều hướng"));
    parts.push(`<circle cx="${systemX}" cy="735" r="13" fill="#fff" stroke="#111" stroke-width="1.5"/><circle cx="${systemX}" cy="735" r="8" fill="#111"/>`);
    parts.push(flowPath([[systemX, 104], [systemX, 140]]));
    parts.push(flowPath([[585, 164], [181, 164]]));
    parts.push(flowPath([[153, 198], [userX, 235]], "Tiếp tục", 250, 218));
    parts.push(flowPath([[userX, 301], [userX, 350]]));
    parts.push(flowPath([[265, 374], [585, 374]]));
    parts.push(flowPath([[665, 408], [665, 465]]));
    parts.push(flowPath([[665, 519], [625, 565]], "Hợp lệ", 610, 540));
    parts.push(flowPath([[700, 492], [820, 492], [820, 565]], "Không hợp lệ", 805, 478));
    parts.push(flowPath([[625, 623], [625, 655]]));
    parts.push(flowPath([[625, 709], [665, 735]]));
    parts.push(flowPath([[820, 619], [820, 745], [105, 745], [105, 174], [125, 174]]));
    parts.push(noteLabel(105, 220, "Thoát"));
  }

  parts.push(svgEnd());
  return parts.join("\n");
}

function authActivitySwimlaneSvg(spec) {
  const width = 980;
  const height = 820;
  const featureName = cleanText(spec.name);
  const specCode = spec.code ?? `UC${String(spec.number).padStart(2, "0")}`;
  const isLogin = spec.number === 11 || featureName.includes("Đăng nhập");
  const parts = [svgStart(width, height, `Hoạt động - ${specCode}. ${featureName}`, false)];
  const frame = { x: 35, y: 45, w: 910, h: 785 };
  const headerY = 78;
  const splitX = 415;
  const userX = 205;
  const systemX = 700;

  const labelBox = (x, y, text) => {
    const labelWidth = Math.max(44, text.length * 7 + 16);
    return `<rect x="${Math.round(x - labelWidth / 2)}" y="${y - 13}" width="${labelWidth}" height="18" rx="4" fill="#fff"/>
<text x="${x}" y="${y}" text-anchor="middle" class="tiny">${esc(text)}</text>`;
  };
  const path = (points, label = "", labelX = 0, labelY = 0, cls = "line") => {
    const d = points.map(([x, y], index) => `${index === 0 ? "M" : "L"}${x} ${y}`).join(" ");
    return `<path class="${cls}" d="${d}"/>${label ? labelBox(labelX, labelY, label) : ""}`;
  };
  const dashedPath = (points) => {
    const d = points.map(([x, y], index) => `${index === 0 ? "M" : "L"}${x} ${y}`).join(" ");
    return `<path d="${d}" stroke="#777" stroke-width="1.2" stroke-dasharray="6 5" fill="none" marker-end="url(#arrow)"/>`;
  };
  const actionBox = (x, y, w, h, text) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="#fff" stroke="#111" stroke-width="1.35"/>
${textBlock(x + Math.round(w / 2), y + Math.round(h / 2), wrapLabel(text, 34, 3), "tiny", 12)}`;

  parts.push(`<text x="55" y="28" class="title">${esc(featureName)}</text>`);
  parts.push(`<rect class="boundary" x="${frame.x}" y="${frame.y}" width="${frame.w}" height="${frame.h}"/>`);
  parts.push(`<line x1="${frame.x}" y1="${headerY}" x2="${frame.x + frame.w}" y2="${headerY}" stroke="#777" stroke-width="1.2"/>`);
  parts.push(`<line x1="${splitX}" y1="${frame.y}" x2="${splitX}" y2="${frame.y + frame.h}" stroke="#777" stroke-width="1.2"/>`);
  parts.push(`<text x="${Math.round((frame.x + splitX) / 2)}" y="67" text-anchor="middle" class="tiny">Người dùng</text>`);
  parts.push(`<text x="${Math.round((splitX + frame.x + frame.w) / 2)}" y="67" text-anchor="middle" class="tiny">Hệ thống</text>`);
  parts.push(`<circle cx="${systemX}" cy="118" r="13" fill="#111"/>`);

  if (isLogin) {
    parts.push(actionBox(userX - 150, 165, 300, 58, "Chọn Đăng nhập"));
    parts.push(actionBox(systemX - 150, 255, 300, 58, "Hiển thị form đăng nhập"));
    parts.push(actionBox(userX - 150, 340, 300, 58, "Nhập email và password"));
    parts.push(actionBox(userX - 150, 445, 300, 58, "Nhấn đăng nhập"));
    parts.push(actionBox(systemX - 150, 445, 300, 58, "Kiểm tra thông tin"));
    parts.push(actionBox(systemX - 150, 555, 300, 58, "Lưu thông tin người dùng"));
    parts.push(actionBox(795, 555, 125, 58, "Hiện thông báo"));
    parts.push(actionBox(systemX - 150, 645, 300, 58, "Điều hướng về trang chủ và hiện thông báo"));
    parts.push(diamond(systemX - 70, 718, 140, 70, "Thành công?"));
    parts.push(`<circle cx="${systemX}" cy="808" r="13" fill="#fff" stroke="#111" stroke-width="1.5"/><circle cx="${systemX}" cy="808" r="8" fill="#111"/>`);
    parts.push(path([[systemX, 131], [systemX, 146], [userX, 146], [userX, 165]]));
    parts.push(path([[userX + 150, 194], [systemX, 194], [systemX, 255]]));
    parts.push(path([[systemX - 150, 284], [userX, 284], [userX, 340]]));
    parts.push(path([[userX, 398], [userX, 445]]));
    parts.push(path([[userX + 150, 474], [systemX - 150, 474]]));
    parts.push(path([[systemX, 503], [systemX, 555]]));
    parts.push(path([[systemX, 613], [systemX, 645]]));
    parts.push(path([[systemX, 703], [systemX, 718]]));
    parts.push(path([[systemX, 788], [systemX, 795]], "true", 735, 792));
    parts.push(path([[770, 753], [795, 753], [795, 584]], "false", 805, 735));
    parts.push(dashedPath([[858, 613], [858, 745], [65, 745], [65, 369], [55, 369]]));
  } else {
    parts.push(actionBox(userX - 150, 165, 300, 58, "Chọn Đăng kí"));
    parts.push(actionBox(systemX - 150, 255, 300, 58, "Hiển thị form đăng kí"));
    parts.push(actionBox(userX - 150, 340, 300, 70, "Nhập họ tên, email, password và xác nhận"));
    parts.push(actionBox(userX - 150, 455, 300, 58, "Nhấn đăng kí"));
    parts.push(actionBox(systemX - 150, 455, 300, 58, "Kiểm tra email, password và dữ liệu"));
    parts.push(actionBox(systemX - 150, 565, 300, 58, "Tạo tài khoản USER, phiên và token"));
    parts.push(actionBox(795, 565, 125, 58, "Hiện thông báo"));
    parts.push(actionBox(systemX - 150, 655, 300, 58, "Lưu thông tin và điều hướng"));
    parts.push(diamond(systemX - 70, 728, 140, 70, "Thành công?"));
    parts.push(`<circle cx="${systemX}" cy="808" r="13" fill="#fff" stroke="#111" stroke-width="1.5"/><circle cx="${systemX}" cy="808" r="8" fill="#111"/>`);
    parts.push(path([[systemX, 131], [systemX, 146], [userX, 146], [userX, 165]]));
    parts.push(path([[userX + 150, 194], [systemX, 194], [systemX, 255]]));
    parts.push(path([[systemX - 150, 284], [userX, 284], [userX, 340]]));
    parts.push(path([[userX, 410], [userX, 455]]));
    parts.push(path([[userX + 150, 484], [systemX - 150, 484]]));
    parts.push(path([[systemX, 513], [systemX, 565]]));
    parts.push(path([[systemX, 623], [systemX, 655]]));
    parts.push(path([[systemX, 713], [systemX, 728]]));
    parts.push(path([[systemX, 798], [systemX, 795]], "true", 735, 792));
    parts.push(path([[770, 763], [795, 763], [795, 594]], "false", 805, 745));
    parts.push(dashedPath([[858, 623], [858, 745], [65, 745], [65, 375], [55, 375]]));
  }

  parts.push(svgEnd());
  return parts.join("\n");
}

function authActivityCleanSwimlaneSvg(spec) {
  const width = 980;
  const height = 900;
  const featureName = cleanText(spec.name);
  const specCode = spec.code ?? `UC${String(spec.number).padStart(2, "0")}`;
  const isLogin = spec.number === 11 || featureName.includes("Đăng nhập");
  const parts = [svgStart(width, height, `Hoạt động - ${specCode}. ${featureName}`, false)];

  const frame = { x: 55, y: 55, w: 870, h: 820 };
  const headerY = 85;
  const splitX = 420;
  const userX = 230;
  const systemX = 700;
  const userBox = { x: 90, w: 280 };
  const systemBox = { x: 560, w: 280 };

  const labelBox = (x, y, text) => {
    const labelWidth = Math.max(44, text.length * 7 + 18);
    return `<rect x="${Math.round(x - labelWidth / 2)}" y="${y - 13}" width="${labelWidth}" height="18" rx="4" fill="#fff"/>
<text x="${x}" y="${y}" text-anchor="middle" class="tiny">${esc(text)}</text>`;
  };
  const line = (points, label = "", labelX = 0, labelY = 0, dashed = false) => {
    const d = points.map(([x, y], index) => `${index === 0 ? "M" : "L"}${x} ${y}`).join(" ");
    const cls = dashed ? "" : "line";
    const attrs = dashed
      ? `stroke="#777" stroke-width="1.2" stroke-dasharray="6 5" fill="none" marker-end="url(#arrow)"`
      : `class="${cls}"`;
    return `<path ${attrs} d="${d}"/>${label ? labelBox(labelX, labelY, label) : ""}`;
  };
  const box = (x, y, w, h, text) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="#fff" stroke="#111" stroke-width="1.35"/>
${textBlock(x + Math.round(w / 2), y + Math.round(h / 2), wrapLabel(text, 34, 3), "tiny", 12)}`;

  const chooseText = isLogin ? "Chọn đăng nhập" : "Chọn đăng kí";
  const formText = isLogin ? "Hiển thị form đăng nhập" : "Hiển thị form đăng kí";
  const inputText = isLogin ? "Nhập email và password" : "Nhập họ tên, email, password và xác nhận";
  const submitText = isLogin ? "Nhấn đăng nhập" : "Nhấn đăng kí";
  const checkText = isLogin ? "Kiểm tra thông tin" : "Kiểm tra email, password và dữ liệu";
  const successText = isLogin ? "Lưu thông tin người dùng" : "Tạo tài khoản USER, phiên và token";
  const finalText = isLogin ? "Điều hướng về trang chủ và hiện thông báo" : "Lưu thông tin và điều hướng";
  const errorText = isLogin ? "Thông tin không hợp lệ" : "Dữ liệu không hợp lệ";

  const choose = { x: userBox.x, y: 155, w: userBox.w, h: 58 };
  const form = { x: systemBox.x, y: 245, w: systemBox.w, h: 58 };
  const input = { x: userBox.x, y: 355, w: userBox.w, h: isLogin ? 58 : 70 };
  const submit = { x: userBox.x, y: isLogin ? 465 : 485, w: userBox.w, h: 58 };
  const check = { x: systemBox.x, y: isLogin ? 465 : 485, w: systemBox.w, h: 58 };
  const success = { x: systemBox.x, y: isLogin ? 575 : 595, w: systemBox.w, h: 58 };
  const finalBox = { x: systemBox.x, y: isLogin ? 665 : 685, w: systemBox.w, h: 58 };
  const decision = { x: systemX - 75, y: isLogin ? 735 : 755, w: 150, h: 70 };
  const error = { x: 785, y: decision.y + Math.round(decision.h / 2) - 29, w: 140, h: 58 };
  const endY = 860;
  const loopY = frame.y + frame.h - 30;

  parts.push(`<text x="55" y="30" class="title">${esc(featureName)}</text>`);
  parts.push(`<rect class="boundary" x="${frame.x}" y="${frame.y}" width="${frame.w}" height="${frame.h}"/>`);
  parts.push(`<line x1="${frame.x}" y1="${headerY}" x2="${frame.x + frame.w}" y2="${headerY}" stroke="#777" stroke-width="1.2"/>`);
  parts.push(`<line x1="${splitX}" y1="${frame.y}" x2="${splitX}" y2="${frame.y + frame.h}" stroke="#777" stroke-width="1.2"/>`);
  parts.push(`<text x="${Math.round((frame.x + splitX) / 2)}" y="74" text-anchor="middle" class="tiny">Người dùng</text>`);
  parts.push(`<text x="${Math.round((splitX + frame.x + frame.w) / 2)}" y="74" text-anchor="middle" class="tiny">Hệ thống</text>`);

  parts.push(`<circle cx="${userX}" cy="122" r="13" fill="#111"/>`);
  parts.push(box(choose.x, choose.y, choose.w, choose.h, chooseText));
  parts.push(box(form.x, form.y, form.w, form.h, formText));
  parts.push(box(input.x, input.y, input.w, input.h, inputText));
  parts.push(box(submit.x, submit.y, submit.w, submit.h, submitText));
  parts.push(box(check.x, check.y, check.w, check.h, checkText));
  parts.push(box(success.x, success.y, success.w, success.h, successText));
  parts.push(box(finalBox.x, finalBox.y, finalBox.w, finalBox.h, finalText));
  parts.push(diamond(decision.x, decision.y, decision.w, decision.h, "Thành công?"));
  parts.push(box(error.x, error.y, error.w, error.h, errorText));
  parts.push(`<circle cx="${systemX}" cy="${endY}" r="13" fill="#fff" stroke="#111" stroke-width="1.5"/><circle cx="${systemX}" cy="${endY}" r="8" fill="#111"/>`);

  parts.push(line([[userX, 135], [userX, choose.y]]));
  parts.push(line([[choose.x + choose.w, choose.y + choose.h / 2], [systemX, choose.y + choose.h / 2], [systemX, form.y]]));
  parts.push(line([[form.x, form.y + form.h / 2], [userX, form.y + form.h / 2], [userX, input.y]]));
  parts.push(line([[userX, input.y + input.h], [userX, submit.y]]));
  parts.push(line([[submit.x + submit.w, submit.y + submit.h / 2], [check.x, check.y + check.h / 2]]));
  parts.push(line([[systemX, check.y + check.h], [systemX, success.y]]));
  parts.push(line([[systemX, success.y + success.h], [systemX, finalBox.y]]));
  parts.push(line([[systemX, finalBox.y + finalBox.h], [systemX, decision.y]]));
  parts.push(line([[systemX, decision.y + decision.h], [systemX, endY - 13]], "true", systemX + 38, decision.y + decision.h + 22));
  parts.push(line([[decision.x + decision.w, decision.y + decision.h / 2], [error.x, error.y + error.h / 2]], "false", error.x - 38, error.y + 18));
  parts.push(line([[error.x + error.w / 2, error.y + error.h], [error.x + error.w / 2, loopY], [70, loopY], [70, input.y + input.h / 2], [input.x, input.y + input.h / 2]], "", 0, 0, true));

  parts.push(svgEnd());
  return parts.join("\n");
}

function activitySwimlaneSvg(spec) {
  const actorNames = spec.actors.map(cleanText);
  const featureName = cleanText(spec.name);
  const details = spec.details.map(cleanText);
  const isView = featureName.startsWith("Xem") || featureName.includes("Dashboard");
  const isManage = featureName.startsWith("Quản lý") || featureName.includes("Phân quyền");
  if (isManage) return activityManageFrameSvg(spec);
  const flow = [
    `Chọn ${featureName}`,
    isView ? "Hiển thị dữ liệu" : "Hiển thị form",
    isManage ? "Chọn thao tác" : isView ? "Chọn điều kiện" : "Điền thông tin",
    "Kiểm tra",
    details[2] ?? featureName,
    isView ? "Hiển thị kết quả" : "Thông báo thành công",
  ];
  const firstActor = actorNames[0] ?? "Người dùng";
  let nodes = flow.map((text, index) => {
    const isActorStep = index === 0 || index === 2 || actorNames.some((actorName) => text.startsWith(actorName));
    return {
      lane: isActorStep ? "actor" : "system",
      text,
    };
  });
  if (isView) {
    nodes = [
      { lane: "actor", text: `Chọn ${featureName}` },
      { lane: "system", text: "Hiển thị dữ liệu" },
      { lane: "actor", text: "Chọn điều kiện" },
      { lane: "system", text: details[0] ?? "Lọc dữ liệu" },
      { lane: "system", text: "Hiển thị kết quả" },
    ];
  } else if (isManage) {
    nodes = [
      { lane: "actor", text: `Chọn ${featureName}` },
      { lane: "system", text: "Hiển thị danh sách" },
      { lane: "actor", text: "Chọn thao tác" },
      { lane: "system", text: "Hiển thị form" },
      { lane: "actor", text: "Điền thông tin" },
      { lane: "system", text: "Kiểm tra" },
      { lane: "system", text: details[2] ?? "Lưu thay đổi" },
      { lane: "system", text: "Thông báo thành công" },
    ];
  } else if (featureName.includes("Thanh toán")) {
    nodes = [
      { lane: "actor", text: "Chọn khóa học" },
      { lane: "system", text: "Tạo đơn thanh toán" },
      { lane: "system", text: "Tạo URL VNPay" },
      { lane: "actor", text: "Xác nhận thanh toán" },
      { lane: "system", text: "Cập nhật trạng thái" },
      { lane: "system", text: "Thông báo kết quả" },
    ];
  } else if (featureName.includes("Đăng ký") || featureName.includes("đăng nhập")) {
    nodes = [
      { lane: "actor", text: "Chọn đăng ký/đăng nhập" },
      { lane: "system", text: "Hiển thị form" },
      { lane: "actor", text: "Nhập thông tin" },
      { lane: "system", text: "Xác thực" },
      { lane: "system", text: "Tạo phiên đăng nhập" },
      { lane: "system", text: "Chuyển màn hình" },
    ];
  }
  const hasDecision = spec.alternateFlows?.length > 0;
  const rowGap = 88;
  const width = 860;
  const height = 235 + nodes.length * rowGap + (hasDecision ? 160 : 90);
  const frame = { x: 25, y: 55, w: width - 50, h: height - 90 };
  const titleH = 24;
  const laneH = 30;
  const leftW = 350;
  const laneTop = frame.y + titleH + laneH;
  const leftX = frame.x;
  const rightX = frame.x + leftW;
  const leftCx = leftX + Math.round(leftW / 2);
  const rightCx = rightX + Math.round((frame.w - leftW) / 2);
  const actorLabel = sequenceActorLabel(spec);
  const name = `${spec.code}. ${cleanText(spec.name)}`;
  const boxW = 260;
  const boxH = 56;
  const actorBoxX = leftCx - boxW / 2;
  const systemBoxX = rightCx - boxW / 2;
  const nodeCenter = (node) => (node.lane === "actor" ? leftCx : rightCx);
  const nodeBoxX = (node) => (node.lane === "actor" ? actorBoxX : systemBoxX);
  const parts = [svgStart(width, height, `Hoạt động - ${name}`)];
  const flowPath = (points, label = "", labelX = 0, labelY = 0, cls = "line") => {
    const pathPoints =
      points.length === 2 && points[0][0] !== points[1][0] && points[0][1] !== points[1][1]
        ? [points[0], [points[1][0], points[0][1]], points[1]]
        : points;
    const d = pathPoints
      .map(([x, y], index) => {
        if (index === 0) return `M${x} ${y}`;
        const [prevX, prevY] = pathPoints[index - 1];
        if (x === prevX) return `V${y}`;
        if (y === prevY) return `H${x}`;
        return `L${x} ${y}`;
      })
      .join(" ");
    const labelSvg = label ? `<text x="${labelX}" y="${labelY}" text-anchor="middle" class="tiny">${esc(label)}</text>` : "";
    return `<path class="${cls}" d="${d}"/>${labelSvg}`;
  };
  const connect = (from, to) => {
    if (from.lane === to.lane) {
      return flowPath([[from.cx, from.y + boxH], [to.cx, to.y]]);
    }
    const fromEdgeX = from.lane === "actor" ? from.x + boxW : from.x;
    const fromY = Math.round(from.y + boxH / 2);
    return flowPath([[fromEdgeX, fromY], [to.cx, fromY], [to.cx, to.y]]);
  };

  parts.push(`<rect class="boundary" x="${frame.x}" y="${frame.y}" width="${frame.w}" height="${frame.h}"/>`);
  parts.push(`<line class="relation" x1="${frame.x}" y1="${frame.y + titleH}" x2="${frame.x + frame.w}" y2="${frame.y + titleH}"/>`);
  parts.push(`<line class="relation" x1="${frame.x}" y1="${frame.y + titleH + laneH}" x2="${frame.x + frame.w}" y2="${frame.y + titleH + laneH}"/>`);
  parts.push(`<line class="relation" x1="${rightX}" y1="${frame.y + titleH}" x2="${rightX}" y2="${frame.y + frame.h}"/>`);
  parts.push(textBlock(frame.x + Math.round(frame.w / 2), frame.y + 12, name, "tiny", 12));
  parts.push(textBlock(leftCx, frame.y + titleH + 15, actorLabel, "tiny", 12));
  parts.push(textBlock(rightCx, frame.y + titleH + 15, "Hệ thống", "tiny", 12));

  const startY = laneTop + 38;
  parts.push(`<circle cx="${leftCx}" cy="${startY}" r="12" fill="#111"/>`);

  const renderedNodes = nodes.map((node, index) => {
    const y = laneTop + 82 + index * rowGap;
    const cx = nodeCenter(node);
    const x = nodeBoxX(node);
    parts.push(rectBox(x, y, boxW, boxH, wrapLabel(node.text, 34, 3)));
    return { ...node, x, y, cx };
  });

  if (renderedNodes[0]) {
    parts.push(flowPath([[leftCx, startY + 12], [renderedNodes[0].cx, renderedNodes[0].y]]));
  }
  for (let index = 0; index < renderedNodes.length - 1; index += 1) {
    parts.push(connect(renderedNodes[index], renderedNodes[index + 1]));
  }

  const last = renderedNodes.at(-1);
  const decisionY = last ? last.y + boxH + 48 : laneTop + 150;
  const decisionCx = rightCx;
  const decisionW = 140;
  const decisionH = 72;
  if (last) {
    const entryX = last.lane === "system" ? last.cx : last.x + boxW;
    if (last.lane === "system") {
      parts.push(flowPath([[last.cx, last.y + boxH], [decisionCx, decisionY]]));
    } else {
      parts.push(flowPath([[entryX, last.y + boxH / 2], [decisionCx, last.y + boxH / 2], [decisionCx, decisionY]]));
    }
  }

  parts.push(diamond(decisionCx - decisionW / 2, decisionY, decisionW, decisionH, "Thành công?"));
  const endY = decisionY + decisionH + 72;
  parts.push(flowPath([[decisionCx, decisionY + decisionH], [decisionCx, endY - 14]], "true", decisionCx + 28, decisionY + decisionH + 34));
  parts.push(`<circle cx="${decisionCx}" cy="${endY}" r="14" fill="#fff" stroke="#111" stroke-width="1.5"/><circle cx="${decisionCx}" cy="${endY}" r="9" fill="#111"/>`);

  if (hasDecision) {
    const errX = rightCx + 88;
    const errY = decisionY + 7;
    const altTitle = cleanText(spec.alternateFlows[0].title);
    parts.push(rectBox(errX, errY, 140, 58, wrapLabel(altTitle, 18, 2), "soft"));
    parts.push(flowPath([[decisionCx + decisionW / 2, decisionY + decisionH / 2], [errX, errY + 29]], "false", errX - 22, errY + 21));
    const retryNode = renderedNodes.find((node, index) => index > 0 && node.lane === "actor") ?? renderedNodes[0];
    const retryEntryX = retryNode ? retryNode.cx : actorBoxX + boxW / 2;
    const retryEntryY = retryNode?.y ?? laneTop + 150;
    const sideX = Math.max(frame.x + 18, (retryNode?.x ?? actorBoxX) - 24);
    const approachY = Math.max(laneTop + 20, retryEntryY - 26);
    parts.push(flowPath([[errX + 70, errY + 58], [errX + 70, errY + 86], [sideX, errY + 86], [sideX, approachY], [retryEntryX, approachY], [retryEntryX, retryEntryY]], "", 0, 0, "dashed"));
  }

  parts.push(svgEnd());
  return parts.join("\n");
}

function activityFromMainFlowSvg(spec) {
  const actorNames = spec.actors.map(cleanText);
  const firstActor = actorNames[0] ?? "Người dùng";
  const systemNames = [
    "Hệ thống",
    "Frontend",
    "Backend",
    "Controller",
    "Service",
    "Repository",
    "Repo",
    "Giao diện",
    "Payment",
    "Auth",
    "User",
    "Rbac",
    "Course",
    "Class",
    "Study",
    "Notification",
    "Dashboard",
  ];
  const actorPattern = new RegExp(`^(${actorNames.map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")}|Người dùng|Tác nhân|Admin|Manager|Teacher|Student)\\b`, "i");
  const systemPattern = new RegExp(`^(${systemNames.join("|")})`, "i");
  const steps = (spec.mainFlow?.length ? spec.mainFlow : [`Mở chức năng ${spec.name}`, "Hệ thống xử lý và hiển thị kết quả"]).map((text, index) => ({
    text: `${index + 1}. ${cleanText(text)}`,
    lane: actorPattern.test(cleanText(text)) && !systemPattern.test(cleanText(text)) ? "actor" : "system",
  }));
  const hasAlternate = spec.alternateFlows?.length > 0;
  const rowGap = 88;
  const width = 920;
  const height = 360 + steps.length * rowGap + (hasAlternate ? 200 : 160);
  const frame = { x: 0, y: 55, w: width - 25, h: height - 90 };
  const laneX = 25;
  const titleH = 26;
  const laneH = 34;
  const leftW = 350;
  const rightX = laneX + leftW;
  const frameRight = frame.x + frame.w;
  const laneTop = frame.y + titleH + laneH;
  const leftCx = laneX + Math.round(leftW / 2);
  const rightCx = rightX + Math.round((frameRight - rightX) / 2);
  const boxW = 292;
  const boxH = 58;
  const nodeCenter = (node) => (node.lane === "actor" ? leftCx : rightCx);
  const nodeBoxX = (node) => nodeCenter(node) - boxW / 2;
  const name = `${spec.code}. ${cleanText(spec.name)}`;
  const parts = [svgStart(width, height, `Hoạt động - ${name}`)];
  const flowPath = (points, label = "", labelX = 0, labelY = 0, cls = "line") => {
    const pathPoints =
      points.length === 2 && points[0][0] !== points[1][0] && points[0][1] !== points[1][1]
        ? [points[0], [points[1][0], points[0][1]], points[1]]
        : points;
    const d = pathPoints
      .map(([x, y], index) => {
        if (index === 0) return `M${x} ${y}`;
        const [prevX, prevY] = pathPoints[index - 1];
        if (x === prevX) return `V${y}`;
        if (y === prevY) return `H${x}`;
        return `L${x} ${y}`;
      })
      .join(" ");
    const labelSvg = label ? `<text x="${labelX}" y="${labelY}" text-anchor="middle" class="tiny">${esc(label)}</text>` : "";
    return `<path class="${cls}" d="${d}"/>${labelSvg}`;
  };
  const connect = (from, to) => {
    if (from.lane === to.lane) return flowPath([[from.cx, from.y + boxH], [to.cx, to.y]]);
    const fromEdgeX = from.lane === "actor" ? from.x + boxW : from.x;
    const fromY = Math.round(from.y + boxH / 2);
    return flowPath([[fromEdgeX, fromY], [to.cx, fromY], [to.cx, to.y]]);
  };

  parts.push(`<rect class="boundary" x="${frame.x}" y="${frame.y}" width="${frame.w}" height="${frame.h}"/>`);
  parts.push(`<line class="relation" x1="${frame.x}" y1="${frame.y + titleH}" x2="${frame.x + frame.w}" y2="${frame.y + titleH}"/>`);
  parts.push(`<line class="relation" x1="${frame.x}" y1="${frame.y + titleH + laneH}" x2="${frame.x + frame.w}" y2="${frame.y + titleH + laneH}"/>`);
  parts.push(`<line class="relation" x1="${rightX}" y1="${frame.y + titleH}" x2="${rightX}" y2="${frame.y + frame.h}"/>`);
  parts.push(textBlock(frame.x + Math.round(frame.w / 2), frame.y + 14, name, "tiny", 12));
  parts.push(textBlock(leftCx, frame.y + titleH + 18, sequenceActorLabel(spec), "tiny", 12));
  parts.push(textBlock(rightCx, frame.y + titleH + 18, "Hệ thống", "tiny", 12));

  const startY = laneTop + 36;
  parts.push(`<circle cx="${leftCx}" cy="${startY}" r="12" fill="#111"/>`);
  const renderedSteps = steps.map((step, index) => {
    const y = laneTop + 78 + index * rowGap;
    const cx = nodeCenter(step);
    const x = nodeBoxX(step);
    parts.push(rectBox(x, y, boxW, boxH, wrapLabel(step.text, 35, 3)));
    return { ...step, x, y, cx };
  });

  if (renderedSteps[0]) parts.push(flowPath([[leftCx, startY + 12], [renderedSteps[0].cx, renderedSteps[0].y]]));
  for (let index = 0; index < renderedSteps.length - 1; index += 1) {
    parts.push(connect(renderedSteps[index], renderedSteps[index + 1]));
  }

  const last = renderedSteps.at(-1);
  const decisionY = last ? last.y + boxH + 46 : laneTop + 150;
  const decisionCx = rightCx;
  if (last) {
    parts.push(flowPath([[last.cx, last.y + boxH], [decisionCx, decisionY]]));
  }
  parts.push(diamond(decisionCx - 72, decisionY, 144, 72, "Thành công?"));
  const endY = decisionY + 140;
  parts.push(flowPath([[decisionCx, decisionY + 72], [decisionCx, endY - 14]], "true", decisionCx + 26, decisionY + 108));
  parts.push(`<circle cx="${decisionCx}" cy="${endY}" r="14" fill="#fff" stroke="#111" stroke-width="1.5"/><circle cx="${decisionCx}" cy="${endY}" r="9" fill="#111"/>`);

  if (hasAlternate) {
    const errX = rightCx + 88;
    const errY = decisionY + 7;
    const altTitle = cleanText(spec.alternateFlows[0].title);
    parts.push(rectBox(errX, errY, 156, 58, wrapLabel(altTitle, 20, 2), "soft"));
    parts.push(flowPath([[decisionCx + 72, decisionY + 36], [errX, errY + 29]], "false", errX - 22, errY + 18));
    const retryNode = renderedSteps.find((node, index) => index > 0 && node.lane === "actor") ?? renderedSteps[0];
    if (retryNode) {
      const retryEntryX = retryNode.cx;
      const retryEntryY = retryNode.y;
      const sideX = Math.max(frame.x + 18, retryNode.x - 24);
      const approachY = Math.max(laneTop + 20, retryEntryY - 26);
      parts.push(flowPath([[errX + 78, errY + 58], [errX + 78, errY + 86], [sideX, errY + 86], [sideX, approachY], [retryEntryX, approachY], [retryEntryX, retryEntryY]], "", 0, 0, "dashed"));
    }
  }

  parts.push(svgEnd());
  return parts.join("\n");
}

function classSvg(spec) {
  const width = 1180;
  const height = 760;
  const cols = [60, 430, 800];
  const parts = [svgStart(width, height, `Lớp - ${spec.code}. ${spec.name}`)];
  const boxes = [];

  spec.classes.forEach((name, index) => {
    const col = index % 3;
    const row = Math.floor(index / 3);
    const x = cols[col];
    const y = 95 + row * 235;
    const attrs = classAttrs(name);
    const h = 48 + attrs.length * 18 + 18;
    boxes.push({ name, x, y, w: 300, h });
    parts.push(`<rect class="class" x="${x}" y="${y}" width="300" height="${h}"/>`);
    parts.push(`<rect class="classHead" x="${x}" y="${y}" width="300" height="42"/>`);
    parts.push(textBlock(x + 150, y + 23, name));
    attrs.forEach((attr, attrIndex) => {
      parts.push(`<text x="${x + 12}" y="${y + 62 + attrIndex * 18}" class="small">${esc(attr)}</text>`);
    });
  });

  for (let index = 0; index < boxes.length - 1; index += 1) {
    const a = boxes[index];
    const b = boxes[index + 1];
    const x1 = a.x < b.x ? a.x + a.w : a.x;
    const x2 = a.x < b.x ? b.x : b.x + b.w;
    const y1 = Math.round(a.y + a.h / 2);
    const y2 = Math.round(b.y + b.h / 2);
    parts.push(`<path class="relation" d="M${x1} ${y1} L${x2} ${y2}"/>`);
    parts.push(`<text x="${Math.round((x1 + x2) / 2)}" y="${Math.round((y1 + y2) / 2 - 5)}" text-anchor="middle" class="tiny">liên quan</text>`);
  }

  parts.push(`<rect class="note" x="60" y="650" width="1060" height="55" rx="6"/>`);
  parts.push(textBlock(590, 678, `Các lớp dùng cho chức năng: ${spec.code}. ${spec.name}`, "small"));
  parts.push(svgEnd());
  return parts.join("\n");
}

function sequenceMessagesFromMainFlow(spec) {
  const participants = spec.participants?.length ? spec.participants : ["Người dùng", "Frontend", "Controller", "Service", "Repository", "CSDL"];
  const [actor, frontend, controller, service, repository, storage] = participants;
  const actorPattern = /^(Người dùng|Tác nhân|Admin|Manager|Teacher|Student|Học viên|Giảng viên|Quản lý)\b/i;
  const frontendPattern = /^(Frontend|Giao diện|App)\b/i;
  const controllerPattern = /Controller\b/i;
  const servicePattern = /Service\b/i;
  const repoPattern = /(Repository|Repo)\b/i;
  const gatewayPattern = /(VNPay|cổng thanh toán|gateway|phương thức thanh toán)/i;
  const displayPattern = /(hiển thị|thông báo|chuyển người dùng|điều hướng|trả.*frontend|trả.*giao diện)/i;
  const writePattern = /(tạo|lưu|cập nhật|xóa|khóa|ẩn|ghi|truy vấn|lấy|kiểm tra|xác minh)/i;

  return (spec.mainFlow?.length ? spec.mainFlow : [`Mở chức năng ${spec.name}`, "Hệ thống xử lý và hiển thị kết quả"]).map((step) => {
    const text = cleanText(step);
    if (actorPattern.test(text)) return [actor, frontend, text];
    if (frontendPattern.test(text)) return displayPattern.test(text) ? [frontend, actor, text, true] : [frontend, controller, text];
    if (controllerPattern.test(text)) return [controller, service, text];
    if (servicePattern.test(text)) return writePattern.test(text) ? [service, repository, text] : [service, controller, text, true];
    if (repoPattern.test(text)) return [repository, storage, text];
    if (gatewayPattern.test(text) && /nhận|callback|kết quả/i.test(text)) return [storage, controller, text];
    if (gatewayPattern.test(text)) return [service, storage, text];
    if (/^Backend\b/i.test(text)) return [controller, frontend, text, true];
    if (displayPattern.test(text)) return [frontend, actor, text, true];
    if (writePattern.test(text)) return [service, repository, text];
    return [controller, service, text];
  });
}

function sequenceSvg(spec) {
  const width = 1320;
  const participants = spec.participants;
  const messages = spec.sequenceMessages ?? sequenceMessagesFromMainFlow(spec) ?? [
    [participants[0], participants[1], "Chọn chức năng / nhập dữ liệu"],
    [participants[1], participants[2], "Gửi HTTP request"],
    [participants[2], participants[3], "Validate và điều phối"],
    [participants[3], participants[4], "Kiểm tra quyền/dữ liệu"],
    [participants[4], participants[5], "Truy vấn hoặc cập nhật"],
    [participants[5], participants[3], "Trả kết quả", true],
    [participants[3], participants[2], "Trả dữ liệu xử lý", true],
    [participants[2], participants[1], "HTTP response", true],
    [participants[1], participants[0], "Hiển thị kết quả", true],
  ];
  const height = Math.max(720, 190 + messages.length * 42);
  const parts = [svgStart(width, height, `Trình tự - ${spec.code}. ${spec.name}`)];
  const gap = Math.floor((width - 160) / (participants.length - 1));
  const pos = new Map();

  participants.forEach((participant, index) => {
    const x = 80 + index * gap;
    pos.set(participant, x);
    parts.push(`<rect class="participant" x="${x - 74}" y="82" width="148" height="38" rx="6"/>`);
    parts.push(textBlock(x, 103, wrapLabel(participant, 18, 2), "tiny", 12));
    parts.push(`<line class="lifeline" x1="${x}" y1="120" x2="${x}" y2="${height - 60}"/>`);
  });

  let y = 155;
  messages.forEach(([from, to, label, ret], index) => {
    parts.push(arrow(pos.get(from), y, pos.get(to), y, `${index + 1}. ${label}`, ret ? "dashed" : "line"));
    y += 42;
  });

  parts.push(svgEnd());
  return parts.join("\n");
}

function sequenceDomainName(spec) {
  const name = cleanText(spec.name);
  const allText = [name, spec.description, ...(spec.mainFlow ?? []), ...(spec.exceptions ?? [])].map(cleanText).join(" ");
  const className = spec.classes?.map(cleanText)?.[0];
  if (/audit/i.test(allText) && /thanh toán/i.test(allText)) return "PaymentAudit";
  if (/thống kê|dashboard/i.test(allText)) return "Dashboard";
  if (/thanh toán|hóa đơn/i.test(name)) return "Payment";
  if (/mật khẩu|hồ sơ|đăng nhập|đăng kí|đăng ký|người dùng/i.test(name)) return "User";
  if (/điểm|học viên/i.test(name)) return "StudentStudy";
  if (/lịch học/i.test(name)) return "Schedule";
  if (/lớp học/i.test(name)) return "ClassRoom";
  if (/thông báo/i.test(name)) return "Notification";
  if (/bài viết/i.test(name)) return "Blog";
  if (/audit/i.test(allText)) return "SecurityAudit";
  if (/khóa học/i.test(name)) return "Course";
  if (/giảng viên/i.test(name)) return "Teacher";
  if (/vai trò|rbac|phân quyền/i.test(name)) return "RBAC";
  return className || "Service";
}

function sequenceActorLabel(spec) {
  const actors = spec.actors.map(cleanText).filter(Boolean);
  const actorSlugs = actors.map(slugText);
  if (actorSlugs.includes("quan-ly") && actorSlugs.includes("admin")) return "Manager";
  if (actorSlugs.includes("manager") && actorSlugs.includes("admin")) return "Manager";
  return actors.join("/") || "User";
}

function stripSubject(text) {
  return oneLine(text)
    .replace(/^(Người dùng|Học viên|Giảng viên|Quản lý|Admin|Manager|Teacher|Student|User|Hệ thống|Giao diện|Frontend|Backend)\s+/i, "")
    .replace(/\.$/, "");
}

function sequenceStepsForSpec(spec) {
  const actorNames = spec.actors.map(cleanText);
  const escapedActors = actorNames.map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  const actorPattern = new RegExp(`^(${escapedActors}|Người dùng|Học viên|Giảng viên|Quản lý|Admin|Manager|Teacher|Student|User)\\b`, "i");
  const flow = (spec.mainFlow ?? []).map(cleanText).filter(Boolean);
  const actorSteps = flow.filter((step) => actorPattern.test(step));
  const systemSteps = flow.filter((step) => !actorPattern.test(step));
  const displayStep = [...systemSteps].reverse().find((step) => /hiển thị|thông báo|chuyển/i.test(step));
  const processStep =
    systemSteps.find((step) => /kiểm tra|xác thực|tìm|lấy|truy vấn|cập nhật|lưu|tạo|gửi|xóa|khóa|ẩn/i.test(step)) ??
    systemSteps[0];
  const inputStep =
    actorSteps.find((step, index) => index > 0 && /nhập|gửi|xác nhận/i.test(step)) ??
    actorSteps.find((step, index) => index > 0 && /chọn/i.test(step)) ??
    actorSteps[1] ??
    actorSteps[0];
  return {
    open: stripSubject(actorSteps[0] ?? flow[0] ?? `Mở ${cleanText(spec.name)}`),
    navigate: "Điều hướng",
    request: stripSubject(inputStep ?? `Gửi yêu cầu ${cleanText(spec.name)}`),
    process: stripSubject(processStep ?? `Xử lý ${cleanText(spec.name)}`),
    success: stripSubject(displayStep ?? "Hiển thị kết quả"),
    failure: stripSubject(spec.exceptions?.[0] ?? spec.alternateFlows?.[0]?.title ?? "Thông báo lỗi") || "Thông báo lỗi",
  };
}

function sequenceSpecDocSvg(spec) {
  const width = 980;
  const height = 760;
  const actorLabel = sequenceActorLabel(spec);
  const domain = sequenceDomainName(spec);
  const steps = sequenceStepsForSpec(spec);
  const parts = [svgStart(width, height, `Trình tự - ${spec.code}. ${cleanText(spec.name)}`, false)];
  const xActor = 190;
  const xView = 460;
  const xDomain = 720;
  const bottomY = 690;
  const msg = (x1, y, x2, text, index, cls = "line") => {
    const mid = Math.round((x1 + x2) / 2);
    parts.push(`<path class="${cls}" d="M${x1} ${y} L${x2} ${y}"/>`);
    parts.push(textBlock(mid, y - 13, `${index}. ${wrapLabel(text, 36, 1)}`, "tiny", 12));
  };

  parts.push(`<text x="70" y="44" class="label" font-style="italic">Biểu đồ trình tự</text>`);
  parts.push(`<circle cx="${xActor}" cy="86" r="8" fill="#aee8ff" stroke="#111" stroke-width="1.1"/>`);
  parts.push(`<path class="actor" d="M${xActor} 94 L${xActor} 125 M${xActor - 18} 108 L${xActor + 18} 108 M${xActor} 125 L${xActor - 16} 150 M${xActor} 125 L${xActor + 16} 150"/>`);
  parts.push(textBlock(xActor, 166, actorLabel, "tiny", 12));
  parts.push(`<rect x="${xView - 70}" y="82" width="140" height="40" fill="#76cdf1" stroke="#111" stroke-width="1.1"/>`);
  parts.push(textBlock(xView, 105, "View", "tiny", 12));
  parts.push(`<rect x="${xDomain - 78}" y="82" width="156" height="40" fill="#76cdf1" stroke="#111" stroke-width="1.1"/>`);
  parts.push(textBlock(xDomain, 105, wrapLabel(domain, 18, 1), "tiny", 12));
  parts.push(`<line class="lifeline" x1="${xActor}" y1="172" x2="${xActor}" y2="${bottomY}"/>`);
  parts.push(`<line class="lifeline" x1="${xView}" y1="122" x2="${xView}" y2="${bottomY}"/>`);
  parts.push(`<line class="lifeline" x1="${xDomain}" y1="122" x2="${xDomain}" y2="${bottomY}"/>`);
  parts.push(`<rect x="${xActor - 6}" y="172" width="12" height="${bottomY - 172}" fill="#76cdf1" stroke="#111" stroke-width="0.8"/>`);

  msg(xActor + 6, 235, xView, steps.open, 1);
  parts.push(`<rect x="${xView - 5}" y="235" width="10" height="42" fill="#76cdf1" stroke="#111" stroke-width="0.8"/>`);
  msg(xView + 5, 270, xDomain, steps.navigate, 2);
  parts.push(`<rect x="${xDomain - 6}" y="270" width="12" height="126" fill="#76cdf1" stroke="#111" stroke-width="0.8"/>`);
  msg(xActor + 6, 345, xDomain, steps.request, 3);
  parts.push(`<path class="line" d="M${xDomain + 6} 390 h32 v26 h-32"/>`);
  parts.push(textBlock(xDomain + 92, 406, `4. ${wrapLabel(steps.process, 28, 1)}`, "tiny", 12));

  const altY = 430;
  const altH = 250;
  parts.push(`<rect x="80" y="${altY}" width="850" height="${altH}" fill="none" stroke="#111" stroke-width="1"/>`);
  parts.push(`<path d="M80 ${altY} H238 V${altY + 34} H80 Z" fill="#fff" stroke="#111" stroke-width="1"/>`);
  parts.push(`<text x="92" y="${altY + 18}" class="tiny" font-weight="700">alt kiểm tra ${esc(domain)}</text>`);
  parts.push(`<text x="130" y="${altY + 42}" class="tiny">[Nếu thành công]</text>`);
  parts.push(`<line x1="80" y1="${altY + 132}" x2="930" y2="${altY + 132}" stroke="#111" stroke-width="1" stroke-dasharray="5 4"/>`);
  parts.push(`<text x="130" y="${altY + 154}" class="tiny">[Nếu không thành công]</text>`);
  msg(xDomain - 6, altY + 82, xActor + 6, steps.success, 5);
  parts.push(`<rect x="${xDomain - 6}" y="${altY + 58}" width="12" height="42" fill="#76cdf1" stroke="#111" stroke-width="0.8"/>`);
  msg(xDomain - 6, altY + 196, xActor + 6, steps.failure, 6, "dashed");
  parts.push(`<rect x="${xDomain - 6}" y="${altY + 170}" width="12" height="48" fill="#76cdf1" stroke="#111" stroke-width="0.8"/>`);

  parts.push(svgEnd());
  return parts.join("\n");
}

function sequenceLayerNames(spec) {
  const name = cleanText(spec.name);
  const domain = sequenceDomainName(spec);
  if (/đăng nhập|đăng kí|đăng ký/i.test(name)) {
    return { controller: "AuthController", service: "AuthService", model: "UserModel", external: "" };
  }
  if (/mật khẩu|hồ sơ/i.test(name)) {
    return { controller: "AccountController", service: "AccountService", model: "UserModel", external: "" };
  }
  if (/thanh toán/i.test(name)) {
    return { controller: "PaymentController", service: "PaymentService", model: "PaymentOrderModel", external: "VNPay" };
  }
  const map = {
    Payment: ["PaymentController", "PaymentService", "PaymentOrderModel"],
    User: ["UserController", "UserService", "UserModel"],
    StudentStudy: ["StudyController", "StudyService", "StudentStudyModel"],
    Schedule: ["ScheduleController", "ScheduleService", "ScheduleModel"],
    ClassRoom: ["ClassRoomController", "ClassRoomService", "ClassRoomModel"],
    Notification: ["NotificationController", "NotificationService", "NotificationModel"],
    Blog: ["BlogController", "BlogService", "BlogModel"],
    PaymentAudit: ["PaymentAuditController", "PaymentAuditService", "PaymentAuditModel"],
    SecurityAudit: ["SecurityAuditController", "SecurityAuditService", "SecurityAuditModel"],
    Dashboard: ["DashboardController", "DashboardService", "DashboardModel"],
    Course: ["CourseController", "CourseService", "ProductModel"],
    Teacher: ["TeacherController", "TeacherService", "TeacherModel"],
    RBAC: ["RbacController", "RbacService", "RoleModel"],
  };
  const [controller, service, model] = map[domain] ?? [`${domain}Controller`, `${domain}Service`, `${domain}Model`];
  return { controller, service, model, external: "" };
}

function sequenceNeedsService(spec) {
  const name = cleanText(spec.name);
  if (/^xem/i.test(name) && !/điểm|hóa đơn|thống kê|audit/i.test(name)) return false;
  if (/thanh toán|hóa đơn|đăng nhập|đăng kí|đăng ký|mật khẩu|hồ sơ|thống kê|điểm|audit|rbac|vai trò|phân quyền/i.test(name)) return true;
  if (/thêm|sửa|cập nhật|xóa|khóa|ẩn|gửi|lưu|tạo/i.test(name)) return true;
  return false;
}

function sequenceNeedsModel(spec) {
  const text = [cleanText(spec.name), ...(spec.mainFlow ?? []).map(cleanText)].join(" ");
  return /xem|tìm|lấy|truy vấn|kiểm tra|xác thực|cập nhật|lưu|tạo|thêm|sửa|xóa|khóa|ẩn|đăng nhập|thanh toán|thống kê/i.test(text);
}

function sequenceCheckStep(spec) {
  const alternateText = (spec.alternateFlows ?? []).flatMap((flow) => [flow.title, ...(flow.steps ?? [])]);
  const isCheckAction = (step) =>
    /(^|\b)(hệ thống|backend|frontend|controller|service|model|repo|repository)\s+kiểm tra\b/i.test(step) ||
    /^kiểm tra\b/i.test(step) ||
    /\bkiểm tra\s+(quyền|dữ liệu|định dạng|trạng thái|email|mật khẩu|mã|người|thông tin|ràng buộc|khóa|vai trò|phiên|tham số|slug|giá)/i.test(step);
  return [...(spec.mainFlow ?? []), ...alternateText].map(cleanText).find(isCheckAction) ?? "";
}

function sequenceCheckObjectLabel(spec) {
  const action = sequenceActionKind(spec);
  if (action === "login") return "thông tin đăng nhập";
  if (action === "register") return "thông tin đăng kí";
  const objectLabel = sequenceObjectLabel(spec);
  if (/^thông tin/i.test(objectLabel)) return objectLabel;
  return `thông tin ${objectLabel}`;
}

function sequenceAltTitle(spec, domain) {
  if (!sequenceCheckStep(spec)) return `alt xử lý ${domain}`;
  return `alt Kiểm tra ${sequenceCheckObjectLabel(spec)}`;
}

function sequenceBranchProcessText(spec) {
  const checkStep = sequenceCheckStep(spec);
  return checkStep ? `Kiểm tra ${sequenceCheckObjectLabel(spec)}` : "Xử lý yêu cầu";
}

function sequenceFullSpecDocSvg(spec) {
  const actorLabel = sequenceActorLabel(spec);
  const steps = sequenceStepsForSpec(spec);
  const names = sequenceLayerNames(spec);
  const participants = [
    { role: "actor", label: actorLabel },
    { role: "view", label: "View" },
    { role: "controller", label: names.controller },
  ];
  if (sequenceNeedsService(spec)) participants.push({ role: "service", label: names.service });
  if (sequenceNeedsModel(spec)) participants.push({ role: "model", label: names.model });
  if (names.external) participants.push({ role: "external", label: names.external });

  const width = Math.max(980, 120 + participants.length * 190);
  const height = names.external ? 880 : 840;
  const bottomY = height - 74;
  const parts = [svgStart(width, height, `Trình tự - ${spec.code}. ${cleanText(spec.name)}`, false)];
  const startX = 90;
  const gap = Math.floor((width - 180) / (participants.length - 1));
  const pos = new Map();
  participants.forEach((participant, index) => pos.set(participant.role, startX + index * gap));

  const roleX = (role) => pos.get(role);
  const msg = (fromRole, y, toRole, text, index, cls = "line") => {
    const x1 = roleX(fromRole);
    const x2 = roleX(toRole);
    const mid = Math.round((x1 + x2) / 2);
    parts.push(`<path class="${cls}" d="M${x1} ${y} L${x2} ${y}"/>`);
    parts.push(textBlock(mid, y - 13, `${index}. ${wrapLabel(text, 34, 1)}`, "tiny", 12));
  };
  const activate = (role, y, h) => {
    const x = roleX(role);
    parts.push(`<rect x="${x - 6}" y="${y}" width="12" height="${h}" fill="#76cdf1" stroke="#111" stroke-width="0.8"/>`);
  };

  parts.push(`<text x="70" y="44" class="label" font-style="italic">Biểu đồ trình tự</text>`);
  participants.forEach((participant) => {
    const x = roleX(participant.role);
    if (participant.role === "actor") {
      parts.push(`<circle cx="${x}" cy="86" r="8" fill="#aee8ff" stroke="#111" stroke-width="1.1"/>`);
      parts.push(`<path class="actor" d="M${x} 94 L${x} 125 M${x - 18} 108 L${x + 18} 108 M${x} 125 L${x - 16} 150 M${x} 125 L${x + 16} 150"/>`);
      parts.push(textBlock(x, 166, wrapLabel(participant.label, 16, 2), "tiny", 12));
      parts.push(`<line class="lifeline" x1="${x}" y1="172" x2="${x}" y2="${bottomY}"/>`);
      return;
    }
    const w = participant.role === "model" ? 160 : 150;
    parts.push(`<rect x="${x - w / 2}" y="82" width="${w}" height="40" fill="#76cdf1" stroke="#111" stroke-width="1.1"/>`);
    parts.push(textBlock(x, 105, wrapLabel(participant.label, 18, 1), "tiny", 12));
    parts.push(`<line class="lifeline" x1="${x}" y1="122" x2="${x}" y2="${bottomY}"/>`);
  });

  activate("actor", 172, 64);
  msg("actor", 220, "view", steps.open, 1);
  activate("view", 220, 58);
  msg("view", 260, "controller", steps.request || "Gửi request", 2);
  activate("controller", 260, 70);

  let index = 3;
  let y = 300;
  const processRole = pos.has("service") ? "service" : pos.has("model") ? "model" : "controller";
  if (processRole !== "controller") {
    msg("controller", y, processRole, "Validate và điều phối", index++);
    activate(processRole, y, 66);
    y += 40;
  }
  if (pos.has("model") && processRole !== "model") {
    msg(processRole, y, "model", steps.process, index++);
    activate("model", y, 66);
    y += 40;
  } else if (processRole === "model") {
    parts.push(`<path class="line" d="M${roleX("model") + 6} ${y} h34 v26 h-34"/>`);
    parts.push(textBlock(roleX("model") + 88, y + 16, `${index++}. ${wrapLabel(steps.process, 28, 1)}`, "tiny", 12));
    y += 40;
  }
  if (pos.has("external")) {
    msg("service", y, "external", "Chuyển sang cổng thanh toán", index++);
    activate("external", y, 66);
    y += 40;
  }

  const altY = y + 20;
  const altH = bottomY - altY - 10;
  parts.push(`<rect x="55" y="${altY}" width="${width - 110}" height="${altH}" fill="none" stroke="#111" stroke-width="1"/>`);
  parts.push(`<path d="M55 ${altY} H235 V${altY + 34} H55 Z" fill="#fff" stroke="#111" stroke-width="1"/>`);
  parts.push(`<text x="68" y="${altY + 18}" class="tiny" font-weight="700">alt xử lý ${esc(sequenceDomainName(spec))}</text>`);
  parts.push(`<text x="105" y="${altY + 42}" class="tiny">[Nếu thành công]</text>`);
  parts.push(`<line x1="55" y1="${altY + Math.round(altH / 2)}" x2="${width - 55}" y2="${altY + Math.round(altH / 2)}" stroke="#111" stroke-width="1" stroke-dasharray="5 4"/>`);
  parts.push(`<text x="105" y="${altY + Math.round(altH / 2) + 24}" class="tiny">[Nếu thất bại]</text>`);

  let successY = altY + 82;
  if (pos.has("external")) {
    msg("external", successY, "service", "Trả kết quả", index++, "dashed");
    successY += 36;
  }
  if (pos.has("model") && pos.has("service")) {
    msg("model", successY, "service", "Trả dữ liệu", index++, "dashed");
    successY += 36;
  }
  if (pos.has("service")) {
    msg("service", successY, "controller", "Trả kết quả xử lý", index++, "dashed");
    successY += 36;
  } else if (pos.has("model")) {
    msg("model", successY, "controller", "Trả dữ liệu", index++, "dashed");
    successY += 36;
  }
  msg("controller", successY, "view", "Response thành công", index++, "dashed");
  successY += 36;
  msg("view", successY, "actor", steps.success, index++, "line");

  const failY = altY + Math.round(altH / 2) + 72;
  msg("controller", failY, "view", "Response lỗi", index++, "dashed");
  msg("view", failY + 42, "actor", steps.failure, index++, "dashed");

  parts.push(svgEnd());
  return parts.join("\n");
}

function sequenceExampleStyleSvg(spec) {
  const actorLabel = sequenceActorLabel(spec);
  const domain = sequenceDomainName(spec);
  const names = sequenceLayerNames(spec);
  const steps = sequenceStepsForSpec(spec);
  const roles = [
    { role: "actor", label: actorLabel },
    { role: "view", label: "View" },
    { role: "controller", label: names.controller },
  ];
  const hasService = sequenceNeedsService(spec);
  const hasModel = sequenceNeedsModel(spec);
  if (hasService) roles.push({ role: "service", label: names.service });
  if (hasModel) roles.push({ role: "model", label: names.model });
  if (names.external) roles.push({ role: "external", label: names.external });

  const processRole = hasService ? "service" : hasModel ? "model" : "controller";
  const yGap = 44;
  let y = 210;
  let index = 1;
  const messages = [];
  const add = (from, to, text, cls = "line", branch = "main") => {
    messages.push({ from, to, text, cls, branch, index: index++, y });
    y += yGap;
  };

  add("actor", "view", steps.open);
  add("view", "controller", "Điều hướng");
  add("actor", "controller", steps.request);

  const altY = y - 18;
  const successFrom = names.external ? "external" : hasModel ? "model" : hasService ? "service" : "controller";
  const processText = names.external ? "Xác nhận thanh toán" : hasModel ? steps.process : sequenceBranchProcessText(spec);
  add(successFrom, successFrom, processText, "line", "success");
  add(successFrom, "actor", steps.success, "line", "success");

  const separatorY = y + 8;
  y += 54;
  const failureStartY = y;
  add(successFrom, "actor", steps.failure, "dashed", "failure");

  const width = Math.max(1120, 260 + roles.length * 190);
  const height = Math.max(760, y + 90);
  const bottomY = height - 60;
  const startX = 260;
  const rightMargin = 260;
  const gap = Math.floor((width - startX - rightMargin) / (roles.length - 1));
  const pos = new Map();
  roles.forEach((item, roleIndex) => pos.set(item.role, startX + roleIndex * gap));
  const roleX = (role) => pos.get(role);
  const parts = [svgStart(width, height, `Trình tự - ${spec.code}. ${cleanText(spec.name)}`, false)];
  const activationHeight = 58;
  const activationSpans = new Map();
  const noteActivation = (role, ay) => {
    if (role === "actor") return;
    const start = ay - 3;
    const end = start + activationHeight;
    const span = activationSpans.get(role);
    if (span && start <= span.end + 2) {
      span.end = Math.max(span.end, end);
      return;
    }
    activationSpans.set(role, { start, end });
  };
  const drawMsg = (message) => {
    const rawX1 = roleX(message.from);
    const rawX2 = roleX(message.to);
    const arrowLen = 10;
    const arrowHalf = 5;
    const lineAttrs = (cls) =>
      `stroke="#111" stroke-width="${cls === "dashed" ? "1" : "1.15"}" ${cls === "dashed" ? 'stroke-dasharray="5 4"' : ""} fill="none"`;
    if (message.from === message.to) {
      const edgeX = rawX1 + 6;
      const outX = edgeX + 36;
      const tipX = edgeX;
      const baseX = tipX + arrowLen;
      const y2 = message.y + 26;
      parts.push(`<path d="M${edgeX} ${message.y} H${outX} V${y2} H${baseX}" ${lineAttrs(message.cls)}/>`);
      parts.push(`<path d="M${tipX} ${y2} L${baseX} ${y2 - arrowHalf} L${baseX} ${y2 + arrowHalf} Z" fill="#111"/>`);
      parts.push(textBlock(rawX1 + 88, message.y + 16, `${message.index}. ${wrapLabel(message.text, 28, 1)}`, "tiny", 12));
    } else {
      const dir = rawX2 >= rawX1 ? 1 : -1;
      const x1 = rawX1 + dir * 6;
      const tipX = rawX2 - dir * 6;
      const baseX = tipX - dir * arrowLen;
      const mid = Math.round((x1 + tipX) / 2);
      parts.push(`<path d="M${x1} ${message.y} L${baseX} ${message.y}" ${lineAttrs(message.cls)}/>`);
      parts.push(`<path d="M${tipX} ${message.y} L${baseX} ${message.y - arrowHalf} L${baseX} ${message.y + arrowHalf} Z" fill="#111"/>`);
      parts.push(textBlock(mid, message.y - 13, `${message.index}. ${wrapLabel(message.text, 35, 1)}`, "tiny", 12));
    }
  };

  messages.forEach((message) => {
    noteActivation(message.to, message.y);
    if (message.to === "actor") noteActivation(message.from, message.y);
  });

  parts.push(`<text x="70" y="44" class="label" font-style="italic">Biểu đồ trình tự</text>`);
  roles.forEach((item) => {
    const x = roleX(item.role);
    if (item.role === "actor") {
      parts.push(`<circle cx="${x}" cy="86" r="8" fill="#aee8ff" stroke="#111" stroke-width="1.1"/>`);
      parts.push(`<path class="actor" d="M${x} 94 L${x} 125 M${x - 18} 108 L${x + 18} 108 M${x} 125 L${x - 16} 150 M${x} 125 L${x + 16} 150"/>`);
      parts.push(textBlock(x, 166, wrapLabel(item.label, 16, 2), "tiny", 12));
      parts.push(`<line class="lifeline" x1="${x}" y1="172" x2="${x}" y2="${bottomY}"/>`);
      parts.push(`<rect x="${x - 6}" y="172" width="12" height="${bottomY - 172}" fill="#76cdf1" stroke="#111" stroke-width="0.8"/>`);
      return;
    }
    const w = item.role === "model" ? 160 : 150;
    parts.push(`<rect x="${x - w / 2}" y="82" width="${w}" height="40" fill="#76cdf1" stroke="#111" stroke-width="1.1"/>`);
    parts.push(textBlock(x, 105, wrapLabel(item.label, 18, 1), "tiny", 12));
    parts.push(`<line class="lifeline" x1="${x}" y1="122" x2="${x}" y2="${bottomY}"/>`);
  });

  activationSpans.forEach((span, role) => {
    const x = roleX(role);
    parts.push(`<rect x="${x - 6}" y="${span.start}" width="12" height="${span.end - span.start}" fill="#76cdf1" stroke="#111" stroke-width="0.8"/>`);
  });

  const altH = Math.max(230, failureStartY + 120 - altY);
  const altX = Math.max(20, roleX("actor") - 240);
  const altRight = width - 55;
  const altW = altRight - altX;
  const altHeader = sequenceAltTitle(spec, domain);
  const maxTabRight = roleX("actor") - 18;
  const altTabW = Math.min(250, Math.max(140, altHeader.length * 6 + 24), maxTabRight - altX);
  const altTabH = 22;
  parts.push(`<rect x="${altX}" y="${altY}" width="${altW}" height="${altH}" fill="none" stroke="#111" stroke-width="1"/>`);
  parts.push(`<path d="M${altX} ${altY} H${altX + altTabW} L${altX + altTabW - 12} ${altY + altTabH} H${altX} Z" fill="#fff" stroke="#111" stroke-width="1"/>`);
  parts.push(`<text x="${altX + 8}" y="${altY + 15}" class="tiny" font-weight="700">${esc(altHeader)}</text>`);
  parts.push(`<text x="${altX + 40}" y="${altY + 42}" class="tiny">[Nếu thành công]</text>`);
  parts.push(`<line x1="${altX}" y1="${separatorY}" x2="${altRight}" y2="${separatorY}" stroke="#111" stroke-width="1" stroke-dasharray="5 4"/>`);
  parts.push(`<text x="${altX + 40}" y="${separatorY + 24}" class="tiny">[Nếu thất bại]</text>`);

  messages.forEach(drawMsg);
  parts.push(svgEnd());
  return parts.join("\n");
}

function sequenceActionKind(spec) {
  const text = slugText(`${spec.slug} ${spec.name}`);
  if (/thanh-toan/.test(text)) return "payment";
  if (/dang-nhap/.test(text)) return "login";
  if (/dang-ki|dang-ky/.test(text)) return "register";
  if (/them|tao/.test(text)) return "add";
  if (/sua|cap-nhat|doi/.test(text)) return "edit";
  if (/xoa|khoa|an/.test(text)) return "delete";
  if (/gui/.test(text)) return "send";
  if (/xem/.test(text)) return "view";
  return "process";
}

function sequenceObjectLabel(spec) {
  const name = cleanText(spec.name);
  const domain = sequenceDomainName(spec);
  if (domain === "ClassRoom") return "lớp học";
  if (domain === "StudentStudy") return "học viên";
  if (domain === "PaymentAudit") return "audit";
  if (domain === "SecurityAudit") return "audit";
  if (domain === "Payment") return "thanh toán";
  if (domain === "Notification") return "thông báo";
  if (domain === "Schedule") return "lịch học";
  if (domain === "Course") return "khóa học";
  if (domain === "Teacher") return "giảng viên";
  if (domain === "Blog") return "bài viết";
  if (domain === "Dashboard") return "dashboard";
  if (domain === "RBAC") return "vai trò";
  if (domain === "User") return name.includes("mật khẩu") ? "mật khẩu" : "tài khoản";
  return cleanText(spec.name).toLowerCase();
}

function sequenceImageStyleSvg(spec) {
  const action = sequenceActionKind(spec);
  const actorLabel = sequenceActorLabel(spec);
  const domain = sequenceDomainName(spec);
  const objectLabel = sequenceObjectLabel(spec);
  const hasExternal = action === "payment";
  const width = hasExternal ? 1020 : 900;
  const height = 780;
  const xActor = 210;
  const xView = 430;
  const xDomain = 650;
  const xExternal = 840;
  const bottomY = 650;
  const parts = [svgStart(width, height, `Trình tự - ${spec.code}. ${cleanText(spec.name)}`, false)];
  const steps = sequenceStepsForSpec(spec);
  const mainName = domain === "ClassRoom" ? "ClassRoom" : domain;
  const pageText = steps.open || `Vào trang ${objectLabel}`;
  const requestText = (() => {
    if (action === "add") return `Gửi thông tin thêm ${objectLabel}`;
    if (action === "edit") return `Gửi thông tin sửa ${objectLabel}`;
    if (action === "delete") return `Gửi thông tin xóa ${objectLabel}`;
    if (action === "send") return `Gửi thông tin ${objectLabel}`;
    if (action === "payment") return "Gửi thông tin thanh toán";
    if (action === "login") return "Gửi thông tin đăng nhập";
    if (action === "register") return "Gửi thông tin đăng ký";
    return `Gửi thông tin xem ${objectLabel}`;
  })();
  const processText = (() => {
    if (action === "add") return `Tạo mới ${objectLabel}`;
    if (action === "edit") return `Tìm ${objectLabel}`;
    if (action === "delete") return `Tìm ${objectLabel}`;
    if (action === "payment") return "Tạo giao dịch";
    if (action === "login") return "Xác thực tài khoản";
    if (action === "register") return "Tạo tài khoản";
    if (action === "send") return `Gửi ${objectLabel}`;
    return `Tìm ${objectLabel}`;
  })();
  const successText = (() => {
    if (action === "add") return `Thông báo thêm thành công`;
    if (action === "edit") return `Thông báo sửa thành công`;
    if (action === "delete") return `Thông báo xóa thành công`;
    if (action === "payment") return "Thông báo thanh toán thành công";
    if (action === "login") return "Đăng nhập thành công";
    if (action === "register") return "Đăng ký thành công";
    return steps.success || "Hiển thị kết quả";
  })();
  const failText = steps.failure || (action === "add" ? "Thông báo tạo thất bại" : `Thông báo ${objectLabel} không tồn tại`);
  const altTitle = action === "add" || action === "login" || action === "register" ? "alt kiểm tra" : `alt kiểm tra ${objectLabel}`;
  const upperGuard = action === "add" || action === "login" || action === "register" ? "[Thành công]" : "[Nếu tồn tại]";
  const lowerGuard = action === "add" || action === "login" || action === "register" ? "[Thất bại]" : "[Nếu không tồn tại]";
  let msgNo = 1;
  const drawMsg = (x1, y, x2, text, cls = "line") => {
    const mid = Math.round((x1 + x2) / 2);
    parts.push(`<path class="${cls}" d="M${x1} ${y} L${x2} ${y}"/>`);
    parts.push(textBlock(mid, y - 13, `${msgNo++}. ${wrapLabel(text, 34, 1)}`, "tiny", 12));
  };
  const activate = (x, y, h = 36) => {
    parts.push(`<rect x="${x - 6}" y="${y}" width="12" height="${h}" fill="#76cdf1" stroke="#111" stroke-width="0.8"/>`);
  };
  const participant = (x, label, w = 150) => {
    parts.push(`<rect x="${x - w / 2}" y="72" width="${w}" height="42" fill="#76cdf1" stroke="#111" stroke-width="1.1"/>`);
    parts.push(textBlock(x, 96, wrapLabel(label, 18, 1), "tiny", 12));
    parts.push(`<line class="lifeline" x1="${x}" y1="114" x2="${x}" y2="${bottomY}"/>`);
  };

  parts.push(`<text x="70" y="38" class="label" font-style="italic">Biểu đồ trình tự</text>`);
  parts.push(`<circle cx="${xActor}" cy="76" r="8" fill="#aee8ff" stroke="#111" stroke-width="1.1"/>`);
  parts.push(`<path class="actor" d="M${xActor} 84 L${xActor} 115 M${xActor - 18} 98 L${xActor + 18} 98 M${xActor} 115 L${xActor - 16} 140 M${xActor} 115 L${xActor + 16} 140"/>`);
  parts.push(textBlock(xActor, 156, actorLabel, "tiny", 12));
  parts.push(`<line class="lifeline" x1="${xActor}" y1="162" x2="${xActor}" y2="${bottomY}"/>`);
  parts.push(`<rect x="${xActor - 6}" y="162" width="12" height="${bottomY - 162}" fill="#76cdf1" stroke="#111" stroke-width="0.8"/>`);
  participant(xView, "View");
  participant(xDomain, mainName);
  if (hasExternal) participant(xExternal, "VNPay", 120);

  const y1 = 225;
  drawMsg(xActor + 6, y1, xView, pageText);
  activate(xView, y1, 38);
  drawMsg(xView + 6, y1 + 36, xDomain, "Điều hướng");
  activate(xDomain, y1 + 36, 38);
  drawMsg(xActor + 6, y1 + 92, xDomain, requestText);

  const altY = 370;
  const altH = 300;
  const sepY = altY + 165;
  parts.push(`<rect x="105" y="${altY}" width="${width - 210}" height="${altH}" fill="none" stroke="#111" stroke-width="1"/>`);
  parts.push(`<path d="M105 ${altY} H220 V${altY + 30} H105 Z" fill="#fff" stroke="#111" stroke-width="1"/>`);
  parts.push(`<text x="112" y="${altY + 18}" class="tiny" font-weight="700">${esc(altTitle)}</text>`);
  parts.push(`<text x="145" y="${altY + 42}" class="tiny">${esc(upperGuard)}</text>`);
  parts.push(`<line x1="105" y1="${sepY}" x2="${width - 105}" y2="${sepY}" stroke="#111" stroke-width="1" stroke-dasharray="5 4"/>`);
  parts.push(`<text x="145" y="${sepY + 22}" class="tiny">${esc(lowerGuard)}</text>`);

  const processY = altY + 14;
  if (hasExternal) {
    drawMsg(xDomain + 6, processY + 10, xExternal, processText);
    activate(xExternal, processY + 10, 42);
    drawMsg(xExternal, altY + 88, xDomain - 6, "Trả kết quả", "dashed");
  } else {
    parts.push(`<path class="line" d="M${xDomain + 6} ${processY} h34 v25 h-34"/>`);
    parts.push(textBlock(xDomain + 86, processY + 16, `${msgNo++}. ${wrapLabel(processText, 24, 1)}`, "tiny", 12));
  }
  activate(xDomain, processY, 38);
  drawMsg(xDomain - 6, altY + 88, xActor + 6, successText);
  activate(xDomain, altY + 72, 38);

  const failY = sepY + 62;
  if (action === "edit" && spec.alternateFlows?.some((flow) => /tạo/i.test(cleanText(flow.title)))) {
    parts.push(`<path class="line" d="M${xDomain + 6} ${failY - 20} h34 v25 h-34"/>`);
    parts.push(textBlock(xDomain + 82, failY - 4, `${msgNo++}. Tạo mới ${wrapLabel(objectLabel, 16, 1)}`, "tiny", 12));
  }
  drawMsg(xDomain - 6, failY, xActor + 6, failText, "dashed");
  activate(xDomain, failY - 16, 38);

  parts.push(svgEnd());
  return parts.join("\n");
}

function sequenceSpecFlowSvg(spec) {
  const actorLabel = sequenceActorLabel(spec);
  const domain = sequenceDomainName(spec);
  const names = sequenceLayerNames(spec);
  const hasService = sequenceNeedsService(spec);
  const hasModel = sequenceNeedsModel(spec);
  const roles = [
    { role: "actor", label: actorLabel },
    { role: "view", label: "View" },
    { role: "controller", label: names.controller },
  ];
  if (hasService) roles.push({ role: "service", label: names.service });
  if (hasModel) roles.push({ role: "model", label: names.model });
  if (names.external) roles.push({ role: "external", label: names.external });

  const actorNames = spec.actors.map(cleanText);
  const escapedActors = actorNames.map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  const actorPattern = new RegExp(`^(${escapedActors}|Người dùng|Học viên|Giảng viên|Quản lý|Admin|Manager|Teacher|Student|User)\\b`, "i");
  const viewPattern = /^(Giao diện|Frontend|Web|Màn hình)\b/i;
  const displayPattern = /\b(hiển thị|thông báo|trả về form|chuyển hướng|điều hướng|chuyển người dùng|chuyển sang màn hình)\b/i;
  const externalPattern = /\b(cổng thanh toán|phương thức thanh toán|vnpay|gateway|kết quả thanh toán|giao dịch)\b/i;
  const dataPattern = /\b(kiểm tra|xác minh|xác định|lấy|tìm|truy vấn|tạo|cập nhật|lưu|xóa|xoá|khóa|khoá|ẩn|gửi|ghi nhận)\b/i;
  const stripRole = (step) =>
    oneLine(step)
      .replace(/^(Người dùng|Học viên|Giảng viên|Quản lý|Admin|Manager|Teacher|Student|User|Hệ thống|Giao diện|Frontend|Backend|Web)\s+/i, "")
      .replace(/\.$/, "");
  const displayOnlyText = (step) => {
    const text = stripRole(step);
    const match = text.match(/\b(hiển thị.+|thông báo.+|chuyển hướng.+|điều hướng.+|chuyển.+)$/i);
    return match ? match[1] : text;
  };

  const routeSystemStep = (step) => {
    const text = cleanText(step);
    if (names.external && externalPattern.test(text) && /chuyển|cổng|phương thức|vnpay|gateway/i.test(text)) {
      return { from: hasService ? "service" : "controller", to: "external" };
    }
    if (names.external && externalPattern.test(text) && /nhận|kết quả|callback|phản hồi/i.test(text)) {
      return { from: "external", to: hasService ? "service" : "controller", cls: "dashed" };
    }
    if (displayPattern.test(text)) return { from: "view", to: "actor", cls: "dashed" };
    if (hasModel && dataPattern.test(text)) return { from: hasService ? "service" : "controller", to: "model" };
    if (hasService) return { from: "controller", to: "service" };
    if (hasModel) return { from: "controller", to: "model" };
    return { from: "controller", to: "controller" };
  };

  const yGap = 44;
  let y = 210;
  let fallbackIndex = 1;
  const messages = [];
  const add = (from, to, text, cls = "line", branch = "main", index = null) => {
    messages.push({ from, to, text, cls, branch, index: index ?? fallbackIndex++, y });
    y += yGap;
  };

  const mainFlow = (spec.mainFlow ?? []).map(cleanText).filter(Boolean);
  mainFlow.forEach((step, stepIndex) => {
    const number = stepIndex + 1;
    if (actorPattern.test(step)) {
      add("actor", "view", stripRole(step), "line", "main", number);
      return;
    }
    if (viewPattern.test(step) || displayPattern.test(step)) {
      add("view", "actor", stripRole(step), displayPattern.test(step) ? "dashed" : "line", "main", number);
      return;
    }
    const route = routeSystemStep(step);
    add(route.from, route.to, stripRole(step), route.cls ?? "line", "main", number);
  });

  if (!messages.length) {
    add("actor", "view", `Mở ${cleanText(spec.name)}`);
    add("view", "controller", `Gửi yêu cầu ${cleanText(spec.name)}`);
    add(hasService ? "service" : "controller", hasModel ? "model" : "controller", `Xử lý ${cleanText(spec.name)}`);
    add("view", "actor", "Hiển thị kết quả", "dashed");
  }

  const altFlows = (spec.alternateFlows ?? []).filter((flow) => cleanText(flow.title).trim());
  const exceptions = (spec.exceptions ?? []).map(cleanText).filter(Boolean);
  const altFrameY = y + 4;
  if (altFlows.length) {
    y += 48;
    altFlows.forEach((flow) => {
      const text = cleanText(flow.title);
      const route = displayPattern.test(text) ? { from: "view", to: "actor", cls: "dashed" } : routeSystemStep(text);
      add(route.from, route.to, text, route.cls ?? "dashed", "alternate", flow.code);
    });
  }

  const exceptionFrameY = y + 4;
  if (exceptions.length) {
    y += 48;
    exceptions.forEach((text, exceptionIndex) => {
      add("view", "actor", text, "dashed", "exception", `E${exceptionIndex + 1}`);
    });
  }

  const width = Math.max(1120, 260 + roles.length * 190);
  const height = Math.max(760, y + 90);
  const bottomY = height - 60;
  const startX = 260;
  const rightMargin = 260;
  const gap = Math.floor((width - startX - rightMargin) / (roles.length - 1));
  const pos = new Map();
  roles.forEach((item, roleIndex) => pos.set(item.role, startX + roleIndex * gap));
  const roleX = (role) => pos.get(role);
  const parts = [svgStart(width, height, `Trình tự - ${spec.code}. ${cleanText(spec.name)}`, false)];
  const activationHeight = 58;
  const activationSpans = new Map();
  const noteActivation = (role, ay) => {
    if (role === "actor") return;
    const start = ay - 3;
    const end = start + activationHeight;
    const span = activationSpans.get(role);
    if (span && start <= span.end + 2) {
      span.end = Math.max(span.end, end);
      return;
    }
    activationSpans.set(role, { start, end });
  };
  const lineAttrs = (cls) =>
    `stroke="#111" stroke-width="${cls === "dashed" ? "1" : "1.15"}" ${cls === "dashed" ? 'stroke-dasharray="5 4"' : ""} fill="none"`;
  const drawMsg = (message) => {
    const rawX1 = roleX(message.from);
    const rawX2 = roleX(message.to);
    const arrowLen = 10;
    const arrowHalf = 5;
    if (message.from === message.to) {
      const edgeX = rawX1 + 6;
      const outX = edgeX + 36;
      const tipX = edgeX;
      const baseX = tipX + arrowLen;
      const y2 = message.y + 26;
      parts.push(`<path d="M${edgeX} ${message.y} H${outX} V${y2} H${baseX}" ${lineAttrs(message.cls)}/>`);
      parts.push(`<path d="M${tipX} ${y2} L${baseX} ${y2 - arrowHalf} L${baseX} ${y2 + arrowHalf} Z" fill="#111"/>`);
      parts.push(textBlock(rawX1 + 88, message.y + 16, `${message.index}. ${wrapLabel(message.text, 28, 1)}`, "tiny", 12));
      return;
    }
    const dir = rawX2 >= rawX1 ? 1 : -1;
    const x1 = rawX1 + dir * 6;
    const tipX = rawX2 - dir * 6;
    const baseX = tipX - dir * arrowLen;
    const mid = Math.round((x1 + tipX) / 2);
    parts.push(`<path d="M${x1} ${message.y} L${baseX} ${message.y}" ${lineAttrs(message.cls)}/>`);
    parts.push(`<path d="M${tipX} ${message.y} L${baseX} ${message.y - arrowHalf} L${baseX} ${message.y + arrowHalf} Z" fill="#111"/>`);
    parts.push(textBlock(mid, message.y - 13, `${message.index}. ${wrapLabel(message.text, 35, 1)}`, "tiny", 12));
  };

  messages.forEach((message) => {
    noteActivation(message.to, message.y);
    if (message.to === "actor") noteActivation(message.from, message.y);
  });

  parts.push(`<text x="70" y="44" class="label" font-style="italic">Biểu đồ trình tự</text>`);
  roles.forEach((item) => {
    const x = roleX(item.role);
    if (item.role === "actor") {
      parts.push(`<circle cx="${x}" cy="86" r="8" fill="#aee8ff" stroke="#111" stroke-width="1.1"/>`);
      parts.push(`<path class="actor" d="M${x} 94 L${x} 125 M${x - 18} 108 L${x + 18} 108 M${x} 125 L${x - 16} 150 M${x} 125 L${x + 16} 150"/>`);
      parts.push(textBlock(x, 166, wrapLabel(item.label, 16, 2), "tiny", 12));
      parts.push(`<line class="lifeline" x1="${x}" y1="172" x2="${x}" y2="${bottomY}"/>`);
      parts.push(`<rect x="${x - 6}" y="172" width="12" height="${bottomY - 172}" fill="#76cdf1" stroke="#111" stroke-width="0.8"/>`);
      return;
    }
    const w = item.role === "model" ? 160 : 150;
    parts.push(`<rect x="${x - w / 2}" y="82" width="${w}" height="40" fill="#76cdf1" stroke="#111" stroke-width="1.1"/>`);
    parts.push(textBlock(x, 105, wrapLabel(item.label, 18, 1), "tiny", 12));
    parts.push(`<line class="lifeline" x1="${x}" y1="122" x2="${x}" y2="${bottomY}"/>`);
  });

  const drawFrame = (frameY, frameH, header, guard) => {
    const frameX = Math.max(20, roleX("actor") - 240);
    const frameRight = width - 55;
    const frameW = frameRight - frameX;
    const tabRightLimit = Math.max(frameX + 130, roleX("actor") - 18);
    const tabW = Math.min(270, Math.max(145, header.length * 6 + 24), tabRightLimit - frameX);
    const tabH = 22;
    parts.push(`<rect x="${frameX}" y="${frameY}" width="${frameW}" height="${frameH}" fill="none" stroke="#111" stroke-width="1"/>`);
    parts.push(`<path d="M${frameX} ${frameY} H${frameX + tabW} L${frameX + tabW - 12} ${frameY + tabH} H${frameX} Z" fill="#fff" stroke="#111" stroke-width="1"/>`);
    parts.push(`<text x="${frameX + 8}" y="${frameY + 15}" class="tiny" font-weight="700">${esc(header)}</text>`);
    parts.push(`<text x="${frameX + 40}" y="${frameY + 42}" class="tiny">${esc(guard)}</text>`);
  };

  if (altFlows.length) {
    const lastAltY = messages.filter((message) => message.branch === "alternate").at(-1)?.y ?? altFrameY;
    drawFrame(altFrameY, Math.max(110, lastAltY - altFrameY + 48), "alt Luồng phụ", "[Theo điều kiện trong đặc tả]");
  }
  if (exceptions.length) {
    const lastExceptionY = messages.filter((message) => message.branch === "exception").at(-1)?.y ?? exceptionFrameY;
    drawFrame(exceptionFrameY, Math.max(110, lastExceptionY - exceptionFrameY + 48), "alt Ngoại lệ", "[Có lỗi phát sinh]");
  }

  activationSpans.forEach((span, role) => {
    const x = roleX(role);
    parts.push(`<rect x="${x - 6}" y="${span.start}" width="12" height="${span.end - span.start}" fill="#76cdf1" stroke="#111" stroke-width="0.8"/>`);
  });
  messages.forEach(drawMsg);
  parts.push(svgEnd());
  return parts.join("\n");
}

function sequenceStandardFlowSvg(spec) {
  const actorLabel = sequenceActorLabel(spec);
  const names = sequenceLayerNames(spec);
  const hasExternal = Boolean(names.external);
  const pageLabel = (() => {
    const name = cleanText(spec.name);
    if (/đăng nhập/i.test(name)) return "Login Page";
    if (/đăng k[iý]/i.test(name)) return "Register Page";
    return "View";
  })();
  const roles = [
    { role: "actor", label: actorLabel, w: 130 },
    { role: "view", label: pageLabel, w: 150 },
    { role: "controller", label: names.controller, w: 170 },
    { role: "model", label: names.model, w: 170 },
  ];
  if (hasExternal) roles.push({ role: "external", label: names.external, w: 130 });

  const actorNames = spec.actors.map(cleanText);
  const escapedActors = actorNames.map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  const actorPattern = new RegExp(`^(${escapedActors}|Người dùng|Học viên|Giảng viên|Quản lý|Admin|Manager|Teacher|Student|User)\\b`, "i");
  const viewPattern = /^(Giao diện|Frontend|Web|Màn hình)\b/i;
  const systemPattern = /^(Hệ thống|Backend|Controller|Service|Model|Repository)\b/i;
  const submitPattern = /\b(nhấn|bấm|gửi|xác nhận)\b/i;
  const displayPattern = /\b(hiển thị|thông báo|trả về form|chuyển hướng|điều hướng|chuyển sang màn hình|chuyển sang trang)\b/i;
  const externalOutPattern = /\b(chuyển.*(cổng|phương thức).*thanh toán|cổng thanh toán|vnpay|gateway)\b/i;
  const externalInPattern = /\b(nhận kết quả thanh toán|callback|phản hồi thanh toán)\b/i;
  const stripRole = (step) =>
    oneLine(step)
      .replace(/^(Người dùng|Học viên|Giảng viên|Quản lý|Admin|Manager|Teacher|Student|User|Hệ thống|Giao diện|Frontend|Backend|Web)\s+/i, "")
      .replace(/\.$/, "");

  const messages = [];
  const add = (from, to, text, index, cls = "line", branch = "main") => {
    messages.push({ from, to, text: stripRole(text), index, cls, branch });
  };

  const mainFlow = (spec.mainFlow ?? []).map(cleanText).filter(Boolean);
  mainFlow.forEach((step, stepIndex) => {
    const index = stepIndex + 1;
    if (actorPattern.test(step)) {
      add("actor", "view", step, index);
      if (submitPattern.test(step) && !/mở|truy cập/i.test(step)) {
        add("view", "controller", `Gửi yêu cầu ${cleanText(spec.name).toLowerCase()}`, `${index}.1`);
      }
      return;
    }
    if (viewPattern.test(step) || displayPattern.test(step)) {
      add("view", "actor", step, index, displayPattern.test(step) ? "dashed" : "line");
      return;
    }
    if (hasExternal && externalInPattern.test(step)) {
      add("external", "controller", step, index, "dashed");
      return;
    }
    if (hasExternal && externalOutPattern.test(step)) {
      add("controller", "external", step, index);
      return;
    }
    if (systemPattern.test(step) || step) {
      add("controller", "model", step, index);
      if (stepIndex === mainFlow.length - 1 || displayPattern.test(mainFlow[stepIndex + 1] ?? "")) {
        add("model", "controller", "Trả kết quả xử lý", `${index}.1`, "dashed");
      }
    }
  });

  if (!messages.length) {
    add("actor", "view", `Mở ${cleanText(spec.name)}`, 1);
    add("view", "controller", `Gửi yêu cầu ${cleanText(spec.name)}`, 2);
    add("controller", "model", `Xử lý ${cleanText(spec.name)}`, 3);
    add("model", "controller", "Trả kết quả xử lý", "3.1", "dashed");
    add("view", "actor", "Hiển thị kết quả", 4, "dashed");
  }

  const altFlows = (spec.alternateFlows ?? []).filter((flow) => cleanText(flow.title).trim());
  const exceptions = (spec.exceptions ?? []).map(cleanText).filter(Boolean);
  altFlows.forEach((flow) => {
    const text = cleanText(flow.title);
    if (displayPattern.test(text) || actorPattern.test(text)) {
      add("view", "actor", text, flow.code, "dashed", "alternate");
      return;
    }
    add("controller", "model", text, flow.code, "dashed", "alternate");
  });
  exceptions.forEach((text, index) => add("view", "actor", text, `E${index + 1}`, "dashed", "exception"));

  const yGap = 40;
  const topY = 190;
  messages.forEach((message, index) => {
    message.y = topY + index * yGap;
  });
  const width = hasExternal ? 1180 : 1040;
  const height = Math.max(720, topY + messages.length * yGap + 110);
  const bottomY = height - 55;
  const xStart = 190;
  const xEnd = width - 145;
  const gap = Math.floor((xEnd - xStart) / (roles.length - 1));
  const pos = new Map();
  roles.forEach((role, index) => pos.set(role.role, xStart + index * gap));
  const roleX = (role) => pos.get(role);
  const parts = [svgStart(width, height, `Trình tự - ${spec.code}. ${cleanText(spec.name)}`, false)];
  const lineAttrs = (cls) =>
    `stroke="#111" stroke-width="${cls === "dashed" ? "1" : "1.15"}" ${cls === "dashed" ? 'stroke-dasharray="5 4"' : ""} fill="none"`;

  parts.push(`<text x="70" y="44" class="label" font-style="italic">Biểu đồ trình tự</text>`);
  roles.forEach((role) => {
    const x = roleX(role.role);
    if (role.role === "actor") {
      parts.push(`<circle cx="${x}" cy="76" r="8" fill="#aee8ff" stroke="#111" stroke-width="1.1"/>`);
      parts.push(`<path class="actor" d="M${x} 84 L${x} 115 M${x - 18} 98 L${x + 18} 98 M${x} 115 L${x - 16} 140 M${x} 115 L${x + 16} 140"/>`);
      parts.push(textBlock(x, 160, wrapLabel(role.label, 16, 2), "tiny", 12));
      parts.push(`<line class="lifeline" x1="${x}" y1="166" x2="${x}" y2="${bottomY}"/>`);
      parts.push(`<rect x="${x - 6}" y="166" width="12" height="${bottomY - 166}" fill="#76cdf1" stroke="#111" stroke-width="0.8"/>`);
      return;
    }
    parts.push(`<rect x="${x - role.w / 2}" y="72" width="${role.w}" height="40" fill="#76cdf1" stroke="#111" stroke-width="1.1"/>`);
    parts.push(textBlock(x, 95, wrapLabel(role.label, 18, 1), "tiny", 12));
    parts.push(`<line class="lifeline" x1="${x}" y1="112" x2="${x}" y2="${bottomY}"/>`);
  });

  const drawFrame = (branch, header, guard) => {
    const branchMessages = messages.filter((message) => message.branch === branch);
    if (!branchMessages.length) return;
    const y1 = branchMessages[0].y - 24;
    const y2 = branchMessages.at(-1).y + 24;
    const x = 70;
    const w = width - 120;
    const tabW = Math.min(220, Math.max(125, header.length * 6 + 24));
    parts.push(`<rect x="${x}" y="${y1}" width="${w}" height="${y2 - y1}" fill="none" stroke="#111" stroke-width="1"/>`);
    parts.push(`<path d="M${x} ${y1} H${x + tabW} L${x + tabW - 12} ${y1 + 22} H${x} Z" fill="#fff" stroke="#111" stroke-width="1"/>`);
    parts.push(`<text x="${x + 8}" y="${y1 + 15}" class="tiny" font-weight="700">${esc(header)}</text>`);
    parts.push(`<text x="${x + 38}" y="${y1 + 42}" class="tiny">${esc(guard)}</text>`);
  };
  drawFrame("alternate", "alt Luồng phụ", "[Theo điều kiện trong đặc tả]");
  drawFrame("exception", "alt Ngoại lệ", "[Có lỗi phát sinh]");

  const activated = new Map();
  messages.forEach((message) => {
    [message.from, message.to].forEach((role) => {
      if (role === "actor") return;
      const span = activated.get(role) ?? { start: message.y - 4, end: message.y + 28 };
      span.start = Math.min(span.start, message.y - 4);
      span.end = Math.max(span.end, message.y + 28);
      activated.set(role, span);
    });
  });
  activated.forEach((span, role) => {
    const x = roleX(role);
    parts.push(`<rect x="${x - 6}" y="${span.start}" width="12" height="${span.end - span.start}" fill="#76cdf1" stroke="#111" stroke-width="0.8"/>`);
  });

  messages.forEach((message) => {
    const x1 = roleX(message.from);
    const x2 = roleX(message.to);
    const dir = x2 >= x1 ? 1 : -1;
    const start = x1 + dir * 6;
    const tip = x2 - dir * 6;
    const base = tip - dir * 10;
    const mid = Math.round((start + tip) / 2);
    parts.push(`<path d="M${start} ${message.y} L${base} ${message.y}" ${lineAttrs(message.cls)}/>`);
    parts.push(`<path d="M${tip} ${message.y} L${base} ${message.y - 5} L${base} ${message.y + 5} Z" fill="#111"/>`);
    parts.push(textBlock(mid, message.y - 13, `${message.index}. ${wrapLabel(message.text, 34, 1)}`, "tiny", 12));
  });

  parts.push(svgEnd());
  return parts.join("\n");
}

function sequenceTemplateFlowSvg(spec) {
  const actorLabel = sequenceActorLabel(spec);
  const names = sequenceLayerNames(spec);
  const name = cleanText(spec.name);
  const hasExternal = Boolean(names.external);
  const pageLabel = (() => {
    if (/đăng nhập/i.test(name)) return "Login Page";
    if (/đăng k[iý]/i.test(name)) return "Register Page";
    if (/thanh toán/i.test(name)) return "Payment Page";
    if (/hồ sơ|mật khẩu/i.test(name)) return "Account Page";
    return "View";
  })();
  const roles = [
    { role: "actor", label: actorLabel, w: 130 },
    { role: "view", label: pageLabel, w: 150 },
    { role: "controller", label: names.controller, w: 170 },
    { role: "model", label: names.model, w: 170 },
  ];
  if (hasExternal) roles.push({ role: "external", label: names.external, w: 130 });

  const actorNames = spec.actors.map(cleanText);
  const escapedActors = actorNames.map((actorName) => actorName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  const actorPattern = new RegExp(`^(${escapedActors}|Người dùng|Học viên|Giảng viên|Quản lý|Admin|Manager|Teacher|Student|User)\\b`, "i");
  const viewPattern = /^(Giao diện|Frontend|Web|Màn hình)\b/i;
  const displayPattern = /\b(hiển thị|thông báo|trả về|chuyển hướng|điều hướng|chuyển.*giao diện|chuyển.*màn hình|chuyển.*trang)\b/i;
  const submitPattern = /\b(nhấn|bấm|gửi|xác nhận|lưu)\b/i;
  const externalOutPattern = /\b(chuyển.*(cổng|phương thức).*thanh toán|cổng thanh toán|vnpay|gateway)\b/i;
  const externalInPattern = /\b(nhận kết quả thanh toán|callback|phản hồi thanh toán)\b/i;
  const backendActionPattern = /(^|\s)(kiểm tra|xác thực|xác minh|xác định|lấy|tìm|truy vấn|tạo|cập nhật|lưu|xóa|xoá|khóa|khoá|ẩn|ghi nhận)\b/i;
  const isDisplayStep = (step) => /hien-thi|thong-bao|tra-ve|chuyen-huong|dieu-huong|chuyen/.test(slugText(step));
  const isBackendStep = (step) => /(^|-)(kiem-tra|xac-thuc|xac-minh|xac-dinh|lay|tim|truy-van|tao|cap-nhat|luu|xoa|khoa|an|ghi-nhan)(-|$)/.test(slugText(step));
  const stripRole = (step) =>
    oneLine(step)
      .replace(/^(Người dùng|Học viên|Giảng viên|Quản lý|Admin|Manager|Teacher|Student|User|Hệ thống|Giao diện|Frontend|Backend|Web)\s+/i, "")
      .replace(/\.$/, "");
  const displayOnlyText = (step) => {
    const text = stripRole(step);
    const match = text.match(/\b(hiển thị.+|thông báo.+|chuyển hướng.+|điều hướng.+|chuyển.+)$/i);
    return match ? match[1] : text;
  };
  const conditionGuard = (text) => {
    const cleaned = stripRole(text)
      .replace(/^Nếu\s+/i, "")
      .replace(/,\s*(hệ thống|người dùng|học viên|giảng viên|quản lý|admin).+$/i, "")
      .replace(/\.$/, "");
    return `[${cleaned || "Có điều kiện"}]`;
  };
  const altHeader = (mainStep, flows) => {
    const flowText = flows.map((flow) => cleanText(flow.text)).join(" ");
    const text = [flowText, mainStep, name].map(cleanText).join(" ");
    if (/chưa đăng nhập/i.test(flowText)) return "alt Kiểm tra trạng thái đăng nhập";
    if (/vai trò|quyền/i.test(flowText)) return "alt Kiểm tra quyền truy cập";
    if (/giao dịch|thất bại|hủy|huỷ/i.test(flowText)) return "alt Kiểm tra thanh toán";
    if (/khóa học|khoá học|đã mua|quyền mua/i.test(flowText)) return "alt Kiểm tra khóa học";
    if (/email|mật khẩu|tài khoản/i.test(flowText)) return "alt Kiểm tra thông tin tài khoản";
    if (/đăng nhập/i.test(text)) return "alt Kiểm tra trạng thái đăng nhập";
    if (/thanh toán|giao dịch|đơn/i.test(text)) return "alt Kiểm tra thanh toán";
    if (/điểm|hồ sơ học tập|dữ liệu/i.test(text)) return "alt Kiểm tra dữ liệu điểm";
    if (/lớp|lịch học/i.test(text)) return "alt Kiểm tra lớp học";
    if (/thông báo/i.test(text)) return "alt Kiểm tra thông báo";
    const check = stripRole(mainStep).match(/^(kiểm tra|xác thực|xác minh|xác định).+/i)?.[0];
    return check ? `alt ${check}` : "alt Kiểm tra điều kiện";
  };
  const exceptionHeader = (exceptions) => {
    const text = [name, ...exceptions].map(cleanText).join(" ");
    if (/thanh toán|giao dịch|mã đơn|chữ ký/i.test(text)) return "alt Xử lý lỗi thanh toán";
    if (/email|mật khẩu|không đúng|không hợp lệ|sai/i.test(text)) return "alt Kiểm tra dữ liệu hợp lệ";
    if (/không tồn tại|không tìm thấy|bị xóa|bị xoá/i.test(text)) return "alt Kiểm tra dữ liệu tồn tại";
    if (/phiên|quyền|tài khoản bị khóa|không có quyền/i.test(text)) return "alt Kiểm tra phiên và quyền";
    if (/kết nối|không tải|backend|hệ thống/i.test(text)) return "alt Xử lý lỗi hệ thống";
    return "alt Xử lý ngoại lệ";
  };
  const requestLabel = (() => {
    if (/đăng nhập/i.test(name)) return "Gửi thông tin đăng nhập tới backend";
    if (/đăng k[iý]/i.test(name)) return "Gửi thông tin đăng kí tới backend";
    if (/thanh toán/i.test(name)) return "Gửi thông tin thanh toán tới backend";
    if (/xem/i.test(name)) return "Gửi yêu cầu tải dữ liệu tới backend";
    return `Gửi yêu cầu ${name.toLowerCase()} tới backend`;
  })();

  const messages = [];
  const frames = [];
  let y = 190;
  const yGap = 40;
  const addMessage = (from, to, text, index, cls = "line") => {
    messages.push({ from, to, text: stripRole(text), index, cls, y });
    y += yGap;
  };
  const addFrame = (header, guard, drawInside, elseGuard = "[Ngược lại]") => {
    const startY = y - 24;
    drawInside();
    const separatorY = elseGuard ? y - 12 : 0;
    if (elseGuard) y += 40;
    const endY = y - 16;
    frames.push({ header, guard, elseGuard, separatorY, y: startY, h: Math.max(elseGuard ? 118 : 78, endY - startY) });
  };

  const altByMainStep = new Map();
  for (const flow of spec.alternateFlows ?? []) {
    const code = oneLine(flow.code ?? "");
    const mainStep = code.split(".")[0];
    if (!mainStep) continue;
    if (!altByMainStep.has(mainStep)) altByMainStep.set(mainStep, []);
    altByMainStep.get(mainStep).push({ code, text: cleanText(flow.title) });
  }

  const routeMainSystemStep = (step, index) => {
    if (hasExternal && externalInPattern.test(step)) {
      addMessage("external", "controller", step, index, "dashed");
      return "controller";
    }
    if (hasExternal && externalOutPattern.test(step)) {
      addMessage("controller", "external", step, index);
      return "external";
    }
    if (backendActionPattern.test(step)) {
      addMessage("controller", "model", step, index);
      return "model";
    }
    if (viewPattern.test(step) || displayPattern.test(step)) {
      addMessage("view", "actor", step, index, displayPattern.test(step) ? "dashed" : "line");
      return "view";
    }
    addMessage("controller", "model", step, index);
    return "model";
  };

  const routeAlternateStep = (flow) => {
    const text = cleanText(flow.text);
    if (/\b(chọn|nhập|bấm|nhấn)\b/i.test(text) && actorPattern.test(text)) {
      addMessage("actor", "view", text, flow.code, "dashed");
      return;
    }
    if (isDisplayStep(text) || /\b(chưa|không|lỗi|thất bại|hủy|huỷ|chuyển sang)\b/i.test(text)) {
      addMessage("view", "actor", text, flow.code, "dashed");
      return;
    }
    addMessage("controller", "model", text, flow.code, "dashed");
  };

  let backendRequested = false;
  let lastBackendRole = "";
  const isBackendRole = (role) => role && role !== "actor" && role !== "view";
  const addBackendReturn = (fromRole, index) => {
    if (fromRole && fromRole !== "controller") {
      addMessage(fromRole, "controller", "Trả kết quả xử lý", `${index}.1`, "dashed");
    }
    addMessage("controller", "view", "Trả response cho giao diện", `${index}.2`, "dashed");
  };
  const mainFlow = (spec.mainFlow ?? []).map(cleanText).filter(Boolean);
  mainFlow.forEach((step, stepIndex) => {
    const index = stepIndex + 1;
    if (actorPattern.test(step)) {
      addMessage("actor", "view", step, index);
      if (submitPattern.test(step)) {
        addMessage("view", "controller", requestLabel, "");
        backendRequested = true;
        lastBackendRole = "controller";
      }
    } else {
      if (!backendRequested && !(viewPattern.test(step) || displayPattern.test(step))) {
        addMessage("view", "controller", requestLabel, `${index}.0`);
        backendRequested = true;
      }
      if ((viewPattern.test(step) || displayPattern.test(step)) && isBackendRole(lastBackendRole)) {
        addBackendReturn(lastBackendRole, index - 1);
        lastBackendRole = "view";
      }
      lastBackendRole = routeMainSystemStep(step, index);
      const nextStep = mainFlow[stepIndex + 1] ?? "";
      if (isBackendRole(lastBackendRole) && displayPattern.test(step)) {
        addBackendReturn(lastBackendRole, index);
        addMessage("view", "actor", displayOnlyText(step), `${index}.3`, "dashed");
        lastBackendRole = "view";
      } else if (isBackendRole(lastBackendRole) && displayPattern.test(nextStep)) {
        addBackendReturn(lastBackendRole, index);
        lastBackendRole = "view";
      }
    }

    const flows = altByMainStep.get(String(index)) ?? [];
    if (flows.length) {
      addFrame(altHeader(step, flows), conditionGuard(flows[0].text), () => {
        flows.forEach(routeAlternateStep);
      });
    }
  });

  if (lastBackendRole && lastBackendRole !== "view" && lastBackendRole !== "external") {
    addMessage(lastBackendRole, "controller", "Trả kết quả xử lý", "R1", "dashed");
    addMessage("controller", "view", "Trả response cho giao diện", "R2", "dashed");
  } else if (lastBackendRole === "external") {
    addMessage("external", "controller", "Trả kết quả từ cổng thanh toán", "R1", "dashed");
    addMessage("controller", "view", "Trả response cho giao diện", "R2", "dashed");
  }

  const exceptions = (spec.exceptions ?? []).map(cleanText).filter(Boolean);
  if (exceptions.length) {
    addFrame(exceptionHeader(exceptions), "[Có lỗi phát sinh]", () => {
      exceptions.forEach((exception, index) => addMessage("view", "actor", exception, `E${index + 1}`, "dashed"));
    }, "");
  }

  if (!messages.length) {
    addMessage("actor", "view", `Mở ${name}`, 1);
    addMessage("view", "controller", requestLabel, 2);
    addMessage("controller", "model", `Xử lý ${name}`, 3);
    addMessage("model", "controller", "Trả kết quả xử lý", 4, "dashed");
    addMessage("controller", "view", "Trả response cho giao diện", 5, "dashed");
    addMessage("view", "actor", "Hiển thị kết quả", 6, "dashed");
  }

  const width = hasExternal ? 1280 : 1120;
  const height = Math.max(720, y + 80);
  const bottomY = height - 55;
  const xStart = hasExternal ? 300 : 330;
  const xEnd = width - (hasExternal ? 150 : 170);
  const gap = Math.floor((xEnd - xStart) / (roles.length - 1));
  const pos = new Map();
  roles.forEach((role, index) => pos.set(role.role, xStart + index * gap));
  const roleX = (role) => pos.get(role);
  const parts = [svgStart(width, height, `Trình tự - ${spec.code}. ${name}`, false)];
  const lineAttrs = (cls) =>
    `stroke="#111" stroke-width="${cls === "dashed" ? "1" : "1.15"}" ${cls === "dashed" ? 'stroke-dasharray="5 4"' : ""} fill="none"`;

  const frameX = Math.max(70, roleX("actor") - 150);
  const frameRight = width - 70;
  const frameW = frameRight - frameX;
  parts.push(`<text x="${frameX}" y="44" class="label" font-style="italic">Biểu đồ trình tự</text>`);
  roles.forEach((role) => {
    const x = roleX(role.role);
    if (role.role === "actor") {
      parts.push(`<circle cx="${x}" cy="76" r="8" fill="#aee8ff" stroke="#111" stroke-width="1.1"/>`);
      parts.push(`<path class="actor" d="M${x} 84 L${x} 115 M${x - 18} 98 L${x + 18} 98 M${x} 115 L${x - 16} 140 M${x} 115 L${x + 16} 140"/>`);
      parts.push(textBlock(x, 160, wrapLabel(role.label, 16, 2), "tiny", 12));
      parts.push(`<line class="lifeline" x1="${x}" y1="166" x2="${x}" y2="${bottomY}"/>`);
      parts.push(`<rect x="${x - 6}" y="166" width="12" height="${bottomY - 166}" fill="#76cdf1" stroke="#111" stroke-width="0.8"/>`);
      return;
    }
    parts.push(`<rect x="${x - role.w / 2}" y="72" width="${role.w}" height="40" fill="#76cdf1" stroke="#111" stroke-width="1.1"/>`);
    parts.push(textBlock(x, 95, wrapLabel(role.label, 18, 1), "tiny", 12));
    parts.push(`<line class="lifeline" x1="${x}" y1="112" x2="${x}" y2="${bottomY}"/>`);
  });

  frames.forEach((frame) => {
    const x = frameX;
    const w = frameW;
    const tabW = Math.min(280, Math.max(125, frame.header.length * 6 + 24));
    parts.push(`<rect x="${x}" y="${frame.y}" width="${w}" height="${frame.h}" fill="none" stroke="#111" stroke-width="1"/>`);
    parts.push(`<path d="M${x} ${frame.y} H${x + tabW} L${x + tabW - 12} ${frame.y + 22} H${x} Z" fill="#fff" stroke="#111" stroke-width="1"/>`);
    parts.push(`<text x="${x + 8}" y="${frame.y + 15}" class="tiny" font-weight="700">${esc(frame.header)}</text>`);
    parts.push(`<text x="${x + 38}" y="${frame.y + 42}" class="tiny">${esc(frame.guard)}</text>`);
    if (frame.separatorY) {
      parts.push(`<line x1="${x}" y1="${frame.separatorY}" x2="${x + w}" y2="${frame.separatorY}" stroke="#111" stroke-width="1" stroke-dasharray="5 4"/>`);
      parts.push(`<text x="${x + 38}" y="${frame.separatorY + 24}" class="tiny">${esc(frame.elseGuard)}</text>`);
    }
  });

  const activated = new Map();
  messages.forEach((message) => {
    [message.from, message.to].forEach((role) => {
      if (role === "actor") return;
      const span = activated.get(role) ?? { start: message.y - 4, end: message.y + 28 };
      span.start = Math.min(span.start, message.y - 4);
      span.end = Math.max(span.end, message.y + 28);
      activated.set(role, span);
    });
  });
  activated.forEach((span, role) => {
    const x = roleX(role);
    parts.push(`<rect x="${x - 6}" y="${span.start}" width="12" height="${span.end - span.start}" fill="#76cdf1" stroke="#111" stroke-width="0.8"/>`);
  });

  messages.forEach((message) => {
    const x1 = roleX(message.from);
    const x2 = roleX(message.to);
    const dir = x2 >= x1 ? 1 : -1;
    const start = x1 + dir * 6;
    const tip = x2 - dir * 6;
    const base = tip - dir * 10;
    const mid = Math.round((start + tip) / 2);
    parts.push(`<path d="M${start} ${message.y} L${base} ${message.y}" ${lineAttrs(message.cls)}/>`);
    parts.push(`<path d="M${tip} ${message.y} L${base} ${message.y - 5} L${base} ${message.y + 5} Z" fill="#111"/>`);
    const prefix = message.index ? `${message.index}. ` : "";
    parts.push(textBlock(mid, message.y - 13, `${prefix}${wrapLabel(message.text, 34, 1)}`, "tiny", 12));
  });

  parts.push(svgEnd());
  return parts.join("\n");
}

function sequenceCleanFlowSvg(spec) {
  const actorLabel = sequenceActorLabel(spec);
  const names = sequenceLayerNames(spec);
  const name = cleanText(spec.name);
  const hasExternal = Boolean(names.external);
  const pageLabel = (() => {
    if (/đăng nhập/i.test(name)) return "Login Page";
    if (/đăng k[iý]/i.test(name)) return "Register Page";
    if (/thanh toán/i.test(name)) return "Payment Page";
    if (/hồ sơ|mật khẩu/i.test(name)) return "Account Page";
    return "View";
  })();
  const roles = [
    { role: "actor", label: actorLabel, w: 130 },
    { role: "view", label: pageLabel, w: 150 },
    { role: "controller", label: names.controller, w: 170 },
    { role: "model", label: names.model, w: 170 },
  ];
  if (hasExternal) roles.push({ role: "external", label: names.external, w: 130 });

  const actorNames = spec.actors.map(cleanText);
  const escapedActors = actorNames.map((actorName) => actorName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  const actorPattern = new RegExp(`^(${escapedActors}|Người dùng|Học viên|Giảng viên|Quản lý|Admin|Manager|Teacher|Student|User)\\b`, "i");
  const displayPattern = /\b(hiển thị|thông báo|trả về|chuyển hướng|điều hướng|chuyển.*giao diện|chuyển.*màn hình|chuyển.*trang)\b/i;
  const submitPattern = /\b(nhấn|bấm|gửi|xác nhận|lưu)\b/i;
  const externalOutPattern = /\b(chuyển.*(cổng|phương thức).*thanh toán|cổng thanh toán|vnpay|gateway)\b/i;
  const externalInPattern = /\b(nhận kết quả thanh toán|callback|phản hồi thanh toán)\b/i;
  const backendActionPattern = /\b(kiểm tra|xác thực|xác minh|xác định|lấy|tìm|truy vấn|tạo|cập nhật|lưu|xóa|xoá|khóa|khoá|ẩn|ghi nhận)\b/i;
  const isDisplayStep = (step) => /hien-thi|thong-bao|tra-ve|chuyen-huong|dieu-huong|chuyen/.test(slugText(step));
  const isBackendStep = (step) => /(^|-)(kiem-tra|xac-thuc|xac-minh|xac-dinh|lay|tim|truy-van|tao|cap-nhat|luu|xoa|khoa|an|ghi-nhan)(-|$)/.test(slugText(step));
  const stripRole = (step) =>
    oneLine(step)
      .replace(/^(Người dùng|Học viên|Giảng viên|Quản lý|Admin|Manager|Teacher|Student|User|Hệ thống|Giao diện|Frontend|Backend|Web)\s+/i, "")
      .replace(/\.$/, "");
  const displayOnlyText = (step) => {
    const text = stripRole(step);
    const match = text.match(/\b(hiển thị.+|thông báo.+|chuyển hướng.+|điều hướng.+|chuyển.+)$/i);
    return match ? match[1] : text;
  };
  const headerObject = (() => {
    if (/đăng nhập/i.test(name)) return "đăng nhập";
    if (/đăng k[iý]/i.test(name)) return "đăng kí";
    if (/thanh toán/i.test(name)) return "thanh toán";
    if (/điểm/i.test(name)) return "điểm";
    if (/lịch học/i.test(name)) return "lịch học";
    if (/lớp học/i.test(name)) return "lớp học";
    if (/thông báo/i.test(name)) return "thông báo";
    if (/bài viết/i.test(name)) return "bài viết";
    if (/khóa học|khoá học/i.test(name)) return "khóa học";
    return cleanText(sequenceObjectLabel(spec));
  })();
  const requestLabel = (() => {
    if (/đăng nhập/i.test(name)) return "Gửi thông tin đăng nhập tới backend";
    if (/đăng k[iý]/i.test(name)) return "Gửi thông tin đăng kí tới backend";
    if (/thanh toán/i.test(name)) return "Gửi thông tin thanh toán tới backend";
    if (/xem/i.test(name)) return "Gửi yêu cầu tải dữ liệu tới backend";
    return `Gửi yêu cầu ${name.toLowerCase()} tới backend`;
  })();

  const messages = [];
  const frames = [];
  let y = 190;
  const yGap = 40;
  const addMessage = (from, to, text, index, cls = "line") => {
    messages.push({ from, to, text: stripRole(text), index, cls, y });
    y += yGap;
  };
  const frameHeaderLines = (header) => wrapLabel(short(header, 48), 25, 2).split("|");
  const frameTopSpace = (header) => (frameHeaderLines(header).length > 1 ? 88 : 72);
  const frameGuardY = (frameY, header) => frameY + (frameHeaderLines(header).length > 1 ? 62 : 48);
  const addFrame = (header, guard, drawInside) => {
    const startY = y - 18;
    const guards = [{ y: frameGuardY(startY, header), text: guard }];
    y = startY + frameTopSpace(header);
    drawInside();
    const endY = y - 8;
    frames.push({ header, guards, separators: [], y: startY, h: Math.max(88, endY - startY) });
    y += 14;
  };
  const returnFromBackend = (fromRole, index) => {
    if (fromRole && fromRole !== "controller") {
      addMessage(fromRole, "controller", "Trả kết quả xử lý", `${index}.1`, "dashed");
    }
    addMessage("controller", "view", "Trả response cho giao diện", `${index}.2`, "dashed");
  };
  const splitConditionAction = (value) => {
    const text = stripRole(value);
    if (!slugText(text).startsWith("neu-")) return { guard: `[${short(text, 52)}]`, action: text };
    const withoutIf = text.replace(/^\S+\s+/, "");
    const parts = withoutIf.split(/,\s*/);
    if (parts.length < 2) return { guard: `[${short(withoutIf, 52)}]`, action: text };
    return {
      guard: `[${short(parts[0], 52)}]`,
      action: oneLine(parts.slice(1).join(", ")),
    };
  };
  const ucFirst = (value) => {
    const text = oneLine(value);
    return text ? `${text.charAt(0).toUpperCase()}${text.slice(1)}` : text;
  };
  const alternateHeader = (parentStep) => {
    const parentText = stripRole(parentStep);
    const parentSlug = slugText(parentText);
    if (parentText && /(^|-)(kiem-tra|xac-thuc|xac-minh|xac-dinh)(-|$)/.test(parentSlug)) return short(`alt ${ucFirst(parentText)}`, 48);
    return `alt Kiểm tra ${headerObject}`;
  };
  const routeAlternate = (flow) => {
    const text = cleanText(flow.actionText ?? flow.title);
    const hasDisplay = isDisplayStep(text);
    const hasBackendAction = isBackendStep(text) || backendActionPattern.test(text);
    if (hasBackendAction) {
      addMessage("controller", "model", text, flow.code, "dashed");
      if (hasDisplay) {
        returnFromBackend("model", flow.code);
        addMessage("view", "actor", displayOnlyText(text), `${flow.code}.3`, "dashed");
      }
      return;
    }
    if (hasDisplay || /\b(chưa|không|lỗi|thất bại|hủy|huỷ|chuyển sang)\b/i.test(text)) {
      addMessage("view", "actor", text, flow.code, "dashed");
      return;
    }
    addMessage("controller", "model", text, flow.code, "dashed");
  };
  const addAlternateFrame = (header, flows) => {
    const startY = y - 18;
    const guards = [];
    const separators = [];
    flows.forEach((flow, flowIndex) => {
      if (flowIndex > 0) {
        separators.push(y - 8);
        y += 18;
      }
      const parsed = splitConditionAction(flow.title);
      if (flowIndex === 0) {
        guards.push({ y: frameGuardY(startY, header), text: parsed.guard });
        y = startY + frameTopSpace(header);
      } else {
        guards.push({ y: y + 12, text: parsed.guard });
        y += 36;
      }
      routeAlternate({ ...flow, actionText: parsed.action });
    });
    const endY = y - 8;
    frames.push({ header, guards, separators, y: startY, h: Math.max(88, endY - startY) });
    y += 14;
  };

  const alternateFlows = (spec.alternateFlows ?? []).filter((flow) => cleanText(flow.title));
  const alternateByParent = new Map();
  alternateFlows.forEach((flow) => {
    const parentCode = String(flow.code ?? "").split(".")[0];
    if (!alternateByParent.has(parentCode)) alternateByParent.set(parentCode, []);
    alternateByParent.get(parentCode).push(flow);
  });
  const emittedAlternateParents = new Set();
  const emitAlternatesForStep = (index, step) => {
    const key = String(index);
    const flows = alternateByParent.get(key) ?? [];
    if (!flows.length) return;
    addAlternateFrame(alternateHeader(step), flows);
    emittedAlternateParents.add(key);
  };

  let backendRequested = false;
  let lastBackendRole = "";
  let lastActorIndex = 0;
  const mainFlow = (spec.mainFlow ?? []).map(cleanText).filter(Boolean);
  mainFlow.forEach((step, stepIndex) => {
    const index = stepIndex + 1;
    if (actorPattern.test(step)) {
      lastActorIndex = index;
      addMessage("actor", "view", step, index);
      if (submitPattern.test(step)) {
        addMessage("view", "controller", requestLabel, "");
        backendRequested = true;
        lastBackendRole = "controller";
      }
    } else {
      const hasDisplay = isDisplayStep(step);
      const hasBackendAction = isBackendStep(step) || backendActionPattern.test(step);
      if (hasDisplay && !hasBackendAction) {
        if (lastBackendRole) returnFromBackend(lastBackendRole, index - 1);
        addMessage("view", "actor", step, index, "dashed");
        lastBackendRole = "";
      } else {
        if (!backendRequested) {
          addMessage("view", "controller", requestLabel, "");
          backendRequested = true;
        }
        if (hasExternal && externalInPattern.test(step)) {
          addMessage("external", "controller", step, index, "dashed");
          lastBackendRole = "controller";
        } else if (hasExternal && externalOutPattern.test(step)) {
          addMessage("controller", "external", step, index);
          lastBackendRole = "external";
        } else {
          addMessage("controller", "model", step, index);
          lastBackendRole = "model";
        }
        if (hasDisplay && hasBackendAction) {
          returnFromBackend(lastBackendRole, index);
          addMessage("view", "actor", displayOnlyText(step), `${index}.3`, "dashed");
          lastBackendRole = "";
        }
      }
    }
    emitAlternatesForStep(index, step);
  });
  if (lastBackendRole) returnFromBackend(lastBackendRole, "R");

  const remainingAlternates = alternateFlows.filter((flow) => !emittedAlternateParents.has(String(flow.code ?? "").split(".")[0]));
  if (remainingAlternates.length) addAlternateFrame(`alt Kiểm tra ${headerObject}`, remainingAlternates);

  const exceptions = (spec.exceptions ?? []).map(cleanText).filter(Boolean);
  if (exceptions.length) {
    addFrame(`alt Xử lý lỗi ${headerObject}`, "[Có lỗi phát sinh]", () => {
      exceptions.forEach((exception, index) => addMessage("view", "actor", exception, `E${index + 1}`, "dashed"));
    });
  }

  const width = hasExternal ? 1280 : 1120;
  const height = Math.max(720, y + 70);
  const bottomY = height - 55;
  const xStart = hasExternal ? 300 : 330;
  const xEnd = width - (hasExternal ? 150 : 170);
  const gap = Math.floor((xEnd - xStart) / (roles.length - 1));
  const pos = new Map();
  roles.forEach((role, index) => pos.set(role.role, xStart + index * gap));
  const roleX = (role) => pos.get(role);
  const frameX = Math.max(190, roleX("actor") - 110);
  const frameRight = width - 70;
  const parts = [svgStart(width, height, `Trình tự - ${spec.code}. ${name}`, false)];
  const lineAttrs = (cls) =>
    `stroke="#111" stroke-width="${cls === "dashed" ? "1" : "1.15"}" ${cls === "dashed" ? 'stroke-dasharray="5 4"' : ""} fill="none" marker-end="url(#arrow)"`;

  parts.push(`<text x="${frameX}" y="44" class="label" font-style="italic">Biểu đồ trình tự</text>`);
  roles.forEach((role) => {
    const x = roleX(role.role);
    if (role.role === "actor") {
      parts.push(`<circle cx="${x}" cy="76" r="8" fill="#aee8ff" stroke="#111" stroke-width="1.1"/>`);
      parts.push(`<path class="actor" d="M${x} 84 L${x} 115 M${x - 18} 98 L${x + 18} 98 M${x} 115 L${x - 16} 140 M${x} 115 L${x + 16} 140"/>`);
      parts.push(textBlock(x, 160, wrapLabel(role.label, 16, 2), "tiny", 12));
      parts.push(`<line class="lifeline" x1="${x}" y1="166" x2="${x}" y2="${bottomY}"/>`);
      parts.push(`<rect x="${x - 6}" y="166" width="12" height="${bottomY - 166}" fill="#76cdf1" stroke="#111" stroke-width="0.8"/>`);
      return;
    }
    parts.push(`<rect x="${x - role.w / 2}" y="72" width="${role.w}" height="40" fill="#76cdf1" stroke="#111" stroke-width="1.1"/>`);
    parts.push(textBlock(x, 95, wrapLabel(role.label, 18, 1), "tiny", 12));
    parts.push(`<line class="lifeline" x1="${x}" y1="112" x2="${x}" y2="${bottomY}"/>`);
  });

  frames.forEach((frame) => {
    const header = short(frame.header, 48);
    const labelW = 170;
    const labelX = frameX - labelW;
    const fragmentX = labelX;
    const fragmentW = frameRight - fragmentX;
    parts.push(`<rect x="${fragmentX}" y="${frame.y}" width="${fragmentW}" height="${frame.h}" fill="none" stroke="#111" stroke-width="1"/>`);
    const labelTextX = labelX + labelW / 2 - 6;
    const labelLines = frameHeaderLines(header);
    const tabH = labelLines.length > 1 ? 34 : 26;
    parts.push(`<path d="M${fragmentX} ${frame.y} H${fragmentX + labelW} L${fragmentX + labelW - 12} ${frame.y + tabH} H${fragmentX} Z" fill="#fff" stroke="#111" stroke-width="1"/>`);
    const labelY = frame.y + (labelLines.length > 1 ? 11 : 16);
    parts.push(`<text x="${labelTextX}" y="${labelY}" text-anchor="middle" class="tiny" font-weight="700">${labelLines
      .map((line, index) => `<tspan x="${labelTextX}" y="${labelY + index * 11}">${esc(line)}</tspan>`)
      .join("")}</text>`);
    (frame.separators ?? []).forEach((separatorY) => {
      parts.push(`<path d="M${fragmentX} ${separatorY} H${frameRight}" stroke="#111" stroke-width="1" stroke-dasharray="5 4"/>`);
    });
    (frame.guards ?? []).forEach((guard) => {
      parts.push(`<text x="${fragmentX + 38}" y="${guard.y}" class="tiny">${esc(guard.text)}</text>`);
    });
  });

  const activationSpans = new Map();
  const addActivationSpan = (role, start, end) => {
    if (!role || role === "actor") return;
    if (!activationSpans.has(role)) activationSpans.set(role, []);
    activationSpans.get(role).push({ start, end });
  };

  messages.forEach((message) => {
    [
      { role: message.from, y: message.y - 30 },
      { role: message.to, y: message.y },
    ].forEach(({ role, y }) => {
      addActivationSpan(role, y, y + 30);
    });
  });

  const mergeableActivationGap = 12;
  activationSpans.forEach((spans, role) => {
    const x = roleX(role);
    const merged = [];
    spans
      .sort((a, b) => a.start - b.start || a.end - b.end)
      .forEach((span) => {
        const last = merged.at(-1);
        if (last && span.start <= last.end + mergeableActivationGap) {
          last.end = Math.max(last.end, span.end);
          return;
        }
        merged.push({ ...span });
      });
    merged.forEach((span) => {
      parts.push(`<rect x="${x - 6}" y="${span.start}" width="12" height="${span.end - span.start}" fill="#76cdf1" stroke="#111" stroke-width="0.8"/>`);
    });
  });

  messages.forEach((message) => {
    const x1 = roleX(message.from);
    const x2 = roleX(message.to);
    const dir = x2 >= x1 ? 1 : -1;
    const start = x1 + dir * 6;
    const tip = x2 - dir * 6;
    const mid = Math.round((start + tip) / 2);
    parts.push(`<path d="M${start} ${message.y} L${tip} ${message.y}" ${lineAttrs(message.cls)}/>`);
    const prefix = message.index ? `${message.index}. ` : "";
    parts.push(textBlock(mid, message.y - 13, `${prefix}${wrapLabel(message.text, 34, 1)}`, "tiny", 12));
  });

  parts.push(`<text x="${Math.round(width / 2)}" y="${height - 18}" text-anchor="middle" font-size="20" font-style="italic" font-weight="700" style="fill:#f00">Biểu đồ trình tự chức năng "${esc(name)}"</text>`);
  parts.push(svgEnd());
  return parts.join("\n");
}

function drawActorFunctionScope(group, spec) {
  const actorName = group.actor;
  const details = spec.details;
  const width = 1260;
  const detailGap = 70;
  const startY = 155;
  const lastDetailY = startY + Math.max(0, details.length - 1) * detailGap;
  const mainY = Math.round((startY + lastDetailY) / 2);
  const height = Math.max(560, lastDetailY + 145);
  const parts = [svgStart(width, height, `Use case phân rã - ${actorName} - ${spec.code}. ${spec.name}`)];

  parts.push(`<rect class="boundary" x="210" y="65" width="980" height="${height - 115}"/>`);
  parts.push(`<text x="230" y="94" class="small">Phạm vi chức năng của actor ${esc(actorName)}</text>`);
  parts.push(`<text x="230" y="116" class="tiny">Chỉ vẽ các use case con mà actor này thực hiện trong chức năng ${esc(spec.code)}.</text>`);
  parts.push(actor(92, mainY, actorName));

  const mainX = 455;
  const mainRx = 190;
  parts.push(usecase(mainX, mainY, mainRx, 36, `${spec.code}. ${wrapLabel(spec.name, 30, 2)}`));
  parts.push(`<path class="relation" d="M118 ${mainY} L${mainX - mainRx} ${mainY}"/>`);

  details.forEach((detail, detailIndex) => {
    const y = startY + detailIndex * detailGap;
    const detailX = 920;
    const detailRx = 220;
    parts.push(usecase(detailX, y, detailRx, 25, wrapLabel(detail, 34, 2)));
    parts.push(arrow(mainX + mainRx, mainY, detailX - detailRx, y, "<<include>>", "dashed"));
  });

  parts.push(`<rect class="note" x="240" y="${height - 58}" width="920" height="34" rx="5"/>`);
  parts.push(textBlock(700, height - 38, `Sơ đồ riêng: Actor ${actorName} - ${spec.code}. ${spec.name}`, "tiny", 12));
  parts.push(svgEnd());
  save(`usecase-phan-ra/${group.folder}/${spec.slug}.svg`, parts.join("\n"));
}

function drawActorSummary(group) {
  const specs = group.useCaseCodes.map(useCaseByCode).filter(Boolean);
  const width = 1380;
  const rowHeight = 100;
  const height = Math.max(620, 160 + specs.length * rowHeight);
  const parts = [svgStart(width, height, `Use case phân rã - Actor ${group.actor}`)];
  const actorY = Math.round(height / 2);
  parts.push(`<rect class="boundary" x="210" y="70" width="1110" height="${height - 120}"/>`);
  parts.push(actor(95, actorY, group.actor));

  specs.forEach((spec, index) => {
    const y = 130 + index * rowHeight;
    const mainX = 455;
    const mainRx = 190;
    parts.push(usecase(mainX, y, mainRx, 31, `${spec.code}. ${wrapLabel(spec.name, 31, 2)}`));
    parts.push(`<path class="relation" d="M120 ${actorY} L${mainX - mainRx} ${y}"/>`);
    spec.details.slice(0, 3).forEach((detail, detailIndex) => {
      const detailY = y - 30 + detailIndex * 30;
      const detailX = 950;
      parts.push(usecase(detailX, detailY, 230, 18, wrapLabel(detail, 38, 1)));
      parts.push(arrow(mainX + mainRx, y, detailX - 230, detailY, detailIndex === 0 ? "<<include>>" : "<<extend>>", "dashed"));
    });
  });

  parts.push(svgEnd());
  save(`usecase-phan-ra/${group.folder}/usecase-phan-ra-${group.folder}.svg`, parts.join("\n"));
}

function actorFunctionIndexHtml(group) {
  const sections = group.useCaseCodes
    .map(useCaseByCode)
    .filter(Boolean)
    .map((spec) => `<section>
  <h2>${spec.code}. ${esc(spec.name)}</h2>
  <img src="${spec.slug}.svg" alt="Use case phân rã ${esc(group.actor)} - ${esc(spec.name)}" />
</section>`)
    .join("\n");

  return `<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Use case phân rã - ${esc(group.actor)}</title>
  <style>
    body { margin: 0; font-family: "Segoe UI", Arial, sans-serif; background: #f2f2f2; color: #111; }
    header { padding: 24px 32px; background: #fff; border-bottom: 1px solid #d8d8d8; }
    h1 { margin: 0 0 8px; font-size: 26px; }
    p { margin: 0; color: #555; }
    main { display: grid; gap: 28px; padding: 28px; }
    section { background: #fff; border: 1px solid #d8d8d8; padding: 18px; }
    h2 { margin: 0 0 14px; font-size: 19px; }
    img { display: block; width: 100%; height: auto; border: 1px solid #bbb; background: #fff; }
  </style>
</head>
<body>
  <header>
    <h1>Use case phân rã - Actor ${esc(group.actor)}</h1>
    <p>Mỗi sơ đồ chỉ thể hiện phạm vi trực tiếp của actor ${esc(group.actor)} trong một chức năng.</p>
  </header>
  <main>
    <section><h2>Tổng hợp actor</h2><img src="usecase-phan-ra-${group.folder}.svg" alt="Use case phân rã actor ${esc(group.actor)}" /></section>
    ${sections}
  </main>
</body>
</html>`;
}

function drawActorDecompositions() {
  actorGroups.forEach((group) => {
    group.useCaseCodes
      .map(useCaseByCode)
      .filter(Boolean)
      .forEach((spec) => drawActorFunctionScope(group, spec));
    drawActorSummary(group);
    save(`usecase-phan-ra/${group.folder}/index.html`, actorFunctionIndexHtml(group));
  });
}

function generalUseCaseSlug(spec) {
  return `${String(spec.number).padStart(2, "0")}-${slugText(spec.name)}`;
}

function useCaseDecompositionSvg(spec) {
  const hasManyActors = spec.actors.length > 3;
  const width = 1120;
  const hasManyExtends = spec.extends.length > 3;
  const height = hasManyActors || hasManyExtends ? 560 : 460;
  const parts = [svgStart(width, height, `Use case phân rã - ${spec.name}`, false)];
  const title = `${spec.number}. Use case ${spec.name}.`;
  const titleW = Math.min(620, 24 + title.length * 8.5);
  const mainX = 440;
  const mainY = spec.actors.length > 1 ? 275 : 245;
  const mainRx = 135;
  const actorX = 145;
  const extendX = 840;
  const extendRx = 130;
  const extendGap = hasManyExtends ? 78 : 95;
  const extendYs =
    spec.extends.length === 1
      ? [mainY]
      : spec.extends.length === 2
        ? [mainY - 95, mainY + 95]
        : hasManyExtends
          ? spec.extends.map((_, index) => mainY - Math.round(((spec.extends.length - 1) * extendGap) / 2) + index * extendGap)
          : spec.extends.map((_, index) => mainY - 105 + index * 95);

  parts.push(`<rect x="78" y="42" width="${titleW}" height="24" fill="#c8fbff"/>`);
  parts.push(`<text x="84" y="59" class="label" font-weight="700">${esc(title)}</text>`);

  const actorGap = hasManyActors ? 82 : 110;
  const firstActorY = mainY - Math.round(((spec.actors.length - 1) * actorGap) / 2);
  spec.actors.forEach((actorName, index) => {
    const y = firstActorY + index * actorGap;
    parts.push(actor(actorX, y, actorName));
    parts.push(`<path class="line" d="M${actorX + 35} ${y} L${mainX - mainRx} ${mainY}"/>`);
  });

  parts.push(usecase(mainX, mainY, mainRx, 32, wrapLabel(spec.name, 26, 2)));

  spec.extends.forEach((label, index) => {
    const y = extendYs[index];
    parts.push(usecase(extendX, y, extendRx, 34, wrapLabel(label, 24, 2)));
    parts.push(arrow(extendX - extendRx, y, mainX + mainRx, mainY, "<<extend>>", "dashed"));
  });

  parts.push(svgEnd());
  return parts.join("\n");
}

function useCaseDecompositionIndexHtml() {
  const sections = decomposedUseCaseSpecs
    .map((spec) => {
      const fileName = `${generalUseCaseSlug(spec)}.svg`;
      return `<section>
  <h2>${spec.number}. ${esc(spec.name)}</h2>
  <img src="${fileName}" alt="Use case phân rã ${esc(spec.name)}" />
</section>`;
    })
    .join("\n");

  return `<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Use case phân rã</title>
  <style>
    body { margin: 0; font-family: "Segoe UI", Arial, sans-serif; background: #f2f2f2; color: #111; }
    header { padding: 24px 32px; background: #fff; border-bottom: 1px solid #d8d8d8; }
    h1 { margin: 0 0 8px; font-size: 26px; }
    p { margin: 0; color: #555; }
    main { display: grid; gap: 28px; padding: 28px; }
    section { background: #fff; border: 1px solid #d8d8d8; padding: 18px; }
    h2 { margin: 0 0 14px; font-size: 19px; }
    img { display: block; width: 100%; height: auto; border: 1px solid #bbb; background: #fff; }
  </style>
</head>
<body>
  <header>
    <h1>Use case phân rã</h1>
    <p>Mỗi sơ đồ bám theo một use case trong sơ đồ tổng quát; phần đặc tả được tách riêng trong thư mục dac-ta-uc.</p>
  </header>
  <main>
    ${sections}
  </main>
</body>
</html>`;
}

function drawUseCaseDecompositions() {
  decomposedUseCaseSpecs.forEach((spec) => {
    save(`usecase-phan-ra/${generalUseCaseSlug(spec)}.svg`, useCaseDecompositionSvg(spec));
  });
  save("usecase-phan-ra/index.html", useCaseDecompositionIndexHtml());
}

const managementActivitySpecs = generalUseCaseSpecs.filter((spec) => {
  const name = cleanText(spec.name);
  return name.startsWith("Quản lý") || ["Đăng nhập", "Đăng kí"].includes(name);
});

function managementActivityIndexHtml() {
  const sections = managementActivitySpecs
    .map((spec) => {
      const fileName = `${generalUseCaseSlug(spec)}.svg`;
      return `<section>
  <h2>${spec.number}. ${esc(spec.name)}</h2>
  <img src="${fileName}" alt="Sơ đồ hoạt động ${esc(spec.name)}" />
</section>`;
    })
    .join("\n");

  return `<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Sơ đồ hoạt động quản lý</title>
  <style>
    body { margin: 0; font-family: "Segoe UI", Arial, sans-serif; background: #f2f2f2; color: #111; }
    header { padding: 24px 32px; background: #fff; border-bottom: 1px solid #d8d8d8; }
    h1 { margin: 0 0 8px; font-size: 26px; }
    p { margin: 0; color: #555; }
    main { display: grid; gap: 28px; padding: 28px; }
    section { background: #fff; border: 1px solid #d8d8d8; padding: 18px; }
    h2 { margin: 0 0 14px; font-size: 19px; }
    img { display: block; width: 100%; height: auto; border: 1px solid #bbb; background: #fff; }
  </style>
</head>
<body>
  <header>
    <h1>Sơ đồ hoạt động quản lý</h1>
    <p>Mỗi sơ đồ gom các thao tác thêm, xem, sửa, xóa/khóa/ẩn của một use case quản lý vào một khung chung.</p>
  </header>
  <main>
    ${sections}
  </main>
</body>
</html>`;
}

function drawManagementActivityDiagrams() {
  managementActivitySpecs.forEach((spec) => {
    const name = cleanText(spec.name);
    const content = ["Đăng nhập", "Đăng kí"].includes(name) ? authActivityCleanSwimlaneSvg(spec) : activityManageFrameSvg(spec);
    save(`hoat-dong-quan-ly/${generalUseCaseSlug(spec)}.svg`, content);
  });
  save("hoat-dong-quan-ly/index.html", managementActivityIndexHtml());
}

function summarySvg() {
  const specs = getChucNangSpecs();
  const width = 1300;
  const rowCount = Math.ceil(specs.length / 2);
  const height = Math.max(820, 150 + rowCount * 88);
  const parts = [svgStart(width, height, `Tổng hợp ${specs.length} đặc tả UseCase`)];
  parts.push(`<rect class="note" x="70" y="60" width="1160" height="58" rx="8"/>`);
  parts.push(textBlock(650, 89, `UML/chuc-nang sinh theo ${specs.length} file đặc tả trong dac-ta-uc.`, "label"));

  specs.forEach((spec, index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const x = col === 0 ? 85 : 675;
    const y = 145 + row * 88;
    parts.push(rectBox(x, y, 540, 62, `${spec.code}. ${wrapLabel(spec.name, 44, 1)}|hoat-dong.svg | lop.svg | trinh-tu.svg`));
  });

  parts.push(svgEnd());
  return parts.join("\n");
}

function functionsIndexHtml() {
  const specs = getChucNangSpecs();
  const sections = specs
    .map((spec) => `<section>
  <h2>${spec.code}. ${esc(spec.name)}</h2>
  <div class="grid">
    <article><h3>Hoạt động</h3><img src="${spec.slug}/hoat-dong.svg" alt="Hoạt động ${esc(spec.name)}" /></article>
    <article><h3>Lớp</h3><img src="${spec.slug}/lop.svg" alt="Lớp ${esc(spec.name)}" /></article>
    <article><h3>Trình tự</h3><img src="${spec.slug}/trinh-tu.svg" alt="Trình tự ${esc(spec.name)}" /></article>
  </div>
</section>`)
    .join("\n");

  return `<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${specs.length} đặc tả UseCase UML</title>
  <style>
    body { margin: 0; font-family: "Segoe UI", Arial, sans-serif; background: #f2f2f2; color: #111; }
    header { padding: 24px 32px; background: #fff; border-bottom: 1px solid #d8d8d8; }
    h1 { margin: 0 0 8px; font-size: 26px; }
    p { margin: 0; color: #555; }
    main { display: grid; gap: 28px; padding: 28px; }
    section { background: #fff; border: 1px solid #d8d8d8; padding: 18px; }
    h2 { margin: 0 0 14px; font-size: 19px; }
    h3 { margin: 0 0 10px; font-size: 14px; }
    .grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; align-items: start; }
    img { display: block; width: 100%; height: auto; border: 1px solid #bbb; background: #fff; }
    @media (max-width: 1100px) { .grid { grid-template-columns: 1fr; } }
  </style>
</head>
<body>
  <header>
    <h1>${specs.length} đặc tả UseCase của hệ thống</h1>
    <p>Mỗi mục bám theo file đặc tả trong dac-ta-uc và có sơ đồ hoạt động, lớp, trình tự.</p>
  </header>
  <main>
    <section>
      <h2>Tổng hợp</h2>
      <img src="tong-hop-chuc-nang.svg" alt="Tổng hợp ${specs.length} đặc tả UseCase" />
    </section>
    ${sections}
  </main>
</body>
</html>`;
}

function systemActivitySvg() {
  const width = 1320;
  const height = 1280;
  const parts = [svgStart(width, height, "Sơ đồ hoạt động tổng thể toàn hệ thống")];

  parts.push(`<circle cx="660" cy="80" r="12" fill="#111"/>`);
  parts.push(rectBox(430, 125, 460, 58, "Tác nhân truy cập hệ thống"));
  parts.push(arrow(660, 92, 660, 125));
  parts.push(diamond(520, 220, 280, 86, "Cần xác thực?"));
  parts.push(arrow(660, 183, 660, 220));
  parts.push(rectBox(150, 245, 360, 58, "UC01. Xem nội dung công khai", "soft"));
  parts.push(rectBox(810, 245, 360, 58, "UC13. Đăng ký, đăng nhập", "soft"));
  parts.push(`<path class="line" d="M520 263 L510 263"/>`);
  parts.push(`<path class="line" d="M800 263 L810 263"/>`);
  parts.push(rectBox(430, 360, 460, 58, "Kiểm tra AuthGuard và phân quyền RBAC"));
  parts.push(`<path class="line" d="M330 303 L330 330 L660 330 L660 360"/>`);
  parts.push(`<path class="line" d="M990 303 L990 330 L660 330 L660 360"/>`);
  parts.push(diamond(520, 455, 280, 86, "Vai trò / phạm vi?"));
  parts.push(arrow(660, 418, 660, 455));

  const lanes = [
    ["Người dùng", "UC02-UC05|UC08|UC13", 150, 620],
    ["Học viên", "UC06-UC08|UC13", 405, 620],
    ["Giảng viên", "UC09-UC13", 660, 620],
    ["Quản lý", "UC11-UC21", 915, 620],
    ["Admin", "UC13-UC23", 1170, 620],
  ];

  lanes.forEach(([name, content, x, y]) => {
    parts.push(`<rect class="soft" x="${x - 108}" y="${y - 50}" width="216" height="150" rx="8"/>`);
    parts.push(textBlock(x, y - 24, name, "small", 13));
    parts.push(textBlock(x, y + 34, content, "tiny", 13));
    parts.push(`<path class="line" d="M660 541 L${x} ${y - 50}"/>`);
  });

  parts.push(rectBox(430, 835, 460, 58, "Service xử lý nghiệp vụ theo chức năng"));
  lanes.forEach(([, , x]) => parts.push(`<path class="line" d="M${x} 720 L${x} 780 L660 780 L660 835"/>`));
  parts.push(rectBox(230, 955, 330, 58, "MongoDB lưu/truy vấn dữ liệu"));
  parts.push(rectBox(760, 955, 330, 58, "VNPay xử lý thanh toán", "soft"));
  parts.push(arrow(660, 893, 395, 955));
  parts.push(arrow(660, 893, 925, 955));
  parts.push(rectBox(430, 1080, 460, 58, "Trả response và cập nhật giao diện"));
  parts.push(arrow(395, 1013, 660, 1080));
  parts.push(arrow(925, 1013, 660, 1080));
  parts.push(arrow(660, 1138, 660, 1215));
  parts.push(`<circle cx="660" cy="1235" r="13" fill="#fff" stroke="#111" stroke-width="1.5"/><circle cx="660" cy="1235" r="8" fill="#111"/>`);

  parts.push(svgEnd());
  return parts.join("\n");
}

function systemSequenceSvg() {
  const width = 1460;
  const height = 900;
  const parts = [svgStart(width, height, "Sơ đồ trình tự tổng thể toàn hệ thống")];
  const participants = ["Actor", "Frontend", "Auth/RBAC", "API Controller", "Domain Service", "Repository/Model", "MongoDB", "External"];
  const gap = Math.floor((width - 160) / (participants.length - 1));
  const pos = new Map();

  participants.forEach((p, index) => {
    const x = 80 + index * gap;
    pos.set(p, x);
    parts.push(`<rect class="participant" x="${x - 72}" y="82" width="144" height="40" rx="6"/>`);
    parts.push(textBlock(x, 104, p, "tiny", 12));
    parts.push(`<line class="lifeline" x1="${x}" y1="122" x2="${x}" y2="835"/>`);
  });

  const messages = [
    ["Actor", "Frontend", "Chọn một trong 23 UC / nhập dữ liệu"],
    ["Frontend", "Auth/RBAC", "Gửi token hoặc yêu cầu xác thực"],
    ["Auth/RBAC", "Repository/Model", "Kiểm tra user, role, permission"],
    ["Repository/Model", "MongoDB", "Truy vấn dữ liệu xác thực"],
    ["MongoDB", "Auth/RBAC", "Trả thông tin quyền", true],
    ["Frontend", "API Controller", "Gửi request nghiệp vụ"],
    ["API Controller", "Auth/RBAC", "Authorize theo endpoint"],
    ["API Controller", "Domain Service", "Validate và điều phối nghiệp vụ"],
    ["Domain Service", "Repository/Model", "Đọc/ghi entity nghiệp vụ"],
    ["Repository/Model", "MongoDB", "CRUD dữ liệu"],
    ["Domain Service", "External", "Gọi VNPay nếu cần"],
    ["External", "Domain Service", "Trả kết quả dịch vụ ngoài", true],
    ["MongoDB", "Repository/Model", "Trả dữ liệu", true],
    ["Repository/Model", "Domain Service", "Trả entity/result", true],
    ["Domain Service", "API Controller", "Trả response nghiệp vụ", true],
    ["API Controller", "Frontend", "HTTP response", true],
    ["Frontend", "Actor", "Hiển thị kết quả / lỗi", true],
  ];

  let y = 160;
  messages.forEach(([from, to, label, ret], index) => {
    parts.push(arrow(pos.get(from), y, pos.get(to), y, `${index + 1}. ${label}`, ret ? "dashed" : "line"));
    y += 39;
  });

  parts.push(svgEnd());
  return parts.join("\n");
}

function systemClassSvg() {
  const width = 1660;
  const height = 1240;
  const classes = [
    ["User", 60, 90],
    ["Session", 380, 90],
    ["AccessToken", 700, 90],
    ["Role", 1020, 90],
    ["Permission", 1340, 90],
    ["Teacher", 60, 310],
    ["Category", 380, 310],
    ["Product", 700, 310],
    ["UserRole", 1020, 310],
    ["RolePermission", 1340, 310],
    ["ClassRoom", 60, 530],
    ["StudentStudy", 380, 530],
    ["StudySession", 700, 530],
    ["Cart", 1020, 530],
    ["CartItem", 1340, 530],
    ["PaymentOrder", 60, 750],
    ["OrderItemSnapshot", 380, 750],
    ["BlogCategory", 700, 750],
    ["Blog", 1020, 750],
    ["Notification", 1340, 750],
    ["SecurityAudit", 60, 970],
    ["DashboardResponse", 380, 970],
  ];
  const parts = [svgStart(width, height, "Sơ đồ lớp tổng thể toàn hệ thống")];
  const boxMap = new Map();
  const classWidth = 260;

  classes.forEach(([name, x, y]) => {
    const attrs = classAttrs(name).slice(0, 6);
    const h = 44 + attrs.length * 17 + 14;
    boxMap.set(name, { x, y, w: classWidth, h });
    parts.push(`<rect class="class" x="${x}" y="${y}" width="${classWidth}" height="${h}"/>`);
    parts.push(`<rect class="classHead" x="${x}" y="${y}" width="${classWidth}" height="38"/>`);
    parts.push(textBlock(x + classWidth / 2, y + 21, name, "small", 13));
    attrs.forEach((attr, attrIndex) => {
      parts.push(`<text x="${x + 12}" y="${y + 56 + attrIndex * 17}" class="tiny">${esc(attr)}</text>`);
    });
  });

  const edgePoint = (a, b) => {
    const ax = a.x + a.w / 2;
    const ay = a.y + a.h / 2;
    const bx = b.x + b.w / 2;
    const by = b.y + b.h / 2;
    const dx = bx - ax;
    const dy = by - ay;

    if (Math.abs(dx) > Math.abs(dy)) {
      return {
        from: [dx > 0 ? a.x + a.w : a.x, ay],
        to: [dx > 0 ? b.x : b.x + b.w, by],
      };
    }

    return {
      from: [ax, dy > 0 ? a.y + a.h : a.y],
      to: [bx, dy > 0 ? b.y : b.y + b.h],
    };
  };

  const relation = (from, to, label, cls = "relation") => {
    const a = boxMap.get(from);
    const b = boxMap.get(to);
    if (!a || !b) return;
    const {
      from: [x1, y1],
      to: [x2, y2],
    } = edgePoint(a, b);
    parts.push(`<path class="${cls}" d="M${Math.round(x1)} ${Math.round(y1)} L${Math.round(x2)} ${Math.round(y2)}"/>`);
    parts.push(`<text x="${Math.round((x1 + x2) / 2)}" y="${Math.round((y1 + y2) / 2 - 5)}" text-anchor="middle" class="tiny">${esc(label)}</text>`);
  };

  relation("User", "Session", "1-n");
  relation("Session", "AccessToken", "1-n");
  relation("User", "AccessToken", "1-n");
  relation("User", "UserRole", "1-n");
  relation("Role", "UserRole", "1-n");
  relation("Role", "RolePermission", "1-n");
  relation("Permission", "RolePermission", "1-n key");
  relation("User", "Teacher", "1-0..1");
  relation("Category", "Product", "1-n");
  relation("Teacher", "Product", "1-n");
  relation("Product", "ClassRoom", "1-n");
  relation("Teacher", "ClassRoom", "1-n");
  relation("User", "StudentStudy", "1-n student");
  relation("ClassRoom", "StudentStudy", "1-n");
  relation("Product", "StudentStudy", "1-n");
  relation("Teacher", "StudentStudy", "1-n");
  relation("StudentStudy", "StudySession", "1-n");
  relation("User", "Cart", "1-0..1");
  relation("Cart", "CartItem", "1-n");
  relation("Product", "CartItem", "1-n");
  relation("User", "PaymentOrder", "1-n");
  relation("PaymentOrder", "OrderItemSnapshot", "1-n");
  relation("BlogCategory", "Blog", "1-n logical");
  relation("User", "Blog", "1-n createdBy");
  relation("User", "Notification", "1-n");
  relation("User", "SecurityAudit", "1-n");
  relation("PaymentOrder", "DashboardResponse", "aggregate");
  relation("StudentStudy", "DashboardResponse", "aggregate");

  parts.push(`<rect class="note" x="700" y="970" width="900" height="105" rx="6"/>`);
  parts.push(`<text x="722" y="1000" class="small">Ghi chú</text>`);
  parts.push(`<text x="722" y="1026" class="tiny">- DashboardResponse là DTO tổng hợp cho màn hình thống kê, không phải collection MongoDB.</text>`);
  parts.push(`<text x="722" y="1048" class="tiny">- Blog.category hiện lưu slug/tên dạng chuỗi; liên kết với BlogCategory là liên kết nghiệp vụ logic.</text>`);

  parts.push(svgEnd());
  return parts.join("\n");
}

function deploymentSvg() {
  const width = 1180;
  const height = 560;
  const parts = [svgStart(width, height, "Biểu đồ triển khai hệ thống")];

  parts.length = 0;
  parts.push(svgStart(width, height, "Bieu do trien khai he thong", false));

  const blue = "#69c3e8";
  const blueTop = "#9fdef4";
  const blueSide = "#55afd9";
  const stroke = "#111";

  const cube = (x, y, w, h, depth, titleLines, inner = []) => {
    const title = Array.isArray(titleLines) ? titleLines : [titleLines];
    const rows = [
      `<polygon points="${x},${y} ${x + depth},${y - depth} ${x + w + depth},${y - depth} ${x + w},${y}" fill="${blueTop}" stroke="${stroke}" stroke-width="1.1"/>`,
      `<polygon points="${x + w},${y} ${x + w + depth},${y - depth} ${x + w + depth},${y + h - depth} ${x + w},${y + h}" fill="${blueSide}" stroke="${stroke}" stroke-width="1.1"/>`,
      `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${blue}" stroke="${stroke}" stroke-width="1.1"/>`,
    ];
    title.forEach((line, index) => {
      rows.push(`<text x="${x + w / 2}" y="${y + 22 + index * 14}" text-anchor="middle" class="tiny" font-weight="${index === title.length - 1 ? 700 : 400}">${esc(line)}</text>`);
    });
    inner.forEach((item) => rows.push(cube(item.x, item.y, item.w, item.h, 14, item.title)));
    return rows.join("\n");
  };

  parts.push(`<text x="54" y="42" class="label" font-weight="700" font-style="italic">2.3.7. Bieu do trien khai</text>`);
  parts.push(
    cube(65, 110, 300, 210, 12, ["<<device>>", "User"], [
      { x: 140, y: 180, w: 135, h: 80, title: ["Frontend App", "Next.js"] },
    ])
  );
  parts.push(
    cube(460, 110, 270, 210, 12, "Backend Server", [
      { x: 505, y: 158, w: 205, h: 135, title: "Node.js / Express" },
      { x: 555, y: 198, w: 130, h: 75, title: "API Service" },
    ])
  );
  parts.push(
    cube(820, 110, 240, 170, 12, "MongoDB Database", [
      { x: 890, y: 178, w: 125, h: 70, title: ["Application", "Collections"] },
    ])
  );
  parts.push(
    cube(460, 390, 185, 95, 12, "Cloudinary", [
      { x: 510, y: 435, w: 90, h: 38, title: "Image Storage" },
    ])
  );
  parts.push(
    cube(820, 390, 185, 95, 12, "VNPay / PayOS", [
      { x: 870, y: 435, w: 90, h: 38, title: "Payment Gateway" },
    ])
  );
  parts.push(`<path d="M365 215 H460" stroke="${stroke}" stroke-width="1.1" fill="none"/>`);
  parts.push(`<path d="M730 215 H820" stroke="${stroke}" stroke-width="1.1" fill="none"/>`);
  parts.push(`<path d="M595 320 V390" stroke="${stroke}" stroke-width="1.1" fill="none"/>`);
  parts.push(`<path d="M730 255 L912 390" stroke="${stroke}" stroke-width="1.1" fill="none"/>`);
  parts.push(svgEnd());
  return parts.join("\n");

  const deploymentNode = (x, y, w, h, stereotype, title, artifacts = []) => {
    const rows = [
      `<rect class="box" x="${x}" y="${y}" width="${w}" height="${h}" rx="6"/>`,
      `<text x="${x + 16}" y="${y + 25}" class="tiny">${esc(stereotype)}</text>`,
      `<text x="${x + 16}" y="${y + 48}" class="label">${esc(title)}</text>`,
    ];
    artifacts.forEach((artifact, index) => {
      const ay = y + 72 + index * 42;
      rows.push(`<rect class="soft" x="${x + 18}" y="${ay}" width="${w - 36}" height="30" rx="4"/>`);
      rows.push(textBlock(x + w / 2, ay + 15, artifact, "tiny", 11));
    });
    return rows.join("\n");
  };

  const databaseNode = (x, y, w, h, title, artifacts = []) => {
    const rows = [
      `<path class="box" d="M${x} ${y + 18} C${x} ${y - 6}, ${x + w} ${y - 6}, ${x + w} ${y + 18} L${x + w} ${y + h - 18} C${x + w} ${y + h + 6}, ${x} ${y + h + 6}, ${x} ${y + h - 18} Z"/>`,
      `<ellipse class="box" cx="${x + w / 2}" cy="${y + 18}" rx="${w / 2}" ry="22"/>`,
      textBlock(x + w / 2, y + 58, title, "small", 13),
    ];
    artifacts.forEach((artifact, index) => {
      rows.push(`<text x="${x + 30}" y="${y + 95 + index * 20}" class="tiny">- ${esc(artifact)}</text>`);
    });
    return rows.join("\n");
  };

  const cloudNode = (x, y, w, h, title, artifacts = []) => {
    const rows = [
      `<rect class="soft" x="${x}" y="${y}" width="${w}" height="${h}" rx="18"/>`,
      `<text x="${x + 18}" y="${y + 29}" class="tiny">&lt;&lt;external service&gt;&gt;</text>`,
      `<text x="${x + 18}" y="${y + 55}" class="label">${esc(title)}</text>`,
    ];
    artifacts.forEach((artifact, index) => {
      rows.push(`<text x="${x + 24}" y="${y + 88 + index * 21}" class="tiny">- ${esc(artifact)}</text>`);
    });
    return rows.join("\n");
  };

  parts.push(`<text x="750" y="68" text-anchor="middle" class="small">Góc nhìn triển khai: client web, Next.js frontend, Express backend, MongoDB và các dịch vụ ngoài.</text>`);
  parts.push(deploymentNode(70, 130, 250, 170, "<<client device>>", "Thiết bị người dùng", ["Web browser", "User / Student / Teacher / Admin"]));
  parts.push(deploymentNode(390, 100, 310, 240, "<<web server>>", "Frontend Next.js", ["App Router pages", "Admin / Student / Public UI", "API client + local storage", "Static assets"]));
  parts.push(deploymentNode(770, 100, 350, 320, "<<application server>>", "Backend Node.js / Express", ["REST controllers", "Auth + RBAC middleware", "Domain services", "Mongoose repositories", "Upload middleware"]));
  parts.push(databaseNode(1210, 135, 230, 210, "MongoDB", ["Users, RBAC", "Courses, classes", "Payments, audits"]));
  parts.push(deploymentNode(390, 535, 310, 150, "<<file storage>>", "Backend uploads", ["avatars/", "course/blog images fallback"]));
  parts.push(cloudNode(770, 535, 300, 160, "Cloudinary", ["Lưu ảnh đại diện", "Lưu ảnh khóa học / bài viết", "CDN phân phối ảnh"]));
  parts.push(cloudNode(1160, 535, 280, 160, "VNPay Gateway", ["Tạo URL thanh toán", "Xử lý giao dịch", "Callback kết quả"]));

  parts.push(arrow(320, 215, 390, 215, "HTTPS"));
  parts.push(arrow(700, 215, 770, 215, "REST/JSON + token"));
  parts.push(arrow(1120, 220, 1210, 220, "Mongoose/TCP"));
  parts.push(arrow(945, 420, 910, 535, "Upload API"));
  parts.push(arrow(540, 340, 540, 535, "multipart file"));
  parts.push(arrow(540, 535, 770, 375, "file path/url", "dashed"));
  parts.push(arrow(1070, 585, 1160, 585, "create payment"));
  parts.push(arrow(1160, 650, 1040, 420, "callback", "dashed"));
  parts.push(arrow(920, 535, 565, 340, "image URL", "dashed"));
  parts.push(arrow(565, 340, 250, 300, "render UI", "dashed"));

  parts.push(`<rect class="note" x="70" y="760" width="1370" height="90" rx="6"/>`);
  parts.push(`<text x="92" y="790" class="small">Ghi chú triển khai</text>`);
  parts.push(`<text x="92" y="818" class="tiny">- Frontend và backend có thể chạy local khi phát triển hoặc tách thành 2 service khi deploy.</text>`);
  parts.push(`<text x="92" y="840" class="tiny">- Backend dùng biến môi trường để cấu hình MongoDB, JWT, Cloudinary và VNPay.</text>`);

  parts.push(svgEnd());
  return parts.join("\n");
}

function deploymentIndexHtml() {
  return `<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Biểu đồ triển khai hệ thống</title>
  <style>
    body { margin: 0; font-family: "Segoe UI", Arial, sans-serif; background: #f2f2f2; color: #111; }
    header { padding: 24px 32px; background: #fff; border-bottom: 1px solid #d8d8d8; }
    h1 { margin: 0 0 8px; font-size: 26px; }
    p { margin: 0; color: #555; }
    main { padding: 28px; }
    section { background: #fff; border: 1px solid #d8d8d8; padding: 18px; }
    img { display: block; width: 100%; height: auto; border: 1px solid #bbb; background: #fff; }
  </style>
</head>
<body>
  <header>
    <h1>Biểu đồ triển khai hệ thống</h1>
    <p>Triển khai frontend, backend, database và dịch vụ ngoài.</p>
  </header>
  <main>
    <section><img src="bieu-do-trien-khai.svg" alt="Biểu đồ triển khai hệ thống" /></section>
  </main>
</body>
</html>`;
}

function systemIndexHtml() {
  return `<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Sơ đồ tổng thể toàn hệ thống</title>
  <style>
    body { margin: 0; font-family: "Segoe UI", Arial, sans-serif; background: #f2f2f2; color: #111; }
    header { padding: 24px 32px; background: #fff; border-bottom: 1px solid #d8d8d8; }
    h1 { margin: 0 0 8px; font-size: 26px; }
    p { margin: 0; color: #555; }
    main { display: grid; gap: 28px; padding: 28px; }
    section { background: #fff; border: 1px solid #d8d8d8; padding: 18px; }
    h2 { margin: 0 0 14px; font-size: 19px; }
    img { display: block; width: 100%; height: auto; border: 1px solid #bbb; background: #fff; }
  </style>
</head>
<body>
  <header>
    <h1>Sơ đồ tổng thể toàn hệ thống</h1>
    <p>Ba sơ đồ dùng chung cho toàn hệ thống: hoạt động, trình tự và lớp.</p>
  </header>
  <main>
    <section><h2>Sơ đồ hoạt động tổng thể</h2><img src="hoat-dong-tong-the.svg" alt="Sơ đồ hoạt động tổng thể" /></section>
    <section><h2>Sơ đồ trình tự tổng thể</h2><img src="trinh-tu-tong-the.svg" alt="Sơ đồ trình tự tổng thể" /></section>
    <section><h2>Sơ đồ lớp tổng thể</h2><img src="lop-tong-the.svg" alt="Sơ đồ lớp tổng thể" /></section>
  </main>
</body>
</html>`;
}

function mainIndexHtml() {
  const specs = getChucNangSpecs();
  const decompositionLinks = decomposedUseCaseSpecs
    .map((spec) => `<li><a href="usecase-phan-ra/${generalUseCaseSlug(spec)}.svg">${spec.number}. ${esc(spec.name)}</a></li>`)
    .join("\n");
  const managementActivityLinks = managementActivitySpecs
    .map((spec) => `<li><a href="hoat-dong-quan-ly/${generalUseCaseSlug(spec)}.svg">${spec.number}. ${esc(spec.name)}</a></li>`)
    .join("\n");

  return `<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Bộ biểu đồ UML</title>
  <style>
    body { margin: 0; font-family: "Segoe UI", Arial, sans-serif; background: #f2f2f2; color: #111; }
    header { padding: 24px 32px; background: #fff; border-bottom: 1px solid #d8d8d8; }
    h1 { margin: 0 0 8px; font-size: 26px; }
    p { margin: 0 0 12px; color: #555; }
    main { display: grid; gap: 28px; padding: 28px; }
    section { background: #fff; border: 1px solid #d8d8d8; padding: 18px; }
    h2 { margin: 0 0 14px; font-size: 19px; }
    a { color: #0f5fcb; font-weight: 600; }
    img { display: block; width: 100%; height: auto; border: 1px solid #bbb; background: #fff; }
    .links { columns: 2; margin: 0; padding-left: 20px; }
    .links li { break-inside: avoid; margin: 4px 0; }
    @media (max-width: 800px) { .links { columns: 1; } }
  </style>
</head>
<body>
  <header>
    <h1>Bộ biểu đồ phân tích thiết kế hệ thống</h1>
    <p>Use case tổng quát được rút gọn theo actor chính; các mục bên dưới bám theo đặc tả use case hiện có.</p>
  </header>
  <main>
    <section>
      <h2>Sơ đồ tổng thể toàn hệ thống</h2>
      <p><a href="tong-the/index.html">Mở sơ đồ hoạt động, trình tự và lớp tổng thể</a></p>
    </section>
    <section>
      <h2>Biểu đồ triển khai</h2>
      <p><a href="trien-khai/index.html">Mở biểu đồ triển khai frontend, backend, database và dịch vụ ngoài</a></p>
    </section>
    <section><h2>${specs.length} đặc tả chức năng</h2><p><a href="chuc-nang/index.html">Mở bộ sơ đồ hoạt động, lớp và trình tự theo dac-ta-uc</a></p></section>
    <section>
      <h2>Sơ đồ hoạt động quản lý</h2>
      <p><a href="hoat-dong-quan-ly/index.html">Mở các sơ đồ hoạt động tổng hợp cho nhóm Quản lý</a></p>
      <ul class="links">
        ${managementActivityLinks}
      </ul>
    </section>
    <section><h2>Use case tổng quát</h2><img src="usecase-tong-quat/usecase-tong-quat.svg" alt="Use case tổng quát" /></section>
    <section>
      <h2>Use case phân rã</h2>
      <p><a href="usecase-phan-ra/index.html">Mở toàn bộ use case phân rã và bảng đặc tả</a></p>
      <ul class="links">
        ${decompositionLinks}
      </ul>
    </section>
  </main>
</body>
</html>`;
}

function readme() {
  const specs = getChucNangSpecs();
  return `# UML

Bộ sơ đồ gồm use case tổng quát rút gọn theo actor chính và ${specs.length} đặc tả chức năng chi tiết của hệ thống.

## Mở nhanh

- \`xem-bieu-do.html\`: xem use case tổng quát và danh sách use case phân rã.
- \`tong-the/index.html\`: xem sơ đồ hoạt động, trình tự và lớp tổng thể toàn hệ thống.
- \`trien-khai/index.html\`: xem biểu đồ triển khai frontend, backend, database và dịch vụ ngoài.
- \`hoat-dong-quan-ly/index.html\`: xem các sơ đồ hoạt động tổng hợp cho nhóm use case Quản lý.
- \`usecase-phan-ra/index.html\`: xem toàn bộ use case phân rã theo sơ đồ tổng quát.
- \`usecase-phan-ra/<ma-use-case>.svg\`: sơ đồ phân rã kèm bảng đặc tả cho một use case.
- \`chuc-nang/index.html\`: xem ${specs.length} đặc tả chức năng; mỗi mục có \`hoat-dong.svg\`, \`lop.svg\`, \`trinh-tu.svg\`.
- \`dac-ta-uc/\`: bảng danh sách tác nhân - UseCase và các file đặc tả use case dạng bảng văn bản.

## Danh sách đặc tả chức năng

${specs.map((spec) => `${spec.code}. ${spec.name}`).join("\n")}

## Sinh lại

Chạy \`node UML/generate-20-uml.mjs\` để sinh lại toàn bộ ảnh SVG và HTML.

Chạy \`node UML/generate-usecase-specs.mjs\` để sinh lại bảng danh sách tác nhân và các file đặc tả use case.
`;
}

ensureClean("chuc-nang");
ensureClean("tong-the");
ensureClean("trien-khai");
ensureClean("usecase-phan-ra");
ensureClean("hoat-dong-quan-ly");

chucNangSpecs = buildFunctionSpecsFromSpecDocs();

drawGeneralUsecase();
drawUseCaseDecompositions();
drawManagementActivityDiagrams();

save("tong-the/hoat-dong-tong-the.svg", systemActivitySvg());
save("tong-the/trinh-tu-tong-the.svg", systemSequenceSvg());
save("tong-the/lop-tong-the.svg", systemClassSvg());
save("tong-the/index.html", systemIndexHtml());

save("trien-khai/bieu-do-trien-khai.svg", deploymentSvg());
save("trien-khai/index.html", deploymentIndexHtml());

save("chuc-nang/tong-hop-chuc-nang.svg", summarySvg());
save("chuc-nang/index.html", functionsIndexHtml());
for (const spec of getChucNangSpecs()) {
  save(`chuc-nang/${spec.slug}/hoat-dong.svg`, activityFromMainFlowSvg(spec));
  save(`chuc-nang/${spec.slug}/lop.svg`, classSvg(spec));
  save(`chuc-nang/${spec.slug}/trinh-tu.svg`, sequenceCleanFlowSvg(spec));
}

save("xem-bieu-do.html", mainIndexHtml());
save("README.md", readme());

console.log(`Generated ${getChucNangSpecs().length} UML/chuc-nang items x 3 diagrams = ${getChucNangSpecs().length * 3} SVG files.`);
console.log("Generated 3 system-wide diagrams: activity, sequence, class.");
console.log("Generated 1 deployment diagram.");
console.log(`Generated 1 general use case and ${decomposedUseCaseSpecs.length} use case decomposition diagrams.`);
console.log(`Generated ${managementActivitySpecs.length} grouped management activity diagrams.`);
