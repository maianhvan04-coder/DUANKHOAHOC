"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  GraduationCap,
  MapPin,
  User2,
} from "lucide-react";
import { useAuth } from "@/hooks/auth/useAuth";
import {
  studentStudyApi,
  type StudentStudyItem,
  type StudyClassRoom,
  type StudyCourse,
  type StudyStatus,
  type StudyTeacher,
} from "@/app/api/student-study.api";

const STUDY_STATUS_LABELS: Record<StudyStatus, string> = {
  ENROLLED: "Đã ghi danh",
  STUDYING: "Đang học",
  PAUSED: "Tạm dừng",
  COMPLETED: "Hoàn thành",
  DROPPED: "Đã nghỉ",
};

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
  return (
    isObject(value) &&
    ("title" in value || "slug" in value)
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

  return null;
}

function getTeacherName(study: StudentStudyItem) {
  const teacher = getTeacher(study);
  if (isNonEmptyString(teacher?.user?.name)) return teacher.user.name.trim();

  return "Chưa có giảng viên";
}

function getClassName(study: StudentStudyItem) {
  if (isNonEmptyString(study.className)) return study.className.trim();

  const classRoom = getClassRoom(study);
  if (isNonEmptyString(classRoom?.className)) return classRoom.className.trim();

  return "Chưa có lớp";
}

function getCourseTitle(study: StudentStudyItem) {
  const course = getCourse(study);
  if (isNonEmptyString(course?.title)) return course.title.trim();

  return getClassName(study);
}

function getScheduleText(study: StudentStudyItem) {
  if (isNonEmptyString(study.scheduleText)) return study.scheduleText.trim();

  const classRoom = getClassRoom(study);
  if (isNonEmptyString(classRoom?.scheduleText)) {
    return classRoom.scheduleText.trim();
  }

  return "Chưa cập nhật";
}

function getRoom(study: StudentStudyItem) {
  if (isNonEmptyString(study.room)) return study.room.trim();

  const classRoom = getClassRoom(study);
  if (isNonEmptyString(classRoom?.room)) return classRoom.room.trim();

  return study.mode === "ONLINE" ? "Online" : "Chưa cập nhật";
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;

  if (isObject(error) && isObject(error.response)) {
    const data = error.response.data;
    if (isObject(data) && isNonEmptyString(data.message)) return data.message;
  }

  return fallback;
}

function formatScore(value: number) {
  return Number(value || 0).toFixed(1);
}

export default function StudentHomePage() {
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
        setErrorText(getErrorMessage(error, "Không tải được bảng tin học viên"));
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void loadData();

    return () => {
      mounted = false;
    };
  }, [user?.id]);

  return (
    <main className="p-4 md:p-6">
      <section className="border border-slate-200 bg-white shadow-sm">
        <div className="bg-[#0D56A6] px-5 py-6 text-white md:px-7">
          <div className="flex flex-col gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1 text-sm font-semibold ring-1 ring-white/20">
                <GraduationCap className="h-4 w-4" />
                Everest Student Portal
              </div>

              <h2 className="mt-4 text-2xl font-bold md:text-3xl">
                Bảng tin học viên
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/80">
                Theo dõi lớp học hiện tại, lịch học và kết quả học tập trong
                một không gian riêng cho học viên.
              </p>
            </div>
          </div>
        </div>

        <div className="border-b border-slate-200 bg-[#F3F8FF] px-5 py-3 md:px-7">
          <h3 className="text-base font-bold text-[#0B2C5F]">
            Các lớp học hiện tại
          </h3>
        </div>

        {loading ? (
          <div className="px-6 py-16 text-center text-sm font-semibold text-slate-500">
            Đang tải bảng tin học viên...
          </div>
        ) : errorText ? (
          <div className="flex items-center justify-center gap-2 px-6 py-16 text-center text-sm font-semibold text-rose-700">
            <AlertCircle className="h-5 w-5" />
            {errorText}
          </div>
        ) : studies.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-sm font-semibold text-slate-600">
              Chưa có lớp học nào
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Khi bạn được xếp lớp, thông tin học tập sẽ hiển thị tại đây.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[1100px] w-full border-collapse text-left">
              <thead>
                <tr className="bg-[#E9F5FF] text-sm font-bold text-slate-700">
                  <th className="w-16 px-5 py-4 text-center">STT</th>
                  <th className="px-5 py-4">Tên lớp học</th>
                  <th className="px-5 py-4">Lịch học</th>
                  <th className="px-5 py-4">Giảng viên</th>
                  <th className="px-5 py-4 text-center">Tiến độ</th>
                  <th className="px-5 py-4 text-center">Điểm TB</th>
                  <th className="px-5 py-4 text-right">Trạng thái</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200">
                {studies.map((study, index) => (
                  <tr
                    key={study._id}
                    className="bg-white text-sm text-slate-700 transition hover:bg-slate-50"
                  >
                    <td className="px-5 py-4 text-center font-semibold">
                      {index + 1}
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-950">
                        {getCourseTitle(study)}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {getClassName(study)}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-start gap-2">
                        <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                        <div>
                          <div className="font-semibold">
                            {getScheduleText(study)}
                          </div>
                          <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                            <MapPin className="h-3.5 w-3.5" />
                            {getRoom(study)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="inline-flex items-center gap-2">
                        <User2 className="h-4 w-4 text-slate-400" />
                        {getTeacherName(study)}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-center font-bold text-[#0D56A6]">
                      {Number(study.progressPercent || 0).toFixed(0)}%
                    </td>
                    <td className="px-5 py-4 text-center font-bold text-slate-950">
                      {formatScore(study.finalAverage)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-100">
                        {STUDY_STATUS_LABELS[study.status] ?? study.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </section>
    </main>
  );
}
