export type TeacherProductItem = {
  _id: string;
  title: string;
  slug: string;
  status: string;
  studentCount: number;
  image: string;
  price: number;
  originalPrice: number;
};

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

  productCount: number;
  totalStudents: number;
  products: TeacherProductItem[];

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
