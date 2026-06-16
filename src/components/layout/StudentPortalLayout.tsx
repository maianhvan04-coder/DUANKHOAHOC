import { useState } from "react";
import type { ComponentProps, ReactNode } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import LoadingState from "../LoadingState";
import EmptyState from "../EmptyState";
import type { NotificationItem } from "../../types/notification.type";

const EVEREST_LOGO = require("../../../assets/images/everest-logo-horizontal.png");

export type StudentPortalTabKey =
  | "feed"
  | "schedule"
  | "grades"
  | "settings";

type IonIconName = ComponentProps<typeof Ionicons>["name"];

type StudentPortalTab = {
  key: StudentPortalTabKey;
  label: string;
  icon: IonIconName;
};

type StudentPortalLayoutProps = {
  activeTab: StudentPortalTabKey;
  email: string;
  role: string;
  loading: boolean;
  refreshing: boolean;
  errorText: string;

  notifications: NotificationItem[];
  unreadCount: number;

  onChangeTab: (tab: StudentPortalTabKey) => void;
  onRefresh: () => void;
  children: ReactNode;
};

export const STUDENT_PORTAL_TABS: StudentPortalTab[] = [
  {
    key: "feed",
    label: "Bảng tin",
    icon: "newspaper-outline",
  },
  {
    key: "schedule",
    label: "Lịch",
    icon: "calendar-outline",
  },
  {
    key: "grades",
    label: "Điểm",
    icon: "bar-chart-outline",
  },
  {
    key: "settings",
    label: "Thông tin",
    icon: "person-circle-outline",
  },
];

export default function StudentPortalLayout({
  activeTab,
  loading,
  refreshing,
  errorText,
  notifications,
  unreadCount,
  onChangeTab,
  onRefresh,
  children,
}: StudentPortalLayoutProps) {
  const insets = useSafeAreaInsets();
  const [notificationVisible, setNotificationVisible] = useState(false);

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
        <View className="flex-row items-center justify-between">
          <View className="min-w-0 flex-1 pr-3">
            <Image
              source={EVEREST_LOGO}
              style={{ width: 218, height: 58 }}
              contentFit="contain"
              accessibilityLabel="Everest"
            />
          </View>

          <Pressable
            className="h-11 w-11 items-center justify-center rounded-full bg-slate-100"
            android_ripple={{ color: "transparent" }}
            onPress={() => setNotificationVisible((value) => !value)}
          >
            <Ionicons
              name="notifications-outline"
              size={23}
              color="#0F172A"
            />

            {unreadCount > 0 ? (
              <View className="absolute right-2 top-2 h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1">
                <Text className="text-[9px] font-extrabold text-white">
                  {unreadCount}
                </Text>
              </View>
            ) : null}
          </Pressable>
        </View>
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
            const color = active ? "#2563EB" : "#64748B";

            return (
              <Pressable
                key={tab.key}
                className="flex-1 items-center justify-center px-1 pt-2 pb-1"
                android_ripple={{ color: "transparent" }}
                onPress={() => onChangeTab(tab.key)}
              >
                <Ionicons name={tab.icon} size={24} color={color} />

                <Text
                  className={[
                    "mt-1 text-[11px] font-extrabold",
                    active ? "text-blue-600" : "text-slate-500",
                  ].join(" ")}
                >
                  {tab.label}
                </Text>

                <View
                  className={[
                    "mt-2 h-[3px] w-8 rounded-full",
                    active ? "bg-blue-600" : "bg-transparent",
                  ].join(" ")}
                />
              </Pressable>
            );
          })}
        </View>
      </View>

      <NotificationDropdown
        visible={notificationVisible}
        top={topSpace + 112}
        notifications={notifications}
        unreadCount={unreadCount}
        onClose={() => setNotificationVisible(false)}
      />
    </View>
  );
}

function NotificationDropdown({
  visible,
  top,
  notifications,
  unreadCount,
  onClose,
}: {
  visible: boolean;
  top: number;
  notifications: NotificationItem[];
  unreadCount: number;
  onClose: () => void;
}) {
  if (!visible) return null;

  return (
    <View className="absolute inset-0 z-50">
      <Pressable className="absolute inset-0" onPress={onClose} />

      <View
        className="absolute right-4 w-[330px] rounded-3xl bg-white p-4 shadow-lg"
        style={{
          top,
          elevation: 16,
          zIndex: 60,
        }}
      >
        <View className="mb-3 flex-row items-center justify-between">
          <Text className="text-lg font-extrabold text-slate-950">
            Thông báo mới
          </Text>

          <View className="flex-row items-center gap-2">
            <Text className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
              {unreadCount} chưa đọc
            </Text>

            <Pressable
              className="h-8 w-8 items-center justify-center rounded-full bg-slate-100"
              onPress={onClose}
            >
              <Ionicons name="close" size={18} color="#334155" />
            </Pressable>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          style={{ maxHeight: 420 }}
        >
          {notifications.length === 0 ? (
            <View className="rounded-2xl bg-slate-50 p-4">
              <EmptyState message="Chưa có thông báo mới" />
            </View>
          ) : (
            notifications.map((item) => (
              <View
                key={item._id}
                className="mb-3 rounded-2xl border border-slate-100 bg-slate-50 p-4"
              >
                <Text className="text-base font-extrabold text-slate-950">
                  {item.title}
                </Text>

                <Text className="mt-2 text-sm leading-5 text-slate-500">
                  {item.message}
                </Text>

                <Text
                  className={[
                    "mt-2 text-xs font-bold",
                    item.isRead ? "text-slate-400" : "text-blue-700",
                  ].join(" ")}
                >
                  {item.isRead ? "Đã đọc" : "Chưa đọc"}
                </Text>
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </View>
  );
}
