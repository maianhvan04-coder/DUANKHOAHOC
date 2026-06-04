import { http } from "@/lib/utils/http";

export type AiRole = "public" | "student" | "teacher" | "admin";

export type AiChatHistoryItem = {
  role: "user" | "assistant";
  content: string;
};

export type AiAskBody = {
  message: string;
  history?: AiChatHistoryItem[];
};

export type AiAskData = {
  answer: string;
  suggestions: string[];
  refused: boolean;
  provider?: {
    model: string;
    keyIndex: number;
    fallbackUsed: boolean;
  } | null;
};

export type AiNotificationDraftData = {
  title: string;
  message: string;
  type: "INFO" | "SUCCESS" | "WARNING" | "ERROR";
  notes: string[];
  refused: boolean;
  provider?: {
    model: string;
    keyIndex: number;
    fallbackUsed: boolean;
  } | null;
};

export type AiApiResponse = {
  ok: boolean;
  data: AiAskData;
};

const endpointByRole: Record<AiRole, string> = {
  public: "/api/ai/public-advisor",
  student: "/api/ai/student-assistant",
  teacher: "/api/ai/teacher-assistant",
  admin: "/api/ai/admin-assistant",
};

export const aiApi = {
  ask: async (role: AiRole, body: AiAskBody) => {
    return (await http.post<AiApiResponse>(endpointByRole[role], body)).data;
  },

  draftNotification: async (prompt: string) => {
    return (
      await http.post<{
        ok: boolean;
        data: AiNotificationDraftData;
      }>("/api/ai/admin-notification-draft", { prompt })
    ).data;
  },
};
