import { Text, View } from "react-native";
import EmptyState from "../../EmptyState";
import StatCard from "../../StatCard";
import type { User } from "../../../types/auth.type";
import type { NotificationItem } from "../../../types/notification.type";
import type { StudentStudyItem } from "../../../types/student-study.type";
import {
  formatScore,
  getClassName,
  getCourseTitle,
  getRoom,
  getScheduleText,
  getTeacherName,
  STUDY_STATUS_LABELS,
} from "../../../utils/studentPortal.util";

type StudentFeedTabProps = {
  user: User;
  studies: StudentStudyItem[];
  notifications: NotificationItem[];
  unreadCount: number;
};

export default function StudentFeedTab({
  user,
  studies,
  notifications,
  unreadCount,
}: StudentFeedTabProps) {
  const studyingCount = studies.filter((item) =>
    ["ENROLLED", "STUDYING"].includes(item.status)
  ).length;
  const averageScore =
    studies.length > 0
      ? studies.reduce((total, item) => total + Number(item.finalAverage || 0), 0) /
        studies.length
      : 0;

  return (
    <View>
      <View className="mb-4 rounded-3xl bg-blue-700 p-5">
        <Text className="text-sm font-bold uppercase tracking-[2px] text-blue-100">
          Bảng tin học viên
        </Text>
        <Text className="mt-2 text-2xl font-extrabold text-white">
          Xin chào, {user.name || "Học viên"}
        </Text>
        <Text className="mt-2 text-sm leading-5 text-blue-100">
          Theo dõi lớp học hiện tại, lịch học gần nhất và thông báo từ trung
          tâm.
        </Text>
      </View>

      <View className="mb-4 flex-row gap-3">
        <StatCard value={studies.length} label="Lớp học" />
        <StatCard value={studyingCount} label="Đang học" />
        <StatCard value={formatScore(averageScore)} label="Điểm TB" />
      </View>

      <View className="mb-4 rounded-3xl bg-white p-4">
        <View className="mb-3 flex-row items-center justify-between">
          <Text className="text-lg font-extrabold text-slate-950">
            Lớp học hiện tại
          </Text>
          <Text className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
            {studies.length} lớp
          </Text>
        </View>

        {studies.length === 0 ? (
          <EmptyState message="Chưa có lớp học nào" />
        ) : (
          studies.map((study) => (
            <View
              key={study._id}
              className="mb-3 rounded-2xl border border-slate-100 bg-slate-50 p-4"
            >
              <View className="mb-2 flex-row items-start justify-between gap-3">
                <View className="flex-1">
                  <Text className="text-base font-extrabold text-slate-950">
                    {getCourseTitle(study)}
                  </Text>
                  <Text className="mt-1 text-xs text-slate-500">
                    {getClassName(study)}
                  </Text>
                </View>

                <Text className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                  {STUDY_STATUS_LABELS[study.status] ?? study.status}
                </Text>
              </View>

              <Text className="text-sm font-semibold text-slate-700">
                {getScheduleText(study)}
              </Text>
              <Text className="mt-1 text-sm text-slate-500">{getRoom(study)}</Text>
              <Text className="mt-1 text-sm text-slate-500">
                Giảng viên: {getTeacherName(study)}
              </Text>

              <View className="mt-3 flex-row gap-2">
                <View className="flex-1 rounded-2xl bg-white p-3">
                  <Text className="text-xs text-slate-500">Tiến độ</Text>
                  <Text className="mt-1 text-lg font-extrabold text-blue-700">
                    {Number(study.progressPercent || 0).toFixed(0)}%
                  </Text>
                </View>
                <View className="flex-1 rounded-2xl bg-white p-3">
                  <Text className="text-xs text-slate-500">Điểm TB</Text>
                  <Text className="mt-1 text-lg font-extrabold text-slate-950">
                    {formatScore(study.finalAverage)}
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}
      </View>

      <View className="rounded-3xl bg-white p-4">
        <View className="mb-3 flex-row items-center justify-between">
          <Text className="text-lg font-extrabold text-slate-950">
            Thông báo mới
          </Text>
          <Text className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
            {unreadCount} chưa đọc
          </Text>
        </View>

        {notifications.length === 0 ? (
          <EmptyState message="Chưa có thông báo mới" />
        ) : (
          notifications.map((item) => (
            <View
              key={item._id}
              className="mb-3 rounded-2xl border border-slate-100 bg-slate-50 p-4"
            >
              <Text className="text-base font-extrabold text-slate-950">
                {item.title}
              </Text>
              <Text className="mt-2 text-sm leading-5 text-slate-500">
                {item.message}
              </Text>
              <Text className="mt-2 text-xs font-bold text-blue-700">
                {item.isRead ? "Đã đọc" : "Chưa đọc"}
              </Text>
            </View>
          ))
        )}
      </View>
    </View>
  );
}
