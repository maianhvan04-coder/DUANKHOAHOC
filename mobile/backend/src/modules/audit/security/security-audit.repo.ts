import { SecurityAuditModel, type SecurityAuditEntity } from "./security-audit.model";

type AdminQuery = {
  page: number;
  limit: number;
  keyword?: string;
  email?: string;
  path?: string;
  ipAddress?: string;
  action?: string;
  success?: boolean;
};

type MyQuery = {
  userId: string;
  page: number;
  limit: number;
  action?: string;
  success?: boolean;
};

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function createSecurityAuditRepo(payload: Partial<SecurityAuditEntity>) {
  return SecurityAuditModel.create(payload);
}

export async function getAdminSecurityAuditsRepo(query: AdminQuery) {
  const { page, limit, keyword, email, path, ipAddress, action, success } = query;

  const filter: Record<string, any> = {};

  if (keyword?.trim()) {
    const regex = new RegExp(escapeRegex(keyword.trim()), "i");
    filter.$or = [
      { userName: regex },
      { userEmail: regex },
      { path: regex },
      { ipAddress: regex },
      { method: regex },
      { action: regex },
      { message: regex },
    ];
  }

  if (email?.trim()) {
    filter.userEmail = new RegExp(escapeRegex(email.trim()), "i");
  }

  if (path?.trim()) {
    filter.path = new RegExp(escapeRegex(path.trim()), "i");
  }

  if (ipAddress?.trim()) {
    filter.ipAddress = new RegExp(escapeRegex(ipAddress.trim()), "i");
  }

  if (action?.trim()) {
    filter.action = action.trim();
  }

  if (typeof success === "boolean") {
    filter.success = success;
  }

  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    SecurityAuditModel.find(filter)
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    SecurityAuditModel.countDocuments(filter),
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}

export async function getMySecurityAuditsRepo(query: MyQuery) {
  const { userId, page, limit, action, success } = query;

  const filter: Record<string, any> = {
    user: userId,
  };

  if (action?.trim()) {
    filter.action = action.trim();
  }

  if (typeof success === "boolean") {
    filter.success = success;
  }

  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    SecurityAuditModel.find(filter)
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    SecurityAuditModel.countDocuments(filter),
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}