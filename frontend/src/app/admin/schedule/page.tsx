"use client";

import { useEffect, useMemo, useState } from "react";
import {
    Clock3,
    MapPin,
    MonitorPlay,
    Pencil,
    Plus,
    Trash2,
    X,
} from "lucide-react";
import { toast } from "sonner";
import {
    classroomApi,
    type ClassMode,
    type ClassroomItem,
    type CourseOption,
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
import { toastConfirm } from "@/lib/utils/toast-confirm";

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

type ScheduleSortKey =
    | "className"
    | "course"
    | "teacher"
    | "schedule"
    | "room"
    | "status"
    | "createdAt";

type StatusFilter = "all" | "active" | "inactive";
type ScheduleFormMode = "create" | "edit";

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
    mode,
    item,
    classOptions,
    selectedClassId,
    value,
    saving,
    onClose,
    onChange,
    onSelectClass,
    onSubmit,
}: {
    open: boolean;
    mode: ScheduleFormMode;
    item: ClassroomItem | null;
    classOptions: ClassroomItem[];
    selectedClassId: string;
    value: ScheduleFormState;
    saving: boolean;
    onClose: () => void;
    onChange: (patch: Partial<ScheduleFormState>) => void;
    onSelectClass: (classRoomId: string) => void;
    onSubmit: () => void;
}) {
    if (!open) return null;

    const isCreate = mode === "create";
    const formDisabled = saving || !item;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 px-4 py-6 backdrop-blur-sm dark:bg-slate-950/70">
                <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-slate-950 dark:text-slate-100">
                    <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5 dark:border-white/10">
                        <div>
                            <h2 className="text-xl font-semibold text-slate-950 dark:text-white">
                                {isCreate ? "Thêm lịch học" : "Sửa lịch học"}
                            </h2>

                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                {isCreate
                                    ? item?.className || "Chọn lớp học cần thêm lịch."
                                    : item?.className || "Cập nhật lịch học theo lớp."}
                            </p>
                        </div>

                        <button
                            type="button"
                            disabled={saving}
                            onClick={onClose}
                            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:opacity-60 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/10"
                            aria-label="Đóng"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
                        <div className="grid gap-5">
                        {isCreate ? (
                            <section className="mb-5 rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-900">
                                <h3 className="text-sm font-semibold text-slate-950 dark:text-white">
                                    Lớp học
                                </h3>

                                <label className="mt-4 block">
                                <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                                    Chọn lớp <span className="text-rose-600">*</span>
                                </span>
                                <select
                                    value={selectedClassId}
                                    disabled={saving}
                                    onChange={(event) => onSelectClass(event.target.value)}
                                    className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-900 outline-none transition focus:border-sky-500 disabled:opacity-60 dark:border-white/10 dark:bg-slate-950 dark:text-slate-100"
                                >
                                    <option value="">Chọn lớp học</option>
                                    {classOptions.map((option) => (
                                        <option key={option._id} value={option._id}>
                                            {option.className} - {getCourseTitle(option)} -{" "}
                                            {getTeacherName(option)}
                                        </option>
                                    ))}
                                </select>
                                </label>
                            </section>
                        ) : null}

                        <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-900/70">
                            <div className="mb-4">
                                <h3 className="text-sm font-semibold text-slate-950 dark:text-white">
                                    Thông tin lịch học
                                </h3>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                                        Hình thức
                                    </label>
                                    <select
                                        value={value.mode}
                                        disabled={formDisabled}
                                        onChange={(event) =>
                                            onChange({ mode: event.target.value as ClassMode })
                                        }
                                        className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-900 outline-none transition focus:border-sky-500 disabled:opacity-60 dark:border-white/10 dark:bg-slate-950 dark:text-slate-100"
                                    >
                                        <option value="ONLINE">Online</option>
                                        <option value="OFFLINE">Offline</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                                        Phòng học / Link học
                                    </label>
                                    <input
                                        value={value.room}
                                        disabled={formDisabled}
                                        onChange={(event) => onChange({ room: event.target.value })}
                                        placeholder={
                                            value.mode === "ONLINE"
                                                ? "Google Meet / Zoom"
                                                : "Phòng 203"
                                        }
                                        className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-900 outline-none transition focus:border-sky-500 disabled:opacity-60 dark:border-white/10 dark:bg-slate-950 dark:text-slate-100"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                                        Lịch học <span className="text-rose-600">*</span>
                                    </label>
                                    <input
                                        value={value.scheduleText}
                                        disabled={formDisabled}
                                        onChange={(event) =>
                                            onChange({ scheduleText: event.target.value })
                                        }
                                        placeholder="Ví dụ: T2 - T4 - T6 | 18:30 - 20:00"
                                        className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-900 outline-none transition focus:border-sky-500 disabled:opacity-60 dark:border-white/10 dark:bg-slate-950 dark:text-slate-100"
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                                        Ngày bắt đầu
                                    </label>
                                    <input
                                        type="date"
                                        value={value.startedAt}
                                        disabled={formDisabled}
                                        onChange={(event) =>
                                            onChange({ startedAt: event.target.value })
                                        }
                                        className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-900 outline-none transition focus:border-sky-500 disabled:opacity-60 dark:border-white/10 dark:bg-slate-950 dark:text-slate-100"
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                                        Ngày kết thúc
                                    </label>
                                    <input
                                        type="date"
                                        value={value.endedAt}
                                        disabled={formDisabled}
                                        onChange={(event) =>
                                            onChange({ endedAt: event.target.value })
                                        }
                                        className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-900 outline-none transition focus:border-sky-500 disabled:opacity-60 dark:border-white/10 dark:bg-slate-950 dark:text-slate-100"
                                    />
                                </div>
                            </div>
                        </section>
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4 dark:border-white/10">
                        <button
                            type="button"
                            disabled={saving}
                            onClick={onClose}
                            className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10"
                        >
                            Đóng
                        </button>

                        <button
                            type="button"
                            disabled={saving || !item}
                            onClick={onSubmit}
                            className="inline-flex h-10 items-center justify-center rounded-xl bg-sky-600 px-5 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {saving
                                ? "Đang lưu..."
                                : isCreate
                                    ? "Thêm lịch học"
                                    : "Lưu và đồng bộ cho lớp"}
                        </button>
                    </div>
                </div>
        </div>
    );
}

