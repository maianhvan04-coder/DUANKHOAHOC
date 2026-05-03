"use client";

import { useEffect, useMemo, useState } from "react";
import {
    BookOpen,
    CalendarDays,
    Clock3,
    MapPin,
    MonitorPlay,
    Pencil,
    Sparkles,
    User2,
    Users,
    X,
} from "lucide-react";
import { toast } from "sonner";
import {
    classroomApi,
    type ClassMode,
    type ClassroomItem,
    type ClassroomStudentStudyItem,
    type CourseOption,
    type StudyStatus,
    type TeacherOption,
} from "@/app/api/classroom.api";
import AdminListTable, {
    AdminActionIconButton,
    AdminEntityCell,
    AdminStatusBadge,
    type AdminFilterSection,
    type AdminTableColumn,
} from "@/components/ui/admin/admin-list-table";
import {
    makePaginationMeta,
    type PaginationMeta,
    type SortDirection,
} from "@/lib/utils/admin-list";

function cn(...values: Array<string | false | null | undefined>) {
    return values.filter(Boolean).join(" ");
}

function getErrorMessage(error: unknown, fallback: string) {
    const e = error as {
        response?: { data?: { message?: string } };
        message?: string;
    };

    return e?.response?.data?.message || e?.message || fallback;
}

function formatDate(value?: string | null) {
    if (!value) return "--";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "--";

    return date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
}

function toDateInputValue(value?: string | null) {
    if (!value) return "";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";

    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
    return local.toISOString().slice(0, 10);
}

function toIsoFromDateInput(value: string) {
    if (!value) return "";
    return new Date(`${value}T12:00:00`).toISOString();
}

function getCourseTitle(item: ClassroomItem) {
    if (item.course && typeof item.course === "object") {
        return item.course.title || "Khóa học";
    }

    return "Khóa học";
}

function getTeacherName(item: ClassroomItem) {
    if (item.teacher && typeof item.teacher === "object") {
        return item.teacher.user?.name || "Giảng viên";
    }

    return "Giảng viên";
}

function getModeLabel(mode: ClassMode) {
    return mode === "ONLINE" ? "Trực tuyến" : "Trực tiếp";
}

function getDisplayRoom(item: { room?: string; mode?: ClassMode }) {
    if (item.room?.trim()) return item.room.trim();
    return item.mode === "ONLINE" ? "Google Meet" : "Phòng học";
}

function formatDateRange(
    startedAt?: string | null,
    endedAt?: string | null
) {
    if (startedAt && endedAt) {
        return `${formatDate(startedAt)} - ${formatDate(endedAt)}`;
    }

    if (startedAt) return `Từ ${formatDate(startedAt)}`;
    if (endedAt) return `Đến ${formatDate(endedAt)}`;
    return "Chưa giới hạn";
}

const STUDY_STATUS_LABELS: Record<StudyStatus, string> = {
    ENROLLED: "Đã ghi danh",
    STUDYING: "Đang học",
    PAUSED: "Tạm dừng",
    COMPLETED: "Hoàn thành",
    DROPPED: "Đã nghỉ",
};

const IMPACTED_STATUSES: StudyStatus[] = ["ENROLLED", "STUDYING", "PAUSED"];

function isImpactedStudent(item: ClassroomStudentStudyItem) {
    return item.isActive && IMPACTED_STATUSES.includes(item.status);
}

function getStudentName(item: ClassroomStudentStudyItem) {
    if (item.student && typeof item.student === "object") {
        return item.student.name || "Học viên";
    }

    return "Học viên";
}

type ScheduleSortKey =
    | "className"
    | "course"
    | "teacher"
    | "schedule"
    | "room"
    | "status"
    | "createdAt";

type StatusFilter = "all" | "active" | "inactive";

type ScheduleFormState = {
    mode: ClassMode;
    scheduleText: string;
    room: string;
    startedAt: string;
    endedAt: string;
};

const INITIAL_FORM: ScheduleFormState = {
    mode: "ONLINE",
    scheduleText: "",
    room: "",
    startedAt: "",
    endedAt: "",
};

