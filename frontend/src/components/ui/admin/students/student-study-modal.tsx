"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  CircleCheckBig,
  Pencil,
  Plus,
  Star,
  Trash2,
  Trophy,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  studentStudyApi,
  type ClassRoomOption,
  type CreateStudentStudyPayload,
  type StudentStudyItem,
  type StudyMode,
  type StudyStatus,
} from "@/app/api/student-study.api";

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

type Props = {
  open: boolean;
  studentId: string;
  studentName: string;
  onClose: () => void;
};

type FormMode = "create" | "edit";

type FormState = {
  classRoom: string;
  status: StudyStatus;
  note: string;
  isActive: boolean;
};

const INITIAL_FORM: FormState = {
  classRoom: "",
  status: "ENROLLED",
  note: "",
  isActive: true,
};

const STATUS_OPTIONS: Array<{ value: StudyStatus; label: string }> = [
  { value: "ENROLLED", label: "Đã ghi danh" },
  { value: "STUDYING", label: "Đang học" },
  { value: "PAUSED", label: "Tạm dừng" },
  { value: "COMPLETED", label: "Hoàn thành" },
  { value: "DROPPED", label: "Đã nghỉ" },
];

type ErrorLike = {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
};

function getErrorMessage(error: unknown, fallback: string) {
  const e = error as ErrorLike;
  return e?.response?.data?.message || e?.message || fallback;
}

function getStatusLabel(value?: string) {
  switch (value) {
    case "ENROLLED":
      return "Đã ghi danh";
    case "STUDYING":
      return "Đang học";
    case "PAUSED":
      return "Tạm dừng";
    case "COMPLETED":
      return "Hoàn thành";
    case "DROPPED":
      return "Đã nghỉ";
    default:
      return value || "Không rõ";
  }
}

