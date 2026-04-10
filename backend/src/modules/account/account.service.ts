import bcrypt from "bcryptjs";
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
};