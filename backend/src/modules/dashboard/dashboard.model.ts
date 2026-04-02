export type DashboardQueryInput = {
  months?: number;
};

export type DashboardCard = {
  label: string;
  value: string;
};

export type DashboardStatCard = {
  key: string;
  label: string;
  value: string;
  change: string;
  positive: boolean;
};

export type DashboardChartPoint = {
  month: string;
  value: number;
};

export type DashboardQuickRow = {
  course: string;
  students: number;
  status: string;
};

export type DashboardResponse = {
  overviewCards: DashboardCard[];
  statCards: DashboardStatCard[];
  enrollmentData: DashboardChartPoint[];
  revenueData: DashboardChartPoint[];
  quickRows: DashboardQuickRow[];
  quickStats: DashboardCard[];
};

export type DashboardMonthBucket = {
  year: number;
  month: number;
  label: string;
  start: Date;
  end: Date;
};

export type DashboardMonthAggregateRow = {
  _id: {
    year: number;
    month: number;
  };
  value: number;
};

export function clampDashboardMonths(value?: number) {
  if (!value || Number.isNaN(value)) return 6;
  return Math.max(3, Math.min(12, value));
}

export function formatInteger(value: number) {
  return new Intl.NumberFormat("vi-VN").format(Number(value || 0));
}

export function formatCompactVnd(value: number) {
  const amount = Number(value || 0);

  if (amount >= 1_000_000_000) {
    const t = amount / 1_000_000_000;
    return `₫ ${t % 1 === 0 ? t.toFixed(0) : t.toFixed(1)} tỷ`;
  }

  if (amount >= 1_000_000) {
    const m = amount / 1_000_000;
    return `₫ ${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M`;
  }

  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function calcDashboardChange(current: number, previous: number) {
  const curr = Number(current || 0);
  const prev = Number(previous || 0);

  if (prev <= 0 && curr <= 0) return "0%";
  if (prev <= 0 && curr > 0) return "+100%";

  const percent = Math.round(((curr - prev) / prev) * 100);
  return `${percent >= 0 ? "+" : ""}${percent}%`;
}

export function mapCourseStatusLabel(status?: string) {
  if (status === "OPEN") return "Đang mở";
  if (status === "COMING") return "Sắp khai giảng";
  if (status === "FULL") return "Đã đầy";
  return "Tạm đóng";
}

export function mapMonthlyRows(
  rows: DashboardMonthAggregateRow[],
  buckets: DashboardMonthBucket[],
  divisor = 1
): DashboardChartPoint[] {
  const map = new Map<string, number>();

  for (const row of rows) {
    const key = `${row._id.year}-${row._id.month}`;
    map.set(key, Number(row.value || 0));
  }

  return buckets.map((bucket) => {
    const key = `${bucket.year}-${bucket.month}`;
    const rawValue = map.get(key) || 0;

    return {
      month: bucket.label,
      value: divisor > 1 ? Math.round(rawValue / divisor) : rawValue,
    };
  });
}