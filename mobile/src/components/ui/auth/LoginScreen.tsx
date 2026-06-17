import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppButton from "../../AppButton";
import AppInput from "../../AppInput";
import { getErrorMessage } from "../../../utils/studentPortal.util";
import type { LoginPayload } from "../../../types/auth.type";

const EVEREST_LOGO = require("../../../../assets/images/everest-logo-horizontal.png");

type LoginScreenProps = {
  loading: boolean;
  onLogin: (payload: LoginPayload) => Promise<void>;
};

export default function LoginScreen({ loading, onLogin }: LoginScreenProps) {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorText, setErrorText] = useState("");

  const canSubmit = email.trim().length > 0 && password.length > 0 && !loading;

  async function handleLogin() {
    if (!canSubmit) {
      setErrorText("Vui lòng nhập email và mật khẩu");
      return;
    }

    try {
      setErrorText("");
      await onLogin({
        email: email.trim(),
        password,
      });
    } catch (error) {
      setErrorText(getErrorMessage(error, "Đăng nhập thất bại"));
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-[#F3F8FF]"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: Math.max(insets.top, 32) + 24,
          paddingHorizontal: 20,
          paddingBottom: Math.max(insets.bottom, 24) + 24,
        }}
      >
        <View className="flex-1 justify-center">
          <View className="mb-8">
            <Image
              source={EVEREST_LOGO}
              style={{ width: "100%", height: 92 }}
              contentFit="contain"
              accessibilityLabel="Everest"
            />
            <Text className="mt-3 text-center text-4xl font-extrabold text-slate-950">
              Đăng nhập
            </Text>
          </View>

          <View className="rounded-[28px] bg-white p-5 shadow-sm">
            <AppInput
              label="Email"
              value={email}
              placeholder="student@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
              onChangeText={setEmail}
            />

            <AppInput
              label="Mật khẩu"
              value={password}
              placeholder="Nhập mật khẩu"
              autoCapitalize="none"
              editable={!loading}
              secureTextEntry
              onChangeText={setPassword}
            />

            {errorText ? (
              <View className="mb-3 rounded-2xl bg-red-50 px-4 py-3">
                <Text className="text-sm font-semibold text-red-600">
                  {errorText}
                </Text>
              </View>
            ) : null}

            <AppButton
              title={loading ? "Đang đăng nhập..." : "Đăng nhập"}
              disabled={!canSubmit}
              onPress={handleLogin}
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
