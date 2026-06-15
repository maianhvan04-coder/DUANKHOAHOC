import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import AppButton from "../../AppButton";
import AppInput from "../../AppInput";
import LoadingState from "../../LoadingState";
import { accountService } from "../../../services/account.service";
import type { AccountUser } from "../../../types/account.type";
import type { User, UserAccess } from "../../../types/auth.type";
import { getErrorMessage } from "../../../utils/studentPortal.util";

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
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [messageText, setMessageText] = useState("");
  const [errorText, setErrorText] = useState("");

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
    } catch (error) {
      setErrorText(getErrorMessage(error, "Không đổi được mật khẩu"));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View className="min-h-[320px] rounded-3xl bg-white p-4">
        <LoadingState message="Đang tải cài đặt..." />
      </View>
    );
  }

  return (
    <View>
      <View className="mb-4 rounded-3xl bg-blue-700 p-5">
        <Text className="text-sm font-bold uppercase tracking-[2px] text-blue-100">
          Cài đặt học viên
        </Text>
        <Text className="mt-2 text-2xl font-extrabold text-white">
          Tài khoản và bảo mật
        </Text>
        <Text className="mt-2 text-sm leading-5 text-blue-100">
          Quản lý hồ sơ đăng nhập đang dùng chung với hệ thống web.
        </Text>
      </View>

      {errorText ? (
        <View className="mb-4 rounded-2xl bg-red-50 px-4 py-3">
          <Text className="text-sm font-semibold text-red-600">{errorText}</Text>
        </View>
      ) : null}

      {messageText ? (
        <View className="mb-4 rounded-2xl bg-emerald-50 px-4 py-3">
          <Text className="text-sm font-semibold text-emerald-700">
            {messageText}
          </Text>
        </View>
      ) : null}

      <View className="mb-4 rounded-3xl bg-white p-4">
        <Text className="mb-4 text-lg font-extrabold text-slate-950">
          Thông tin tài khoản
        </Text>
        <Info label="Tên hiển thị" value={account?.name || user.name} />
        <Info label="Email" value={account?.email || user.email} />
        <Info label="Vai trò chính" value={access?.primaryRole || "STUDENT"} />
      </View>

      <View className="mb-4 rounded-3xl bg-white p-4">
        <Text className="mb-4 text-lg font-extrabold text-slate-950">
          Đổi mật khẩu
        </Text>

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

      <View className="rounded-3xl bg-white p-4">
        <Text className="mb-3 text-lg font-extrabold text-slate-950">
          Phiên đăng nhập
        </Text>
        <Text className="mb-4 text-sm leading-5 text-slate-500">
          Đăng xuất sẽ xóa access token mobile và gọi API logout của backend.
        </Text>
        <AppButton title="Đăng xuất" variant="danger" onPress={onLogout} />
      </View>
    </View>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <View className="mb-3 flex-row justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-3">
      <Text className="text-sm text-slate-500">{label}</Text>
      <Text className="flex-1 text-right text-sm font-extrabold text-slate-950">
        {value}
      </Text>
    </View>
  );
}
