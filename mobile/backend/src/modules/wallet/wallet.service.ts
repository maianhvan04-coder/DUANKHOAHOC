import { isValidObjectId, Types } from "mongoose";

import { ClassRoomModel } from "../classroom/classroom.model";
import { ProductModel } from "../course/course.model";
import { StudentStudyModel } from "../student/student-study.model";
import { studentStudyService } from "../student/service/student-study.service";
import { UserModel } from "../user/user.model";
import { WalletModel, WalletTransactionModel } from "./wallet.model";

type AppError = Error & { statusCode?: number };
type StudyMode = "ONLINE" | "OFFLINE";

function createError(statusCode: number, message: string): AppError {
  const error = new Error(message) as AppError;
  error.statusCode = statusCode;
  return error;
}

function toObjectId(id: string, message: string) {
  if (!isValidObjectId(id)) throw createError(400, message);
  return new Types.ObjectId(id);
}

async function ensureWallet(userId: string) {
  const user = toObjectId(userId, "Tài khoản không hợp lệ");
  const wallet = await WalletModel.findOneAndUpdate(
    { user },
    { $setOnInsert: { user, balance: 0 } },
    { new: true, upsert: true }
  );

  return wallet;
}

async function ensureStudentAccount(userId: string) {
  const user = await UserModel.findById(userId).select("role deletedAt active");

  if (!user || user.deletedAt) {
    throw createError(404, "Không tìm thấy tài khoản học viên");
  }

  if (user.role !== "STUDENT") {
    throw createError(403, "Tài khoản cần là học viên để đăng ký khóa học");
  }

  if (user.active === false) {
    throw createError(403, "Tài khoản học viên đang bị khóa");
  }
}

async function findEnrollClass(courseId: string, mode: StudyMode) {
  return ClassRoomModel.findOne({
    course: toObjectId(courseId, "Khóa học không hợp lệ"),
    mode,
    isActive: true,
    isDeleted: false,
  }).sort({ createdAt: -1 });
}

async function ensureCanEnroll(params: {
  userId: string;
  courseId: string;
  mode: StudyMode;
}) {
  await ensureStudentAccount(params.userId);

  const course = await ProductModel.findOne({
    _id: toObjectId(params.courseId, "Khóa học không hợp lệ"),
    isDeleted: false,
  });

  if (!course) throw createError(404, "Không tìm thấy khóa học");
  if (course.isActive === false) throw createError(400, "Khóa học đang tạm ẩn");
  if (course.status !== "OPEN") throw createError(400, "Khóa học chưa mở đăng ký");

  if (!course.modes?.includes(params.mode)) {
    throw createError(400, "Khóa học không hỗ trợ hình thức học đã chọn");
  }

  const classRoom = await findEnrollClass(params.courseId, params.mode);

  if (!classRoom) {
    throw createError(404, "Chưa có lớp phù hợp với hình thức học đã chọn");
  }

  const duplicate = await StudentStudyModel.findOne({
    student: toObjectId(params.userId, "Tài khoản không hợp lệ"),
    course: course._id,
    isActive: true,
    status: { $ne: "DROPPED" },
  }).lean();

  if (duplicate) {
    throw createError(409, "Bạn đã đăng ký khóa học này");
  }

  if (Number(classRoom.maxStudents || 0) > 0) {
    const currentStudents = await StudentStudyModel.countDocuments({
      classRoom: classRoom._id,
      isActive: true,
      status: { $ne: "DROPPED" },
    });

    if (currentStudents >= Number(classRoom.maxStudents || 0)) {
      throw createError(400, "Lớp học đã đủ học viên");
    }
  }

  return {
    course,
    classRoom,
    price: Number(course.price || 0),
  };
}

export const walletService = {
  async getMyWallet(userId: string) {
    const wallet = await ensureWallet(userId);
    const transactions = await WalletTransactionModel.find({
      user: wallet.user,
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    return {
      balance: Number(wallet.balance || 0),
      transactions,
    };
  },

  async topup(userId: string, amount: number) {
    const safeAmount = Math.trunc(Number(amount || 0));

    if (!Number.isFinite(safeAmount) || safeAmount <= 0) {
      throw createError(400, "Số tiền nạp không hợp lệ");
    }

    const wallet = await ensureWallet(userId);
    const balanceBefore = Number(wallet.balance || 0);
    wallet.balance = balanceBefore + safeAmount;
    await wallet.save();

    await WalletTransactionModel.create({
      user: wallet.user,
      type: "TOPUP",
      amount: safeAmount,
      balanceBefore,
      balanceAfter: wallet.balance,
      note: "Nạp tiền vào ví học tập",
    });

    return {
      balance: Number(wallet.balance || 0),
    };
  },

  async enroll(userId: string, payload: { courseId: string; mode: StudyMode }) {
    const mode = payload.mode === "OFFLINE" ? "OFFLINE" : "ONLINE";
    const { course, classRoom, price } = await ensureCanEnroll({
      userId,
      courseId: payload.courseId,
      mode,
    });

    const wallet = await ensureWallet(userId);
    const balanceBefore = Number(wallet.balance || 0);

    if (balanceBefore < price) {
      throw createError(402, "Số dư không đủ để đăng ký khóa học");
    }

    wallet.balance = balanceBefore - price;
    await wallet.save();

    try {
      const study = await studentStudyService.create({
        student: userId,
        classRoom: String(classRoom._id),
        status: "ENROLLED",
        isActive: true,
      });

      await WalletTransactionModel.create({
        user: wallet.user,
        type: "ENROLL",
        amount: price,
        balanceBefore,
        balanceAfter: wallet.balance,
        course: course._id,
        classRoom: classRoom._id,
        mode,
        note: `Đăng ký khóa học: ${course.title}`,
      });

      return {
        balance: Number(wallet.balance || 0),
        item: study,
      };
    } catch (error) {
      const refundBefore = Number(wallet.balance || 0);
      wallet.balance = refundBefore + price;
      await wallet.save();

      await WalletTransactionModel.create({
        user: wallet.user,
        type: "REFUND",
        amount: price,
        balanceBefore: refundBefore,
        balanceAfter: wallet.balance,
        course: course._id,
        classRoom: classRoom._id,
        mode,
        note: "Hoàn tiền do đăng ký thất bại",
      });

      throw error;
    }
  },
};
