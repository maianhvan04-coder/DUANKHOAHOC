import bcrypt from "bcryptjs";
import { isValidObjectId } from "mongoose";
import { accountRepo } from "./account.repo";
import {
  uploadBufferToCloudinary,
  deleteFromCloudinary,
} from "../../utils/cloudinary-upload";

type HttpError = Error & {
  statusCode?: number;
};

type AccountUserEntity = {
  _id: unknown;
  name: string;
  email: string;
  avatar?: string | null;
  avatarPublicId?: string | null;
  passwordHash?: string | null;
};

type PaymentEntity = {
  _id: unknown;
  paymentCode: string | number;
  amount: number;
  status: string;
  provider: string;
  createdAt: Date | string;
};

type GetMeResult = {
  _id: string;
  name: string;
  email: string;
  avatar: string | null;
};

type UpdateMyProfileParams = {
  userId: string;
  name: string;
  avatarFile?: Express.Multer.File;
};

type ChangeMyPasswordParams = {
  userId: string;
  currentPassword: string;
  newPassword: string;
};

type PaymentHistoryItem = {
  id: string;
  code: string;
  amount: number;
  status: string;
  provider: string;
  createdAt: Date | string;
};

type AnyObj = Record<string, unknown>;

type MyCourseStatus = "pending" | "approved" | "assigned";

