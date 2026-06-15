import type { ReactNode } from "react";
import { SymbolView, type AndroidSymbol, type SFSymbol } from "expo-symbols";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import LoadingState from "../LoadingState";

export type StudentPortalTabKey =
  | "feed"
  | "schedule"
  | "grades"
  | "settings";

type StudentPortalTab = {
  key: StudentPortalTabKey;
  label: string;
  iosIcon: SFSymbol;
  androidIcon: AndroidSymbol;
};

type StudentPortalLayoutProps = {
  activeTab: StudentPortalTabKey;
  email: string;
  role: string;
  loading: boolean;
  refreshing: boolean;
  errorText: string;
  onChangeTab: (tab: StudentPortalTabKey) => void;
  onRefresh: () => void;
  children: ReactNode;
};

export const STUDENT_PORTAL_TABS: StudentPortalTab[] = [
  {
    key: "feed",
    label: "Bảng tin",
    iosIcon: "newspaper.fill",
    androidIcon: "newspaper",
  },
  {
    key: "schedule",
    label: "Lịch",
    iosIcon: "calendar",
    androidIcon: "calendar_month",
  },
  {
    key: "grades",
    label: "Điểm",
    iosIcon: "chart.bar.fill",
    androidIcon: "bar_chart",
  },
  {
    key: "settings",
    label: "Cài đặt",
    iosIcon: "gearshape.fill",
    androidIcon: "settings",
  },
];

export default function StudentPortalLayout({
  activeTab,
  email,
  role,
  loading,
  refreshing,
  errorText,
  onChangeTab,
  onRefresh,
  children,
}: StudentPortalLayoutProps) {
  const insets = useSafeAreaInsets();
  const activeItem = STUDENT_PORTAL_TABS.find(
    (item) => item.key === activeTab
  );
  const topSpace = Math.max(insets.top, 28) + 12;
  const bottomSpace = Math.max(insets.bottom, 10);

  return (
    <View className="flex-1 bg-slate-100">
      <View
        className="border-b border-slate-200 bg-white px-4 pb-4"
        style={{ paddingTop: topSpace }}
      >
        <Text className="text-xs font-bold uppercase tracking-[2px] text-blue-700">
          Everest Student
        </Text>
        <Text className="mt-1 text-2xl font-extrabold text-slate-950">
          {activeItem?.label}
        </Text>
      </View>

      {loading ? (
        <LoadingState message="Đang tải dữ liệu học viên..." />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={{
            padding: 16,
            paddingBottom: bottomSpace + 100,
          }}
        >
          {errorText ? (
            <View className="mb-4 rounded-2xl bg-red-50 px-4 py-3">
              <Text className="text-sm font-semibold text-red-600">
                {errorText}
              </Text>
            </View>
          ) : null}

          {children}
        </ScrollView>
      )}

      <View
        className="absolute bottom-0 left-0 right-0 border-t border-slate-200 bg-white px-2 pt-2"
        style={{ paddingBottom: bottomSpace }}
      >
        <View className="flex-row">
          {STUDENT_PORTAL_TABS.map((tab) => {
            const active = activeTab === tab.key;
            const color = active ? "#2563eb" : "#64748b";

            return (
              <Pressable
                key={tab.key}
                className={[
                  "flex-1 items-center justify-center rounded-2xl px-1 py-2",
                  active ? "bg-blue-50" : "bg-transparent",
                ].join(" ")}
                onPress={() => onChangeTab(tab.key)}
              >
                <SymbolView
                  name={{
                    ios: tab.iosIcon,
                    android: tab.androidIcon,
                    web: tab.androidIcon,
                  }}
                  size={24}
                  tintColor={color}
                />
                <Text
                  className={[
                    "mt-1 text-[11px] font-extrabold",
                    active ? "text-blue-600" : "text-slate-500",
                  ].join(" ")}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}
