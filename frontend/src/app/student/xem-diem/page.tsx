"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/auth/useAuth";
import {
  studentStudyApi,
  type StudentStudyItem,
  type StudyClassRoom,
  type StudyCourse,
  type StudyStatus,
} from "@/app/api/student-study.api";

type AnyObj = Record<string, unknown>;

const STUDY_STATUS_LABELS: Record<StudyStatus, string> = {
  ENROLLED: "Đang học",
  STUDYING: "Đang học",
  PAUSED: "Tạm dừng",
  COMPLETED: "Hoàn thành",
  DROPPED: "Đã nghỉ",
};

function isObject(value: unknown): value is AnyObj {
  return typeof value === "object" && value !== null;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
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
  return className || "Chưa có tên học phần";
}

function pickString(source: unknown, keys: string[]) {
  if (!isObject(source)) return "";

  for (const key of keys) {
    const raw = source[key];
    if (isNonEmptyString(raw)) return raw.trim();
  }

  return "";
}

function getDateValue(study: StudentStudyItem) {
  return (
    study.startedAt ||
    getClassRoom(study)?.startedAt ||
    study.createdAt ||
    ""
  );
}

function inferSemesterFromDate(value: string) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = date.getMonth() + 1;

  if (month >= 8) return `${year}_${year + 1}_1`;
  return `${year - 1}_${year}_2`;
}

function getSemester(study: StudentStudyItem) {
  const course = getCourse(study);
  const classRoom = getClassRoom(study);

  return (
    pickString(study, ["semester", "term", "hocKy", "academicTerm"]) ||
    pickString(classRoom, ["semester", "term", "hocKy", "academicTerm"]) ||
    pickString(course, ["semester", "term", "hocKy", "academicTerm"]) ||
    inferSemesterFromDate(getDateValue(study)) ||
    "--"
  );
}

function formatScore(value: number | null | undefined) {
  const numberValue = Number(value ?? 0);
  if (!Number.isFinite(numberValue)) return "";

  return numberValue.toFixed(1).replace(/\.0$/, "");
}

function scoreFromPercent(value: number | null | undefined) {
  const numberValue = Number(value ?? 0);
  if (!Number.isFinite(numberValue)) return 0;

  return Math.max(0, Math.min(10, numberValue / 10));
}

function getExamEligibility(study: StudentStudyItem) {
  if (study.status === "DROPPED") return "Không đạt";
  if (Number(study.attendancePercent || 0) < 50) return "Không đạt";
  return "Đạt";
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;

  if (isObject(error) && isObject(error.response)) {
    const data = error.response.data;
    if (isObject(data) && isNonEmptyString(data.message)) return data.message;
  }

  return fallback;
}