function getStatusStyle(value?: string) {
  switch (value) {
    case "ENROLLED":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "STUDYING":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "PAUSED":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "COMPLETED":
      return "border-violet-200 bg-violet-50 text-violet-700";
    case "DROPPED":
      return "border-rose-200 bg-rose-50 text-rose-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

function getPerformanceLabel(value?: string) {
  switch (value) {
    case "EXCELLENT":
      return "Xuất sắc";
    case "GOOD":
      return "Tốt";
    default:
      return "Bình thường";
  }
}

function getPerformanceStyle(value?: string) {
  switch (value) {
    case "EXCELLENT":
      return "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700";
    case "GOOD":
      return "border-blue-200 bg-blue-50 text-blue-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

function getCourseTitle(item: StudentStudyItem) {
  if (item.course && typeof item.course === "object") {
    return item.course.title || "Khóa học";
  }

  if (item.classRoom && typeof item.classRoom === "object") {
    if (item.classRoom.course && typeof item.classRoom.course === "object") {
      return item.classRoom.course.title || "Khóa học";
    }
  }

  return "Khóa học";
}

function getTeacherName(item: StudentStudyItem) {
  if (item.teacher && typeof item.teacher === "object") {
    return item.teacher.user?.name || "";
  }

  if (item.classRoom && typeof item.classRoom === "object") {
    if (item.classRoom.teacher && typeof item.classRoom.teacher === "object") {
      return item.classRoom.teacher.user?.name || "";
    }
  }

  if (item.course && typeof item.course === "object") {
    return item.course.teacherName || "";
  }

  return "";
}

function getClassRoomName(item: StudentStudyItem) {
  if (item.classRoom && typeof item.classRoom === "object") {
    return item.classRoom.className || item.className || "—";
  }

  return item.className || "—";
}

function getModeLabel(mode?: StudyMode) {
  return mode === "OFFLINE" ? "Trực tiếp" : "Trực tuyến";
}

function getScheduleText(item: StudentStudyItem) {
  if (item.classRoom && typeof item.classRoom === "object") {
    return item.classRoom.scheduleText || item.scheduleText || "—";
  }

  return item.scheduleText || "—";
}

function getRoomText(item: StudentStudyItem) {
  if (item.classRoom && typeof item.classRoom === "object") {
    return item.classRoom.room || item.room || "—";
  }

  return item.room || "—";
}

function getInitialForm(
  mode: FormMode,
  initialData: StudentStudyItem | null
): FormState {
  if (mode === "edit" && initialData) {
    return {
      classRoom:
        initialData.classRoom && typeof initialData.classRoom === "object"
          ? initialData.classRoom._id || ""
          : "",
      status: initialData.status || "ENROLLED",
      note: initialData.note || "",
      isActive: initialData.isActive ?? true,
    };
  }

  return INITIAL_FORM;
}

function getCourseTitleFromClassRoom(classRoom: ClassRoomOption | null) {
  if (!classRoom) return "";
  if (classRoom.course && typeof classRoom.course === "object") {
    return classRoom.course.title || "";
  }
  return "";
}

function getTeacherNameFromClassRoom(classRoom: ClassRoomOption | null) {
  if (!classRoom) return "";
  if (classRoom.teacher && typeof classRoom.teacher === "object") {
    return classRoom.teacher.user?.name || "";
  }
  return "";
}

type StudyFormProps = {
  mode: FormMode;
  initialData: StudentStudyItem | null;
  studentId: string;
  classRooms: ClassRoomOption[];
  saving: boolean;
  onDone: () => Promise<void>;
  onCloseForm: () => void;
};

function StudyForm({
  mode,
  initialData,
  studentId,
  classRooms,
  saving,
  onDone,
  onCloseForm,
}: StudyFormProps) {
  const [form, setForm] = useState<FormState>(() =>
    getInitialForm(mode, initialData)
  );
  const [submitting, setSubmitting] = useState(false);

  const selectedClassRoom = useMemo(
    () => classRooms.find((item) => item._id === form.classRoom) || null,
    [classRooms, form.classRoom]
  );

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.classRoom) {
      toast.error("Vui lòng chọn lớp học");
      return;
    }

    const payload: CreateStudentStudyPayload = {
      classRoom: form.classRoom,
      status: form.status,
      note: form.note.trim(),
      isActive: form.isActive,
    };

    try {
      setSubmitting(true);

      if (mode === "edit" && initialData?._id) {
        await studentStudyApi.update(initialData._id, payload);
        toast.success("Cập nhật hồ sơ học tập thành công");
      } else {
        await studentStudyApi.create(studentId, payload);
        toast.success("Gán học viên vào lớp thành công");
      }

      await onDone();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Lưu hồ sơ học tập thất bại"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div className="flex items-center gap-2">
        <CircleCheckBig className="h-5 w-5 text-slate-700" />
        <h3 className="text-lg font-bold text-slate-900">
          {mode === "edit" ? "Cập nhật lớp học" : "Gán vào lớp"}
        </h3>
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">
          Lớp học
        </label>
        <select
          value={form.classRoom}
          onChange={(e) => setField("classRoom", e.target.value)}
          className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400"
        >
          <option value="">Chọn lớp học</option>
          {classRooms.map((item) => (
            <option key={item._id} value={item._id}>
              {item.className}
              {getCourseTitleFromClassRoom(item)
                ? ` - ${getCourseTitleFromClassRoom(item)}`
                : ""}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Khóa học
          </label>
          <input
            readOnly
            value={getCourseTitleFromClassRoom(selectedClassRoom)}
            placeholder="Tự động theo lớp"
            className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Giảng viên
          </label>
          <input
            readOnly
            value={getTeacherNameFromClassRoom(selectedClassRoom)}
            placeholder="Tự động theo lớp"
            className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Hình thức
          </label>
          <input
            readOnly
            value={selectedClassRoom ? getModeLabel(selectedClassRoom.mode) : ""}
            placeholder="Tự động theo lớp"
            className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Lịch học
          </label>
          <input
            readOnly
            value={selectedClassRoom?.scheduleText || ""}
            placeholder="Tự động theo lớp"
            className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Phòng học
          </label>
          <input
            readOnly
            value={selectedClassRoom?.room || ""}
            placeholder="Tự động theo lớp"
            className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none"
          />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">
          Trạng thái
        </label>
        <select
          value={form.status}
          onChange={(e) => setField("status", e.target.value as StudyStatus)}
          className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400"
        >
          {STATUS_OPTIONS.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">
          Ghi chú
        </label>
        <textarea
          value={form.note}
          onChange={(e) => setField("note", e.target.value)}
          rows={4}
          placeholder="Nhập ghi chú thêm..."
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
        />
      </div>

      <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={form.isActive}
          onChange={(e) => setField("isActive", e.target.checked)}
          className="h-4 w-4 rounded border-slate-300"
        />
        Hồ sơ học tập đang hoạt động
      </label>

      <div className="flex flex-wrap gap-3 pt-1">
        <button
          type="submit"
          disabled={saving || submitting}
          className="inline-flex h-11 items-center justify-center rounded-2xl bg-emerald-600 px-5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving || submitting
            ? "Đang lưu..."
            : mode === "edit"
              ? "Cập nhật hồ sơ học tập"
              : "Gán vào lớp"}
        </button>

        <button
          type="button"
          onClick={onCloseForm}
          disabled={saving || submitting}
          className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Hủy form
        </button>
      </div>
    </form>
  );
}

export default function StudentStudyModal({
  open,
  studentId,
  studentName,
  onClose,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [items, setItems] = useState<StudentStudyItem[]>([]);
  const [classRooms, setClassRooms] = useState<ClassRoomOption[]>([]);

  const [formMode, setFormMode] = useState<FormMode>("create");
  const [editingItem, setEditingItem] = useState<StudentStudyItem | null>(null);

  async function loadData() {
    if (!studentId) return;

    setLoading(true);
    try {
      const [studyItems, classRoomItems] = await Promise.all([
        studentStudyApi.listByStudent(studentId),
        studentStudyApi.listClassRoomOptions(),
      ]);

      setItems(studyItems);
      setClassRooms(classRoomItems.filter((item) => item.isDeleted !== true));
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Không tải được hồ sơ học tập"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!open) return;
    void loadData();
  }, [open, studentId]);

  const formKey = useMemo(() => {
    return `${formMode}-${editingItem?._id ?? "new"}-${studentId}`;
  }, [formMode, editingItem, studentId]);

  function openCreate() {
    setFormMode("create");
    setEditingItem(null);
  }

  function openEdit(item: StudentStudyItem) {
    setFormMode("edit");
    setEditingItem(item);
  }

  async function handleDelete(item: StudentStudyItem) {
    const title = getCourseTitle(item);
    const ok = window.confirm(`Xóa hồ sơ học tập "${title}"?`);
    if (!ok) return;

    try {
      await studentStudyApi.remove(item._id);
      toast.success("Xóa hồ sơ học tập thành công");
      await loadData();
      setFormMode("create");
      setEditingItem(null);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Xóa hồ sơ học tập thất bại"));
    }
  }

  async function handleDone() {
    setSaving(true);
    try {
      await loadData();
      setFormMode("create");
      setEditingItem(null);
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/45 p-4">
      <div className="flex h-[92vh] w-full max-w-7xl flex-col overflow-hidden rounded-[28px] bg-slate-50 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5">
          <div>
            <h2 className="text-[30px] font-bold tracking-[-0.02em] text-slate-900">
              Hồ sơ học tập
            </h2>
            <p className="mt-1 text-base text-slate-500">{studentName}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-14 w-14 items-center justify-center rounded-[20px] border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
          >
            <X className="h-7 w-7" />
          </button>
        </div>

        <div className="grid min-h-0 flex-1 gap-0 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="min-h-0 overflow-y-auto border-r border-slate-200 bg-white p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Danh sách học tập
                </h3>
                <p className="text-sm text-slate-500">
                  Xem các lớp đã gán cho học viên
                </p>
              </div>

              <button
                type="button"
                onClick={openCreate}
                className="inline-flex h-11 items-center gap-2 rounded-[16px] bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                <Plus className="h-4 w-4" />
                Gán vào lớp
              </button>
            </div>

            {loading ? (
              <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 p-10 text-center text-sm text-slate-500">
                Đang tải dữ liệu...
              </div>
            ) : items.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-white shadow-sm">
                  <BookOpen className="h-7 w-7 text-slate-400" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-slate-800">
                  Chưa có hồ sơ học tập nào
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Bấm “Gán vào lớp” để thêm lớp học cho học viên.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => (
                  <div
                    key={item._id}
                    className={cn(
                      "rounded-[24px] border p-5 shadow-sm transition",
                      editingItem?._id === item._id
                        ? "border-emerald-300 bg-emerald-50/40"
                        : "border-slate-200 bg-white"
                    )}
                  >
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-lg font-bold text-slate-900">
                            {getCourseTitle(item)}
                          </h4>

                          <span
                            className={cn(
                              "inline-flex rounded-full border px-3 py-1 text-xs font-semibold",
                              getStatusStyle(item.status)
                            )}
                          >
                            {getStatusLabel(item.status)}
                          </span>

                          <span
                            className={cn(
                              "inline-flex rounded-full border px-3 py-1 text-xs font-semibold",
                              getPerformanceStyle(item.performanceStatus)
                            )}
                          >
                            {getPerformanceLabel(item.performanceStatus)}
                          </span>

                          {item.isHonored && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                              <Trophy className="h-3.5 w-3.5" />
                              {item.honorTitle || "Vinh danh"}
                            </span>
                          )}
                        </div>

                        <div className="mt-3 grid gap-2 text-sm text-slate-600 md:grid-cols-2">
                          <p>
                            <span className="font-semibold text-slate-800">Lớp:</span>{" "}
                            {getClassRoomName(item)}
                          </p>
                          <p>
                            <span className="font-semibold text-slate-800">
                              Hình thức:
                            </span>{" "}
                            {getModeLabel(item.mode)}
                          </p>
                          <p>
                            <span className="font-semibold text-slate-800">
                              Giảng viên:
                            </span>{" "}
                            {getTeacherName(item) || "—"}
                          </p>
                          <p>
                            <span className="font-semibold text-slate-800">
                              Lịch học:
                            </span>{" "}
                            {getScheduleText(item)}
                          </p>
                          <p>
                            <span className="font-semibold text-slate-800">
                              Phòng:
                            </span>{" "}
                            {getRoomText(item)}
                          </p>
                          <p>
                            <span className="font-semibold text-slate-800">
                              Xếp hạng:
                            </span>{" "}
                            {item.rank ? `#${item.rank}` : "—"}
                          </p>
                        </div>

                        <div className="mt-4 grid gap-3 md:grid-cols-2">
                          <div className="rounded-2xl bg-slate-50 p-4">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium text-slate-600">
                                Tiến độ
                              </span>
                              <span className="font-bold text-slate-900">
                                {item.progressPercent}%
                              </span>
                            </div>
                            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                              <div
                                className="h-full rounded-full bg-slate-900"
                                style={{
                                  width: `${Math.max(
                                    0,
                                    Math.min(100, item.progressPercent)
                                  )}%`,
                                }}
                              />
                            </div>
                          </div>

                          <div className="rounded-2xl bg-slate-50 p-4">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium text-slate-600">
                                Điểm
                              </span>
                              <span className="font-bold text-slate-900">
                                {item.score}/100
                              </span>
                            </div>
                            <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                              <Star className="h-4 w-4" />
                              {item.completionStatus === "COMPLETED"
                                ? "Đã hoàn thành"
                                : "Chưa hoàn thành"}
                            </div>
                          </div>
                        </div>

                        {item.note ? (
                          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                            <span className="font-semibold text-slate-800">
                              Ghi chú:
                            </span>{" "}
                            {item.note}
                          </div>
                        ) : null}
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(item)}
                          className="inline-flex h-10 items-center gap-2 rounded-[14px] border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          <Pencil className="h-4 w-4" />
                          Sửa
                        </button>

                        <button
                          type="button"
                          onClick={() => void handleDelete(item)}
                          className="inline-flex h-10 items-center gap-2 rounded-[14px] border border-rose-200 px-4 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
                        >
                          <Trash2 className="h-4 w-4" />
                          Xóa
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="min-h-0 overflow-y-auto bg-slate-50 p-6">
            <StudyForm
              key={formKey}
              mode={formMode}
              initialData={editingItem}
              studentId={studentId}
              classRooms={classRooms}
              saving={saving}
              onDone={handleDone}
              onCloseForm={openCreate}
            />

            <div className="mt-5 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
              <h4 className="text-sm font-bold text-slate-900">
                Ghi chú hệ thống
              </h4>
              <div className="mt-3 space-y-2 text-sm text-slate-600">
                <p>- Quản trị viên chỉ gán học viên vào lớp học.</p>
                <p>- Giáo viên, lịch học, phòng học được lấy theo lớp.</p>
                <p>- Điểm, tiến độ, điểm danh và vinh danh sẽ cập nhật ở màn quản lý lớp.</p>
                <p>- Nếu bật hiển thị vinh danh thì bên người dùng sẽ thấy.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
