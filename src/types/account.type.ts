export type AccountUser = {
  _id: string;
  name: string;
  email: string;
  avatar?: string | null;
};

export type ChangePasswordPayload = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};
