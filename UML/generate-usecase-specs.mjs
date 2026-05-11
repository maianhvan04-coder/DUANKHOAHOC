import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { actorHierarchy, actorUseCaseMap, useCaseByCode, useCases } from "./usecase-data.mjs";

const root = dirname(fileURLToPath(import.meta.url));
const outputDir = join(root, "dac-ta-uc");

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

function renderAlternateFlows(flows) {
  return flows
    .map((flow) => {
      const steps = flow.steps.map((step, index) => `${flow.code}.${index + 1}. ${step}`).join("\n");
      return `${flow.code}. ${flow.title}\n${steps}`;
    })
    .join("\n\n");
}

function renderExceptions(spec) {
  const exceptions = [
    "Không thể kết nối đến backend hoặc cơ sở dữ liệu, hệ thống thông báo lỗi kết nối cho người dùng.",
    "Phiên đăng nhập hết hạn hoặc token không hợp lệ, hệ thống yêu cầu người dùng đăng nhập lại.",
    "Hệ thống phát sinh lỗi không xác định, thao tác hiện tại không được lưu và người dùng được đề xuất thử lại sau.",
  ];

  if (spec.code === "UC02") {
    exceptions.push("Cổng thanh toán VNPay không phản hồi hoặc trả dữ liệu không hợp lệ, hệ thống giữ đơn ở trạng thái chờ hoặc thất bại theo nghiệp vụ.");
  }

  return renderList(exceptions);
}

function actorUseCaseRows() {
  const rows = [["Tác nhân", "Mã UC", "UseCase"]];

  for (const [actorName, codes] of actorUseCaseMap) {
    codes
      .map((code) => useCaseByCode(code))
      .filter(Boolean)
      .forEach((spec, index) => {
        rows.push([index === 0 ? actorName : "", spec.code, spec.name]);
      });
  }

  return rows;
}

function actorUseCaseListDoc() {
  const hierarchyNote = actorHierarchy.map(([child, parent]) => `${child} kế thừa ${parent}`).join("; ");

  return `Bảng 2-1: Bảng danh sách các tác nhân và UseCase theo tác nhân

Ghi chú: Bảng dưới đây liệt kê các liên kết trực tiếp trong sơ đồ use case tổng quát. Quan hệ kế thừa actor trên sơ đồ: ${hierarchyNote}.

${table(actorUseCaseRows(), [16, 8, 58], 1)}
`;
}

function textDoc(spec) {
  const rows = [
    ["Mã UseCase", spec.code],
    ["Tên UseCase", spec.name],
    ["Mô tả", spec.description],
    ["Tiền điều kiện", renderList(spec.preconditions)],
    ["Luồng chính", renderOrdered(spec.mainFlow)],
    ["Luồng phụ", renderAlternateFlows(spec.alternateFlows)],
    ["Ngoại lệ", renderExceptions(spec)],
  ];

  return `Bảng 2-${Number(spec.code.slice(2)) + 1}: Bảng đặc tả chức năng "${spec.name}"

${table(rows, [16, 86])}
`;
}

function cleanDocOutput() {
  const target = resolve(outputDir);
  const allowedRoot = resolve(root) + sep;
  if (!target.startsWith(allowedRoot)) {
    throw new Error(`Refuse to clean outside UML: ${target}`);
  }

  mkdirSync(target, { recursive: true });
  const generatedFiles = ["bang-danh-sach-tac-nhan-usecase.doc", ...useCases.map((spec) => spec.file)];
  for (const file of generatedFiles) {
    rmSync(join(target, file), { force: true });
  }
}

cleanDocOutput();
writeFileSync(join(outputDir, "bang-danh-sach-tac-nhan-usecase.doc"), `\ufeff${actorUseCaseListDoc()}`, "utf8");

for (const spec of useCases) {
  writeFileSync(join(outputDir, spec.file), `\ufeff${textDoc(spec)}`, "utf8");
}

console.log(`Generated ${useCases.length} use case specification documents and 1 actor-usecase list in ${outputDir}`);
