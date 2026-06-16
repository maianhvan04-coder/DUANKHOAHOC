import { API_ENDPOINTS } from "../constants/api";
import type {
  AccountUser,
  ChangePasswordPayload,
} from "../types/account.type";
import { httpClient } from "../utils/httpClient";

export const accountService = {
  async getMe() {
    const response = await httpClient.get<{ user: AccountUser }>(
      API_ENDPOINTS.account.me
    );
    return response.user;
  },

  async changePassword(payload: ChangePasswordPayload) {
    return httpClient.patch<{ message: string }>(
      API_ENDPOINTS.account.password,
      payload
    );
  },
};
