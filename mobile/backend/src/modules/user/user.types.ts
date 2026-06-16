export type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  deletedAt: string | null;
  createdAt?: string;
  updatedAt?: string;
};