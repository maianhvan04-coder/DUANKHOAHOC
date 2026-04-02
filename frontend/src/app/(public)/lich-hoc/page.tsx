"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  MapPin,
  MonitorPlay,
  Sparkles,
  User2,
} from "lucide-react";
import { authApi } from "@/app/api/auth.api";
import {
  studentStudyApi,
  type StudentStudyItem,
  type StudyMode,
  type StudyTeacher,
  type StudyCourse,
  type StudyClassRoom,
} from "@/app/api/student-study.api";

type ScheduleLessonItem = {
  id: string;
  title: string;
  teacherName: string;
  room: string;
  className: string;
  mode: StudyMode;
  startAt: Date;
  endAt: Date;
};

const WEEKDAY_LABELS = [
  "Thứ 2",
  "Thứ 3",
  "Thứ 4",
  "Thứ 5",
  "Thứ 6",
  "Thứ 7",
  "CN",
];

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

function toDateOnlyKey(date: Date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(
    date.getDate()
  )}`;
}

function parseDate(value?: string | null) {
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

function addDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function startOfWeekMonday(date: Date) {
  const result = new Date(date);
  const day = result.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  result.setDate(result.getDate() + diff);
  result.setHours(0, 0, 0, 0);
  return result;
}

function endOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

function isSameDate(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
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

function formatTimeRange(startAt: Date, endAt: Date) {
  return `${pad2(startAt.getHours())}:${pad2(startAt.getMinutes())} - ${pad2(
    endAt.getHours()
  )}:${pad2(endAt.getMinutes())}`;
}

function formatWeekRange(weekStart: Date) {
  const weekEnd = addDays(weekStart, 6);
  return `${weekStart.getDate()}/${weekStart.getMonth() + 1}/${weekStart.getFullYear()} - ${weekEnd.getDate()}/${weekEnd.getMonth() + 1}/${weekEnd.getFullYear()}`;
}

function isStudyTeacher(value: unknown): value is StudyTeacher {
  return (
    isObject(value) && ("user" in value || "avatar" in value || "_id" in value)
  );
}

function isStudyCourse(value: unknown): value is StudyCourse {
  return (
    isObject(value) &&
    ("title" in value || "teacherName" in value || "slug" in value)
  );
}

function isStudyClassRoom(value: unknown): value is StudyClassRoom {
  return (
    isObject(value) &&
    ("className" in value || "scheduleText" in value || "room" in value)
  );
}

function getClassRoom(study: StudentStudyItem): StudyClassRoom | null {
  return isStudyClassRoom(study.classRoom) ? study.classRoom : null;
}

function getCourse(study: StudentStudyItem): StudyCourse | null {
  if (isStudyCourse(study.course)) return study.course;

  const classRoom = getClassRoom(study);
  if (classRoom && isStudyCourse(classRoom.course)) return classRoom.course;

  return null;
}

function getTeacher(study: StudentStudyItem): StudyTeacher | null {
  if (isStudyTeacher(study.teacher)) return study.teacher;

  const classRoom = getClassRoom(study);
  if (classRoom && isStudyTeacher(classRoom.teacher)) return classRoom.teacher;

  const course = getCourse(study);
  if (course && isStudyTeacher(course.teacher)) return course.teacher;

  return null;
}

function getTeacherName(study: StudentStudyItem) {
  const teacher = getTeacher(study);
  if (isNonEmptyString(teacher?.user?.name)) return teacher.user.name.trim();

  const course = getCourse(study);
  if (isNonEmptyString(course?.teacherName)) return course.teacherName.trim();

  return "Giảng viên";
}

function getClassName(study: StudentStudyItem) {
  if (isNonEmptyString(study.className)) return study.className.trim();

  const classRoom = getClassRoom(study);
  if (isNonEmptyString(classRoom?.className)) return classRoom.className.trim();

  return "";
}

function getCourseTitle(study: StudentStudyItem) {
  const course = getCourse(study);
  if (isNonEmptyString(course?.title)) return course.title.trim();

  const className = getClassName(study);
  if (className) return className;

  return "Lớp học";
}

function getStudyMode(study: StudentStudyItem): StudyMode {
  if (study.mode === "ONLINE" || study.mode === "OFFLINE") return study.mode;

  const classRoom = getClassRoom(study);
  if (classRoom?.mode === "ONLINE" || classRoom?.mode === "OFFLINE") {
    return classRoom.mode;
  }

  return "ONLINE";
}

function getScheduleText(study: StudentStudyItem) {
  if (isNonEmptyString(study.scheduleText)) return study.scheduleText.trim();

  const classRoom = getClassRoom(study);
  if (isNonEmptyString(classRoom?.scheduleText)) {
    return classRoom.scheduleText.trim();
  }

  return "";
}

function getRoomLabel(study: StudentStudyItem) {
  if (isNonEmptyString(study.room)) return study.room.trim();

  const classRoom = getClassRoom(study);
  if (isNonEmptyString(classRoom?.room)) return classRoom.room.trim();

  return getStudyMode(study) === "ONLINE" ? "Google Meet" : "Phòng học";
}

function getStartedAt(study: StudentStudyItem) {
  if (study.startedAt) return study.startedAt;

  const classRoom = getClassRoom(study);
  return classRoom?.startedAt ?? null;
}

function getEndedAt(study: StudentStudyItem) {
  if (study.endedAt) return study.endedAt;

  const classRoom = getClassRoom(study);
  return classRoom?.endedAt ?? null;
}

function getModeLabel(mode: StudyMode) {
  return mode === "ONLINE" ? "Online" : "Trực tiếp";
}

function getModeBadgeClass(mode: StudyMode) {
  return mode === "ONLINE"
    ? "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200"
    : "bg-sky-100 text-sky-700 ring-1 ring-sky-200";
}

function getCardClass(mode: StudyMode) {
  return mode === "ONLINE"
    ? "border-emerald-200/80 bg-emerald-50/70"
    : "border-sky-200/80 bg-sky-50/70";
}

function getErrorMessage(error: unknown, fallback: string) {
  const e = error as {
    response?: { data?: { message?: string } };
    message?: string;
  };

  return e?.response?.data?.message || e?.message || fallback;
}

function parseTimeRangeFromScheduleText(scheduleText: string) {
  const match = scheduleText.match(
    /(\d{1,2})(?::|h|H)?(\d{2})?\s*[-–]\s*(\d{1,2})(?::|h|H)?(\d{2})?/
  );

  if (!match) return null;

  const startHour = Number(match[1]);
  const startMinute = Number(match[2] ?? "0");
  const endHour = Number(match[3]);
  const endMinute = Number(match[4] ?? "0");

  if (
    !Number.isFinite(startHour) ||
    !Number.isFinite(startMinute) ||
    !Number.isFinite(endHour) ||
    !Number.isFinite(endMinute)
  ) {
    return null;
  }

  return {
    startHour,
    startMinute,
    endHour,
    endMinute,
  };
}

function parseWeekdayIndexes(scheduleText: string) {
  const text = scheduleText.toLowerCase();
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

  for (const item of patterns) {
    if (item.regex.test(text)) {
      indexes.push(item.index);
    }
  }

  return indexes;
}

function createDateTimeFromParts(date: Date, hour: number, minute: number) {
  const next = new Date(date);
  next.setHours(hour, minute, 0, 0);
  return next;
}

function getJsWeekdayIndex(date: Date) {
  const day = date.getDay();
  return day === 0 ? 6 : day - 1;
}

function isValidSessionDateForSchedule(
  sessionDate: Date,
  allowedWeekdays: number[],
  startedAt?: string | null,
  endedAt?: string | null
) {
  if (!isWithinRange(sessionDate, startedAt, endedAt)) {
    return false;
  }

  if (allowedWeekdays.length === 0) {
    return true;
  }

  const weekday = getJsWeekdayIndex(sessionDate);
  return allowedWeekdays.includes(weekday);
}

function buildLessonsFromStudy(
  study: StudentStudyItem,
  weekDates: Date[]
): ScheduleLessonItem[] {
  const mode = getStudyMode(study);
  const scheduleText = getScheduleText(study);
  const timeRange = parseTimeRangeFromScheduleText(scheduleText);
  const title = getCourseTitle(study);
  const teacherName = getTeacherName(study);
  const room = getRoomLabel(study);
  const className = getClassName(study);
  const startedAt = getStartedAt(study);
  const endedAt = getEndedAt(study);
  const weekdayIndexes = parseWeekdayIndexes(scheduleText);

  const lessonMap = new Map<string, ScheduleLessonItem>();

  if (weekdayIndexes.length > 0 && timeRange) {
    for (const weekdayIndex of weekdayIndexes) {
      const date = weekDates[weekdayIndex];
      if (!date) continue;
      if (!isWithinRange(date, startedAt, endedAt)) continue;

      const startAt = createDateTimeFromParts(
        date,
        timeRange.startHour,
        timeRange.startMinute
      );

      const endAt = createDateTimeFromParts(
        date,
        timeRange.endHour,
        timeRange.endMinute
      );

      const key = toDateOnlyKey(date);

      lessonMap.set(key, {
        id: `${study._id}-planned-${weekdayIndex}-${key}`,
        title,
        teacherName,
        room,
        className,
        mode,
        startAt,
        endAt,
      });
    }
  }

  const sessions = Array.isArray(study.sessions) ? study.sessions : [];

  for (const session of sessions) {
    const sessionDate = parseDate(session.date);
    if (!sessionDate) continue;

    const inThisWeek = weekDates.some((d) => isSameDate(d, sessionDate));
    if (!inThisWeek) continue;

    const validForSchedule = isValidSessionDateForSchedule(
      sessionDate,
      weekdayIndexes,
      startedAt,
      endedAt
    );

    if (!validForSchedule) {
      continue;
    }

    const startAt = timeRange
      ? createDateTimeFromParts(
          sessionDate,
          timeRange.startHour,
          timeRange.startMinute
        )
      : createDateTimeFromParts(sessionDate, 18, 0);

    const endAt = timeRange
      ? createDateTimeFromParts(
          sessionDate,
          timeRange.endHour,
          timeRange.endMinute
        )
      : createDateTimeFromParts(sessionDate, 20, 0);

    const key = toDateOnlyKey(sessionDate);

    lessonMap.set(key, {
      id: `${study._id}-actual-${session.sessionNo}-${key}`,
      title,
      teacherName,
      room,
      className,
      mode,
      startAt,
      endAt,
    });
  }

  return Array.from(lessonMap.values()).sort(
    (a, b) => a.startAt.getTime() - b.startAt.getTime()
  );
}

function LessonCard({ item }: { item: ScheduleLessonItem }) {
  return (
    <div
      className={cn(
        "rounded-3xl border p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md",
        getCardClass(item.mode)
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="line-clamp-2 text-[16px] font-bold leading-7 text-slate-900">
          {item.title}
        </h3>

        <span
          className={cn(
            "shrink-0 rounded-full px-3 py-1 text-xs font-semibold",
            getModeBadgeClass(item.mode)
          )}
        >
          {getModeLabel(item.mode)}
        </span>
      </div>

      <div className="mt-4 space-y-2.5 text-[14px] text-slate-600">
        <div className="flex items-center gap-2">
          <Clock3 className="h-4 w-4 shrink-0" />
          <span>{formatTimeRange(item.startAt, item.endAt)}</span>
        </div>

        <div className="flex items-center gap-2">
          <User2 className="h-4 w-4 shrink-0" />
          <span className="line-clamp-1">{item.teacherName}</span>
        </div>

        <div className="flex items-center gap-2">
          {item.mode === "ONLINE" ? (
            <MonitorPlay className="h-4 w-4 shrink-0" />
          ) : (
            <MapPin className="h-4 w-4 shrink-0" />
          )}
          <span className="line-clamp-1">{item.room}</span>
        </div>
      </div>

      {item.className ? (
        <div className="mt-4 rounded-2xl bg-white/70 px-3 py-2 text-xs text-slate-500 ring-1 ring-slate-200/70">
          <span className="font-medium text-slate-600">Lớp:</span>{" "}
          <span className="line-clamp-1">{item.className}</span>
        </div>
      ) : null}
    </div>
  );
}

function DayColumn({
  date,
  label,
  items,
}: {
  date: Date;
  label: string;
  items: ScheduleLessonItem[];
}) {
  const today = new Date();
  const isToday = isSameDate(date, today);

  return (
    <div className="min-w-[245px] xl:min-w-0">
      <div
        className={cn(
          "h-full rounded-[28px] border p-4",
          isToday
            ? "border-sky-200 bg-sky-50/60"
            : "border-slate-200 bg-slate-50/70"
        )}
      >
        <div className="mb-4 text-center">
          <div className="flex items-center justify-center gap-2">
            <p
              className={cn(
                "text-[18px] font-bold",
                isToday ? "text-sky-700" : "text-slate-700"
              )}
            >
              {label}
            </p>

            {isToday ? (
              <span className="rounded-full bg-sky-100 px-2.5 py-1 text-[11px] font-semibold text-sky-700 ring-1 ring-sky-200">
                Hôm nay
              </span>
            ) : null}
          </div>

          <div className="mt-3 flex justify-center">
            <div
              className={cn(
                "flex h-11 w-11 items-center justify-center rounded-full text-[18px] font-bold",
                isToday
                  ? "bg-sky-700 text-white shadow-sm"
                  : "bg-white text-slate-700 ring-1 ring-slate-200"
              )}
            >
              {date.getDate()}
            </div>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="flex min-h-[280px] items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white/60 px-4 text-center">
            <div>
              <p className="text-sm font-semibold text-slate-600">
                Không có lịch
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Hôm nay không có buổi học nào
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <LessonCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function StudentWeeklySchedulePage() {
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() =>
    startOfWeekMonday(new Date())
  );
  const [studies, setStudies] = useState<StudentStudyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        setLoading(true);
        setErrorText("");

        const me = await authApi.me();

        const response = me as {
          access?: { roles?: string[]; primaryRole?: string };
          user?: { id?: string };
        };

        const roles = Array.isArray(response.access?.roles)
          ? response.access.roles
          : [];
        const primaryRole = response.access?.primaryRole;
        const userId = response.user?.id;

        if (primaryRole !== "STUDENT" && !roles.includes("STUDENT")) {
          throw new Error("Tài khoản hiện tại không phải học viên");
        }

        if (!userId) {
          throw new Error("Không tìm thấy thông tin học viên");
        }

        const data = await studentStudyApi.listByStudent(userId);

        if (!mounted) return;

        const filtered = data.filter(
          (item) =>
            item.isActive &&
            (item.status === "ENROLLED" ||
              item.status === "STUDYING" ||
              item.status === "PAUSED")
        );

        setStudies(filtered);
      } catch (error) {
        if (!mounted) return;
        setErrorText(getErrorMessage(error, "Không tải được lịch học"));
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void loadData();

    return () => {
      mounted = false;
    };
  }, []);

  const weekDates = useMemo(() => {
    return Array.from({ length: 7 }, (_, index) =>
      addDays(currentWeekStart, index)
    );
  }, [currentWeekStart]);

  const groupedByDate = useMemo(() => {
    const map = new Map<string, ScheduleLessonItem[]>();

    for (const study of studies) {
      const lessons = buildLessonsFromStudy(study, weekDates);

      for (const lesson of lessons) {
        const key = toDateOnlyKey(lesson.startAt);
        const prev = map.get(key) ?? [];
        prev.push(lesson);
        map.set(key, prev);
      }
    }

    for (const [, values] of map) {
      values.sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
    }

    return map;
  }, [studies, weekDates]);

  const totalLessons = useMemo(() => {
    let total = 0;
    for (const [, items] of groupedByDate) {
      total += items.length;
    }
    return total;
  }, [groupedByDate]);

  function goPrevWeek() {
    setCurrentWeekStart((prev) => addDays(prev, -7));
  }

  function goNextWeek() {
    setCurrentWeekStart((prev) => addDays(prev, 7));
  }

  function goToday() {
    setCurrentWeekStart(startOfWeekMonday(new Date()));
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#f1f5f9_100%)] p-4 md:p-6">
      <section className="mx-auto max-w-[1600px] rounded-[32px] border border-slate-200/80 bg-white/85 p-5 shadow-[0_10px_40px_rgba(15,23,42,0.06)] backdrop-blur md:p-7">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sky-700">
              <Sparkles className="h-5 w-5" />
              <span className="text-sm font-semibold">Thời khóa biểu học viên</span>
            </div>

            <h1 className="mt-2 text-[26px] font-bold tracking-tight text-slate-900">
              Lịch học tuần
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-500">
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5">
                <CalendarDays className="h-4 w-4" />
                {formatWeekRange(currentWeekStart)}
              </span>

              <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1.5 text-emerald-700 ring-1 ring-emerald-200">
                {totalLessons} buổi trong tuần
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={goPrevWeek}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={goToday}
              className="inline-flex h-11 items-center justify-center rounded-2xl bg-sky-700 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-800"
            >
              Hôm nay
            </button>

            <button
              type="button"
              onClick={goNextWeek}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="mt-8 rounded-[28px] border border-dashed border-slate-200 bg-slate-50 px-6 py-20 text-center text-sm text-slate-500">
            Đang tải lịch học...
          </div>
        ) : errorText ? (
          <div className="mt-8 rounded-[28px] border border-rose-200 bg-rose-50 px-6 py-20 text-center text-sm text-rose-700">
            {errorText}
          </div>
        ) : (
          <div className="mt-8 overflow-x-auto pb-2">
            <div className="grid min-w-[1760px] grid-cols-7 gap-4 xl:min-w-0">
              {weekDates.map((date, index) => {
                const key = toDateOnlyKey(date);
                const dayItems = groupedByDate.get(key) ?? [];

                return (
                  <DayColumn
                    key={key}
                    date={date}
                    label={WEEKDAY_LABELS[index]}
                    items={dayItems}
                  />
                );
              })}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}