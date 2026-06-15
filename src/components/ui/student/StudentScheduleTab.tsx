import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import EmptyState from "../../EmptyState";
import type { StudentStudyItem } from "../../../types/student-study.type";
import {
  addDays,
  buildLessonsFromStudy,
  formatShortDate,
  formatTimeRange,
  formatWeekRange,
  getModeLabel,
  getWeekdayLabel,
  isSameDate,
  startOfWeekMonday,
} from "../../../utils/studentPortal.util";

type StudentScheduleTabProps = {
  studies: StudentStudyItem[];
};

export default function StudentScheduleTab({ studies }: StudentScheduleTabProps) {
  const [weekStart, setWeekStart] = useState(() => startOfWeekMonday(new Date()));

  const weekDates = useMemo(
    () => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)),
    [weekStart]
  );

  const lessons = useMemo(
    () =>
      studies
        .flatMap((study) => buildLessonsFromStudy(study, weekDates))
        .sort((a, b) => a.startAt.getTime() - b.startAt.getTime()),
    [studies, weekDates]
  );

  return (
    <View>
      <View className="mb-4 rounded-3xl bg-white p-4">
        <Text className="text-sm font-bold uppercase tracking-[2px] text-blue-700">
          Lịch học
        </Text>
        <View className="mt-3 flex-row items-center justify-between gap-3">
          <Pressable
            className="rounded-2xl bg-blue-50 px-4 py-3"
            onPress={() => setWeekStart((current) => addDays(current, -7))}
          >
            <Text className="font-extrabold text-blue-700">Trước</Text>
          </Pressable>

          <View className="flex-1 items-center">
            <Text className="text-xs text-slate-500">Tuần</Text>
            <Text className="mt-1 text-base font-extrabold text-slate-950">
              {formatWeekRange(weekStart)}
            </Text>
          </View>

          <Pressable
            className="rounded-2xl bg-blue-600 px-4 py-3"
            onPress={() => setWeekStart((current) => addDays(current, 7))}
          >
            <Text className="font-extrabold text-white">Sau</Text>
          </Pressable>
        </View>
      </View>

      {weekDates.map((date) => {
        const dayLessons = lessons.filter((item) => isSameDate(item.startAt, date));
        const today = isSameDate(date, new Date());

        return (
          <View
            key={date.toISOString()}
            className={[
              "mb-4 rounded-3xl border p-4",
              today ? "border-blue-300 bg-blue-50" : "border-slate-100 bg-white",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <View className="mb-3 flex-row items-center justify-between">
              <View>
                <Text className="text-lg font-extrabold text-slate-950">
                  {getWeekdayLabel(date)}
                </Text>
                <Text className="mt-1 text-sm text-slate-500">
                  {formatShortDate(date)}
                </Text>
              </View>

              {today ? (
                <Text className="rounded-full bg-blue-600 px-3 py-1 text-xs font-bold text-white">
                  Hôm nay
                </Text>
              ) : null}
            </View>

            {dayLessons.length === 0 ? (
              <EmptyState message="Không có buổi học" />
            ) : (
              dayLessons.map((lesson) => (
                <View
                  key={lesson.id}
                  className="mb-3 rounded-2xl border border-slate-100 bg-white p-4"
                >
                  <View className="mb-2 flex-row items-start justify-between gap-3">
                    <Text className="flex-1 text-base font-extrabold text-slate-950">
                      {lesson.title}
                    </Text>
                    <Text className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                      {getModeLabel(lesson.mode)}
                    </Text>
                  </View>

                  <Text className="text-sm font-bold text-blue-700">
                    {formatTimeRange(lesson.startAt, lesson.endAt)}
                  </Text>
                  <Text className="mt-1 text-sm text-slate-500">
                    Giảng viên: {lesson.teacherName}
                  </Text>
                  <Text className="mt-1 text-sm text-slate-500">
                    Phòng/link: {lesson.room}
                  </Text>
                  <Text className="mt-1 text-sm text-slate-500">
                    Lớp: {lesson.className}
                  </Text>
                </View>
              ))
            )}
          </View>
        );
      })}
    </View>
  );
}
