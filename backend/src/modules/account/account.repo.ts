import { UserModel } from "../user/user.model";
import { PaymentOrderModel } from "../payment/payment.model";
import { ProductModel } from "../course/course.model";
import { StudentStudyModel } from "../student/student-study.model";

const teacherPopulate = {
  path: "teacher",
  select: "user specialty avatar",
  populate: {
    path: "user",
    select: "name email",
  },
};

const coursePopulate = {
  path: "course",
  select: "title slug teacher teacherName image level modes status durationText price",
};

const classRoomPopulate = {
  path: "classRoom",
  select: "course teacher className mode scheduleText room startedAt endedAt",
};

export const accountRepo = {
  findUserById(userId: string) {
    return UserModel.findById(userId);
  },

  findUserByIdLean(userId: string) {
    return UserModel.findById(userId).lean();
  },

  findUserByIdWithPassword(userId: string) {
    return UserModel.findById(userId).select("+password");
  },

  saveUser(user: any) {
    return user.save();
  },

  findPaymentsByUser(userId: string) {
    return PaymentOrderModel.find({ user: userId })
      .sort({ createdAt: -1 })
      .select("_id paymentCode amount status provider createdAt")
      .lean();
  },

  findStudiesByUser(userId: string) {
    return StudentStudyModel.find({ student: userId, isActive: true })
      .sort({ createdAt: -1 })
      .populate(coursePopulate)
      .populate(teacherPopulate)
      .populate(classRoomPopulate)
      .lean();
  },

  findCourseOrdersByUser(userId: string) {
    return PaymentOrderModel.find({
      user: userId,
      status: { $in: ["PENDING", "PAID"] },
    })
      .sort({ createdAt: -1 })
      .select("_id paymentCode status items createdAt paidAt")
      .lean();
  },

  findProductsByIds(courseIds: string[]) {
    return ProductModel.find({ _id: { $in: courseIds } })
      .select("_id title slug teacherName modes durationText status")
      .lean();
  },
};
