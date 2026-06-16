import { Text, View } from "react-native";

type StatCardProps = {
  value: string | number;
  label: string;
};

export default function StatCard({ value, label }: StatCardProps) {
  return (
    <View className="flex-1 rounded-2xl bg-white p-4">
      <Text className="text-2xl font-extrabold text-blue-600">{value}</Text>
      <Text className="mt-1 text-xs text-slate-500">{label}</Text>
    </View>
  );
}