export default function StudentGradesPage() {
  const { user } = useAuth();
  const [studies, setStudies] = useState<StudentStudyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");

  useEffect(() => {
    if (!user?.id) return;

    const userId = user.id;
    let mounted = true;

    async function loadData() {
      try {
        setLoading(true);
        setErrorText("");

        const data = await studentStudyApi.listByStudent(userId);

        if (!mounted) return;

        setStudies(
          data.filter(
            (item) =>
              item.isActive &&
              ["ENROLLED", "STUDYING", "PAUSED", "COMPLETED"].includes(
                item.status
              )
          )
        );
      } catch (error) {
        if (!mounted) return;
        setErrorText(getErrorMessage(error, "Không tải được dữ liệu điểm"));
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void loadData();

    return () => {
      mounted = false;
    };
  }, [user?.id]);

  const sortedStudies = useMemo(() => {
    return [...studies].sort((a, b) =>
      getCourseTitle(a).localeCompare(getCourseTitle(b), "vi")
    );
  }, [studies]);

  return (
    <main className="p-4 md:p-6">
      <section className="border border-[#cbe7fb] bg-white shadow-sm">
        <div className="border-b border-[#cbe7fb] bg-[#0D56A6] px-5 py-4 text-white md:px-7">
          <h2 className="text-lg font-bold">Bảng điểm học tập</h2>
          <p className="mt-1 text-sm text-white/80">
            Tổng hợp điểm chuyên cần, bài tập và điểm kiểm tra của từng học phần.
          </p>
        </div>

        {loading ? (
          <div className="px-6 py-16 text-center text-sm font-semibold text-slate-500">
            Đang tải dữ liệu điểm...
          </div>
        ) : errorText ? (
          <div className="flex items-center justify-center gap-2 px-6 py-16 text-center text-sm font-semibold text-rose-700">
            <AlertCircle className="h-5 w-5" />
            {errorText}
          </div>
        ) : sortedStudies.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-sm font-semibold text-slate-600">
              Chưa có dữ liệu điểm
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Khi bạn được xếp lớp, bảng điểm sẽ hiển thị tại đây.
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-3 p-3 lg:hidden">
              {sortedStudies.map((study, index) => {
                const eligible = getExamEligibility(study);

                return (
                  <article
                    key={study._id}
                    className="rounded-2xl border border-[#cbe7fb] bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[#0D56A6]">
                          #{index + 1}
                        </div>
                        <h3 className="mt-1 line-clamp-2 text-sm font-bold text-slate-950">
                          {getCourseTitle(study)}
                        </h3>
                        <p className="mt-1 line-clamp-1 text-xs text-slate-500">
                          {getClassName(study)}
                        </p>
                      </div>

                      <span
                        className={
                          eligible === "Đạt"
                            ? "shrink-0 text-sm font-bold text-[#2F6BFF]"
                            : "shrink-0 text-sm font-bold text-rose-600"
                        }
                      >
                        {eligible}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="rounded-xl bg-[#F4FAFF] px-2 py-2">
                        <div className="font-semibold text-slate-500">
                          C.Cần
                        </div>
                        <div className="mt-1 font-bold text-slate-950">
                          {formatScore(scoreFromPercent(study.attendancePercent))}
                        </div>
                      </div>
                      <div className="rounded-xl bg-[#F4FAFF] px-2 py-2">
                        <div className="font-semibold text-slate-500">
                          TBCTN
                        </div>
                        <div className="mt-1 font-bold text-slate-950">
                          {formatScore(scoreFromPercent(study.progressPercent))}
                        </div>
                      </div>
                      <div className="rounded-xl bg-[#F4FAFF] px-2 py-2">
                        <div className="font-semibold text-slate-500">TBC</div>
                        <div className="mt-1 font-bold text-slate-950">
                          {formatScore(study.finalAverage)}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-4 gap-2 text-center text-xs">
                      <div className="rounded-xl border border-slate-200 px-2 py-2">
                        <div className="font-semibold text-slate-500">
                          Học kỳ
                        </div>
                        <div className="mt-1 font-bold text-slate-950">
                          {getSemester(study)}
                        </div>
                      </div>
                      <div className="rounded-xl border border-slate-200 px-2 py-2">
                        <div className="font-semibold text-slate-500">TX1</div>
                        <div className="mt-1 font-bold text-slate-950">
                          {formatScore(study.test1)}
                        </div>
                      </div>
                      <div className="rounded-xl border border-slate-200 px-2 py-2">
                        <div className="font-semibold text-slate-500">TX2</div>
                        <div className="mt-1 font-bold text-slate-950">
                          {formatScore(study.test2)}
                        </div>
                      </div>
                      <div className="rounded-xl border border-slate-200 px-2 py-2">
                        <div className="font-semibold text-slate-500">TX3</div>
                        <div className="mt-1 font-bold text-slate-950">
                          {formatScore(study.test3)}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="hidden overflow-hidden lg:block">
            <table className="w-full table-fixed border-collapse text-left text-[13px] text-slate-800">
              <colgroup>
                <col className="w-[4%]" />
                <col className="w-[29%]" />
                <col className="w-[11%]" />
                <col className="w-[9%]" />
                <col className="w-[10%]" />
                <col className="w-[6.5%]" />
                <col className="w-[6.5%]" />
                <col className="w-[6.5%]" />
                <col className="w-[8%]" />
                <col className="w-[9.5%]" />
              </colgroup>
              <thead>
                <tr className="bg-[#E6F5FF] text-[13px] font-bold leading-tight text-slate-800">
                  <th
                    rowSpan={2}
                    className="border border-[#cbe7fb] px-2 py-3 text-center"
                  >
                    STT
                  </th>
                  <th
                    rowSpan={2}
                    className="border border-[#cbe7fb] px-3 py-3"
                  >
                    Tên học phần
                  </th>
                  <th
                    rowSpan={2}
                    className="border border-[#cbe7fb] px-2 py-3 text-center"
                  >
                    Học kỳ
                  </th>
                  <th
                    rowSpan={2}
                    className="border border-[#cbe7fb] px-2 py-3 text-center"
                  >
                    Điểm C.Cần
                  </th>
                  <th
                    rowSpan={2}
                    className="border border-[#cbe7fb] px-2 py-3 text-center"
                  >
                    Điểm TBCTN
                  </th>
                  <th
                    colSpan={3}
                    className="border border-[#cbe7fb] px-2 py-3 text-center"
                  >
                    Điểm thường xuyên
                  </th>
                  <th
                    rowSpan={2}
                    className="border border-[#cbe7fb] px-2 py-3 text-center"
                  >
                    Điểm TBC
                  </th>
                  <th
                    rowSpan={2}
                    className="border border-[#cbe7fb] px-2 py-3 text-center"
                  >
                    <span className="block">DK thi</span>
                    <span className="block">KTHP</span>
                  </th>
                </tr>

                <tr className="bg-[#E6F5FF] text-[13px] font-bold leading-tight text-slate-800">
                  <th className="border border-[#cbe7fb] px-2 py-2.5 text-center">
                    TX 1
                  </th>
                  <th className="border border-[#cbe7fb] px-2 py-2.5 text-center">
                    TX 2
                  </th>
                  <th className="border border-[#cbe7fb] px-2 py-2.5 text-center">
                    TX 3
                  </th>
                </tr>
              </thead>

              <tbody>
                {sortedStudies.map((study, index) => {
                  const eligible = getExamEligibility(study);

                  return (
                    <tr
                      key={study._id}
                      className="transition odd:bg-white even:bg-slate-50 hover:bg-[#F4FAFF]"
                    >
                      <td className="border border-[#cbe7fb] px-2 py-3 text-center">
                        {index + 1}
                      </td>
                      <td className="border border-[#cbe7fb] px-3 py-3">
                        <div className="line-clamp-2 font-medium leading-snug text-slate-900">
                          {getCourseTitle(study)}
                        </div>
                        <div className="mt-1 line-clamp-1 text-[11px] text-slate-500">
                          {getClassName(study)}
                        </div>
                      </td>
                      <td className="border border-[#cbe7fb] px-2 py-3 text-center">
                        {getSemester(study)}
                      </td>
                      <td className="border border-[#cbe7fb] px-2 py-3 text-center">
                        {formatScore(scoreFromPercent(study.attendancePercent))}
                      </td>
                      <td className="border border-[#cbe7fb] px-2 py-3 text-center">
                        {formatScore(scoreFromPercent(study.progressPercent))}
                      </td>
                      <td className="border border-[#cbe7fb] px-2 py-3 text-center">
                        {formatScore(study.test1)}
                      </td>
                      <td className="border border-[#cbe7fb] px-2 py-3 text-center">
                        {formatScore(study.test2)}
                      </td>
                      <td className="border border-[#cbe7fb] px-2 py-3 text-center">
                        {formatScore(study.test3)}
                      </td>
                      <td className="border border-[#cbe7fb] px-2 py-3 text-center font-semibold">
                        {formatScore(study.finalAverage)}
                      </td>
                      <td className="border border-[#cbe7fb] px-2 py-3 text-center">
                        <span
                          className={
                            eligible === "Đạt"
                              ? "font-semibold text-[#2F6BFF]"
                              : "font-semibold text-rose-600"
                          }
                          title={STUDY_STATUS_LABELS[study.status]}
                        >
                          {eligible}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          </>
        )}
      </section>
    </main>
  );
}
