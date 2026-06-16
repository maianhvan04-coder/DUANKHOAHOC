import { isValidObjectId } from "mongoose";

import {
  PaymentMethodModel,
  type PaymentMethodDocument,
  type PaymentMethodType,
} from "./payment-method.model";

type AppError = Error & { statusCode?: number };

export type PaymentMethodPayload = {
  name?: string;
  code?: string;
  type?: PaymentMethodType;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  logo?: string;
  qrImage?: string;
  description?: string;
  transferPrefix?: string;
  sortOrder?: number;
  isActive?: boolean;
};

type BankPreset = {
  bankName: string;
  name: string;
  code: string;
  logo: string;
  description: string;
  aliases: string[];
};

const bankPresets: BankPreset[] = [
  {
    bankName: "MB",
    name: "MB Bank",
    code: "MBB",
    logo: "/banks/mbbank.png",
    description: "Ngan hang Quan doi, VietQR",
    aliases: ["MB", "MBB", "MB BANK"],
  },
  {
    bankName: "VietinBank",
    name: "VietinBank",
    code: "VTB",
    logo: "/banks/vietinbank.png",
    description: "VietinBank, VietQR, Internet Banking",
    aliases: ["VIETINBANK", "VIETINNGAN HANG", "VIETINNGÂN HÀNG", "VTB"],
  },
];

const defaultPaymentMethods: PaymentMethodPayload[] = [
  {
    name: bankPresets[0].name,
    code: bankPresets[0].code,
    type: "BANK",
    bankName: bankPresets[0].bankName,
    accountNumber: "888666999",
    accountName: "Cong ty TNHH DV & PT CN Everest",
    logo: bankPresets[0].logo,
    description: bankPresets[0].description,
    transferPrefix: "EVR",
    sortOrder: 1,
    isActive: true,
  },
  {
    name: bankPresets[1].name,
    code: bankPresets[1].code,
    type: "BANK",
    bankName: bankPresets[1].bankName,
    accountNumber: "",
    accountName: "Cong ty TNHH DV & PT CN Everest",
    logo: bankPresets[1].logo,
    description: bankPresets[1].description,
    transferPrefix: "EVR",
    sortOrder: 2,
    isActive: true,
  },
];

function createError(statusCode: number, message: string): AppError {
  const error = new Error(message) as AppError;
  error.statusCode = statusCode;
  return error;
}

function normalizeCode(code: string) {
  return String(code || "").trim().toUpperCase();
}

function normalizeBankKey(value: string) {
  return String(value || "")
    .trim()
    .normalize("NFC")
    .toUpperCase();
}

function findBankPreset(payload: PaymentMethodPayload | Partial<PaymentMethodPayload>) {
  const keys = [payload.bankName, payload.code, payload.name]
    .filter(Boolean)
    .map((value) => normalizeBankKey(String(value)));

  return bankPresets.find((preset) => {
    const aliases = preset.aliases.map(normalizeBankKey);
    return keys.some((key) => aliases.includes(key));
  });
}

function assertCompletePaymentMethod(
  payload: PaymentMethodPayload | Partial<PaymentMethodPayload>
) {
  if (!payload.name || !payload.code) {
    throw createError(400, "Ten va ma phuong thuc thanh toan la bat buoc");
  }
}

function cleanPayload(
  payload: PaymentMethodPayload | Partial<PaymentMethodPayload>,
  options: { applyDefaults?: boolean } = {}
) {
  const preset = findBankPreset(payload);
  const next: Partial<PaymentMethodPayload> = {
    ...payload,
  };

  if (preset && (next.type || "BANK") === "BANK") {
    next.type = "BANK";
    next.bankName = preset.bankName;
    next.name = preset.name;
    next.code = preset.code;
    next.logo = preset.logo;
    next.description = next.description || preset.description;
  }

  if (typeof next.code === "string") next.code = normalizeCode(next.code);
  if (typeof next.transferPrefix === "string") {
    next.transferPrefix = normalizeCode(next.transferPrefix);
  }

  if (options.applyDefaults) {
    if (!next.type) next.type = "BANK";
    if (!next.transferPrefix) next.transferPrefix = "EVR";
  }

  return next;
}

async function ensureDefaultMethods() {
  await Promise.all(
    defaultPaymentMethods.map((method) => {
      const data = cleanPayload(method, { applyDefaults: true });
      assertCompletePaymentMethod(data);

      return PaymentMethodModel.updateOne(
        { code: data.code },
        { $setOnInsert: data },
        { upsert: true }
      );
    })
  );
}

function assertId(id: string) {
  if (!isValidObjectId(id)) {
    throw createError(400, "Phuong thuc thanh toan khong hop le");
  }
}

export const paymentMethodService = {
  async listActive() {
    await ensureDefaultMethods();

    const items = await PaymentMethodModel.find({ isActive: true })
      .sort({ sortOrder: 1, createdAt: 1 })
      .lean();

    return { items };
  },

  async listAdmin() {
    await ensureDefaultMethods();

    const items = await PaymentMethodModel.find()
      .sort({ sortOrder: 1, createdAt: 1 })
      .lean();

    return { items };
  },

  async create(payload: PaymentMethodPayload) {
    const data = cleanPayload(payload, { applyDefaults: true });
    assertCompletePaymentMethod(data);

    const duplicated = await PaymentMethodModel.exists({ code: data.code });
    if (duplicated) {
      throw createError(409, "Ma phuong thuc thanh toan da ton tai");
    }

    const item = await PaymentMethodModel.create(data);
    return { item };
  },

  async update(id: string, payload: Partial<PaymentMethodPayload>) {
    assertId(id);
    const data = cleanPayload(payload);

    if (data.code) {
      const duplicated = await PaymentMethodModel.exists({
        _id: { $ne: id },
        code: data.code,
      });

      if (duplicated) {
        throw createError(409, "Ma phuong thuc thanh toan da ton tai");
      }
    }

    const item = await PaymentMethodModel.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });

    if (!item) throw createError(404, "Khong tim thay phuong thuc thanh toan");
    return { item };
  },

  async remove(id: string) {
    assertId(id);
    const item = await PaymentMethodModel.findByIdAndDelete(id);
    if (!item) throw createError(404, "Khong tim thay phuong thuc thanh toan");
    return { item };
  },
};
