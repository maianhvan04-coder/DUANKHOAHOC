import crypto from "crypto";
import qs from "qs";

type VnpParams = Record<string, string>;

function getRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Thiếu biến môi trường ${name}`);
  }
  return value;
}

function maskSecret(secret: string): string {
  if (!secret) return "";
  if (secret.length <= 8) return "*".repeat(secret.length);
  return `${secret.slice(0, 4)}${"*".repeat(secret.length - 8)}${secret.slice(-4)}`;
}

function getDateInGmt7(baseDate = new Date()): Date {
  const utc = baseDate.getTime() + baseDate.getTimezoneOffset() * 60 * 1000;
  return new Date(utc + 7 * 60 * 60 * 1000);
}

function formatVnpayDate(date: Date): string {
  const yyyy = date.getFullYear();
  const MM = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const HH = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");

  return `${yyyy}${MM}${dd}${HH}${mm}${ss}`;
}

/**
 * Giữ đúng flow theo demo VNPAY:
 * - sort key tăng dần
 * - encode value
 * - khoảng trắng đổi thành +
 */
function sortObject(input: VnpParams): VnpParams {
  const sorted: VnpParams = {};
  const keys = Object.keys(input)
    .map((key) => encodeURIComponent(key))
    .sort();

  for (const encodedKey of keys) {
    const originalKey = decodeURIComponent(encodedKey);
    sorted[encodedKey] = encodeURIComponent(input[originalKey]).replace(/%20/g, "+");
  }

  return sorted;
}

function toStringRecord(input: Record<string, unknown>): VnpParams {
  return Object.keys(input).reduce<VnpParams>((acc, key) => {
    const value = input[key];
    if (value === undefined || value === null) return acc;

    acc[key] = Array.isArray(value) ? String(value[0] ?? "") : String(value);
    return acc;
  }, {});
}

function buildSignData(params: VnpParams): string {
  const sorted = sortObject(params);
  return qs.stringify(sorted, { encode: false });
}

function signVnpay(params: VnpParams): string {
  const secretKey = getRequiredEnv("VNPAY_HASH_SECRET");
  const signData = buildSignData(params);

  return crypto
    .createHmac("sha512", secretKey)
    .update(Buffer.from(signData, "utf-8"))
    .digest("hex");
}

export function normalizeIp(ip?: string | null): string {
  if (!ip) return "127.0.0.1";
  if (ip === "::1") return "127.0.0.1";
  if (ip.startsWith("::ffff:")) return ip.replace("::ffff:", "");
  return ip;
}

export function createVnpayCheckout(params: {
  paymentCode: number | string;
  amount: number;
  ipAddr?: string;
  bankCode?: string;
}) {
  const tmnCode = getRequiredEnv("VNPAY_TMN_CODE");
  const secretKey = getRequiredEnv("VNPAY_HASH_SECRET");
  const payUrl = getRequiredEnv("VNPAY_PAY_URL");
  const publicApiUrl = getRequiredEnv("PUBLIC_API_URL").replace(/\/+$/, "");

  if (!Number.isFinite(params.amount) || params.amount <= 0) {
    throw new Error("Số tiền thanh toán không hợp lệ");
  }

  const now = getDateInGmt7();
  const expiredAt = new Date(now.getTime() + 15 * 60 * 1000);

  const vnpParams: VnpParams = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode: tmnCode,
    vnp_Locale: "vn",
    vnp_CurrCode: "VND",
    vnp_TxnRef: String(params.paymentCode),
    vnp_OrderInfo: `Thanh toan don hang ${params.paymentCode}`,
    vnp_OrderType: "other",
    vnp_Amount: String(Math.round(params.amount) * 100),
    vnp_ReturnUrl: `${publicApiUrl}/api/payments/vnpay/return`,
    vnp_IpAddr: normalizeIp(params.ipAddr),
    vnp_CreateDate: formatVnpayDate(now),
    vnp_ExpireDate: formatVnpayDate(expiredAt),
  };

  if (params.bankCode?.trim()) {
    vnpParams.vnp_BankCode = params.bankCode.trim();
  }

  const sorted = sortObject(vnpParams);
  const signData = qs.stringify(sorted, { encode: false });
  const secureHash = crypto
    .createHmac("sha512", secretKey)
    .update(Buffer.from(signData, "utf-8"))
    .digest("hex");

  const checkoutUrl =
    `${payUrl}?` +
    qs.stringify(
      {
        ...sorted,
        vnp_SecureHash: secureHash,
      },
      { encode: false }
    );

  console.log("VNPAY TMN =", JSON.stringify(tmnCode));
  console.log("VNPAY SECRET =", JSON.stringify(maskSecret(secretKey)));
  console.log("VNPAY PAY URL =", JSON.stringify(payUrl));
  console.log("PUBLIC_API_URL =", JSON.stringify(publicApiUrl));
  console.log("VNPAY RETURN URL =", JSON.stringify(vnpParams.vnp_ReturnUrl));
  console.log("VNPAY RAW PARAMS =", vnpParams);
  console.log("VNPAY SORTED PARAMS =", sorted);
  console.log("VNPAY SIGN DATA =", signData);
  console.log("VNPAY SECURE HASH =", secureHash);
  console.log("VNPAY checkoutUrl =", checkoutUrl);

  return {
    checkoutUrl,
    raw: {
      ...vnpParams,
      vnp_SecureHash: secureHash,
    },
  };
}

export function verifyVnpayParams(query: Record<string, unknown>): boolean {
  const params = toStringRecord(query);
  const receivedSecureHash = params.vnp_SecureHash;

  if (!receivedSecureHash) {
    return false;
  }

  delete params.vnp_SecureHash;
  delete params.vnp_SecureHashType;

  const signData = buildSignData(params);
  const expectedSecureHash = signVnpay(params);

  console.log("VNPAY VERIFY PARAMS =", params);
  console.log("VNPAY VERIFY SIGN DATA =", signData);
  console.log("VNPAY VERIFY RECEIVED HASH =", receivedSecureHash);
  console.log("VNPAY VERIFY EXPECTED HASH =", expectedSecureHash);

  return receivedSecureHash === expectedSecureHash;
}

export function normalizeVnpayQuery(query: Record<string, unknown>): VnpParams {
  return toStringRecord(query);
}