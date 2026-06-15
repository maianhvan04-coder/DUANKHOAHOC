import { Pressable, Text, View } from "react-native";

type Option<T extends string> = {
  label: string;
  value: T;
};

type OptionGroupProps<T extends string> = {
  label: string;
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
};

export default function OptionGroup<T extends string>({
  label,
  value,
  options,
  onChange,
}: OptionGroupProps<T>) {
  return (
    <View className="mb-3">
      <Text className="mb-2 text-sm font-bold text-slate-700">{label}</Text>

      <View className="flex-row flex-wrap gap-2">
        {options.map((option) => {
          const active = option.value === value;

          return (
            <Pressable
              key={option.value}
              className={[
                "rounded-full px-3 py-2",
                active ? "bg-blue-600" : "bg-slate-100",
              ]
                .filter(Boolean)
                .join(" ")}
              onPress={() => onChange(option.value)}
            >
              <Text
                className={[
                  "text-sm font-bold",
                  active ? "text-white" : "text-slate-600",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}