export default function AdminSchedulePage() {
    const [classes, setClasses] = useState<ClassroomItem[]>([]);
    const [classOptions, setClassOptions] = useState<ClassroomItem[]>([]);
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
    const [modalMode, setModalMode] = useState<ScheduleFormMode>("edit");
    const [modalOpen, setModalOpen] = useState(false);
    const [form, setForm] = useState<ScheduleFormState>(INITIAL_FORM);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        let mounted = true;

        async function loadLookups() {
            try {
                const [courseItems, teacherItems, classItems] = await Promise.all([
                    classroomApi.listCourseOptions(),
                    classroomApi.listTeacherOptions(),
                    classroomApi.list({
                        limit: 500,
                        sortBy: "className",
                        sortOrder: "asc",
                    }),
                ]);

                if (!mounted) return;

                setCourses(courseItems);
                setTeachers(teacherItems);
                setClassOptions(classItems);
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
                setClassOptions((prev) => {
                    const map = new Map(prev.map((item) => [item._id, item]));

                    result.items.forEach((item) => {
                        map.set(item._id, item);
                    });

                    return Array.from(map.values()).sort((left, right) =>
                        left.className.localeCompare(right.className, "vi")
                    );
                });
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
        if (page > serverPagination.totalPages) {
            setPage(serverPagination.totalPages);
        }
    }, [page, serverPagination.totalPages]);

    function resetEditor() {
        setModalOpen(false);
        setEditingItem(null);
        setModalMode("edit");
        setForm(INITIAL_FORM);
    }

    function replaceClassItem(updated: ClassroomItem) {
        setClasses((prev) =>
            prev.map((item) => (item._id === updated._id ? updated : item))
        );
        setClassOptions((prev) =>
            prev.map((item) => (item._id === updated._id ? updated : item))
        );
    }

    function openCreator() {
        setModalMode("create");
        setEditingItem(null);
        setForm(INITIAL_FORM);
        setModalOpen(true);
    }

    function openEditor(item: ClassroomItem) {
        setModalMode("edit");
        setEditingItem(item);
        setForm(getInitialForm(item));
        setModalOpen(true);
    }

    function handleSelectClass(classRoomId: string) {
        const selected =
            classOptions.find((item) => item._id === classRoomId) ??
            classes.find((item) => item._id === classRoomId) ??
            null;

        setEditingItem(selected);
        setForm(getInitialForm(selected));
    }

    async function handleSubmit() {
        if (!editingItem) {
            toast.error("Vui lòng chọn lớp học");
            return;
        }

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

            replaceClassItem(updated);

            resetEditor();
            setReloadSeed((prev) => prev + 1);
            toast.success(
                modalMode === "create"
                    ? "Đã thêm lịch học và đồng bộ cho toàn bộ học viên của lớp"
                    : "Đã cập nhật lịch học và đồng bộ cho toàn bộ học viên của lớp"
            );
        } catch (error) {
            toast.error(getErrorMessage(error, "Cập nhật lịch học thất bại"));
        } finally {
            setSaving(false);
        }
    }

    async function handleDeleteSchedule(item: ClassroomItem) {
        const ok = await toastConfirm(`Xóa lịch học của lớp "${item.className}"?`, {
            title: "Xác nhận xóa lịch",
            confirmText: "Xóa",
            cancelText: "Đóng",
        });

        if (!ok) return;

        try {
            const updated = await classroomApi.update(item._id, {
                scheduleText: "",
                room: "",
                startedAt: null,
                endedAt: null,
            });

            replaceClassItem(updated);
            setReloadSeed((prev) => prev + 1);
            toast.success("Đã xóa lịch học của lớp");
        } catch (error) {
            toast.error(getErrorMessage(error, "Xóa lịch học thất bại"));
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
            widthClassName: "w-[26%]",
            render: (item) => (
                <AdminEntityCell
                    title={item.className || "--"}
                    subtitle={getCourseTitle(item)}
                    meta={getTeacherName(item)}
                    hideMedia
                />
            ),
        },
        {
            id: "schedule",
            label: "Lịch học",
            sortKey: "schedule",
            widthClassName: "w-[24%]",
            render: (item) => (
                <div className="min-w-0 space-y-2">
                    <div className="whitespace-normal break-words font-semibold text-slate-900 dark:text-white">
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
            widthClassName: "w-[14%]",
            render: (item) => (
                <div className="flex min-w-0 items-center gap-2 text-slate-700 dark:text-slate-200">
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
            widthClassName: "w-[18%]",
            render: (item) => (
                <div className="min-w-0 space-y-1">
                    <div className="flex min-w-0 items-center gap-2 text-slate-700 dark:text-slate-200">
                        <Clock3 className="h-4 w-4 shrink-0 text-slate-400" />
                        <span className="whitespace-normal break-words">
                            {formatDateRange(item.startedAt, item.endedAt)}
                        </span>
                    </div>
                </div>
            ),
        },
        {
            id: "status",
            label: "Trạng thái",
            sortKey: "status",
            widthClassName: "w-[10%]",
            render: (item) => (
                <AdminStatusBadge
                    tone={item.isActive ? "success" : "neutral"}
                    className="min-w-[88px] px-2"
                >
                    {item.isActive ? "ACTIVE" : "TẠM TẮT"}
                </AdminStatusBadge>
            ),
        },
        {
            id: "actions",
            label: <div className="text-right">Thao tác</div>,
            widthClassName: "w-[8%]",
            align: "right",
            render: (item) => {
                const hasSchedule = Boolean(
                    item.scheduleText || item.room || item.startedAt || item.endedAt
                );

                return (
                    <div className="flex items-center justify-end gap-1">
                        <AdminActionIconButton
                            title="Sửa lịch"
                            onClick={() => openEditor(item)}
                        >
                            <Pencil className="h-4 w-4" />
                        </AdminActionIconButton>

                        <AdminActionIconButton
                            danger
                            disabled={!hasSchedule}
                            title="Xóa lịch"
                            onClick={() => void handleDeleteSchedule(item)}
                        >
                            <Trash2 className="h-4 w-4" />
                        </AdminActionIconButton>
                    </div>
                );
            },
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
                toolbarEnd={
                    <button
                        type="button"
                        onClick={openCreator}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 text-sm font-semibold text-white transition hover:bg-sky-700"
                    >
                        <Plus className="h-4 w-4" />
                        Thêm lịch
                    </button>
                }
                tableMinWidthClassName="min-w-full"
            />

            <ScheduleEditorModal
                open={modalOpen}
                mode={modalMode}
                item={editingItem}
                classOptions={classOptions}
                selectedClassId={editingItem?._id ?? ""}
                value={form}
                saving={saving}
                onClose={() => {
                    if (saving) return;
                    resetEditor();
                }}
                onChange={(patch) => setForm((prev) => ({ ...prev, ...patch }))}
                onSelectClass={handleSelectClass}
                onSubmit={() => void handleSubmit()}
            />
        </div>
    );
}
