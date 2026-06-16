import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AppButton from "../../AppButton";
import AppInput from "../../AppInput";
import LoadingState from "../../LoadingState";
import { accountService } from "../../../services/account.service";
import type { AccountUser } from "../../../types/account.type";
import type { User, UserAccess } from "../../../types/auth.type";
import { getErrorMessage } from "../../../utils/studentPortal.util";
import { studentSettingsStyles as styles } from "./styles";

type StudentSettingsTabProps = {
  user: User;
  access: UserAccess | null;
  onLogout: () => Promise<void>;
};

export default function StudentSettingsTab({
  user,
  access,
  onLogout,
}: StudentSettingsTabProps) {
  const [account, setAccount] = useState<AccountUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showAccountInfo, setShowAccountInfo] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [messageText, setMessageText] = useState("");
  const [errorText, setErrorText] = useState("");

  const displayName = account?.name || user.name || "Học viên";
  const displayEmail = account?.email || user.email || "";
  const avatarText = getAvatarText(displayName);

  useEffect(() => {
    let mounted = true;

    async function loadAccount() {
      try {
        setLoading(true);
        setErrorText("");

        const data = await accountService.getMe();

        if (!mounted) return;
        setAccount(data);
      } catch (error) {
        if (!mounted) return;
        setErrorText(getErrorMessage(error, "Không tải được tài khoản"));
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void loadAccount();

    return () => {
      mounted = false;
    };
  }, []);

  async function handleChangePassword() {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setErrorText("Vui lòng nhập đủ thông tin mật khẩu");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorText("Mật khẩu xác nhận không khớp");
      return;
    }

    try {
      setSaving(true);
      setErrorText("");
      setMessageText("");

      const response = await accountService.changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      setMessageText(response.message || "Đổi mật khẩu thành công");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordForm(false);
    } catch (error) {
      setErrorText(getErrorMessage(error, "Không đổi được mật khẩu"));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingBox}>
        <LoadingState message="Đang tải cài đặt..." />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <View style={styles.profileRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{avatarText}</Text>
          </View>

          <View style={styles.profileInfo}>
            <Text style={styles.name}>{displayName}</Text>
            <Text style={styles.phone}>{displayEmail}</Text>
          </View>
        </View>
      </View>

      {errorText ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{errorText}</Text>
        </View>
      ) : null}

      {messageText ? (
        <View style={styles.successBox}>
          <Text style={styles.successText}>{messageText}</Text>
        </View>
      ) : null}

      <View style={styles.menuBox}>
        <MenuItem
          icon={<Ionicons name="person-outline" size={18} color="#111827" />}
          title="Thông tin tài khoản"
          onPress={() => setShowAccountInfo((value) => !value)}
        />

        {showAccountInfo ? (
          <View style={styles.infoBox}>
            <Info label="Tên hiển thị" value={displayName} />
            <Info label="Email" value={displayEmail} />
          </View>
        ) : null}

        <MenuItem
          icon={<Ionicons name="card-outline" size={18} color="#111827" />}
          title="Tài khoản ngân hàng"
        />

        <MenuItem
          icon={
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={18}
              color="#111827"
            />
          }
          title="Tạo nhóm hỗ trợ"
        />

        <MenuItem
          icon={
            <Ionicons
              name="lock-closed-outline"
              size={18}
              color="#111827"
            />
          }
          title="Đổi mật khẩu"
          onPress={() => setShowPasswordForm((value) => !value)}
        />

        {showPasswordForm ? (
          <View style={styles.passwordBox}>
            <AppInput
              label="Mật khẩu hiện tại"
              value={currentPassword}
              placeholder="Nhập mật khẩu hiện tại"
              autoCapitalize="none"
              editable={!saving}
              secureTextEntry
              onChangeText={setCurrentPassword}
            />

            <AppInput
              label="Mật khẩu mới"
              value={newPassword}
              placeholder="Nhập mật khẩu mới"
              autoCapitalize="none"
              editable={!saving}
              secureTextEntry
              onChangeText={setNewPassword}
            />

            <AppInput
              label="Xác nhận mật khẩu mới"
              value={confirmPassword}
              placeholder="Nhập lại mật khẩu mới"
              autoCapitalize="none"
              editable={!saving}
              secureTextEntry
              onChangeText={setConfirmPassword}
            />

            <AppButton
              title={saving ? "Đang lưu..." : "Lưu mật khẩu"}
              disabled={saving}
              onPress={handleChangePassword}
            />
          </View>
        ) : null}

        <MenuItem
          icon={
            <Ionicons
              name="shield-checkmark-outline"
              size={18}
              color="#111827"
            />
          }
          title="Chính sách bảo mật"
        />

        <MenuItem
          icon={
            <Ionicons
              name="document-text-outline"
              size={18}
              color="#111827"
            />
          }
          title="Điều khoản dịch vụ"
        />

        <MenuItem
          icon={<Ionicons name="settings-outline" size={18} color="#111827" />}
          title="Cài đặt chung"
          last
        />
      </View>

      <Pressable style={styles.logoutBtn} onPress={onLogout}>
        <MaterialCommunityIcons name="logout" size={17} color="#EF4444" />
        <Text style={styles.logoutText}>Đăng xuất</Text>
      </Pressable>
    </View>
  );
}

function MenuItem({
  icon,
  title,
  onPress,
  last = false,
}: {
  icon: ReactNode;
  title: string;
  onPress?: () => void;
  last?: boolean;
}) {
  return (
    <Pressable
      style={[styles.menuItem, last && styles.menuItemLast]}
      onPress={onPress}
    >
      <View style={styles.menuIconBox}>{icon}</View>

      <Text style={styles.menuTitle}>{title}</Text>

      <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
    </Pressable>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function getAvatarText(name: string) {
  const words = name.trim().split(/\s+/);

  if (words.length === 1) {
    return words[0]?.charAt(0).toUpperCase() || "H";
  }

  return `${words[0]?.charAt(0) || ""}${
    words[words.length - 1]?.charAt(0) || ""
  }`.toUpperCase();
}