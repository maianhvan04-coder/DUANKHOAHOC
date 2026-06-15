import type {
  StudentStudyItem,
  StudyClassRoom,
  StudyCourse,
  StudyMode,
  StudyStatus,
  StudyTeacher,
} from "../types/student-study.type";

export type ScheduleLessonItem = {
  id: string;
  title: string;
  teacherName: string;
  room: string;
  className: string;
  mode: StudyMode;
  startAt: Date;
  endAt: Date;
};

export const STUDY_STATUS_LABELS: Record<StudyStatus, string> = {
  ENROLLED: "Đã ghi danh",
  STUDYING: "Đang học",
  PAUSED: "Tạm dừng",
  COMPLETED: "Hoàn thành",
  DROPPED: "Đã nghỉ",
};

const WEEKDAY_LABELS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isStudyTeacher(value: unknown): value is StudyTeacher {
  return (
    isObject(value) && ("user" in value || "avatar" in value || "_id" in value)
  );
}

function isStudyCourse(value: unknown): value is StudyCourse {
  return isObject(value) && ("title" in value || "slug" in value);
}

function isStudyClassRoom(value: unknown): value is StudyClassRoom {
  return (
    isObject(value) &&
    ("className" in value || "scheduleText" in value || "room" in value)
  );
}

export function getClassRoom(study: StudentStudyItem) {
  return isStudyClassRoom(study.classRoom) ? study.classRoom : null;
}

export function getCourse(study: StudentStudyItem) {
  if (isStudyCourse(study.course)) return study.course;

  const classRoom = getClassRoom(study);
  if (classRoom && isStudyCourse(classRoom.course)) return classRoom.course;

  return null;
}

export function getTeacher(study: StudentStudyItem) {
  if (isStudyTeacher(study.teacher)) return study.teacher;

  const classRoom = getClassRoom(study);
  if (classRoom && isStudyTeacher(classRoom.teacher)) return classRoom.teacher;

  return null;
}

export function getTeacherName(study: StudentStudyItem) {
  const teacher = getTeacher(study);
  if (isNonEmptyString(teacher?.user?.name)) return teacher.user.name.trim();

  return "Chưa có giảng viên";
}

export function getClassName(study: StudentStudyItem) {
  if (isNonEmptyString(study.className)) return study.className.trim();

  const classRoom = getClassRoom(study);
  if (isNonEmptyString(classRoom?.className)) return classRoom.className.trim();

  return "Chưa có lớp";
}

export function getCourseTitle(study: StudentStudyItem) {
  const course = getCourse(study);
  if (isNonEmptyString(course?.title)) return course.title.trim();

  return getClassName(study);
}

export function getScheduleText(study: StudentStudyItem) {
  if (isNonEmptyString(study.scheduleText)) return study.scheduleText.trim();

  const classRoom = getClassRoom(study);
  if (isNonEmptyString(classRoom?.scheduleText)) {
    return classRoom.scheduleText.trim();
  }

  return "Chưa cập nhật";
}

export function getRoom(study: StudentStudyItem) {
  if (isNonEmptyString(study.room)) return study.room.trim();

  const classRoom = getClassRoom(study);
  if (isNonEmptyString(classRoom?.room)) return classRoom.room.trim();

  return getStudyMode(study) === "ONLINE" ? "Online" : "Chưa cập nhật";
}

export function getStudyMode(study: StudentStudyItem): StudyMode {
  if (study.mode === "ONLINE" || study.mode === "OFFLINE") return study.mode;

  const classRoom = getClassRoom(study);
  if (classRoom?.mode === "ONLINE" || classRoom?.mode === "OFFLINE") {
    return classRoom.mode;
  }

  return "ONLINE";
}

export function getStartedAt(study: StudentStudyItem) {
  if (study.startedAt) return study.startedAt;
  return getClassRoom(study)?.startedAt ?? null;
}

export function getEndedAt(study: StudentStudyItem) {
  if (study.endedAt) return study.endedAt;
  return getClassRoom(study)?.endedAt ?? null;
}

export function getModeLabel(mode: StudyMode) {
  return mode === "ONLINE" ? "Online" : "Trực tiếp";
}

export function getActiveStudies(studies: StudentStudyItem[]) {
  return studies.filter(
    (item) =>
      item.isActive &&
      ["ENROLLED", "STUDYING", "PAUSED", "COMPLETED"].includes(item.status)
  );
}

export function formatScore(value: number | null | undefined) {
  const numberValue = Number(value ?? 0);
  if (!Number.isFinite(numberValue)) return "--";

  return numberValue.toFixed(1).replace(/\.0$/, "");
}

export function scoreFromPercent(value: number | null | undefined) {
  const numberValue = Number(value ?? 0);
  if (!Number.isFinite(numberValue)) return 0;

  return Math.max(0, Math.min(10, numberValue / 10));
}

export function getExamEligibility(study: StudentStudyItem) {
  if (study.status === "DROPPED") return "Không đạt";
  if (Number(study.attendancePercent || 0) < 50) return "Không đạt";
  return "Đạt";
}

export function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;

  if (isObject(error) && isObject(error.data)) {
    const data = error.data;
    if (isNonEmptyString(data.message)) return data.message;
  }

  return fallback;
}

export function pad2(value: number) {
  return String(value).padStart(2, "0");
}

