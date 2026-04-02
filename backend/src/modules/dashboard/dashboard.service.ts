import type {
  DashboardQueryInput,
  DashboardResponse,
} from "./dashboard.model";
import {
  calcDashboardChange,
  clampDashboardMonths,
  formatCompactVnd,
  formatInteger,
  mapCourseStatusLabel,
  mapMonthlyRows,
} from "./dashboard.model";
import {
  buildDashboardMonthBuckets,
  countActiveCoursesRepo,
  countActiveTeachersRepo,
  countAllCoursesRepo,
  countAllTeachersRepo,
  countCoursesCreatedInRangeRepo,
  countPendingOrdersRepo,
  countRunningClassesRepo,
  countStudentsCreatedInRangeRepo,
  countStudentsRepo,
  countTeachersCreatedInRangeRepo,
  getCurrentMonthRange,
  getEnrollmentSeriesRepo,
  getPreviousMonthRange,
  getRevenueSeriesRepo,
  getTopCoursesRepo,
  sumPendingRevenueRepo,
  sumRevenueInRangeRepo,
  sumTotalRevenueRepo,
} from "./dashboard.repo";

export async function getDashboardService(
  query: DashboardQueryInput = {}
): Promise<DashboardResponse> {
  const months = clampDashboardMonths(query.months);
  const buckets = buildDashboardMonthBuckets(months);
  const firstBucketStart = buckets[0].start;

  const thisMonth = getCurrentMonthRange();
  const prevMonth = getPreviousMonthRange();

  const [
    activeCourses,
    runningClasses,
    activeTeachers,
    pendingOrders,
    pendingRevenue,
    totalStudents,
    totalTeachers,
    totalCourses,
    totalRevenue,
    studentsThisMonth,
    studentsPrevMonth,
    teachersThisMonth,
    teachersPrevMonth,
    coursesThisMonth,
    coursesPrevMonth,
    revenueThisMonth,
    revenuePrevMonth,
    enrollmentRows,
    revenueRows,
    topCourses,
  ] = await Promise.all([
    countActiveCoursesRepo(),
    countRunningClassesRepo(),
    countActiveTeachersRepo(),
    countPendingOrdersRepo(),
    sumPendingRevenueRepo(),
    countStudentsRepo(),
    countAllTeachersRepo(),
    countAllCoursesRepo(),
    sumTotalRevenueRepo(),
    countStudentsCreatedInRangeRepo(thisMonth.start, thisMonth.end),
    countStudentsCreatedInRangeRepo(prevMonth.start, prevMonth.end),
    countTeachersCreatedInRangeRepo(thisMonth.start, thisMonth.end),
    countTeachersCreatedInRangeRepo(prevMonth.start, prevMonth.end),
    countCoursesCreatedInRangeRepo(thisMonth.start, thisMonth.end),
    countCoursesCreatedInRangeRepo(prevMonth.start, prevMonth.end),
    sumRevenueInRangeRepo(thisMonth.start, thisMonth.end),
    sumRevenueInRangeRepo(prevMonth.start, prevMonth.end),
    getEnrollmentSeriesRepo(firstBucketStart),
    getRevenueSeriesRepo(firstBucketStart),
    getTopCoursesRepo(4),
  ]);

  return {
    overviewCards: [
      {
        label: "Khóa học hoạt động",
        value: formatInteger(activeCourses),
      },
      {
        label: "Lớp hôm nay",
        value: formatInteger(runningClasses),
      },
      {
        label: "Giảng viên online",
        value: formatInteger(activeTeachers),
      },
      {
        label: "Yêu cầu mới",
        value: formatInteger(pendingOrders),
      },
    ],
    statCards: [
      {
        key: "students",
        label: "Tổng học viên",
        value: formatInteger(totalStudents),
        change: calcDashboardChange(studentsThisMonth, studentsPrevMonth),
        positive: studentsThisMonth >= studentsPrevMonth,
      },
      {
        key: "teachers",
        label: "Giảng viên",
        value: formatInteger(totalTeachers),
        change: calcDashboardChange(teachersThisMonth, teachersPrevMonth),
        positive: teachersThisMonth >= teachersPrevMonth,
      },
      {
        key: "courses",
        label: "Khóa học",
        value: formatInteger(totalCourses),
        change: calcDashboardChange(coursesThisMonth, coursesPrevMonth),
        positive: coursesThisMonth >= coursesPrevMonth,
      },
      {
        key: "revenue",
        label: "Doanh thu",
        value: formatCompactVnd(totalRevenue),
        change: calcDashboardChange(revenueThisMonth, revenuePrevMonth),
        positive: revenueThisMonth >= revenuePrevMonth,
      },
    ],
    enrollmentData: mapMonthlyRows(enrollmentRows, buckets, 1),
    revenueData: mapMonthlyRows(revenueRows, buckets, 1_000_000),
    quickRows: topCourses.map((item) => ({
      course: item.course,
      students: item.students,
      status: mapCourseStatusLabel(item.status),
    })),
    quickStats: [
      {
        label: "Lớp đang chạy",
        value: formatInteger(runningClasses),
      },
      {
        label: "Yêu cầu mới",
        value: formatInteger(pendingOrders),
      },
      {
        label: "Giảng viên online",
        value: formatInteger(activeTeachers),
      },
      {
        label: "Học phí chờ",
        value: formatCompactVnd(pendingRevenue),
      },
    ],
  };
}