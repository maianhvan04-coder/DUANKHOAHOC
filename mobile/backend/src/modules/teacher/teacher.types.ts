export type TeacherListItem = {
  _id: string;
  userId: string;
  role: "TEACHER";
  name: string;
  email: string;

  specialty: string;
  phone: string;
  avatar: string;
  active: boolean;
  deletedAt: string | null;

  classCount: number;
  totalStudents: number;

  createdAt?: string;
  updatedAt?: string;
};

export type CreateTeacherInput = {
  name: string;
  email: string;
  password: string;

  phone?: string;

  avatar?: string;
  avatarPublicId?: string;
};

export type UpdateTeacherInput = {
  name?: string;
  email?: string;
  password?: string;

  phone?: string;

  avatar?: string;
  avatarPublicId?: string;
};