export function parseDate(value?: string | null) {
  if (!value) return null;

  const onlyDateMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (onlyDateMatch) {
    const year = Number(onlyDateMatch[1]);
    const month = Number(onlyDateMatch[2]) - 1;
    const day = Number(onlyDateMatch[3]);
    return new Date(year, month, day, 0, 0, 0, 0);
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function addDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

export function startOfWeekMonday(date: Date) {
  const result = new Date(date);
  const day = result.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  result.setDate(result.getDate() + diff);
  result.setHours(0, 0, 0, 0);
  return result;
}

export function formatShortDate(date: Date) {
  return `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}`;
}

export function getWeekdayLabel(date: Date) {
  const day = date.getDay();
  return WEEKDAY_LABELS[day === 0 ? 6 : day - 1];
}

export function formatWeekRange(weekStart: Date) {
  const weekEnd = addDays(weekStart, 6);
  return `${formatShortDate(weekStart)} - ${formatShortDate(weekEnd)}`;
}

export function isSameDate(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function endOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

function isWithinRange(
  date: Date,
  startValue?: string | null,
  endValue?: string | null
) {
  const start = parseDate(startValue);
  const end = parseDate(endValue);

  if (
    start &&
    date < new Date(start.getFullYear(), start.getMonth(), start.getDate())
  ) {
    return false;
  }

  if (
    end &&
    date > endOfDay(new Date(end.getFullYear(), end.getMonth(), end.getDate()))
  ) {
    return false;
  }

  return true;
}

function parseTimeRangeFromScheduleText(scheduleText: string) {
  const match = scheduleText.match(
    /(\d{1,2})(?::|h|H)?(\d{2})?\s*[-–]\s*(\d{1,2})(?::|h|H)?(\d{2})?/
  );

  if (!match) return null;

  return {
    startHour: Number(match[1]),
    startMinute: Number(match[2] ?? "0"),
    endHour: Number(match[3]),
    endMinute: Number(match[4] ?? "0"),
  };
}

function parseWeekdayIndexes(scheduleText: string) {
  const indexes: number[] = [];
  const patterns: Array<{ index: number; regex: RegExp }> = [
    { index: 0, regex: /(thứ\s*2|\bt2\b)/i },
    { index: 1, regex: /(thứ\s*3|\bt3\b)/i },
    { index: 2, regex: /(thứ\s*4|\bt4\b)/i },
    { index: 3, regex: /(thứ\s*5|\bt5\b)/i },
    { index: 4, regex: /(thứ\s*6|\bt6\b)/i },
    { index: 5, regex: /(thứ\s*7|\bt7\b)/i },
    { index: 6, regex: /(chủ\s*nhật|\bcn\b)/i },
  ];

  patterns.forEach((item) => {
    if (item.regex.test(scheduleText)) indexes.push(item.index);
  });

  return indexes;
}

function createDateTimeFromParts(date: Date, hour: number, minute: number) {
  const next = new Date(date);
  next.setHours(hour, minute, 0, 0);
  return next;
}

export function formatTimeRange(startAt: Date, endAt: Date) {
  return `${pad2(startAt.getHours())}:${pad2(startAt.getMinutes())} - ${pad2(
    endAt.getHours()
  )}:${pad2(endAt.getMinutes())}`;
}

export function buildLessonsFromStudy(
  study: StudentStudyItem,
  weekDates: Date[]
): ScheduleLessonItem[] {
  const mode = getStudyMode(study);
  const scheduleText = getScheduleText(study);
  const timeRange = parseTimeRangeFromScheduleText(scheduleText);
  const weekdayIndexes = parseWeekdayIndexes(scheduleText);

  const plannedLessons =
    timeRange && weekdayIndexes.length > 0
      ? weekdayIndexes.map((weekdayIndex) => {
          const date = weekDates[weekdayIndex];
          if (!date) return null;
          if (!isWithinRange(date, getStartedAt(study), getEndedAt(study))) {
            return null;
          }

          return {
            id: `${study._id}-${weekdayIndex}-${formatShortDate(date)}`,
            title: getCourseTitle(study),
            teacherName: getTeacherName(study),
            room: getRoom(study),
            className: getClassName(study),
            mode,
            startAt: createDateTimeFromParts(
              date,
              timeRange.startHour,
              timeRange.startMinute
            ),
            endAt: createDateTimeFromParts(
              date,
              timeRange.endHour,
              timeRange.endMinute
            ),
          };
        })
      : [];

  const sessionLessons = study.sessions
    .map((session) => {
      const date = parseDate(session.date);
      if (!date) return null;
      if (!weekDates.some((weekDate) => isSameDate(weekDate, date))) return null;

      return {
        id: `${study._id}-session-${session.sessionNo}-${formatShortDate(date)}`,
        title: getCourseTitle(study),
        teacherName: getTeacherName(study),
        room: getRoom(study),
        className: getClassName(study),
        mode,
        startAt: timeRange
          ? createDateTimeFromParts(
              date,
              timeRange.startHour,
              timeRange.startMinute
            )
          : createDateTimeFromParts(date, 18, 0),
        endAt: timeRange
          ? createDateTimeFromParts(date, timeRange.endHour, timeRange.endMinute)
          : createDateTimeFromParts(date, 20, 0),
      };
    })
    .filter((item): item is ScheduleLessonItem => item !== null);

  const lessons = new Map<string, ScheduleLessonItem>();

  plannedLessons
    .filter((item): item is ScheduleLessonItem => item !== null)
    .forEach((item) => lessons.set(formatShortDate(item.startAt), item));

  sessionLessons.forEach((item) =>
    lessons.set(formatShortDate(item.startAt), item)
  );

  return Array.from(lessons.values()).sort(
    (a, b) => a.startAt.getTime() - b.startAt.getTime()
  );
}
