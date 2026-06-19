"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { toast } from "sonner";
import {
  ChevronDown,
  Code2,
  Eye,
  EyeOff,
  ExternalLink,
  FileText,
  Italic,
  Link2,
  List,
  ListOrdered,
  Pencil,
  Plus,
  Quote,
  Redo2,
  Star,
  Strikethrough,
  Type,
  Underline,
  Undo2,
  Unlink,
  X,
} from "lucide-react";
import {
  blogApi,
  type BlogBody,
  type BlogCategoryItem,
  type BlogItem,
} from "@/app/api/blog.api";
import AdminListTable, {
  AdminActionIconButton,
  AdminEntityCell,
  AdminStatusBadge,
  type AdminFilterSection,
  type AdminTableColumn,
} from "@/components/ui/admin/admin-list-table";
import { showAdminConfirmToast } from "@/components/ui/admin/admin-toast";
import {
  compareSortValues,
  getPageBounds,
  paginateItems,
  type SortDirection,
} from "@/lib/utils/admin-list";

type BlogStatusFilter = "PUBLISHED" | "DRAFT";
type BlogHotFilter = "HOT" | "NORMAL";
type BlogViewMode = "active" | "deleted";
type BlogSortBy =
  | "createdAt"
  | "title"
  | "status"
  | "publishedAt"
  | "updatedAt"
  | "deletedAt"
  | "isFeatured";
type BlogSortOrder = SortDirection;
type FormMode = "create" | "edit";

type BlogFormState = {
  title: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string;
  authorName: string;
  isFeatured: boolean;
  isPublished: boolean;
  publishedAt: string;
};

const DEFAULT_BLOG_CATEGORY = "";

const INITIAL_FORM: BlogFormState = {
  title: "",
  excerpt: "",
  content: "",
  category: DEFAULT_BLOG_CATEGORY,
  tags: "",
  authorName: "",
  isFeatured: false,
  isPublished: false,
  publishedAt: "",
};

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function formatDateTime(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("vi-VN");
}

function getPublicPostHref(post: BlogItem) {
  return `/goc-kien-thuc/${encodeURIComponent(post.slug || post._id)}`;
}

function toDatetimeLocal(value?: string | null) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const pad = (input: number) => String(input).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function isAllowedImage(src?: string | null) {
  if (!src) return false;
  if (src.startsWith("/")) return true;

  try {
    const url = new URL(src);
    return url.protocol === "https:" && url.hostname === "res.cloudinary.com";
  } catch {
    return false;
  }
}

function getErrorMessage(error: unknown, fallback: string) {
  if (typeof error === "object" && error !== null) {
    const value = error as {
      response?: { data?: { message?: string; error?: string } };
      message?: string;
    };

    return (
      value.response?.data?.message ||
      value.response?.data?.error ||
      value.message ||
      fallback
    );
  }

  return fallback;
}

function EditorToolbarButton({
  children,
  title,
  onClick,
}: {
  children: ReactNode;
  title: string;
  onClick: () => void;
}) {

  return (
    <button
      type="button"
      title={title}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className="inline-flex h-10 min-w-10 items-center justify-center rounded-2xl border border-slate-300 bg-white px-3 text-sm font-bold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950/20 dark:text-slate-100 dark:hover:border-slate-500 dark:hover:bg-slate-800"
    >
      {children}
    </button>
  );
}

function RichContentEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const editorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || document.activeElement === editor) return;
    if (editor.innerHTML !== value) editor.innerHTML = value;
  }, [value]);

  function emitChange() {
    onChange(editorRef.current?.innerHTML || "");
  }

  function runCommand(command: string, commandValue?: string) {
    editorRef.current?.focus();
    document.execCommand(command, false, commandValue);
    emitChange();
  }

  function createLink() {
    const url = window.prompt("Nhập đường dẫn liên kết");
    if (!url) return;
    runCommand("createLink", url);
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-300 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100">
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-950/80">
        <select
          aria-label="Font"
          onChange={(event) => runCommand("fontName", event.target.value)}
          defaultValue="Arial"
          className="h-10 min-w-[208px] rounded-2xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-sky-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
        >
          <option value="Arial">Arial</option>
          <option value="Times New Roman">Times New Roman</option>
          <option value="Georgia">Georgia</option>
          <option value="Verdana">Verdana</option>
        </select>

        <select
          aria-label="Size"
          onChange={(event) => runCommand("fontSize", event.target.value)}
          defaultValue="4"
          className="h-10 rounded-2xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-sky-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
        >
          <option value="2">14</option>
          <option value="3">16</option>
          <option value="4">18</option>
          <option value="5">24</option>
          <option value="6">32</option>
        </select>

        <label
          className="inline-flex h-10 min-w-10 cursor-pointer items-center justify-center rounded-2xl border border-slate-300 bg-white px-3 text-lg font-black text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950/20 dark:text-slate-100 dark:hover:border-slate-500 dark:hover:bg-slate-800"
          title="Màu chữ"
        >
          A
          <input
            type="color"
            className="sr-only"
            onChange={(event) => runCommand("foreColor", event.target.value)}
          />
        </label>

        <label
          className="inline-flex h-10 min-w-10 cursor-pointer items-center justify-center rounded-2xl border border-slate-300 bg-white px-3 text-lg font-black text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950/20 dark:text-slate-100 dark:hover:border-slate-500 dark:hover:bg-slate-800"
          title="Màu nền"
        >
          A
          <input
            type="color"
            className="sr-only"
            onChange={(event) => runCommand("hiliteColor", event.target.value)}
          />
        </label>

        <EditorToolbarButton title="Hoàn tác" onClick={() => runCommand("undo")}>
          <Undo2 className="h-4 w-4" />
        </EditorToolbarButton>
        <EditorToolbarButton title="Làm lại" onClick={() => runCommand("redo")}>
          <Redo2 className="h-4 w-4" />
        </EditorToolbarButton>
        <EditorToolbarButton title="Đậm" onClick={() => runCommand("bold")}>
          <Type className="h-4 w-4" />
        </EditorToolbarButton>
        <EditorToolbarButton title="Nghiêng" onClick={() => runCommand("italic")}>
          <Italic className="h-4 w-4" />
        </EditorToolbarButton>
        <EditorToolbarButton title="Gạch chân" onClick={() => runCommand("underline")}>
          <Underline className="h-4 w-4" />
        </EditorToolbarButton>
        <EditorToolbarButton title="Gạch ngang" onClick={() => runCommand("strikeThrough")}>
          <Strikethrough className="h-4 w-4" />
        </EditorToolbarButton>
        <EditorToolbarButton title="H1" onClick={() => runCommand("formatBlock", "H1")}>
          H1
        </EditorToolbarButton>
        <EditorToolbarButton title="H2" onClick={() => runCommand("formatBlock", "H2")}>
          H2
        </EditorToolbarButton>
        <EditorToolbarButton
          title="Danh sách"
          onClick={() => runCommand("insertUnorderedList")}
        >
          <List className="h-4 w-4" />
        </EditorToolbarButton>
        <EditorToolbarButton
          title="Danh sách số"
          onClick={() => runCommand("insertOrderedList")}
        >
          <ListOrdered className="h-4 w-4" />
        </EditorToolbarButton>
        <EditorToolbarButton
          title="Trích dẫn"
          onClick={() => runCommand("formatBlock", "BLOCKQUOTE")}
        >
          <Quote className="h-4 w-4" />
        </EditorToolbarButton>
        <EditorToolbarButton title="Code" onClick={() => runCommand("formatBlock", "PRE")}>
          <Code2 className="h-4 w-4" />
        </EditorToolbarButton>
        <EditorToolbarButton title="Liên kết" onClick={createLink}>
          <Link2 className="h-4 w-4" />
        </EditorToolbarButton>
        <EditorToolbarButton title="Bỏ liên kết" onClick={() => runCommand("unlink")}>
          <Unlink className="h-4 w-4" />
        </EditorToolbarButton>
      </div>

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={emitChange}
        className="min-h-[350px] w-full overflow-y-auto bg-white px-5 py-4 text-[16px] leading-7 text-slate-900 outline-none empty:before:text-slate-400 empty:before:content-[attr(data-placeholder)] dark:bg-slate-950 dark:text-slate-100 dark:empty:before:text-slate-500"
        data-placeholder="Nhập nội dung bài viết..."
      />
    </div>
  );
}

