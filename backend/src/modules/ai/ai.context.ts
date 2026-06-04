import { Types } from "mongoose";
import { ProductModel } from "../course/course.model";
import { StudentStudyModel } from "../student/student-study.model";
import { NotificationModel } from "../notification/notification.model";
import { PaymentOrderModel } from "../payment/payment.model";
import { ClassRoomModel } from "../classroom/classroom.model";
import { TeacherModel } from "../teacher/teacher.model";
import { getDashboardService } from "../dashboard/dashboard.service";

function compactCurrency(value: unknown) {
  const amount = Number(value || 0);
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

function toDateText(value: unknown) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
}

function getCategoryName(value: unknown) {
  if (!value || typeof value !== "object") return "";
  return String((value as { name?: unknown }).name || "");
}

function getRefId(value: unknown) {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (value instanceof Types.ObjectId) return value.toString();
  if (typeof value === "object" && "_id" in (value as Record<string, unknown>)) {
    return String((value as { _id?: unknown })._id || "");
  }
  return "";
}

function normalizeCourse(item: any, studentCount?: number) {
  return {
    id: String(item._id || ""),
    title: item.title || "",
    shortDescription: item.shortDescription || "",
    category: getCategoryName(item.category),
    level: item.level || "",
    modes: item.modes || [],
    status: item.status || "",
    rating: Number(item.rating || 0),
    durationText: item.durationText || "",
    price: compactCurrency(item.price),
    teacherName: item.teacherName || "",
    studentCount: studentCount ?? undefined,
  };
}

function normalizeStudy(item: any) {
  const course = item.course || {};
  const classRoom = item.classRoom || {};
  const teacherUser = item.teacher?.user || {};

  const upcomingSessions = Array.isArray(item.sessions)
    ? item.sessions
        .filter((session: any) => session?.date)
        .slice(0, 8)
        .map((session: any) => ({
          sessionNo: session.sessionNo,
          date: toDateText(session.date),
          attendanceStatus: session.attendanceStatus,
          homeworkStatus: session.homeworkStatus,
          teacherNote: session.teacherNote || "",
        }))
    : [];

  return {
    id: String(item._id || ""),
    courseTitle: course.title || "",
    className: item.className || classRoom.className || "",
    teacherName: teacherUser.name || course.teacherName || "",
    mode: item.mode || classRoom.mode || "",
    scheduleText: item.scheduleText || classRoom.scheduleText || "",
    room: item.room || classRoom.room || "",
    status: item.status || "",
    progressPercent: Number(item.progressPercent || 0),
    attendancePercent: Number(item.attendancePercent || 0),
    finalAverage: Number(item.finalAverage || 0),
    academicLevel: item.academicLevel || "",
    startedAt: toDateText(item.startedAt || classRoom.startedAt),
    endedAt: toDateText(item.endedAt || classRoom.endedAt),
    note: item.note || "",
    sessions: upcomingSessions,
  };
}

export async function buildPublicAiContext() {
  const courses = await ProductModel.find({
    isDeleted: false,
    isActive: true,
  })
    .select(
      "title shortDescription category level modes status rating durationText price teacherName createdAt"
    )
    .populate("category", "name")
    .sort({ createdAt: -1 })
    .limit(40)
    .lean();

  const courseIds = courses.map((item) => item._id).filter(Boolean);
  const counts = await StudentStudyModel.aggregate([
    {
      $match: {
        course: { $in: courseIds },
        isActive: true,
      },
    },
    {
      $group: {
        _id: "$course",
        count: { $sum: 1 },
      },
    },
  ]);

  const countMap = new Map(
    counts.map((item) => [String(item._id), Number(item.count || 0)])
  );

  return {
    courses: courses.map((item: any) =>
      normalizeCourse(item, countMap.get(String(item._id)) || 0)
    ),
  };
}