type MyCourseItem = {
  id: string;
  source: "study" | "payment";
  courseId: string;
  title: string;
  format: string;
  desiredSchedule: string;
  className: string;
  teacherName: string;
  actualSchedule: string;
  status: MyCourseStatus;
  paymentCode?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

function createHttpError(statusCode: number, message: string): HttpError {
  const err: HttpError = new Error(message);
  err.statusCode = statusCode;
  return err;
}

function toAccountUser(user: AccountUserEntity): GetMeResult {
  return {
    _id: String(user._id),
    name: user.name,
    email: user.email,
    avatar: user.avatar ?? null,
  };
}

function isObject(value: unknown): value is AnyObj {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  return fallback;
}

function asDateLike(value: unknown): Date | string | undefined {
  if (value instanceof Date || typeof value === "string") return value;
  return undefined;
}

function stringifyId(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number") return String(value);

  if (isObject(value)) {
    const id =
      (value._id !== value ? stringifyId(value._id) : "") ||
      (value.id !== value ? stringifyId(value.id) : "");
    if (id) return id;

    const text = String(value);
    return text && text !== "[object Object]" ? text : "";
  }

  return "";
}

function getObjectArray(value: unknown): AnyObj[] {
  return Array.isArray(value) ? value.filter(isObject) : [];
}

function getObj(value: unknown): AnyObj | null {
  return isObject(value) ? value : null;
}

function getTeacherName(value: unknown): string {
  const teacher = getObj(value);
  if (!teacher) return "";

  const user = getObj(teacher.user);
  return (
    asString(user?.name) ||
    asString(teacher.name) ||
    asString(teacher.teacherName)
  );
}

function getStudyCourse(study: AnyObj): AnyObj | null {
  const course = getObj(study.course);
  if (course) return course;

  const classRoom = getObj(study.classRoom);
  return getObj(classRoom?.course);
}

function getStudyClassRoom(study: AnyObj): AnyObj | null {
  return getObj(study.classRoom);
}

function formatMode(mode: unknown) {
  return asString(mode) === "OFFLINE" ? "Tại lớp" : "Trực tuyến";
}

function formatProductMode(product: AnyObj | undefined) {
  const modes = Array.isArray(product?.modes)
    ? product.modes.map((item) => asString(item)).filter(Boolean)
    : [];

  if (modes.includes("OFFLINE") && modes.includes("ONLINE")) {
    return "Trực tuyến / Tại lớp";
  }

  if (modes.includes("OFFLINE")) return "Tại lớp";
  return "Trực tuyến";
}

function mapStudyStatus(study: AnyObj): MyCourseStatus {
  const classRoom = getStudyClassRoom(study);
  const className = asString(study.className) || asString(classRoom?.className);

  if (className || classRoom) return "assigned";

  const status = asString(study.status);
  if (status === "ENROLLED" || status === "STUDYING" || status === "COMPLETED") {
    return "approved";
  }

  return "pending";
}

function mapStudyToMyCourse(study: AnyObj): MyCourseItem {
  const course = getStudyCourse(study);
  const classRoom = getStudyClassRoom(study);
  const courseId =
    stringifyId(study.course) ||
    stringifyId(course) ||
    stringifyId(classRoom?.course);
  const mode = classRoom?.mode ?? study.mode;
  const className = asString(study.className) || asString(classRoom?.className);
  const scheduleText =
    asString(study.scheduleText) || asString(classRoom?.scheduleText);
  const teacherName =
    getTeacherName(study.teacher) ||
    getTeacherName(classRoom?.teacher) ||
    asString(course?.teacherName);

  return {
    id: stringifyId(study) || courseId,
    source: "study",
    courseId,
    title: asString(course?.title) || className || "Khóa học",
    format: formatMode(mode),
    desiredSchedule: scheduleText || "--",
    className: className || "--",
    teacherName: teacherName || "--",
    actualSchedule: scheduleText || "--",
    status: mapStudyStatus(study),
    createdAt: asDateLike(study.createdAt),
    updatedAt: asDateLike(study.updatedAt),
  };
}

function mapOrderCourse(params: {
  order: AnyObj;
  orderItem: AnyObj;
  product?: AnyObj;
}): MyCourseItem {
  const { order, orderItem, product } = params;
  const courseId = asString(orderItem.courseId);
  const orderId = stringifyId(order);
  const status: MyCourseStatus =
    asString(order.status) === "PAID" ? "approved" : "pending";

  return {
    id: `${orderId || asString(order.paymentCode)}-${courseId}`,
    source: "payment",
    courseId,
    title: asString(product?.title) || asString(orderItem.title) || "Khóa học",
    format: formatProductMode(product),
    desiredSchedule: "--",
    className: "--",
    teacherName: asString(product?.teacherName) || "--",
    actualSchedule: "--",
    status,
    paymentCode: asString(order.paymentCode),
    createdAt: asDateLike(order.paidAt) ?? asDateLike(order.createdAt),
    updatedAt: asDateLike(order.paidAt) ?? asDateLike(order.updatedAt),
  };
}

function getCourseSortTime(item: MyCourseItem) {
  const value = item.updatedAt ?? item.createdAt;
  if (!value) return 0;

  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : 0;
}

export const accountService = {
  async getMe(userId: string): Promise<GetMeResult> {
    const user = (await accountRepo.findUserByIdLean(
      userId
    )) as AccountUserEntity | null;

    if (!user) {
      throw createHttpError(404, "Không tìm thấy người dùng");
    }

    return toAccountUser(user);
  },

  async updateMyProfile(params: UpdateMyProfileParams): Promise<GetMeResult> {
    const { userId, name, avatarFile } = params;

    const user = (await accountRepo.findUserById(
      userId
    )) as AccountUserEntity | null;

    if (!user) {
      throw createHttpError(404, "Không tìm thấy người dùng");
    }

    user.name = name;

    if (avatarFile) {
      const oldPublicId = user.avatarPublicId ?? undefined;

      const uploaded = await uploadBufferToCloudinary(
        avatarFile.buffer,
        "avatars"
      );

      user.avatar = uploaded.secure_url;
      user.avatarPublicId = uploaded.public_id;

      await deleteFromCloudinary(oldPublicId);
    }

    await accountRepo.saveUser(user);

    return toAccountUser(user);
  },

  async changeMyPassword(params: ChangeMyPasswordParams): Promise<boolean> {
    const { userId, currentPassword, newPassword } = params;

    const user = (await accountRepo.findUserByIdWithPassword(
      userId
    )) as AccountUserEntity | null;

    if (!user) {
      throw createHttpError(404, "Không tìm thấy người dùng");
    }

    const currentHash = user.passwordHash;

    if (!currentHash) {
      throw createHttpError(400, "Tài khoản chưa có mật khẩu");
    }

    const matched = await bcrypt.compare(currentPassword, currentHash);

    if (!matched) {
      throw createHttpError(400, "Mật khẩu hiện tại không đúng");
    }

    const sameAsOld = await bcrypt.compare(newPassword, currentHash);

    if (sameAsOld) {
      throw createHttpError(400, "Mật khẩu mới không được trùng mật khẩu cũ");
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);

    await accountRepo.saveUser(user);

    return true;
  },

  async getMyPayments(userId: string): Promise<PaymentHistoryItem[]> {
    const payments = (await accountRepo.findPaymentsByUser(
      userId
    )) as PaymentEntity[];

    return payments.map((item) => ({
      id: String(item._id),
      code: String(item.paymentCode),
      amount: item.amount,
      status: item.status,
      provider: item.provider,
      createdAt: item.createdAt,
    }));
  },

  async getMyCourses(userId: string): Promise<MyCourseItem[]> {
    const [studiesRaw, ordersRaw] = await Promise.all([
      accountRepo.findStudiesByUser(userId),
      accountRepo.findCourseOrdersByUser(userId),
    ]);

    const studies = (studiesRaw as unknown[]).filter(isObject);
    const orders = (ordersRaw as unknown[]).filter(isObject);
    const orderCourseIds = orders
      .flatMap((order) => getObjectArray(order.items))
      .map((item) => asString(item.courseId))
      .filter((courseId) => courseId && isValidObjectId(courseId));

    const productsRaw = await accountRepo.findProductsByIds([
      ...new Set(orderCourseIds),
    ]);
    const productMap = new Map<string, AnyObj>();

    (productsRaw as unknown[]).filter(isObject).forEach((product) => {
      const productId = stringifyId(product);
      if (productId) productMap.set(productId, product);
    });

    const items = studies.map(mapStudyToMyCourse);
    const seenCourseIds = new Set(
      items.map((item) => item.courseId).filter(Boolean)
    );

    orders.forEach((order) => {
      getObjectArray(order.items).forEach((orderItem) => {
        const courseId = asString(orderItem.courseId);
        if (!courseId || seenCourseIds.has(courseId)) return;

        items.push(
          mapOrderCourse({
            order,
            orderItem,
            product: productMap.get(courseId),
          })
        );
        seenCourseIds.add(courseId);
      });
    });

    return items.sort((left, right) => getCourseSortTime(right) - getCourseSortTime(left));
  },
};
