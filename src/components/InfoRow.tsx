import { Text, View } from "react-native";

type InfoRowProps = {
  label: string;
  value: string | number;
  highlight?: boolean;
};

export default function InfoRow({
  label,
  value,
  highlight = false,
}: InfoRowProps) {
  return (
    <View className="mb-2 flex-row justify-between gap-3">
      <Text className="text-sm text-slate-500">{label}</Text>

      <Text
        className={[
          "flex-1 text-right text-sm font-semibold",
          highlight ? "font-extrabold text-blue-600" : "text-slate-900",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {value}
      </Text>
    </View>
  );
}