export async function buildStudentAiContext(userId: string) {
  const [studies, notifications, payments] = await Promise.all([
    StudentStudyModel.find({
      student: userId,
      isActive: true,
    })
      .sort({ updatedAt: -1 })
      .limit(12)
      .populate("course", "title shortDescription level modes status durationText price teacherName")
      .populate("classRoom", "className mode scheduleText room startedAt endedAt")
      .populate({
        path: "teacher",
        select: "user",
        populate: {
          path: "user",
          select: "name email",
        },
      })
      .lean(),

    NotificationModel.find({
      userId,
      $or: [{ isSent: true }, { isSent: { $exists: false } }],
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .select("title message type isRead sentAt createdAt")
      .lean(),

    PaymentOrderModel.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(8)
      .select("status amount items paidAt createdAt")
      .lean(),
  ]);

  return {
    currentDateTime: new Date().toLocaleString("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
    }),
    studies: studies.map(normalizeStudy),
    notifications: notifications.map((item) => ({
      title: item.title,
      message: item.message,
      type: item.type,
      isRead: item.isRead,
      sentAt: toDateText(item.sentAt || item.createdAt),
    })),
    payments: payments.map((item: any) => ({
      status: item.status,
      amount: compactCurrency(item.amount),
      items: Array.isArray(item.items)
        ? item.items.map((entry: any) => ({
            title: entry.title,
            quantity: entry.quantity,
            subtotal: compactCurrency(entry.subtotal),
          }))
        : [],
      paidAt: toDateText(item.paidAt),
      createdAt: toDateText(item.createdAt),
    })),
  };
}

export async function buildTeacherAiContext(userId: string) {
  const teacher = await TeacherModel.findOne({
    user: userId,
    isDeleted: false,
  })
    .populate("user", "name email")
    .lean();

  const notificationsPromise = NotificationModel.find({
    userId,
    $or: [{ isSent: true }, { isSent: { $exists: false } }],
  })
    .sort({ createdAt: -1 })
    .limit(10)
    .select("title message type isRead sentAt createdAt")
    .lean();

  if (!teacher) {
    const notifications = await notificationsPromise;

    return {
      currentDateTime: new Date().toLocaleString("vi-VN", {
        timeZone: "Asia/Ho_Chi_Minh",
      }),
      teacher: null,
      classes: [],
      notifications: notifications.map((item) => ({
        title: item.title,
        message: item.message,
        type: item.type,
        isRead: item.isRead,
        sentAt: toDateText(item.sentAt || item.createdAt),
      })),
    };
  }

  const [classes, notifications] = await Promise.all([
    ClassRoomModel.find({
      teacher: teacher._id,
      isDeleted: false,
    })
      .select("className mode scheduleText room maxStudents startedAt endedAt isActive course updatedAt")
      .populate("course", "title shortDescription level status durationText")
      .sort({ updatedAt: -1 })
      .limit(20)
      .lean(),
    notificationsPromise,
  ]);

  const classIds = classes.map((item) => item._id).filter(Boolean);
  const studentCounts = await StudentStudyModel.aggregate([
    {
      $match: {
        classRoom: { $in: classIds },
        isActive: true,
      },
    },
    {
      $group: {
        _id: "$classRoom",
        count: { $sum: 1 },
      },
    },
  ]);

  const countMap = new Map(
    studentCounts.map((item) => [String(item._id), Number(item.count || 0)])
  );

  return {
    currentDateTime: new Date().toLocaleString("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
    }),
    teacher: {
      id: String(teacher._id || ""),
      name:
        teacher.user && typeof teacher.user === "object"
          ? String((teacher.user as { name?: unknown }).name || "")
          : "",
      email:
        teacher.user && typeof teacher.user === "object"
          ? String((teacher.user as { email?: unknown }).email || "")
          : "",
      specialty: teacher.specialty || "",
      active: Boolean(teacher.isActive),
    },
    classes: classes.map((item: any) => ({
      id: String(item._id || ""),
      className: item.className || "",
      courseTitle: item.course?.title || "",
      mode: item.mode || "",
      scheduleText: item.scheduleText || "",
      room: item.room || "",
      startedAt: toDateText(item.startedAt),
      endedAt: toDateText(item.endedAt),
      active: Boolean(item.isActive),
      maxStudents: Number(item.maxStudents || 0),
      currentStudents: countMap.get(String(item._id)) || 0,
    })),
    notifications: notifications.map((item) => ({
      title: item.title,
      message: item.message,
      type: item.type,
      isRead: item.isRead,
      sentAt: toDateText(item.sentAt || item.createdAt),
    })),
  };
}

export async function buildAdminAiContext() {
  const [dashboard, courses, classes, recentStudies, pendingPayments] =
    await Promise.all([
      getDashboardService({ months: 6 }),
      ProductModel.find({ isDeleted: false })
        .select("title status isActive level modes price durationText teacherName createdAt")
        .sort({ createdAt: -1 })
        .limit(12)
        .lean(),
      ClassRoomModel.find({ isDeleted: false })
        .select("className mode scheduleText room maxStudents startedAt endedAt isActive course")
        .populate("course", "title")
        .sort({ updatedAt: -1 })
        .limit(12)
        .lean(),
      StudentStudyModel.find({ isActive: true })
        .sort({ updatedAt: -1 })
        .limit(12)
        .populate("student", "name email")
        .populate("course", "title")
        .lean(),
      PaymentOrderModel.find({ status: "PENDING" })
        .sort({ createdAt: -1 })
        .limit(10)
        .select("amount items createdAt user")
        .populate("user", "name email")
        .lean(),
    ]);

  return {
    currentDateTime: new Date().toLocaleString("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
    }),
    dashboard,
    recentCourses: courses.map((item: any) => normalizeCourse(item)),
    recentClasses: classes.map((item: any) => ({
      id: String(item._id || ""),
      className: item.className,
      courseTitle: item.course?.title || "",
      mode: item.mode,
      scheduleText: item.scheduleText,
      room: item.room,
      maxStudents: item.maxStudents,
      isActive: item.isActive,
      startedAt: toDateText(item.startedAt),
      endedAt: toDateText(item.endedAt),
    })),
    recentStudies: recentStudies.map((item: any) => ({
      id: String(item._id || ""),
      studentId: getRefId(item.student),
      studentName: item.student?.name || "",
      studentEmail: item.student?.email || "",
      courseTitle: item.course?.title || "",
      className: item.className,
      status: item.status,
      progressPercent: Number(item.progressPercent || 0),
      attendancePercent: Number(item.attendancePercent || 0),
      finalAverage: Number(item.finalAverage || 0),
    })),
    pendingPayments: pendingPayments.map((item: any) => ({
      studentName: item.user?.name || "",
      studentEmail: item.user?.email || "",
      amount: compactCurrency(item.amount),
      items: Array.isArray(item.items)
        ? item.items.map((entry: any) => entry.title).join(", ")
        : "",
      createdAt: toDateText(item.createdAt),
    })),
  };
}
