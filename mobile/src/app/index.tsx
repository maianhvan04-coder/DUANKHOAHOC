import { View } from "react-native";
import LoadingState from "../components/LoadingState";
import LoginScreen from "../components/ui/auth/LoginScreen";
import StudentPortalScreen from "../components/ui/student/StudentPortalScreen";
import { useMobileAuth } from "../hooks/useMobileAuth";
import type { LoginPayload } from "../types/auth.type";

export default function AuthIndex() {
  const auth = useMobileAuth();

  async function handleLogin(payload: LoginPayload) {
    await auth.login(payload);
  }

  if (!auth.hydrated) {
    return (
      <View className="flex-1 bg-slate-100 px-4">
        <LoadingState message="Đang kiểm tra phiên đăng nhập..." />
      </View>
    );
  }

  if (!auth.user) {
    return <LoginScreen loading={auth.isLoading} onLogin={handleLogin} />;
  }

  return (
    <StudentPortalScreen
      user={auth.user}
      access={auth.access}
      onLogout={auth.logout}
    />
  );
}