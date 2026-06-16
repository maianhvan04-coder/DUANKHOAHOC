export const AI_SCOPE_REFUSAL =
  "Mình chỉ hỗ trợ các câu hỏi liên quan đến khóa học, lịch học, thông báo, học phí và hoạt động của trung tâm. Bạn hỏi lại theo phạm vi này nhé.";

const DOMAIN_KEYWORDS = [
  "khoa hoc",
  "lop hoc",
  "chuong trinh",
  "lo trinh",
  "tu van",
  "dang ky",
  "hoc vien",
  "giang vien",
  "giao vien",
  "lich hoc",
  "thong bao",
  "hoc phi",
  "thanh toan",
  "diem",
  "bai tap",
  "buoi hoc",
  "phong hoc",
  "trung tam",
  "toeic",
  "ielts",
  "tin hoc",
  "lap trinh",
  "tieng anh",
  "lich",
  "hom nay",
  "tuan nay",
  "ngay mai",
  "sap toi",
  "nghi hoc",
  "khai giang",
  "lich nghi",
];

const OFF_TOPIC_KEYWORDS = [
  "thoi tiet",
  "bong da",
  "the thao",
  "chung khoan",
  "coin",
  "crypto",
  "bitcoin",
  "dau tu",
  "nau an",
  "mon an",
  "du lich",
  "ve may bay",
  "khach san",
  "phim",
  "game",
  "tinh yeu",
  "boi toan",
  "tu vi",
  "benh",
  "thuoc",
  "y te",
  "phap luat",
  "lap code",
  "viet code",
  "sua code",
  "tin tuc",
  "chinh tri",
];

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase();
}

export function isOutsideAiScope(message: string) {
  const normalized = normalizeText(message);
  const hasDomainKeyword = DOMAIN_KEYWORDS.some((keyword) =>
    normalized.includes(keyword)
  );
  const hasOffTopicKeyword = OFF_TOPIC_KEYWORDS.some((keyword) =>
    normalized.includes(keyword)
  );

  return hasOffTopicKeyword && !hasDomainKeyword;
}
