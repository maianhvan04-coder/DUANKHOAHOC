import type { Request, Response, NextFunction } from "express";
import {
  createCheckoutSession,
  findUserOrderByPaymentCode,
  markOrderFailed,
  markOrderPaid,
} from "./payment.service";
import { normalizeVnpayQuery, verifyVnpayParams } from "./vnpay.service";

function getUserId(req: Request) {
  const user: any = (req as any).user;
  return String(user?.id || user?._id || "");
}

function getFrontendBaseUrl() {
  const value =
    process.env.FRONTEND_URL?.trim() ||
    process.env.APP_URL?.trim() ||
    process.env.CORS_ORIGIN?.trim() ||
    "http://localhost:3000";

  if (!/^https?:\/\//i.test(value)) {
    throw new Error(`URL frontend không hợp lệ: ${value}`);
  }

  return value.replace(/\/+$/, "");
}

function getRedirectUrl(
  path: string,
  query: Record<string, string | number | boolean | undefined>
) {
  const baseUrl = getFrontendBaseUrl();
  const url = new URL(path, baseUrl);

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });

  return url.toString();
}

export async function createCheckoutSessionController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const provider = req.body?.provider ?? "vnpay";

    if (provider !== "vnpay") {
      return res.status(400).json({ message: "Chỉ hỗ trợ VNPAY" });
    }

    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const result = await createCheckoutSession({
      userId,
      provider: "vnpay",
      ipAddr: req.ip,
    });

    return res.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
}

export async function getMyOrderStatusController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = getUserId(req);
    const paymentCode = Number(req.params.paymentCode);

    if (!paymentCode) {
      return res.status(400).json({ message: "paymentCode không hợp lệ" });
    }

    const order = await findUserOrderByPaymentCode(paymentCode, userId);
    if (!order) {
      return res.status(404).json({ message: "Không tìm thấy đơn thanh toán" });
    }

    return res.json({
      ok: true,
      item: order,
    });
  } catch (error) {
    next(error);
  }
}

export async function vnpayIpnController(req: Request, res: Response) {
  try {
    const valid = verifyVnpayParams(req.query as Record<string, unknown>);
    if (!valid) {
      return res
        .status(200)
        .json({ RspCode: "97", Message: "Invalid checksum" });
    }

    const query = normalizeVnpayQuery(req.query as Record<string, unknown>);
    const paymentCode = Number(query.vnp_TxnRef);
    const amount = Number(query.vnp_Amount || 0) / 100;

    const success =
      query.vnp_ResponseCode === "00" &&
      (query.vnp_TransactionStatus === "00" || !query.vnp_TransactionStatus);

    if (!paymentCode) {
      return res
        .status(200)
        .json({ RspCode: "01", Message: "Order not found" });
    }

    if (success) {
      await markOrderPaid({
        paymentCode,
        provider: "vnpay",
        gatewayTransactionNo: query.vnp_TransactionNo || "",
        gatewayPayload: query,
      });

      return res
        .status(200)
        .json({ RspCode: "00", Message: "Confirm Success" });
    }

    if (amount >= 0) {
      await markOrderFailed(paymentCode, "vnpay", query);
    }

    return res
      .status(200)
      .json({ RspCode: "00", Message: "Confirm Success" });
  } catch (error) {
    console.error("VNPAY IPN ERROR =", error);
    return res.status(200).json({ RspCode: "99", Message: "Unknown error" });
  }
}

export async function vnpayReturnController(req: Request, res: Response) {
  try {
    console.log("VNPAY RETURN QUERY =", req.query);
    console.log("FRONTEND_URL =", process.env.FRONTEND_URL);
    console.log("APP_URL =", process.env.APP_URL);
    console.log("CORS_ORIGIN =", process.env.CORS_ORIGIN);

    const query = normalizeVnpayQuery(req.query as Record<string, unknown>);
    const valid = verifyVnpayParams(req.query as Record<string, unknown>);

    const success =
      valid &&
      query.vnp_ResponseCode === "00" &&
      (query.vnp_TransactionStatus === "00" || !query.vnp_TransactionStatus);

    const redirectUrl = getRedirectUrl("/checkout/result", {
      provider: "vnpay",
      paymentCode: query.vnp_TxnRef || "",
      code: query.vnp_ResponseCode || "",
      transactionStatus: query.vnp_TransactionStatus || "",
      valid: valid ? 1 : 0,
      success: success ? 1 : 0,
      transactionNo: query.vnp_TransactionNo || "",
      bankCode: query.vnp_BankCode || "",
      amount: query.vnp_Amount ? Number(query.vnp_Amount) / 100 : 0,
    });

    console.log("VNPAY RETURN REDIRECT =", redirectUrl);
    return res.redirect(302, redirectUrl);
  } catch (error) {
    console.error("VNPAY RETURN ERROR =", error);
    return res.status(500).json({
      message: error instanceof Error ? error.message : "Internal server error",
    });
  }
}