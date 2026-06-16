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

  const average =
    sortedStudies.length > 0
      ? sortedStudies.reduce((sum, item) => {
          const value = Number(item.finalAverage ?? 0);
          return sum + (Number.isFinite(value) ? value : 0);
        }, 0) / sortedStudies.length
      : 0;

  const passedCount = sortedStudies.filter(
    (item) => getExamEligibility(item) === "Đạt"
  ).length;

  if (sortedStudies.length === 0) {
    return (
      <View className="bg-transparent px-3 pb-4">
        <EmptyState message="Chưa có dữ liệu điểm" />
      </View>
    );
  }

  return (
    <View className="bg-transparent px-3 pb-4">
      <Text className="mb-3 text-center text-lg font-extrabold uppercase text-slate-950">
        BẢNG ĐIỂM HỌC TẬP
      </Text>

      {sortedStudies.map((study, index) => (
        <GradeTable key={study._id} study={study} index={index} />
      ))}

      <View className="mt-1 overflow-hidden rounded-2xl border border-slate-700">
        <View className="border-b border-slate-700 bg-slate-100 px-3 py-3">
          <Text className="text-center text-base font-extrabold uppercase text-slate-950">
            KẾT QUẢ HỌC TẬP
          </Text>
        </View>

        <SummaryRow label="Danh hiệu" value={getRewardTitle(average)} />
        <SummaryRow
          label="Số môn đạt điều kiện thi"
          value={`${passedCount}/${sortedStudies.length}`}
        />
        <SummaryRow
          label="Điểm trung bình chung"
          value={formatScore(average)}
          last
        />
      </View>
    </View>
  );
}

function GradeTable({
  study,
  index,
}: {
  study: StudentStudyItem;
  index: number;
}) {
  const eligibility = getExamEligibility(study);

  const rows = [
    {
      label: "Chuyên cần",
      value: formatScore(scoreFromPercent(study.attendancePercent)),
    },
    {
      label: "Tiến độ",
      value: formatScore(scoreFromPercent(study.progressPercent)),
    },
    {
      label: "TX1",
      value: formatScore(study.test1),
    },
    {
      label: "TX2",
      value: formatScore(study.test2),
    },
    {
      label: "TX3",
      value: formatScore(study.test3),
    },
    {
      label: "Học kỳ",
      value: formatScore(
        getOptionalScore(study, ["finalExam", "examScore", "semesterScore"])
      ),
    },
    {
      label: "Trung bình môn",
      value: formatScore(study.finalAverage),
      strong: true,
    },
    {
      label: "Trạng thái",
      value: STUDY_STATUS_LABELS[study.status] ?? study.status,
    },
    {
      label: "Điều kiện thi",
      value: eligibility,
      status: eligibility,
    },
  ];

  return (
    <View className="mb-4 overflow-hidden rounded-2xl border border-slate-700">
      <View className="border-b border-slate-700 bg-slate-100 px-3 py-3">
        <Text className="text-center text-base font-extrabold text-slate-950">
          {getCourseTitle(study)}
        </Text>

        <Text className="mt-1 text-center text-xs text-slate-500">
          Môn {index + 1} · {getClassName(study)}
        </Text>
      </View>

      <View className="flex-row border-b border-slate-700 bg-slate-50">
        <View className="flex-1 border-r border-slate-700 px-3 py-3">
          <Text className="text-center text-sm font-extrabold text-slate-950">
            Điểm thành phần
          </Text>
        </View>

        <View className="flex-1 px-3 py-3">
          <Text className="text-center text-sm font-extrabold text-slate-950">
            Điểm
          </Text>
        </View>
      </View>

      {rows.map((row, rowIndex) => (
        <View
          key={row.label}
          className={[
            "flex-row bg-white",
            rowIndex === rows.length - 1 ? "" : "border-b border-slate-200",
          ].join(" ")}
        >
          <View className="flex-1 justify-center border-r border-slate-700 px-3 py-3">
            <Text className="text-sm text-slate-600">{row.label}</Text>
          </View>

          <View className="flex-1 justify-center px-3 py-3">
            <Text
              className={[
                "text-right text-sm",
                row.strong
                  ? "font-extrabold text-blue-700"
                  : row.status === "Đạt"
                  ? "font-extrabold text-emerald-700"
                  : row.status === "Chưa đạt" || row.status === "Không đạt"
                  ? "font-extrabold text-red-600"
                  : "font-extrabold text-slate-950",
              ].join(" ")}
            >
              {row.value || "-"}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function SummaryRow({
  label,
  value,
  last = false,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View
      className={[
        "flex-row bg-white",
        last ? "" : "border-b border-slate-200",
      ].join(" ")}
    >
      <View className="flex-1 justify-center border-r border-slate-700 px-3 py-3">
        <Text className="text-sm text-slate-600">{label}</Text>
      </View>

      <View className="flex-1 justify-center px-3 py-3">
        <Text className="text-right text-sm font-extrabold text-slate-950">
          {value || "-"}
        </Text>
      </View>
    </View>
  );
}

function getOptionalScore(study: StudentStudyItem, keys: string[]) {
  const data = study as unknown as Record<string, unknown>;

  for (const key of keys) {
    const value = data[key];

    if (value !== undefined && value !== null && value !== "") {
      return value as number;
    }
  }

  return undefined;
}

function getRewardTitle(average: number) {
  if (average >= 8) return "Giỏi";
  if (average >= 6.5) return "Khá";
  if (average >= 5) return "Trung bình";
  return "Chưa đạt";
}