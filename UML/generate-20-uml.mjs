import { mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve, sep } from "node:path";
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

function svgStart(width, height, title, showTitle = true) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <title>${esc(title)}</title>
  <defs>
    <marker id="arrow" markerWidth="9" markerHeight="9" refX="9" refY="4.5" orient="auto" markerUnits="strokeWidth">
      <path d="M0,0 L9,4.5 L0,9 Z" fill="#111"/>
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

function drawGeneralUsecase() {
  const width = 1020;
  const height = 1640;
  const ucX = 610;
  const ucRx = 190;
  const parts = [svgStart(width, height, "Use case tổng quát")];
  parts.push(`<pattern id="grid" width="18" height="18" patternUnits="userSpaceOnUse">
    <path d="M18 0 H0 V18" fill="none" stroke="#eeeeee" stroke-width="1"/>
  </pattern>`);
  parts.push(`<rect width="100%" height="100%" fill="url(#grid)" opacity="0.65"/>`);
  parts.push(`<rect class="boundary" x="190" y="70" width="750" height="${height - 130}"/>`);
  parts.push(`<text x="565" y="98" text-anchor="middle" class="small">Hệ thống quản lý khóa học</text>`);

  const actorPositions = [
    ["Người dùng", 90, 235],
    ["Học viên", 90, 515],
    ["Giảng viên", 90, 800],
    ["Quản lý", 90, 1115],
    ["Admin", 90, 1430],
  ];

  actorPositions.forEach(([label, x, y]) => parts.push(actor(x, y, label)));
  const actorPos = Object.fromEntries(actorPositions.map(([label, x, y]) => [label, { x, y }]));

  actorHierarchy.forEach(([child, parent]) => {
    const c = actorPos[child];
    const p = actorPos[parent];
    if (!c || !p) return;
    const x = 90;
    const startY = c.y - 58;
    const endY = p.y + 58;
    parts.push(`<path class="relation" d="M${x} ${startY} L${x} ${endY}"/>`);
    parts.push(`<path d="M${x} ${endY} L${x - 9} ${endY + 17} L${x + 9} ${endY + 17} Z" fill="#fff" stroke="#111" stroke-width="1.1"/>`);
  });

  useCases.forEach((spec, index) => {
    const y = 130 + index * 62;
    parts.push(usecase(ucX, y, ucRx, 24, `${spec.code}. ${wrapLabel(spec.name, 35, 2)}`));
    spec.actors.forEach((actorName) => {
      const from = actorPos[actorName];
      if (!from) return;
      parts.push(`<path class="relation" d="M${from.x + 25} ${from.y} L${ucX - ucRx} ${y}"/>`);
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
    const d = points.map(([x, y], index) => `${index === 0 ? "M" : "L"}${x} ${y}`).join(" ");
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
  const objectName = featureName.includes("Phân quyền") ? "RBAC" : featureName.replace(/^Quản lý\s+/i, "");
  const details = spec.details.map(cleanText);
  const addLabel = details.find((item) => /thêm|tạo/i.test(item)) ?? `Thêm ${objectName}`;
  const viewLabel = details.find((item) => /xem|danh sách/i.test(item)) ?? `Xem ${objectName}`;
  const selectLabel = details.find((item) => /chọn|lọc|tìm/i.test(item)) ?? `Chọn ${objectName}`;
  const editLabel = details.find((item) => /sửa|cập nhật|gán/i.test(item)) ?? `Sửa ${objectName}`;
  const deleteLabel = details.find((item) => /xóa|hủy/i.test(item)) ?? `Xóa ${objectName}`;
  const parts = [svgStart(width, height, `Hoạt động - ${spec.code}. ${featureName}`, false)];
  const flowPath = (points, label = "", labelX = 0, labelY = 0) => {
    const d = points.map(([x, y], index) => `${index === 0 ? "M" : "L"}${x} ${y}`).join(" ");
    const labelSvg = label ? `<text x="${labelX}" y="${labelY}" text-anchor="middle" class="tiny">${esc(label)}</text>` : "";
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
  parts.push(flowPath([[90, 251], [75, 270], [75, 290]], "true", 54, 268));
  parts.push(flowPath([[120, 251], [194, 270], [194, 290]], "false", 174, 268));
  parts.push(diamond(91, 385, 55, 42, ""));
  parts.push(flowPath([[75, 336], [75, 406], [91, 406]]));
  parts.push(flowPath([[194, 336], [194, 406], [146, 406]]));
  parts.push(`<circle cx="118" cy="477" r="13" fill="#fff" stroke="#111" stroke-width="1.5"/><circle cx="118" cy="477" r="8" fill="#111"/>`);
  parts.push(flowPath([[118, 427], [118, 464]]));

  parts.push(groupBox(285, 135, 210, 455, "Xem / xóa"));
  parts.push(`<circle cx="390" cy="185" r="11" fill="#111"/>`);
  parts.push(actionBox(320, 240, 140, 42, viewLabel));
  parts.push(flowPath([[390, 196], [390, 240]]));
  parts.push(actionBox(320, 310, 140, 42, selectLabel));
  parts.push(flowPath([[390, 282], [390, 310]]));
  parts.push(diamond(360, 380, 60, 46, ""));
  parts.push(flowPath([[390, 352], [390, 380]]));
  parts.push(actionBox(320, 455, 140, 48, deleteLabel));
  parts.push(flowPath([[390, 426], [390, 455]], "true", 421, 445));
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
  parts.push(flowPath([[725, 546], [680, 565], [680, 575]], "true", 681, 558));
  parts.push(flowPath([[755, 546], [820, 565], [820, 575]], "false", 819, 558));
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
  const actorLabel = actorNames.join("/");
  const name = `${spec.code}. ${cleanText(spec.name)}`;
  const boxW = 260;
  const boxH = 56;
  const actorBoxX = leftCx - boxW / 2;
  const systemBoxX = rightCx - boxW / 2;
  const nodeCenter = (node) => (node.lane === "actor" ? leftCx : rightCx);
  const nodeBoxX = (node) => (node.lane === "actor" ? actorBoxX : systemBoxX);
  const parts = [svgStart(width, height, `Hoạt động - ${name}`)];
  const flowPath = (points, label = "", labelX = 0, labelY = 0, cls = "line") => {
    const d = points.map(([x, y], index) => `${index === 0 ? "M" : "L"}${x} ${y}`).join(" ");
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
    const retryY = Math.round((retryNode?.y ?? laneTop + 150) + boxH / 2);
    const retryX = retryNode?.x ?? actorBoxX;
    const sideX = leftX + 24;
    parts.push(flowPath([[errX + 70, errY + 58], [errX + 70, errY + 86], [sideX, errY + 86], [sideX, retryY], [retryX, retryY]], "", 0, 0, "dashed"));
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

function sequenceSvg(spec) {
  const width = 1320;
  const height = 720;
  const parts = [svgStart(width, height, `Trình tự - ${spec.code}. ${spec.name}`)];
  const participants = spec.participants;
  const gap = Math.floor((width - 160) / (participants.length - 1));
  const pos = new Map();

  participants.forEach((participant, index) => {
    const x = 80 + index * gap;
    pos.set(participant, x);
    parts.push(`<rect class="participant" x="${x - 74}" y="82" width="148" height="38" rx="6"/>`);
    parts.push(textBlock(x, 103, wrapLabel(participant, 18, 2), "tiny", 12));
    parts.push(`<line class="lifeline" x1="${x}" y1="120" x2="${x}" y2="660"/>`);
  });

  const messages = [
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

  let y = 155;
  messages.forEach(([from, to, label, ret], index) => {
    parts.push(arrow(pos.get(from), y, pos.get(to), y, `${index + 1}. ${label}`, ret ? "dashed" : "line"));
    y += 55;
  });

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

function summarySvg() {
  const width = 1300;
  const height = 1240;
  const parts = [svgStart(width, height, "Tổng hợp 23 chức năng UseCase")];
  parts.push(`<rect class="note" x="70" y="60" width="1160" height="58" rx="8"/>`);
  parts.push(textBlock(650, 89, "UML/chuc-nang khớp với 23 chức năng trong sơ đồ use case tổng quát.", "label"));

  useCases.forEach((spec, index) => {
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
  const sections = useCases
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
  <title>23 chức năng UseCase UML</title>
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
    <h1>23 chức năng UseCase của hệ thống</h1>
    <p>Mỗi chức năng có sơ đồ hoạt động, sơ đồ lớp và sơ đồ trình tự.</p>
  </header>
  <main>
    <section>
      <h2>Tổng hợp</h2>
      <img src="tong-hop-chuc-nang.svg" alt="Tổng hợp 23 chức năng UseCase" />
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
  const width = 1500;
  const height = 930;
  const parts = [svgStart(width, height, "Biểu đồ triển khai hệ thống")];

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
  const actorSections = actorGroups
    .map((group) => {
      const links = group.useCaseCodes
        .map(useCaseByCode)
        .filter(Boolean)
        .map((spec) => `<li><a href="usecase-phan-ra/${group.folder}/${spec.slug}.svg">${spec.code}. ${esc(spec.name)}</a></li>`)
        .join("\n");

      return `<section>
  <h2>Use case phân rã - Actor ${esc(group.actor)}</h2>
  <p><a href="usecase-phan-ra/${group.folder}/index.html">Mở toàn bộ phạm vi chức năng của actor ${esc(group.actor)}</a></p>
  <ul class="links">
    ${links}
  </ul>
</section>`;
    })
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
    <p>Dữ liệu được căn theo 23 chức năng trong sơ đồ use case tổng quát.</p>
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
    <section><h2>23 chức năng</h2><p><a href="chuc-nang/index.html">Mở bộ sơ đồ hoạt động, lớp và trình tự cho 23 chức năng</a></p></section>
    <section><h2>Use case tổng quát</h2><img src="usecase-tong-quat/usecase-tong-quat.svg" alt="Use case tổng quát" /></section>
    ${actorSections}
  </main>
</body>
</html>`;
}

function readme() {
  return `# UML

Bộ sơ đồ được sinh lại theo 23 chức năng trong \`usecase-tong-quat/usecase-tong-quat.svg\`.

## Mở nhanh

- \`xem-bieu-do.html\`: xem use case tổng quát và danh sách use case phân rã theo từng actor.
- \`tong-the/index.html\`: xem sơ đồ hoạt động, trình tự và lớp tổng thể toàn hệ thống.
- \`trien-khai/index.html\`: xem biểu đồ triển khai frontend, backend, database và dịch vụ ngoài.
- \`usecase-phan-ra/<Actor>/index.html\`: xem toàn bộ sơ đồ phân rã riêng của một actor.
- \`usecase-phan-ra/<Actor>/<ma-chuc-nang>.svg\`: sơ đồ phạm vi riêng của actor trong một chức năng cụ thể.
- \`chuc-nang/index.html\`: xem 23 chức năng; mỗi chức năng có \`hoat-dong.svg\`, \`lop.svg\`, \`trinh-tu.svg\`.
- \`dac-ta-uc/\`: bảng danh sách tác nhân - UseCase và 23 file đặc tả use case dạng bảng văn bản.

## Danh sách 23 chức năng

${useCases.map((spec) => `${spec.code}. ${spec.name}`).join("\n")}

## Sinh lại

Chạy \`node UML/generate-20-uml.mjs\` để sinh lại toàn bộ ảnh SVG và HTML.

Chạy \`node UML/generate-usecase-specs.mjs\` để sinh lại bảng danh sách tác nhân và 23 file đặc tả use case.
`;
}

ensureClean("chuc-nang");
ensureClean("tong-the");
ensureClean("trien-khai");
ensureClean("usecase-phan-ra");

drawGeneralUsecase();
drawActorDecompositions();

save("tong-the/hoat-dong-tong-the.svg", systemActivitySvg());
save("tong-the/trinh-tu-tong-the.svg", systemSequenceSvg());
save("tong-the/lop-tong-the.svg", systemClassSvg());
save("tong-the/index.html", systemIndexHtml());

save("trien-khai/bieu-do-trien-khai.svg", deploymentSvg());
save("trien-khai/index.html", deploymentIndexHtml());

save("chuc-nang/tong-hop-chuc-nang.svg", summarySvg());
save("chuc-nang/index.html", functionsIndexHtml());
for (const spec of useCases) {
  save(`chuc-nang/${spec.slug}/hoat-dong.svg`, activitySwimlaneSvg(spec));
  save(`chuc-nang/${spec.slug}/lop.svg`, classSvg(spec));
  save(`chuc-nang/${spec.slug}/trinh-tu.svg`, sequenceSvg(spec));
}

save("xem-bieu-do.html", mainIndexHtml());
save("README.md", readme());

console.log(`Generated ${useCases.length} UML/chuc-nang items x 3 diagrams = ${useCases.length * 3} SVG files.`);
console.log("Generated 3 system-wide diagrams: activity, sequence, class.");
console.log("Generated 1 deployment diagram.");
console.log(`Generated 1 general use case and ${actorGroups.length} actor decomposition groups.`);
