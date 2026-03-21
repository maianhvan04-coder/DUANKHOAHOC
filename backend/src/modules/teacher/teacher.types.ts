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
  name: string;
  email: string;

  specialty: string;
  phone: string;
  avatar: string;

  degree: string;
  experience: string;
  achievement: string;
  bio: string;

  rating: number;
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

  specialty?: string;
  phone?: string;

  avatar?: string;
  avatarPublicId?: string;

  degree?: string;
  experience?: string;
  achievement?: string;
  bio?: string;

  rating?: number;
  active?: boolean;
};

export type UpdateTeacherInput = {
  name?: string;
  password?: string;

  specialty?: string;
  phone?: string;

  avatar?: string;
  avatarPublicId?: string;

  degree?: string;
  experience?: string;
  achievement?: string;
  bio?: string;

  rating?: number;
  active?: boolean;
};