function getInitialForm(item: ClassroomItem | null): ScheduleFormState {
    if (!item) return INITIAL_FORM;

    return {
        mode: item.mode || "ONLINE",
        scheduleText: item.scheduleText || "",
        room: item.room || "",
        startedAt: toDateInputValue(item.startedAt),
        endedAt: toDateInputValue(item.endedAt),
    };
}

function ScheduleEditorModal({
    open,
    item,
    value,
    saving,
    students,
    studentsLoading,
    onClose,
    onChange,
    onSubmit,
}: {
    open: boolean;
    item: ClassroomItem | null;
    value: ScheduleFormState;
    saving: boolean;
    students: ClassroomStudentStudyItem[];
    studentsLoading: boolean;
    onClose: () => void;
    onChange: (patch: Partial<ScheduleFormState>) => void;
    onSubmit: () => void;
}) {
    if (!open || !item) return null;

    const impactedStudents = students.filter(isImpactedStudent);
    const previewStudents = impactedStudents.slice(0, 6);

    return (
        <div className="fixed inset-0 z-[120] bg-slate-950/45 p-3 md:p-5">
            <div className="flex h-full items-center justify-center">
                <div className="flex h-[92vh] w-full max-w-[880px] flex-col overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-2xl">
                    <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4">
                        <div className="pr-4">
                            <div className="flex items-center gap-2 text-sky-700">
                                <CalendarDays className="h-5 w-5" />
                                <span className="text-sm font-semibold">
                                    Chỉnh lịch theo lớp
                                </span>
                            </div>

                            <h2 className="mt-2 text-[22px] font-bold text-slate-900">
                                {item.className}
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                Lưu thay đổi tại đây sẽ đồng bộ sang toàn bộ học viên thuộc lớp
                                này.
                            </p>
                        </div>

                        <button
                            type="button"
                            disabled={saving}
                            onClick={onClose}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto px-5 py-5">
                        <section className="grid gap-3 md:grid-cols-3">
                            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                                <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
                                    <BookOpen className="h-4 w-4" />
                                    Khóa học
                                </div>
                                <p className="mt-2 text-base font-semibold text-slate-900">
                                    {getCourseTitle(item)}
                                </p>
                            </div>

                            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                                <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
                                    <User2 className="h-4 w-4" />
                                    Giảng viên
                                </div>
                                <p className="mt-2 text-base font-semibold text-slate-900">
                                    {getTeacherName(item)}
                                </p>
                            </div>

                            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                                <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
                                    <Users className="h-4 w-4" />
                                    Học viên chịu ảnh hưởng
                                </div>
                                <p className="mt-2 text-base font-semibold text-slate-900">
                                    {studentsLoading
                                        ? "Đang tải..."
                                        : `${impactedStudents.length} học viên`}
                                </p>
                                <p className="mt-1 text-xs text-slate-500">
                                    Trạng thái đang xem lịch: ghi danh, đang học, tạm dừng.
                                </p>
                            </div>
                        </section>

                        <section className="mt-5 rounded-[28px] border border-slate-200 bg-white p-5">
                            <div className="mb-4">
                                <h3 className="text-base font-semibold text-slate-900">
                                    Thông tin lịch học
                                </h3>
                                <p className="mt-1 text-sm text-slate-500">
                                    Cập nhật khung giờ, hình thức học và khoảng thời gian áp dụng
                                    cho lớp.
                                </p>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                                        Hình thức
                                    </label>
                                    <select
                                        value={value.mode}
                                        onChange={(event) =>
                                            onChange({ mode: event.target.value as ClassMode })
                                        }
                                        className="h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-sky-500"
                                    >
                                        <option value="ONLINE">Online</option>
                                        <option value="OFFLINE">Offline</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                                        Phòng học / Link học
                                    </label>
                                    <input
                                        value={value.room}
                                        onChange={(event) => onChange({ room: event.target.value })}
                                        placeholder={
                                            value.mode === "ONLINE"
                                                ? "Google Meet / Zoom"
                                                : "Phòng 203"
                                        }
                                        className="h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-sky-500"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                                        Lịch học
                                    </label>
                                    <input
                                        value={value.scheduleText}
                                        onChange={(event) =>
                                            onChange({ scheduleText: event.target.value })
                                        }
                                        placeholder="Ví dụ: T2 - T4 - T6 | 18:30 - 20:00"
                                        className="h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-sky-500"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                                        Ngày bắt đầu
                                    </label>
                                    <input
                                        type="date"
                                        value={value.startedAt}
                                        onChange={(event) =>
                                            onChange({ startedAt: event.target.value })
                                        }
                                        className="h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-sky-500"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                                        Ngày kết thúc
                                    </label>
                                    <input
                                        type="date"
                                        value={value.endedAt}
                                        onChange={(event) =>
                                            onChange({ endedAt: event.target.value })
                                        }
                                        className="h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-sky-500"
                                    />
                                </div>
                            </div>
                        </section>

                        <section className="mt-5 rounded-[28px] border border-sky-100 bg-sky-50/70 p-5">
                            <div className="flex items-center gap-2 text-sky-700">
                                <Sparkles className="h-5 w-5" />
                                <h3 className="text-base font-semibold">Phạm vi đồng bộ</h3>
                            </div>

                            <p className="mt-2 text-sm leading-6 text-slate-600">
                                Sau khi lưu, lịch mới sẽ ghi đè vào hồ sơ học tập của học viên
                                trong lớp này. Trang `/lich-hoc` của học viên sẽ đọc lịch mới
                                ngay từ dữ liệu lớp và snapshot đã được đồng bộ.
                            </p>

                            {studentsLoading ? (
                                <div className="mt-4 rounded-2xl border border-dashed border-sky-200 bg-white px-4 py-5 text-sm text-slate-500">
                                    Đang tải danh sách học viên...
                                </div>
                            ) : impactedStudents.length === 0 ? (
                                <div className="mt-4 rounded-2xl border border-dashed border-sky-200 bg-white px-4 py-5 text-sm text-slate-500">
                                    Chưa có học viên đang theo lớp này.
                                </div>
                            ) : (
                                <div className="mt-4 space-y-3">
                                    {previewStudents.map((student) => (
                                        <div
                                            key={student._id}
                                            className="flex items-center justify-between gap-3 rounded-2xl border border-white bg-white px-4 py-3"
                                        >
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-semibold text-slate-900">
                                                    {getStudentName(student)}
                                                </p>
                                                <p className="truncate text-xs text-slate-500">
                                                    {typeof student.student === "object" &&
                                                        student.student?.email
                                                        ? student.student.email
                                                        : "Học viên lớp"}
                                                </p>
                                            </div>

                                            <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                                                {STUDY_STATUS_LABELS[student.status]}
                                            </span>
                                        </div>
                                    ))}

                                    {impactedStudents.length > previewStudents.length ? (
                                        <p className="text-xs text-slate-500">
                                            Và còn {impactedStudents.length - previewStudents.length}{" "}
                                            học viên khác sẽ nhận lịch mới.
                                        </p>
                                    ) : null}
                                </div>
                            )}
                        </section>
                    </div>

                    <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-5 py-4">
                        <button
                            type="button"
                            disabled={saving}
                            onClick={onClose}
                            className="h-11 rounded-2xl border border-slate-200 px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            Hủy
                        </button>

                        <button
                            type="button"
                            disabled={saving}
                            onClick={onSubmit}
                            className="inline-flex h-11 items-center justify-center rounded-2xl bg-sky-600 px-5 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {saving ? "Đang lưu..." : "Lưu và đồng bộ cho lớp"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function AdminSchedulePage() {
    const [classes, setClasses] = useState<ClassroomItem[]>([]);
    const [courses, setCourses] = useState<CourseOption[]>([]);
    const [teachers, setTeachers] = useState<TeacherOption[]>([]);
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
    const [courseFilter, setCourseFilter] = useState("");
    const [teacherFilter, setTeacherFilter] = useState("");
    const [sortKey, setSortKey] = useState<ScheduleSortKey>("createdAt");
    const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [reloadSeed, setReloadSeed] = useState(0);
    const [serverPagination, setServerPagination] = useState<PaginationMeta>(
        makePaginationMeta(0, 1, 10)
    );

    const [editingItem, setEditingItem] = useState<ClassroomItem | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [form, setForm] = useState<ScheduleFormState>(INITIAL_FORM);
    const [saving, setSaving] = useState(false);
    const [students, setStudents] = useState<ClassroomStudentStudyItem[]>([]);
    const [studentsLoading, setStudentsLoading] = useState(false);

    useEffect(() => {
        let mounted = true;

        async function loadLookups() {
            try {
                const [courseItems, teacherItems] = await Promise.all([
                    classroomApi.listCourseOptions(),
                    classroomApi.listTeacherOptions(),
                ]);

                if (!mounted) return;

                setCourses(courseItems);
                setTeachers(teacherItems);
            } catch (error) {
                if (!mounted) return;
                toast.error(getErrorMessage(error, "Không tải được bộ lọc lớp học"));
            }
        }

        void loadLookups();

        return () => {
            mounted = false;
        };
    }, []);

    useEffect(() => {
        let mounted = true;

        async function loadClasses() {
            try {
                setLoading(true);

                const result = await classroomApi.listPaged({
                    q: search || undefined,
                    status: statusFilter === "all" ? undefined : statusFilter,
                    courseId: courseFilter || undefined,
                    teacherId: teacherFilter || undefined,
                    sortBy: sortKey,
                    sortOrder: sortDirection,
                    page,
                    limit: pageSize,
                });

                if (!mounted) return;

                setClasses(result.items);
                setServerPagination(
                    result.pagination ??
                    makePaginationMeta(result.items.length, page, pageSize)
                );
            } catch (error) {
                if (!mounted) return;

                setClasses([]);
                setServerPagination(makePaginationMeta(0, page, pageSize));
                toast.error(
                    getErrorMessage(error, "Không tải được danh sách lịch học")
                );
            } finally {
                if (mounted) setLoading(false);
            }
        }

        void loadClasses();

        return () => {
            mounted = false;
        };
    }, [
        courseFilter,
        page,
        pageSize,
        reloadSeed,
        search,
        sortDirection,
        sortKey,
        statusFilter,
        teacherFilter,
    ]);

    useEffect(() => {
        if (!modalOpen || !editingItem?._id) return;

        const editingId: string = editingItem._id;

        let mounted = true;

        async function loadStudents() {
            try {
                setStudentsLoading(true);

                const items = await classroomApi.listStudents(editingId);

                if (!mounted) return;
                setStudents(items);
            } catch (error) {
                if (!mounted) return;

                setStudents([]);
                toast.error(
                    getErrorMessage(error, "Không tải được học viên của lớp này")
                );
            } finally {
                if (mounted) setStudentsLoading(false);
            }
        }

        void loadStudents();

        return () => {
            mounted = false;
        };
    }, [editingItem?._id, modalOpen]);

    useEffect(() => {
        if (page > serverPagination.totalPages) {
            setPage(serverPagination.totalPages);
        }
    }, [page, serverPagination.totalPages]);

    function resetEditor() {
        setModalOpen(false);
        setEditingItem(null);
        setForm(INITIAL_FORM);
        setStudents([]);
        setStudentsLoading(false);
    }

    function openEditor(item: ClassroomItem) {
        setEditingItem(item);
        setForm(getInitialForm(item));
        setStudents([]);
        setModalOpen(true);
    }

    async function handleSubmit() {
        if (!editingItem) return;

        if (!form.scheduleText.trim()) {
            toast.error("Vui lòng nhập lịch học cho lớp");
            return;
        }

        if (form.startedAt && form.endedAt && form.endedAt < form.startedAt) {
            toast.error("Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu");
            return;
        }

        try {
            setSaving(true);

            const updated = await classroomApi.update(editingItem._id, {
                mode: form.mode,
                scheduleText: form.scheduleText.trim(),
                room: form.room.trim(),
                startedAt: form.startedAt ? toIsoFromDateInput(form.startedAt) : "",
                endedAt: form.endedAt ? toIsoFromDateInput(form.endedAt) : "",
            });

            setClasses((prev) =>
                prev.map((item) => (item._id === updated._id ? updated : item))
            );

            resetEditor();
            setReloadSeed((prev) => prev + 1);
            toast.success(
                "Đã cập nhật lịch học và đồng bộ cho toàn bộ học viên của lớp"
            );
        } catch (error) {
            toast.error(getErrorMessage(error, "Cập nhật lịch học thất bại"));
        } finally {
            setSaving(false);
        }
    }

    const activeFilterCount =
        Number(statusFilter !== "all") +
        Number(courseFilter !== "") +
        Number(teacherFilter !== "");

    const filterSections = useMemo<AdminFilterSection[]>(
        () => [
            {
                id: "status",
                title: "Trạng thái lớp",
                options: [
                    {
                        id: "status-all",
                        label: "Tất cả",
                        checked: statusFilter === "all",
                        onToggle: () => {
                            setStatusFilter("all");
                            setPage(1);
                        },
                    },
                    {
                        id: "status-active",
                        label: "Đang hoạt động",
                        checked: statusFilter === "active",
                        onToggle: () => {
                            setStatusFilter("active");
                            setPage(1);
                        },
                    },
                    {
                        id: "status-inactive",
                        label: "Tạm tắt",
                        checked: statusFilter === "inactive",
                        onToggle: () => {
                            setStatusFilter("inactive");
                            setPage(1);
                        },
                    },
                ],
            },
            {
                id: "course",
                title: "Khóa học",
                options: [
                    {
                        id: "course-all",
                        label: "Tất cả khóa học",
                        checked: courseFilter === "",
                        onToggle: () => {
                            setCourseFilter("");
                            setPage(1);
                        },
                    },
                    ...courses.map((course) => ({
                        id: `course-${course._id}`,
                        label: course.title,
                        checked: courseFilter === course._id,
                        onToggle: () => {
                            setCourseFilter(course._id);
                            setPage(1);
                        },
                    })),
                ],
            },
            {
                id: "teacher",
                title: "Giảng viên",
                options: [
                    {
                        id: "teacher-all",
                        label: "Tất cả giảng viên",
                        checked: teacherFilter === "",
                        onToggle: () => {
                            setTeacherFilter("");
                            setPage(1);
                        },
                    },
                    ...teachers.map((teacher) => ({
                        id: `teacher-${teacher._id}`,
                        label: teacher.user?.name || "Giảng viên",
                        checked: teacherFilter === teacher._id,
                        onToggle: () => {
                            setTeacherFilter(teacher._id);
                            setPage(1);
                        },
                    })),
                ],
            },
        ],
        [courseFilter, courses, statusFilter, teacherFilter, teachers]
    );

    const tableColumns: AdminTableColumn<ClassroomItem, ScheduleSortKey>[] = [
        {
            id: "class",
            label: "Lớp học",
            sortKey: "className",
            widthClassName: "w-[300px]",
            render: (item) => (
                <AdminEntityCell
                    title={item.className || "--"}
                    subtitle={getCourseTitle(item)}
                    meta={getTeacherName(item)}
                    icon={<BookOpen className="h-4 w-4 text-slate-500" />}
                />
            ),
        },
        {
            id: "schedule",
            label: "Lịch học",
            sortKey: "schedule",
            widthClassName: "w-[270px]",
            render: (item) => (
                <div className="space-y-2">
                    <div className="font-semibold text-slate-900">
                        {item.scheduleText || "Chưa thiết lập lịch"}
                    </div>
                    <span
                        className={cn(
                            "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
                            item.mode === "ONLINE"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-sky-100 text-sky-700"
                        )}
                    >
                        {getModeLabel(item.mode)}
                    </span>
                </div>
            ),
        },
        {
            id: "room",
            label: "Địa điểm",
            sortKey: "room",
            widthClassName: "w-[210px]",
            render: (item) => (
                <div className="flex items-center gap-2 text-slate-700">
                    {item.mode === "ONLINE" ? (
                        <MonitorPlay className="h-4 w-4 shrink-0 text-slate-400" />
                    ) : (
                        <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
                    )}
                    <span className="truncate">{getDisplayRoom(item)}</span>
                </div>
            ),
        },
        {
            id: "period",
            label: "Áp dụng",
            widthClassName: "w-[170px]",
            render: (item) => (
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-slate-700">
                        <Clock3 className="h-4 w-4 shrink-0 text-slate-400" />
                        <span>{formatDateRange(item.startedAt, item.endedAt)}</span>
                    </div>
                </div>
            ),
        },
        {
            id: "status",
            label: "Trạng thái",
            sortKey: "status",
            widthClassName: "w-[140px]",
            render: (item) => (
                <AdminStatusBadge tone={item.isActive ? "success" : "neutral"}>
                    {item.isActive ? "ACTIVE" : "TẠM TẮT"}
                </AdminStatusBadge>
            ),
        },
        {
            id: "actions",
            label: <div className="text-right">Thao tác</div>,
            widthClassName: "w-[110px]",
            align: "right",
            render: (item) => (
                <div className="flex items-center justify-end gap-2">
                    <AdminActionIconButton
                        title="Chỉnh lịch"
                        onClick={() => openEditor(item)}
                    >
                        <Pencil className="h-4 w-4" />
                    </AdminActionIconButton>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6">

            <AdminListTable<ClassroomItem, ScheduleSortKey>
                rows={classes}
                columns={tableColumns}
                rowKey={(item) => item._id}
                loading={loading}
                searchValue={search}
                searchPlaceholder="Tìm lớp, khóa học, giảng viên, lịch hoặc phòng học..."
                onSearchChange={(value) => {
                    setSearch(value);
                    setPage(1);
                }}
                filterSections={filterSections}
                activeFilterCount={activeFilterCount}
                onApplyFilters={() => setPage(1)}
                onClearFilters={() => {
                    setSearch("");
                    setStatusFilter("all");
                    setCourseFilter("");
                    setTeacherFilter("");
                    setPage(1);
                }}
                sortBy={sortKey}
                sortOrder={sortDirection}
                onSortChange={(nextSortBy, nextSortOrder) => {
                    setSortKey(nextSortBy);
                    setSortDirection(nextSortOrder);
                    setPage(1);
                }}
                onReload={() => setReloadSeed((prev) => prev + 1)}
                pagination={{
                    currentPage: serverPagination.page,
                    totalPages: serverPagination.totalPages,
                    totalItems: serverPagination.total,
                    pageSize,
                    onPageSizeChange: (nextPageSize) => {
                        setPageSize(nextPageSize);
                        setPage(1);
                    },
                    onPageChange: setPage,
                    pageSizeOptions: [5, 10, 20],
                }}
                emptyText="Không có lớp học nào phù hợp để cập nhật lịch."
                labels={{
                    apply: "Áp dụng",
                    clear: "Xóa lọc",
                    filter: "Bộ lọc",
                    loading: "Đang tải danh sách lịch học...",
                    noData: "Không có dữ liệu",
                    of: "/",
                    reload: "Tải lại",
                    rows: "Số dòng / trang",
                    search: "Tìm kiếm",
                    showing: "Hiển thị",
                }}
                tableMinWidthClassName="min-w-[1200px]"
            />

            <ScheduleEditorModal
                open={modalOpen}
                item={editingItem}
                value={form}
                saving={saving}
                students={students}
                studentsLoading={studentsLoading}
                onClose={() => {
                    if (saving) return;
                    resetEditor();
                }}
                onChange={(patch) => setForm((prev) => ({ ...prev, ...patch }))}
                onSubmit={() => void handleSubmit()}
            />
        </div>
    );
}
