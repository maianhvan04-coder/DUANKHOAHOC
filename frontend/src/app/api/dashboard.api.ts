import { http } from "@/lib/utils/http";

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

export type DashboardData = {
  overviewCards: DashboardCard[];
  statCards: DashboardStatCard[];
  enrollmentData: DashboardChartPoint[];
  revenueData: DashboardChartPoint[];
  quickRows: DashboardQuickRow[];
  quickStats: DashboardCard[];
};

export const dashboardApi = {
  async getOverview(months = 6) {
    const res = await http.get("/api/dashboard", {
      params: { months },
    });

    return res.data?.data as DashboardData;
  },
};