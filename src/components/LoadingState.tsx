import { ActivityIndicator, Text, View } from "react-native";

type LoadingStateProps = {
  message?: string;
};

export default function LoadingState({
  message = "Đang tải dữ liệu...",
}: LoadingStateProps) {
  return (
    <View className="flex-1 items-center justify-center">
      <ActivityIndicator size="large" color="#2563eb" />
      <Text className="mt-3 text-base text-slate-500">{message}</Text>
    </View>
  );
}