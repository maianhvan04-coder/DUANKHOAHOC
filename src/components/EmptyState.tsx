import { Text, View } from "react-native";

type EmptyStateProps = {
  message: string;
};

export default function EmptyState({ message }: EmptyStateProps) {
  return (
    <View className="items-center p-8">
      <Text className="text-base text-slate-500">{message}</Text>
    </View>
  );
}