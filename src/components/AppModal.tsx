import type { ReactNode } from "react";
import { Modal, ScrollView, View } from "react-native";

type AppModalProps = {
  visible: boolean;
  children: ReactNode;
};

export default function AppModal({ visible, children }: AppModalProps) {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 justify-end bg-black/50">
        <View className="max-h-[88%] rounded-t-3xl bg-white p-5">
          <ScrollView showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}