export default function AdminBlogPage() {
  const [items, setItems] = useState<BlogItem[]>([]);
  const [categories, setCategories] = useState<BlogCategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryLoading, setCategoryLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilters, setStatusFilters] = useState<BlogStatusFilter[]>([]);
  const [categoryFilters, setCategoryFilters] = useState<string[]>([]);
  const [hotFilters, setHotFilters] = useState<BlogHotFilter[]>([]);
  const [viewMode] = useState<BlogViewMode>("active");

  const [sortBy, setSortBy] = useState<BlogSortBy>("createdAt");
  const [sortOrder, setSortOrder] = useState<BlogSortOrder>("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>("create");
  const [editingItem, setEditingItem] = useState<BlogItem | null>(null);
  const [form, setForm] = useState<BlogFormState>(INITIAL_FORM);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [busyPostId, setBusyPostId] = useState<string | null>(null);

  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [editingCategory, setEditingCategory] =
    useState<BlogCategoryItem | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    description: "",
    isActive: true,
  });
  const [categorySubmitting, setCategorySubmitting] = useState(false);

  const loadBlogs = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage("");
      const query = {
        limit: 100,
        sortBy: viewMode === "deleted" ? "deletedAt" : "publishedAt",
        sortOrder: "desc" as const,
      };
      const res =
        viewMode === "deleted"
          ? await blogApi.getDeleted(query)
          : await blogApi.getAdminAll(query);

      setItems(res.items || []);
    } catch (error) {
      console.error(error);
      const message = getErrorMessage(
        error,
        viewMode === "deleted"
          ? "Không tải được danh sách bài viết đã xóa"
          : "Không tải được danh sách bài viết"
      );
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [viewMode]);

  const loadCategories = useCallback(async () => {
    try {
      setCategoryLoading(true);
      const res = await blogApi.getCategoriesAdmin();
      setCategories(res.items || []);
    } catch (error) {
      console.error(error);
      const message = getErrorMessage(error, "Không tải được chuyên mục blog");
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setCategoryLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBlogs();
    void loadCategories();
  }, [loadBlogs, loadCategories]);

  const categoryByName = useMemo(() => {
    const map = new Map<string, BlogCategoryItem>();
    categories.forEach((category) => {
      if (category.name) map.set(category.name, category);
    });
    return map;
  }, [categories]);

  const categoryOptions = useMemo(
    () =>
      categories
        .filter((item) => item.isActive !== false)
        .map((item) => item.name)
        .filter(Boolean),
    [categories]
  );

  const categorySelectOptions = useMemo(() => {
    if (form.category && !categoryOptions.includes(form.category)) {
      return [form.category, ...categoryOptions];
    }

    return categoryOptions;
  }, [categoryOptions, form.category]);

  const activeFilterCount =
    statusFilters.length + categoryFilters.length + hotFilters.length;

  const filteredItems = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return items.filter((item) => {
      const category = categoryByName.get(item.category || "");
      const status = item.isPublished === false ? "DRAFT" : "PUBLISHED";
      const hotFlag = item.isFeatured ? "HOT" : "NORMAL";

      const matchesSearch =
        !keyword ||
        item.title?.toLowerCase().includes(keyword) ||
        item.excerpt?.toLowerCase().includes(keyword) ||
        item.category?.toLowerCase().includes(keyword) ||
        item.authorName?.toLowerCase().includes(keyword);

      if (!matchesSearch) return false;
      if (statusFilters.length && !statusFilters.includes(status)) return false;
      if (hotFilters.length && !hotFilters.includes(hotFlag)) return false;

      if (categoryFilters.length) {
        if (!category?._id || !categoryFilters.includes(category._id)) {
          return false;
        }
      }

      return true;
    });
  }, [
    categoryByName,
    categoryFilters,
    hotFilters,
    items,
    search,
    statusFilters,
  ]);

  const sortedItems = useMemo(() => {
    const pick = (item: BlogItem) => {
      if (sortBy === "title") return item.title || "";
      if (sortBy === "status") return item.isPublished === false ? 0 : 1;
      if (sortBy === "isFeatured") return item.isFeatured ? 1 : 0;
      if (sortBy === "publishedAt") return item.publishedAt || "";
      if (sortBy === "updatedAt") return item.updatedAt || "";
      if (sortBy === "deletedAt") return item.deletedAt || "";
      return item.createdAt || "";
    };

    return [...filteredItems].sort((left, right) =>
      compareSortValues(pick(left), pick(right), sortOrder)
    );
  }, [filteredItems, sortBy, sortOrder]);

  const { totalPages, currentPage } = getPageBounds(
    sortedItems.length,
    page,
    pageSize
  );

  const pagedItems = useMemo(
    () => paginateItems(sortedItems, currentPage, pageSize),
    [currentPage, pageSize, sortedItems]
  );

  function toggleArrayValue<T extends string>(
    values: T[],
    value: T,
    setter: Dispatch<SetStateAction<T[]>>
  ) {
    void values;
    setter((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
    );
    setPage(1);
  }

  function clearFilters() {
    setSearch("");
    setStatusFilters([]);
    setCategoryFilters([]);
    setHotFilters([]);
    setPage(1);
  }

  function openCreateForm() {
    setFormMode("create");
    setEditingItem(null);
    setImageFile(null);
    setForm({
      ...INITIAL_FORM,
      category: categorySelectOptions[0] || DEFAULT_BLOG_CATEGORY,
      authorName: "Everest",
    });
    setIsFormOpen(true);
  }

  function openEditForm(item: BlogItem) {
    setFormMode("edit");
    setEditingItem(item);
    setImageFile(null);
    setForm({
      title: item.title || "",
      excerpt: item.excerpt || "",
      content: item.content || "",
      category: item.category || categorySelectOptions[0] || DEFAULT_BLOG_CATEGORY,
      tags: (item.tags || []).join(", "),
      authorName: item.authorName || "",
      isFeatured: Boolean(item.isFeatured),
      isPublished: item.isPublished !== false,
      publishedAt: toDatetimeLocal(item.publishedAt),
    });
    setIsFormOpen(true);
  }

  function closeForm(force = false) {
    if (submitting && !force) return;
    setIsFormOpen(false);
    setEditingItem(null);
    setImageFile(null);
  }

  function buildBlogBody(): BlogBody {
    const tags = form.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    const body: BlogBody = {
      title: form.title.trim(),
      excerpt: form.excerpt.trim(),
      content: form.content,
      category: form.category,
      tags,
      authorName: form.authorName.trim(),
      isFeatured: form.isFeatured,
      isPublished: form.isPublished,
    };

    if (form.publishedAt) {
      body.publishedAt = new Date(form.publishedAt).toISOString();
    }

    if (imageFile) {
      body.image = imageFile;
    }

    return body;
  }

  async function handleSubmit() {
    const plainContent = form.content.replace(/<[^>]*>/g, "").trim();

    if (!form.title.trim()) {
      toast.warning("Vui lòng nhập tiêu đề bài viết");
      return;
    }

    if (!form.category) {
      toast.warning("Vui lòng chọn chuyên mục blog");
      return;
    }

    if (!plainContent) {
      toast.warning("Vui lòng nhập nội dung bài viết");
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage("");
      const body = buildBlogBody();

      if (formMode === "edit" && editingItem) {
        await blogApi.update(editingItem._id, body);
      } else {
        await blogApi.create(body);
      }

      closeForm(true);
      await loadBlogs();
      toast.success(
        formMode === "edit"
          ? "Cập nhật bài viết thành công"
          : "Tạo bài viết thành công"
      );
    } catch (error) {
      console.error(error);
      const message = getErrorMessage(error, "Không lưu được bài viết");
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleTogglePublished(item: BlogItem) {
    try {
      setBusyPostId(item._id);
      setErrorMessage("");
      const nextPublished = item.isPublished === false;
      const body: Partial<BlogBody> = { isPublished: nextPublished };
      if (nextPublished) {
        body.publishedAt = item.publishedAt || new Date().toISOString();
      }
      await blogApi.update(item._id, body);
      await loadBlogs();
      toast.success(nextPublished ? "Đã xuất bản bài viết" : "Đã ẩn bài viết");
    } catch (error) {
      console.error(error);
      const message = getErrorMessage(
        error,
        "Không cập nhật được trạng thái bài viết"
      );
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setBusyPostId(null);
    }
  }

  async function handleDelete(item: BlogItem) {
    showAdminConfirmToast({
      message: `Xóa bài viết "${item.title}"?`,
      description: "Bài viết sẽ được chuyển sang tab Đã xóa.",
      confirmLabel: "Xóa",
      onConfirm: async () => {
        try {
          setBusyPostId(item._id);
          setErrorMessage("");
          await blogApi.remove(item._id);
          await loadBlogs();
          toast.success("Đã xóa bài viết");
        } catch (error) {
          console.error(error);
          const message = getErrorMessage(error, "Không xóa được bài viết");
          setErrorMessage(message);
          toast.error(message);
        } finally {
          setBusyPostId(null);
        }
      },
    });
  }

  async function handleRestore(item: BlogItem) {
    showAdminConfirmToast({
      message: `Khôi phục bài viết "${item.title}"?`,
      confirmLabel: "Khôi phục",
      onConfirm: async () => {
        try {
          setBusyPostId(item._id);
          setErrorMessage("");
          await blogApi.restore(item._id);
          await loadBlogs();
          toast.success("Khôi phục bài viết thành công");
        } catch (error) {
          console.error(error);
          const message = getErrorMessage(error, "Không khôi phục được bài viết");
          setErrorMessage(message);
          toast.error(message);
        } finally {
          setBusyPostId(null);
        }
      },
    });
  }

  async function handleForceDelete(item: BlogItem) {
    showAdminConfirmToast({
      message: `Xóa vĩnh viễn bài viết "${item.title}"?`,
      description: "Hành động này không thể hoàn tác.",
      confirmLabel: "Xóa vĩnh viễn",
      onConfirm: async () => {
        try {
          setBusyPostId(item._id);
          setErrorMessage("");
          await blogApi.forceRemove(item._id);
          await loadBlogs();
          toast.success("Đã xóa vĩnh viễn bài viết");
        } catch (error) {
          console.error(error);
          const message = getErrorMessage(
            error,
            "Không xóa vĩnh viễn được bài viết"
          );
          setErrorMessage(message);
          toast.error(message);
        } finally {
          setBusyPostId(null);
        }
      },
    });
  }

  function resetCategoryForm() {
    setEditingCategory(null);
    setCategoryForm({
      name: "",
      description: "",
      isActive: true,
    });
  }

  function openCategoryModal() {
    resetCategoryForm();
    setIsCategoryOpen(true);
  }

  function startEditCategory(item: BlogCategoryItem) {
    setEditingCategory(item);
    setCategoryForm({
      name: item.name || "",
      description: item.description || "",
      isActive: item.isActive !== false,
    });
  }

  async function handleSubmitCategory() {
    if (!categoryForm.name.trim()) {
      toast.warning("Vui lòng nhập tên chuyên mục");
      return;
    }

    try {
      setCategorySubmitting(true);
      setErrorMessage("");
      const body = {
        name: categoryForm.name.trim(),
        description: categoryForm.description.trim(),
        isActive: categoryForm.isActive,
      };

      if (editingCategory) {
        await blogApi.updateCategory(editingCategory._id, body);
      } else {
        await blogApi.createCategory(body);
      }

      resetCategoryForm();
      await loadCategories();
      toast.success(
        editingCategory
          ? "Cập nhật chuyên mục thành công"
          : "Tạo chuyên mục thành công"
      );
    } catch (error) {
      console.error(error);
      const message = getErrorMessage(error, "Không lưu được chuyên mục blog");
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setCategorySubmitting(false);
    }
  }

  async function handleDeleteCategory(item: BlogCategoryItem) {
    showAdminConfirmToast({
      message: `Xóa chuyên mục "${item.name}"?`,
      confirmLabel: "Xóa",
      onConfirm: async () => {
        try {
          setCategorySubmitting(true);
          setErrorMessage("");
          await blogApi.removeCategory(item._id);
          await loadCategories();
          toast.success("Đã xóa chuyên mục blog");
        } catch (error) {
          console.error(error);
          const message = getErrorMessage(error, "Không xóa được chuyên mục blog");
          setErrorMessage(message);
          toast.error(message);
        } finally {
          setCategorySubmitting(false);
        }
      },
    });
  }

  void handleDelete;
  void handleRestore;
  void handleForceDelete;
  void handleDeleteCategory;

  const filterSections: AdminFilterSection[] = [
    {
      id: "status",
      title: "Trạng thái",
      options: [
        {
          id: "status-published",
          label: "Đã xuất bản",
          checked: statusFilters.includes("PUBLISHED"),
          onToggle: () =>
            toggleArrayValue(statusFilters, "PUBLISHED", setStatusFilters),
        },
        {
          id: "status-draft",
          label: "Bản nháp",
          checked: statusFilters.includes("DRAFT"),
          onToggle: () => toggleArrayValue(statusFilters, "DRAFT", setStatusFilters),
        },
      ],
    },
    {
      id: "category",
      title: "Chuyên mục",
      options: categories.length
        ? categories.map((category) => ({
            id: `category-${category._id}`,
            label: category.name || "-",
            checked: categoryFilters.includes(category._id),
            onToggle: () =>
              toggleArrayValue(categoryFilters, category._id, setCategoryFilters),
          }))
        : [
            {
              id: "category-empty",
              label: "Chưa có chuyên mục",
              checked: false,
              disabled: true,
              onToggle: () => undefined,
            },
          ],
    },
    {
      id: "display",
      title: "Hiển thị",
      options: [
        {
          id: "display-hot",
          label: "Nổi bật",
          checked: hotFilters.includes("HOT"),
          onToggle: () => toggleArrayValue(hotFilters, "HOT", setHotFilters),
        },
        {
          id: "display-normal",
          label: "Bình thường",
          checked: hotFilters.includes("NORMAL"),
          onToggle: () => toggleArrayValue(hotFilters, "NORMAL", setHotFilters),
        },
      ],
    },
  ];

  const tableColumns: AdminTableColumn<BlogItem, BlogSortBy>[] = [
    {
      id: "post",
      label: "Bài viết",
      sortKey: "title",
      widthClassName: "w-[32%]",
      render: (item) => (
        <AdminEntityCell
          title={
            <span className="inline-flex min-w-0 items-center gap-2">
              <span className="truncate">{item.title || "--"}</span>
              {item.isFeatured ? (
                <Star className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400" />
              ) : null}
            </span>
          }
          subtitle={item.excerpt || "Không có mô tả ngắn"}
          image={isAllowedImage(item.image) ? item.image : undefined}
          icon={<FileText className="h-4 w-4 text-slate-500 dark:text-slate-300" />}
        />
      ),
    },
    {
      id: "category",
      label: "Chuyên mục",
      widthClassName: "w-[14%]",
      render: (item) => {
        const category = categoryByName.get(item.category || "");

        return (
          <div className="min-w-0">
            <div className="truncate font-medium text-slate-900 dark:text-slate-100">
              {item.category || "-"}
            </div>
            <div className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
              {category?.slug || "-"}
            </div>
          </div>
        );
      },
    },
    {
      id: "status",
      label: "Trạng thái",
      sortKey: "status",
      widthClassName: "w-[13%]",
      render: (item) => (
        <div className="flex flex-col items-start gap-1.5">
          <AdminStatusBadge
            tone={item.isPublished === false ? "danger" : "success"}
          >
            {item.isPublished === false ? "Bản nháp" : "Đã xuất bản"}
          </AdminStatusBadge>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {item.isFeatured ? "Nổi bật" : "Bình thường"}
          </span>
        </div>
      ),
    },
    {
      id: "publishedAt",
      label: "Ngày đăng",
      sortKey: "publishedAt",
      widthClassName: "w-[14%]",
      render: (item) => formatDateTime(item.publishedAt),
    },
    {
      id: "updatedAt",
      label: viewMode === "deleted" ? "Đã xóa" : "Cập nhật",
      sortKey: viewMode === "deleted" ? "deletedAt" : "updatedAt",
      widthClassName: "w-[14%]",
      render: (item) =>
        formatDateTime(viewMode === "deleted" ? item.deletedAt : item.updatedAt),
    },
    {
      id: "actions",
      label: <div className="text-right">Thao tác</div>,
      widthClassName: "w-[13%]",
      align: "right",
      render: (item) => {
        const isBusy = busyPostId === item._id;

        return (
          <div className="flex items-center justify-end gap-1">
                <AdminActionIconButton
                  title="Sửa"
                  onClick={() => openEditForm(item)}
                  disabled={isBusy}
                >
                  <Pencil className="h-4 w-4" />
                </AdminActionIconButton>
                <AdminActionIconButton
                  title="Xem bài viết"
                  onClick={() =>
                    window.open(
                      getPublicPostHref(item),
                      "_blank",
                      "noopener,noreferrer"
                    )
                  }
                  disabled={isBusy || item.isPublished === false}
                >
                  <ExternalLink className="h-4 w-4" />
                </AdminActionIconButton>
                <AdminActionIconButton
                  title={item.isPublished === false ? "Xuất bản" : "Ẩn bài viết"}
                  onClick={() => void handleTogglePublished(item)}
                  disabled={isBusy}
                >
                  {item.isPublished === false ? (
                    <Eye className="h-4 w-4" />
                  ) : (
                    <EyeOff className="h-4 w-4" />
                  )}
                </AdminActionIconButton>
          </div>
        );
      },
    },
  ];

  return (
    <>
      <div className="space-y-5">
        {errorMessage ? (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-600 dark:text-red-300">
            {errorMessage}
          </div>
        ) : null}

        <AdminListTable<BlogItem, BlogSortBy>
          rows={pagedItems}
          columns={tableColumns}
          rowKey={(item) => item._id}
          loading={loading}
          searchValue={search}
          searchPlaceholder="Tìm theo tiêu đề, mô tả, chuyên mục..."
          onSearchChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          filterSections={filterSections}
          activeFilterCount={activeFilterCount}
          onApplyFilters={() => setPage(1)}
          onClearFilters={clearFilters}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortChange={(nextSortBy, nextSortOrder) => {
            setSortBy(nextSortBy);
            setSortOrder(nextSortOrder);
            setPage(1);
          }}
          onReload={() => void loadBlogs()}
          toolbarEnd={
            <button
              type="button"
              onClick={openCreateForm}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-sky-600 px-5 text-sm font-semibold text-white transition hover:bg-sky-700"
            >
              <Plus className="h-4.5 w-4.5" />
              Thêm bài viết
            </button>
          }
          pagination={{
            currentPage,
            totalPages,
            totalItems: sortedItems.length,
            pageSize,
            onPageSizeChange: (nextPageSize) => {
              setPageSize(nextPageSize);
              setPage(1);
            },
            onPageChange: setPage,
            pageSizeOptions: PAGE_SIZE_OPTIONS,
          }}
          emptyText="Chưa có bài viết nào."
          labels={{
            apply: "Áp dụng",
            clear: "Xóa",
            filter: "Bộ lọc",
            loading: "Đang tải bài viết...",
            noData: "Không có dữ liệu",
            of: "trên",
            reload: "Tải lại",
            rows: "Dòng",
            search: "Tìm kiếm",
            showing: "Hiển thị",
          }}
          tableMinWidthClassName="min-w-full"
        />
      </div>

      {isCategoryOpen ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 px-4 py-6 backdrop-blur-sm dark:bg-slate-950/70">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-slate-950">
            <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5 dark:border-white/10">
              <div>
                <h2 className="text-xl font-semibold text-slate-950 dark:text-white">
                  Chuyên mục blog
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Tạo chuyên mục để chọn khi viết bài Góc kiến thức.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCategoryOpen(false)}
                disabled={categorySubmitting}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:opacity-60 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[calc(92vh-154px)] overflow-y-auto p-6">
              <div className="rounded-2xl border border-slate-200 p-4 dark:border-white/10">
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">
                      Tên chuyên mục <span className="text-rose-600">*</span>
                    </span>
                    <input
                      value={categoryForm.name}
                      onChange={(event) =>
                        setCategoryForm((prev) => ({
                          ...prev,
                          name: event.target.value,
                        }))
                      }
                      className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none transition focus:border-sky-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
                      placeholder="Phương pháp học"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">
                      Mô tả
                    </span>
                    <input
                      value={categoryForm.description}
                      onChange={(event) =>
                        setCategoryForm((prev) => ({
                          ...prev,
                          description: event.target.value,
                        }))
                      }
                      className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none transition focus:border-sky-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
                      placeholder="Mô tả ngắn"
                    />
                  </label>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <label className="inline-flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
                    <input
                      type="checkbox"
                      checked={categoryForm.isActive}
                      onChange={(event) =>
                        setCategoryForm((prev) => ({
                          ...prev,
                          isActive: event.target.checked,
                        }))
                      }
                      className="h-4 w-4 rounded border-slate-300"
                    />
                    Hiển thị
                  </label>
                  <button
                    type="button"
                    onClick={() => void handleSubmitCategory()}
                    disabled={categorySubmitting}
                    className="inline-flex h-10 items-center justify-center rounded-xl bg-sky-600 px-4 text-sm font-bold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {categorySubmitting
                      ? "Đang lưu..."
                      : editingCategory
                      ? "Lưu chuyên mục"
                      : "Tạo chuyên mục"}
                  </button>
                  {editingCategory ? (
                    <button
                      type="button"
                      onClick={resetCategoryForm}
                      disabled={categorySubmitting}
                      className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10"
                    >
                      Hủy sửa
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10">
                <table className="w-full min-w-[640px] text-left">
                  <thead className="bg-slate-50 text-xs font-black uppercase tracking-[0.08em] text-slate-500 dark:bg-white/5">
                    <tr>
                      <th className="px-4 py-3">Chuyên mục</th>
                      <th className="px-4 py-3">Trạng thái</th>
                      <th className="px-4 py-3 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                    {categoryLoading ? (
                      <tr>
                        <td
                          colSpan={3}
                          className="px-4 py-8 text-center text-sm font-semibold text-slate-500"
                        >
                          Đang tải chuyên mục...
                        </td>
                      </tr>
                    ) : categories.length ? (
                      categories.map((item) => (
                        <tr key={item._id}>
                          <td className="px-4 py-3">
                            <p className="font-bold text-slate-900 dark:text-white">
                              {item.name}
                            </p>
                            <p className="mt-1 line-clamp-1 text-sm text-slate-500">
                              {item.description || item.slug || "--"}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={cn(
                                "inline-flex rounded-full px-3 py-1 text-xs font-black",
                                item.isActive === false
                                  ? "bg-slate-100 text-slate-600"
                                  : "bg-emerald-100 text-emerald-700"
                              )}
                            >
                              {item.isActive === false ? "Ẩn" : "Hiển thị"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-2">
                              <AdminActionIconButton
                                title="Sửa chuyên mục"
                                onClick={() => startEditCategory(item)}
                              >
                                <Pencil className="h-4 w-4" />
                              </AdminActionIconButton>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={3}
                          className="px-4 py-8 text-center text-sm font-semibold text-slate-500"
                        >
                          Chưa có chuyên mục blog.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {isFormOpen ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 px-4 py-6 backdrop-blur-sm dark:bg-slate-950/70">
          <div className="flex max-h-[92vh] w-full max-w-[min(74rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-slate-950">
            <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5 dark:border-white/10">
              <div>
                <h2 className="text-xl font-semibold text-slate-950 dark:text-white">
                  {formMode === "create" ? "Thêm bài viết" : "Sửa bài viết"}
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Bài viết đã xuất bản sẽ hiển thị ở Góc kiến thức.
                </p>
              </div>
              <button
                type="button"
                onClick={() => closeForm()}
                disabled={submitting}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:opacity-60 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
                <label className="xl:col-span-6">
                  <span className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">
                    Tiêu đề <span className="text-red-500">*</span>
                  </span>
                  <input
                    value={form.title}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, title: event.target.value }))
                    }
                    placeholder="Tiêu đề"
                    className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-slate-400 dark:border-white/10 dark:bg-white/5 dark:text-white"
                  />
                </label>

                <label className="xl:col-span-3">
                  <span className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">
                    Chuyên mục <span className="text-red-500">*</span>
                  </span>
                  <div className="relative">
                    <select
                      value={form.category}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          category: event.target.value,
                        }))
                      }
                      className="h-11 w-full appearance-none rounded-xl border border-slate-300 bg-white px-4 pr-10 text-sm outline-none transition focus:border-slate-400 dark:border-white/10 dark:bg-slate-900 dark:text-white"
                    >
                      {!categorySelectOptions.length ? (
                        <option value="">Chưa có chuyên mục</option>
                      ) : null}
                      {categorySelectOptions.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  </div>
                </label>

                <label className="xl:col-span-3">
                  <span className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">
                    Trạng thái
                  </span>
                  <div className="relative">
                    <select
                      value={form.isPublished ? "PUBLISHED" : "DRAFT"}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          isPublished: event.target.value === "PUBLISHED",
                        }))
                      }
                      className="h-11 w-full appearance-none rounded-xl border border-slate-300 bg-white px-4 pr-10 text-sm outline-none transition focus:border-slate-400 dark:border-white/10 dark:bg-slate-900 dark:text-white"
                    >
                      <option value="DRAFT">Chưa xuất bản</option>
                      <option value="PUBLISHED">Đã xuất bản</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  </div>
                </label>

                <label className="xl:col-span-4">
                  <span className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">
                    Ngày đăng
                  </span>
                  <input
                    type="datetime-local"
                    value={form.publishedAt}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        publishedAt: event.target.value,
                      }))
                    }
                    className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-slate-400 dark:border-white/10 dark:bg-white/5 dark:text-white"
                  />
                </label>

                <label className="xl:col-span-4">
                  <span className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">
                    Tác giả
                  </span>
                  <input
                    value={form.authorName}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        authorName: event.target.value,
                      }))
                    }
                    placeholder="Everest"
                    className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-slate-400 dark:border-white/10 dark:bg-white/5 dark:text-white"
                  />
                </label>

                <label className="xl:col-span-4">
                  <span className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">
                    Ảnh đại diện
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) =>
                      setImageFile(event.target.files?.[0] || null)
                    }
                    className="block h-11 w-full rounded-xl border border-slate-300 px-4 py-2 text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-sky-50 file:px-3 file:py-1 file:text-sm file:font-bold file:text-sky-700 dark:border-white/10 dark:bg-white/5 dark:text-white"
                  />
                </label>
              </div>

              <div className="mt-4 grid grid-cols-1 items-stretch gap-4 xl:grid-cols-12">
                <label className="flex h-full flex-col xl:col-span-9">
                  <span className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">
                    Tóm tắt
                  </span>
                  <textarea
                    value={form.excerpt}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        excerpt: event.target.value,
                      }))
                    }
                    placeholder="Tóm tắt"
                    className="min-h-[124px] flex-1 resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400 dark:border-white/10 dark:bg-white/5 dark:text-white"
                  />
                </label>

                <div className="flex h-full flex-col xl:col-span-3">
                  <span className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">
                    Hiển thị
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={form.isFeatured}
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        isFeatured: !prev.isFeatured,
                      }))
                    }
                    className={cn(
                      "inline-flex h-9 w-fit items-center gap-2 rounded-xl border px-2.5 text-sm font-semibold transition",
                      form.isFeatured
                        ? "border-sky-500/40 bg-sky-50 text-sky-700 dark:border-sky-500/40 dark:bg-sky-500/15 dark:text-sky-200"
                        : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-white/10"
                    )}
                  >
                    <span
                      className={cn(
                        "relative inline-flex h-5 w-9 items-center rounded-full transition",
                        form.isFeatured ? "bg-sky-500" : "bg-slate-300"
                      )}
                    >
                      <span
                        className={cn(
                          "inline-block h-4 w-4 transform rounded-full bg-white shadow transition",
                          form.isFeatured ? "translate-x-4" : "translate-x-0.5"
                        )}
                      />
                    </span>
                    <span className="whitespace-nowrap">Nổi bật</span>
                  </button>

                  <label className="mt-4 block">
                    <span className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">
                      Tags
                    </span>
                    <input
                      value={form.tags}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, tags: event.target.value }))
                      }
                      placeholder="ielts, tự học"
                      className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-slate-400 dark:border-white/10 dark:bg-white/5 dark:text-white"
                    />
                  </label>
                </div>
              </div>

              <div className="mt-4">
                <span className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">
                  Nội dung <span className="text-red-500">*</span>
                </span>
                <RichContentEditor
                  value={form.content}
                  onChange={(content) =>
                    setForm((prev) => ({
                      ...prev,
                      content,
                    }))
                  }
                />
              </div>

              {!categorySelectOptions.length ? (
                <p className="mt-4 text-sm font-semibold text-amber-600">
                  Vui lòng tạo chuyên mục trước khi thêm bài viết.
                </p>
              ) : null}
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4 dark:border-white/10">
              <button
                type="button"
                onClick={() => closeForm()}
                disabled={submitting}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => void handleSubmit()}
                disabled={submitting || !categorySelectOptions.length}
                className="inline-flex h-10 items-center justify-center rounded-xl bg-sky-600 px-5 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Đang lưu..." : "Lưu"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
