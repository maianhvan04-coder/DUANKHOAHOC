import { useMemo } from "react";
import { Text, View } from "react-native";
import EmptyState from "../../EmptyState";
import type { StudentStudyItem } from "../../../types/student-study.type";
import {
  formatScore,
  getClassName,
  getCourseTitle,
  getExamEligibility,
  scoreFromPercent,
  STUDY_STATUS_LABELS,
} from "../../../utils/studentPortal.util";

type StudentGradesTabProps = {
  studies: StudentStudyItem[];
};

export default function StudentGradesTab({ studies }: StudentGradesTabProps) {
  const sortedStudies = useMemo(
    () =>
      [...studies].sort((a, b) =>
        getCourseTitle(a).localeCompare(getCourseTitle(b), "vi")
      ),
    [studies]
  );

  return (
    <View>
      <View className="mb-4 rounded-3xl bg-blue-700 p-5">
        <Text className="text-sm font-bold uppercase tracking-[2px] text-blue-100">
          Bảng điểm học tập
        </Text>
        <Text className="mt-2 text-2xl font-extrabold text-white">
          Điểm và điều kiện thi
        </Text>
        <Text className="mt-2 text-sm leading-5 text-blue-100">
          Tổng hợp chuyên cần, tiến độ, điểm thường xuyên và điểm trung bình.
        </Text>
      </View>

      {sortedStudies.length === 0 ? (
        <View className="rounded-3xl bg-white">
          <EmptyState message="Chưa có dữ liệu điểm" />
        </View>
      ) : (
        sortedStudies.map((study, index) => {
          const eligibility = getExamEligibility(study);

          return (
            <View key={study._id} className="mb-4 rounded-3xl bg-white p-4">
              <View className="mb-4 flex-row items-start justify-between gap-3">
                <View className="flex-1">
                  <Text className="text-xs font-bold text-blue-700">
                    #{index + 1}
                  </Text>
                  <Text className="mt-1 text-lg font-extrabold text-slate-950">
                    {getCourseTitle(study)}
                  </Text>
                  <Text className="mt-1 text-sm text-slate-500">
                    {getClassName(study)}
                  </Text>
                </View>

                <Text
                  className={[
                    "rounded-full px-3 py-1 text-xs font-bold",
                    eligibility === "Đạt"
                      ? "bg-blue-50 text-blue-700"
                      : "bg-red-50 text-red-600",
                  ].join(" ")}
                >
                  {eligibility}
                </Text>
              </View>

              <View className="mb-3 flex-row gap-2">
                <ScoreBox
                  label="C.Cần"
                  value={formatScore(scoreFromPercent(study.attendancePercent))}
                />
                <ScoreBox
                  label="TBCTN"
                  value={formatScore(scoreFromPercent(study.progressPercent))}
                />
                <ScoreBox label="TBC" value={formatScore(study.finalAverage)} />
              </View>

              <View className="mb-3 flex-row gap-2">
                <ScoreBox label="TX1" value={formatScore(study.test1)} muted />
                <ScoreBox label="TX2" value={formatScore(study.test2)} muted />
                <ScoreBox label="TX3" value={formatScore(study.test3)} muted />
              </View>

              <View className="rounded-2xl bg-slate-50 px-4 py-3">
                <Text className="text-sm font-semibold text-slate-600">
                  Trạng thái: {STUDY_STATUS_LABELS[study.status] ?? study.status}
                </Text>
              </View>
            </View>
          );
        })
      )}
    </View>
  );
}

function ScoreBox({
  label,
  value,
  muted = false,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <View
      className={[
        "flex-1 rounded-2xl p-3",
        muted ? "bg-slate-50" : "bg-blue-50",
      ].join(" ")}
    >
      <Text className="text-xs font-semibold text-slate-500">{label}</Text>
      <Text
        className={[
          "mt-1 text-xl font-extrabold",
          muted ? "text-slate-950" : "text-blue-700",
        ].join(" ")}
      >
        {value}
      </Text>
    </View>
  );
}
