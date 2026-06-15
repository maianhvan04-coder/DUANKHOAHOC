export type User = {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
};

export type UserAccess = {
  primaryRole: string;
  roles: string[];
  permissions: string[];
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
};

export type AuthResponse = {
  accessToken: string;
  user: User;
  access: UserAccess;
};

export type MeResponse = {
  user: User;
  access: UserAccess;
};

export type RefreshResponse = {
  accessToken: string;
  access: UserAccess;
};
