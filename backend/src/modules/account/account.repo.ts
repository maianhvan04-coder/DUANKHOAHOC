import { UserModel } from "../user/user.model";
import { PaymentOrderModel } from "../payment/payment.model";

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
};