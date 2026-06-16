export type BlogItem = {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  image: string;
  imagePublicId?: string;
  authorName: string;
  isFeatured: boolean;
  isPublished: boolean;
  publishedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type BlogPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type BlogListQuery = {
  category?: string;
  featured?: boolean | string;
  isFeatured?: boolean | string;
  isPublished?: boolean | string;
  keyword?: string;
  limit?: number | string;
  page?: number | string;
  published?: boolean | string;
  q?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

export type BlogListData = {
  items: BlogItem[];
  pagination: BlogPagination;
};
