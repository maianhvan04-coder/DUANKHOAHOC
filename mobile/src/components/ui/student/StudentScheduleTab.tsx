import { useMemo, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { StudentStudyItem } from "../../../types/student-study.type";
import {
  addDays,
  buildLessonsFromStudy,
  formatShortDate,
  formatTimeRange,
  formatWeekRange,
  isSameDate,
  startOfWeekMonday,
} from "../../../utils/studentPortal.util";
import { studentScheduleStyles as styles } from "./styles";

type StudentScheduleTabProps = {
  studies: StudentStudyItem[];
};

export default function StudentScheduleTab({ studies }: StudentScheduleTabProps) {
  const [weekStart, setWeekStart] = useState(() =>
    startOfWeekMonday(new Date())
  );

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
    <View style={styles.root}>
      <WeekPicker weekStart={weekStart} setWeekStart={setWeekStart} />

      <View style={styles.timelineWrap}>
        {weekDates.map((date, dayIndex) => {
          const dayLessons = lessons.filter((lesson) =>
            isSameDate(lesson.startAt, date)
          );

          const today = isSameDate(date, new Date());
          const lastDay = dayIndex === weekDates.length - 1;

          return (
            <View key={date.toISOString()} style={styles.timelineRow}>
              <View style={styles.dayCol}>
                <Text style={[styles.dayText, today && styles.todayDayText]}>
                  {getVietnameseWeekday(date)}
                </Text>

                <Text style={[styles.dateText, today && styles.todayDateText]}>
                  {formatShortDate(date)}
                </Text>
              </View>

              <View style={styles.lineCol}>
                {!lastDay ? <View style={styles.verticalLine} /> : null}

                <View
                  style={[
                    styles.iconOuter,
                    today && styles.todayIconOuter,
                  ]}
                >
                  <Ionicons
                    name="arrow-forward"
                    size={10}
                    color={today ? "#FFFFFF" : "#0EA5E9"}
                  />
                </View>
              </View>

              <View style={styles.cardCol}>
                {dayLessons.length === 0 ? (
                  <View
                    style={[
                      styles.lessonCard,
                      today ? styles.todayCard : styles.emptyLessonCard,
                    ]}
                  >
                    <Text
                      style={[
                        styles.emptyLessonText,
                        today && styles.todayEmptyLessonText,
                      ]}
                    >
                      Không có lịch học
                    </Text>
                  </View>
                ) : (
                  dayLessons.map((lesson, lessonIndex) => {
                    const roomText = lesson.room?.trim() || "Google Meet";

                    return (
                      <View
                        key={lesson.id}
                        style={[
                          styles.lessonCard,
                          today ? styles.todayCard : styles.normalCard,
                          lessonIndex > 0 && styles.lessonCardSpacing,
                        ]}
                      >
                        <Text
                          numberOfLines={1}
                          style={[
                            styles.lessonTitle,
                            today ? styles.todayTitle : styles.normalTitle,
                          ]}
                        >
                          {lesson.title}
                        </Text>

                        <Text
                          numberOfLines={1}
                          style={[
                            styles.lessonMeta,
                            today ? styles.todayMeta : styles.normalMeta,
                          ]}
                        >
                          {roomText} |{" "}
                          {formatTimeRange(lesson.startAt, lesson.endAt)}
                        </Text>
                      </View>
                    );
                  })
                )}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function WeekPicker({
  weekStart,
  setWeekStart,
}: {
  weekStart: Date;
  setWeekStart: Dispatch<SetStateAction<Date>>;
}) {
  return (
    <View style={styles.weekBox}>
      <Pressable
        style={styles.prevBtn}
        onPress={() => setWeekStart((current) => addDays(current, -7))}
      >
        <Text style={styles.prevText}>Trước</Text>
      </Pressable>

      <View style={styles.weekCenter}>
        <Text style={styles.weekLabel}>Tuần</Text>
        <Text style={styles.weekText}>{formatWeekRange(weekStart)}</Text>
      </View>

      <Pressable
        style={styles.nextBtn}
        onPress={() => setWeekStart((current) => addDays(current, 7))}
      >
        <Text style={styles.nextText}>Sau</Text>
      </Pressable>
    </View>
  );
}

function getVietnameseWeekday(date: Date) {
  const day = date.getDay();

  switch (day) {
    case 1:
      return "Thứ 2";
    case 2:
      return "Thứ 3";
    case 3:
      return "Thứ 4";
    case 4:
      return "Thứ 5";
    case 5:
      return "Thứ 6";
    case 6:
      return "Thứ 7";
    default:
      return "CN";
  }
}