import { ProductModel } from "../course/course.model";
import { TeacherModel } from "../teacher/teacher.model";
import { StudentModel } from "../student/student.model";
import { StudentStudyModel } from "../student/student-study.model";
import { UserModel } from "../user/user.model";
import { PaymentOrderModel } from "../payment/payment.model";

import type {
  DashboardMonthAggregateRow,
  DashboardMonthBucket,
} from "./dashboard.model";

export function buildDashboardMonthBuckets(months: number): DashboardMonthBucket[] {
  const now = new Date();
  const firstDayCurrentMonth = new Date(
    now.getFullYear(),
    now.getMonth(),
    1,
    0,
    0,
    0,
    0
  );

  const buckets: DashboardMonthBucket[] = [];

  for (let i = months - 1; i >= 0; i--) {
    const start = new Date(
      firstDayCurrentMonth.getFullYear(),
      firstDayCurrentMonth.getMonth() - i,
      1,
      0,
      0,
      0,
      0
    );

    const end = new Date(
      start.getFullYear(),
      start.getMonth() + 1,
      1,
      0,
      0,
      0,
      0
    );

    buckets.push({
      year: start.getFullYear(),
      month: start.getMonth() + 1,
      label: `T${start.getMonth() + 1}`,
      start,
      end,
    });
  }

  return buckets;
}

export function getCurrentMonthRange() {
  const now = new Date();

  return {
    start: new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0),
    end: new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0),
  };
}

export function getPreviousMonthRange() {
  const now = new Date();

  return {
    start: new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0),
    end: new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0),
  };
}

export async function countActiveCoursesRepo() {
  return ProductModel.countDocuments({
    isDeleted: false,
    isActive: true,
  });
}

export async function countAllCoursesRepo() {
  return ProductModel.countDocuments({
    isDeleted: false,
  });
}

export async function countActiveTeachersRepo() {
  return TeacherModel.countDocuments({
    isDeleted: false,
    isActive: true,
  });
}

export async function countAllTeachersRepo() {
  return TeacherModel.countDocuments({
    isDeleted: false,
  });
}

export async function countStudentsRepo() {
  return StudentModel.countDocuments({
    isDeleted: false,
  });
}

export async function countStudentsCreatedInRangeRepo(start: Date, end: Date) {
  return StudentModel.countDocuments({
    isDeleted: false,
    createdAt: { $gte: start, $lt: end },
  });
}

export async function countTeachersCreatedInRangeRepo(start: Date, end: Date) {
  return TeacherModel.countDocuments({
    isDeleted: false,
    createdAt: { $gte: start, $lt: end },
  });
}

export async function countCoursesCreatedInRangeRepo(start: Date, end: Date) {
  return ProductModel.countDocuments({
    isDeleted: false,
    createdAt: { $gte: start, $lt: end },
  });
}

export async function countPendingOrdersRepo() {
  return PaymentOrderModel.countDocuments({
    status: "PENDING",
  });
}

export async function sumPendingRevenueRepo() {
  const rows = await PaymentOrderModel.aggregate([
    {
      $match: {
        status: "PENDING",
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: "$amount" },
      },
    },
  ]);

  return Number(rows?.[0]?.total || 0);
}

export async function sumRevenueInRangeRepo(start: Date, end: Date) {
  const rows = await PaymentOrderModel.aggregate([
    {
      $match: {
        status: "PAID",
        paidAt: { $gte: start, $lt: end },
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: "$amount" },
      },
    },
  ]);

  return Number(rows?.[0]?.total || 0);
}

export async function sumTotalRevenueRepo() {
  const rows = await PaymentOrderModel.aggregate([
    {
      $match: {
        status: "PAID",
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: "$amount" },
      },
    },
  ]);

  return Number(rows?.[0]?.total || 0);
}

export async function countRunningClassesRepo() {
  const rows = await StudentStudyModel.aggregate([
    {
      $match: {
        isActive: true,
        status: { $in: ["ENROLLED", "STUDYING"] },
      },
    },
    {
      $group: {
        _id: {
          course: "$course",
          className: "$className",
        },
      },
    },
    {
      $count: "total",
    },
  ]);

  return Number(rows?.[0]?.total || 0);
}

export async function getEnrollmentSeriesRepo(
  startDate: Date
): Promise<DashboardMonthAggregateRow[]> {
  const rows = await StudentStudyModel.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
        },
        value: { $sum: 1 },
      },
    },
    {
      $sort: {
        "_id.year": 1,
        "_id.month": 1,
      },
    },
  ]);

  return rows as DashboardMonthAggregateRow[];
}

export async function getRevenueSeriesRepo(
  startDate: Date
): Promise<DashboardMonthAggregateRow[]> {
  const rows = await PaymentOrderModel.aggregate([
    {
      $match: {
        status: "PAID",
        paidAt: { $gte: startDate, $ne: null },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: "$paidAt" },
          month: { $month: "$paidAt" },
        },
        value: { $sum: "$amount" },
      },
    },
    {
      $sort: {
        "_id.year": 1,
        "_id.month": 1,
      },
    },
  ]);

  return rows as DashboardMonthAggregateRow[];
}

export async function getTopCoursesRepo(limit = 4) {
  const rows = await StudentStudyModel.aggregate([
    {
      $match: {
        isActive: true,
      },
    },
    {
      $group: {
        _id: "$course",
        students: { $sum: 1 },
      },
    },
    {
      $sort: {
        students: -1,
      },
    },
    {
      $limit: limit,
    },
  ]);

  const courseIds = rows.map((row) => row._id).filter(Boolean);

  const products = await ProductModel.find(
    { _id: { $in: courseIds } },
    { title: 1, status: 1 }
  ).lean();

  const productMap = new Map(
    products.map((item: any) => [String(item._id), item])
  );

  return rows.map((row) => {
    const product = productMap.get(String(row._id));

    return {
      course: product?.title || "Khóa học không xác định",
      students: Number(row.students || 0),
      status: product?.status || "",
    };
  });
}
