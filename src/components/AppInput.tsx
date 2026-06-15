import {
  KeyboardTypeOptions,
  Text,
  TextInput,
  TextInputProps,
  View,
} from "react-native";

type AppInputProps = {
  label?: string;
  value: string;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  onChangeText: (text: string) => void;
} & Pick<
  TextInputProps,
  "autoCapitalize" | "editable" | "multiline" | "secureTextEntry"
>;

export default function AppInput({
  label,
  value,
  placeholder,
  keyboardType = "default",
  onChangeText,
  autoCapitalize = "sentences",
  editable = true,
  multiline = false,
  secureTextEntry = false,
}: AppInputProps) {
  return (
    <View className="mb-3">
      {label ? (
        <Text className="mb-2 text-sm font-bold text-slate-700">{label}</Text>
      ) : null}

      <TextInput
        className="rounded-2xl bg-white px-4 py-3 text-base text-slate-900"
        value={value}
        placeholder={placeholder}
        placeholderTextColor="#94a3b8"
        keyboardType={keyboardType}
        onChangeText={onChangeText}
        autoCapitalize={autoCapitalize}
        editable={editable}
        multiline={multiline}
        secureTextEntry={secureTextEntry}
      />
    </View>
  );
}
