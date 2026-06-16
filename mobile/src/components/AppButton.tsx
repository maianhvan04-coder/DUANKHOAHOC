import { Pressable, Text } from "react-native";

type AppButtonProps = {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger";
  full?: boolean;
  disabled?: boolean;
};

export default function AppButton({
  title,
  onPress,
  variant = "primary",
  full = false,
  disabled = false,
}: AppButtonProps) {
  const buttonClass = [
    "items-center rounded-xl px-4 py-3",
    full ? "flex-1" : "",
    variant === "primary" ? "bg-blue-600" : "",
    variant === "secondary" ? "bg-blue-50" : "",
    variant === "danger" ? "bg-red-50" : "",
    disabled ? "opacity-60" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const textClass = [
    "text-base font-extrabold",
    variant === "primary" ? "text-white" : "",
    variant === "secondary" ? "text-blue-600" : "",
    variant === "danger" ? "text-red-600" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Pressable className={buttonClass} disabled={disabled} onPress={onPress}>
      <Text className={textClass}>{title}</Text>
    </Pressable>
  );
}
