"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { BookOpen, MessageCircle, X } from "lucide-react";

import { categoryApi, type CategoryItem } from "@/app/api/category.api";
import { classroomApi } from "@/app/api/classroom.api";
import {
  productApi,
  type ProductItem,
  type ProductMode,
  type ProductStatus,
} from "@/app/api/course.api";
import { walletApi } from "@/app/api/wallet.api";
import { useAuth } from "@/hooks/auth/useAuth";
import { emitWalletBalanceChanged } from "@/lib/utils/wallet-events";

const FALLBACK_COURSE_IMAGES = [
  "/Program/FeaturedCourses/course-4.png",
  "/Program/FeaturedCourses/course-1.jpg",
  "/Program/FeaturedCourses/course-2.webp",
  "/Program/FeaturedCourses/course-3.jpg",
  "/Program/Catalog/math-thinking.jpg",
  "/Program/Catalog/english-speaking.jpg",
  "/Program/Catalog/programming-basic.png",
  "/home/programs/program-1.png",
  "/home/programs/program-2.png",
  "/home/programs/program-3.png",
  "/home/programs/program-4.png",
];

const SECTION_ACCENTS = ["bg-[#0D8DFF]", "bg-[#18BD78]", "bg-[#FF5A45]", "bg-[#8B5CF6]"];

type CourseSection = {
  id: string;
  title: string;
  courses: ProductItem[];
};

type ApiError = {
  response?: {
    status?: number;
    data?: {
      message?: string;
      error?: string;
    };
  };
  message?: string;
};

function getErrorMessage(error: unknown, fallback: string) {
  if (typeof error === "object" && error !== null) {
    const apiError = error as ApiError;
    return (
      apiError.response?.data?.message ||
      apiError.response?.data?.error ||
      apiError.message ||
      fallback
    );
  }

  return fallback;
}

function getCategoryId(category: ProductItem["category"]) {
  return typeof category === "string" ? category : category?._id || "";
}

function getCategoryName(category: ProductItem["category"], categories: CategoryItem[]) {
  if (typeof category !== "string") return category?.name || "Danh mục";
  return categories.find((item) => item._id === category)?.name || "Danh mục";
}

function getStatusLabel(status: ProductStatus) {
  if (status === "OPEN") return "Đang mở";
  if (status === "COMING") return "Sắp mở";
  return "Đã đầy";
}

function formatPrice(value?: number) {
  return `${Number(value || 0).toLocaleString("vi-VN")}đ`;
}

function getModeLabel(mode: ProductMode) {
  return mode === "OFFLINE" ? "Offline" : "Online";
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

function getCourseImage(item: ProductItem, index: number) {
  if (isAllowedImage(item.image)) return item.image || "";
  return FALLBACK_COURSE_IMAGES[index % FALLBACK_COURSE_IMAGES.length];
}

function formatStudentCount(value?: number) {
  return Number(value || 0).toLocaleString("vi-VN");
}

function buildCourseSections(products: ProductItem[], categories: CategoryItem[]) {
  const activeProducts = products.filter(
    (item) => item.isActive !== false && !item.isDeleted
  );

  const sections: CourseSection[] = categories
    .map((category) => ({
      id: category._id,
      title: category.name,
      courses: activeProducts.filter(
        (course) => getCategoryId(course.category) === category._id
      ),
    }))
    .filter((section) => section.courses.length > 0);

  const groupedIds = new Set(sections.flatMap((section) => section.courses.map((item) => item._id)));
  const remainingCourses = activeProducts.filter((item) => !groupedIds.has(item._id));

  if (remainingCourses.length) {
    sections.push({
      id: "other",
      title: "Khóa học khác",
      courses: remainingCourses,
    });
  }

  if (!sections.length && activeProducts.length) {
    return [
      {
        id: "featured",
        title: "Khóa học nổi bật",
        courses: activeProducts,
      },
    ];
  }

  return sections.slice(0, 4).map((section) => ({
    ...section,
    courses: section.courses.slice(0, 10),
  }));
}

function CourseCard({
  course,
  index,
  categories,
}: {
  course: ProductItem;
  index: number;
  categories: CategoryItem[];
}) {
  const image = getCourseImage(course, index);

  return (
    <Link
      href={`/khoa-hoc/${course._id}`}
      className="group overflow-hidden rounded-[4px] border border-slate-200 bg-white text-left shadow-[0_3px_10px_rgba(15,23,42,0.12)] transition hover:-translate-y-0.5 hover:border-[#0D56A6]/40 hover:shadow-[0_8px_18px_rgba(15,23,42,0.16)]"
    >
      <div className="relative h-[126px] overflow-hidden bg-[#eaf6ff]">
        {image ? (
          <Image
            src={image}
            alt={course.title}
            fill
            sizes="(max-width: 640px) 50vw, 180px"
            className="object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-400">
            <BookOpen className="h-8 w-8" />
          </div>
        )}

        <span className="absolute left-1.5 top-1.5 rounded-[2px] bg-red-500 px-1.5 py-0.5 text-[9px] font-black text-white">
          {getStatusLabel(course.status)}
        </span>
        <span className="absolute right-1.5 top-1.5 rounded-[2px] bg-white/90 px-1.5 py-0.5 text-[9px] font-black text-[#0D56A6]">
          {getCategoryName(course.category, categories)}
        </span>
      </div>

      <div className="p-3">
        <h3 className="line-clamp-2 min-h-10 text-[13px] font-bold leading-5 text-slate-800">
          {course.title}
        </h3>
        <p className="mt-1 line-clamp-1 text-[11px] font-medium text-[#0D56A6]">
          {course.durationText || course.shortDescription || "Đang cập nhật"}
        </p>
        <div className="mt-2 space-y-1 text-[10px] font-medium text-slate-500">
          <p className="flex items-center gap-1">
            <MessageCircle className="h-3 w-3 text-sky-500" />
            {formatStudentCount(course.studentCount)} học viên
          </p>
        </div>
      </div>
    </Link>
  );
}

function CourseSectionBlock({
  section,
  index,
  categories,
}: {
  section: CourseSection;
  index: number;
  categories: CategoryItem[];
}) {
  return (
    <section className="mx-auto max-w-[1180px] px-4 py-3">
      <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-slate-800">
        <span className={`h-7 w-[3px] ${SECTION_ACCENTS[index % SECTION_ACCENTS.length]}`} />
        {section.title}
      </h2>

      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {section.courses.map((course, courseIndex) => (
          <CourseCard
            key={course._id}
            course={course}
            index={courseIndex}
            categories={categories}
          />
        ))}
      </div>
    </section>
  );
}

export function CourseDetailView({
  course,
  index,
  categories,
  onClose,
}: {
  course: ProductItem;
  index: number;
  categories: CategoryItem[];
  onClose: () => void;
}) {
  const { user } = useAuth();
  const availableModes = useMemo<ProductMode[]>(
    () => (course.modes?.length ? course.modes : ["ONLINE"]),
    [course.modes]
  );
  const [selectedMode, setSelectedMode] = useState<ProductMode>(
    availableModes[0] || "ONLINE"
  );
  const [balance, setBalance] = useState(0);
  const [walletLoading, setWalletLoading] = useState(true);
  const [classLoading, setClassLoading] = useState(true);
  const [classModes, setClassModes] = useState<ProductMode[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [topupLoading, setTopupLoading] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const image = getCourseImage(course, index);
  const price = Number(course.price || 0);
  const missingAmount = Math.max(price - balance, 0);
  const enabledModes = useMemo(
    () => availableModes.filter((mode) => classModes.includes(mode)),
    [availableModes, classModes]
  );
  const selectableModes = classLoading ? availableModes : enabledModes;
  const selectedModeAvailable = selectableModes.includes(selectedMode);
  const canRegister =
    course.status === "OPEN" &&
    course.isActive !== false &&
    missingAmount <= 0 &&
    selectedModeAvailable &&
    !classLoading &&
    !submitting;
  const canOpenRegister =
    course.status === "OPEN" &&
    course.isActive !== false &&
    missingAmount <= 0 &&
    selectedModeAvailable &&
    !classLoading;

  useEffect(() => {
    setFormName(user?.name || "");
    setFormEmail(user?.email || "");
  }, [user?.email, user?.name]);

  useEffect(() => {
    const nextMode = selectableModes.includes(selectedMode)
      ? selectedMode
      : selectableModes[0] || availableModes[0] || "ONLINE";
    setSelectedMode(nextMode);
  }, [availableModes, selectableModes, selectedMode]);

  useEffect(() => {
    let mounted = true;

    async function loadClasses() {
      try {
        setClassLoading(true);
        const items = await classroomApi.list({ courseId: course._id });
        if (!mounted) return;

        const nextModes = Array.from(
          new Set(
            items
              .filter((item) => item.isActive !== false && item.isDeleted !== true)
              .map((item) => item.mode)
              .filter((mode): mode is ProductMode => mode === "ONLINE" || mode === "OFFLINE")
          )
        );
        setClassModes(nextModes);
      } catch {
        if (mounted) setClassModes([]);
      } finally {
        if (mounted) setClassLoading(false);
      }
    }

    void loadClasses();

    return () => {
      mounted = false;
    };
  }, [course._id]);

  useEffect(() => {
    let mounted = true;

    async function loadWallet() {
      try {
        setWalletLoading(true);
        const data = await walletApi.getMine();
        if (mounted) setBalance(Number(data.balance || 0));
      } catch (err) {
        if (mounted) {
          setError(getErrorMessage(err, "Vui lòng đăng nhập để xem số dư ví."));
        }
      } finally {
        if (mounted) setWalletLoading(false);
      }
    }

    void loadWallet();

    return () => {
      mounted = false;
    };
  }, []);

  async function handleTopup() {
    if (typeof window !== "undefined") {
      window.location.href = "/nap-tien";
      return;
    }

    if (missingAmount <= 0 || topupLoading) return;

    try {
      setTopupLoading(true);
      setError("");
      setMessage("");
      const data = await walletApi.topup({ amount: missingAmount });
      setBalance(Number(data.balance || 0));
      emitWalletBalanceChanged();
      setMessage("Đã nạp đủ số dư để đăng ký khóa học.");
    } catch (err) {
      setError(getErrorMessage(err, "Không thể nạp tiền vào ví."));
    } finally {
      setTopupLoading(false);
    }
  }

  function handleOpenRegister() {
    setError("");
    setMessage("");

    if (!user) {
      setError("Vui lòng đăng nhập để đăng ký khóa học.");
      return;
    }

    if (!canOpenRegister) return;
    setRegisterOpen(true);
  }

  async function handleEnroll() {
    if (!canRegister) return false;

    try {
      setSubmitting(true);
      setError("");
      setMessage("");
      const data = await walletApi.enroll({
        courseId: course._id,
        mode: selectedMode,
      });
      setBalance(Number(data.balance || 0));
      emitWalletBalanceChanged();
      setMessage("Đăng ký khóa học thành công.");
      setRegisterOpen(false);
      return true;
    } catch (err) {
      setError(getErrorMessage(err, "Không thể đăng ký khóa học."));
      return false;
    } finally {
      setSubmitting(false);
    }
  }

  const categoryName = getCategoryName(course.category, categories);
  const courseSummary =
    course.shortDescription ||
    "Nội dung khóa học được thiết kế theo lộ trình rõ ràng, giúp học viên học chắc kiến thức và thực hành hiệu quả.";

  return (
    <section className="mx-auto max-w-[1180px] px-4 py-6">
      <button
        type="button"
        onClick={onClose}
        className="mb-4 inline-flex h-10 items-center rounded-[4px] border border-slate-200 bg-white px-4 text-sm font-bold text-[#0D56A6] transition hover:border-[#0D56A6] hover:bg-sky-50"
      >
        Quay lại danh sách
      </button>

      <div className="mb-5 flex flex-wrap items-center gap-2 text-sm text-slate-500">
        <span className="font-semibold text-[#0D56A6]">Trang chủ</span>
        <span>&gt;</span>
        <span className="font-semibold text-[#0D56A6]">{categoryName}</span>
        <span>&gt;</span>
        <span className="font-medium text-slate-700">{course.title}</span>
      </div>

      <div className="grid gap-7 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <article>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#0D56A6]">
            {categoryName}
          </p>
          <h1 className="mt-3 text-3xl font-semibold leading-tight text-slate-700">
            {course.title}
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-6 text-slate-600">
            {courseSummary}
          </p>
          <div className="relative mt-4 aspect-video overflow-hidden rounded-[2px] border border-slate-300 bg-slate-100">
            {image ? (
              <Image
                src={image}
                alt={course.title}
                fill
                sizes="(max-width: 1024px) 100vw, 760px"
                className="object-cover"
                priority
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <BookOpen className="h-12 w-12 text-slate-400" />
              </div>
            )}
          </div>
        </article>

        <aside className="lg:pt-[118px]">
          <div className="rounded-[2px] border border-slate-200 bg-white shadow-sm">
            <div className="bg-[#2196E8] px-4 py-3 text-sm font-bold text-white">
              Đăng ký khóa học
            </div>
            <div className="space-y-4 bg-[#E8F4FF] px-4 py-4">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-slate-600">Học phí</span>
                <span className="text-xl font-bold text-orange-600">
                  {formatPrice(price)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-slate-600">Trạng thái</span>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                  {getStatusLabel(course.status)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-slate-600">Thời lượng</span>
                <span className="text-sm font-bold text-slate-900">
                  {course.durationText || "Đang cập nhật"}
                </span>
              </div>
            </div>
          </div>

          {error ? (
            <p className="mt-3 rounded-[4px] bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">
              {error}
            </p>
          ) : null}
          {message ? (
            <p className="mt-3 rounded-[4px] bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
              {message}
            </p>
          ) : null}

          <div className="mt-5 grid gap-3">
            {missingAmount > 0 ? (
              <button
                type="button"
                onClick={() => void handleTopup()}
                disabled={topupLoading || walletLoading}
                className="h-12 rounded-[4px] border border-orange-500 bg-white text-base font-black text-orange-600 transition hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {topupLoading ? "Đang nạp..." : "Nạp đủ số dư"}
              </button>
            ) : null}
            <button
              type="button"
              onClick={handleOpenRegister}
              disabled={!canOpenRegister || walletLoading}
              className="h-12 rounded-[4px] bg-orange-500 text-base font-black text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              Đăng kí ngay
            </button>
          </div>

          <div className="mt-6 text-sm leading-6 text-slate-700">
            <p className="font-semibold text-[#0D56A6]">Mục tiêu khóa học:</p>
            <ul className="mt-1 list-disc space-y-1 pl-5">
              <li>Nắm chắc kiến thức trọng tâm của khóa học.</li>
              <li>Thực hành theo lộ trình phù hợp với hình thức học đã chọn.</li>
            </ul>
            <p className="mt-4 font-semibold text-[#0D56A6]">Cấu trúc khóa học:</p>
            <ul className="mt-1 list-disc space-y-1 pl-5">
              <li>{getModeLabel(selectedMode)} tại lớp đang mở.</li>
              <li>{course.durationText || "Thời lượng đang cập nhật"}.</li>
            </ul>
          </div>
        </aside>
      </div>

      {registerOpen ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/55 px-4 py-6">
          <form
            className="w-full max-w-[560px] overflow-hidden rounded-[4px] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.28)]"
            onSubmit={(event) => {
              event.preventDefault();
              void handleEnroll();
            }}
          >
            <div className="relative px-6 pb-5 pt-6">
              <button
                type="button"
                onClick={() => setRegisterOpen(false)}
                aria-label="Đóng"
                className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center text-slate-400 transition hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>

              <h2 className="mx-auto max-w-[420px] text-center text-2xl font-black uppercase leading-8 text-[#0D56A6]">
                Đăng kí khóa học
              </h2>

              <div className="mt-8 space-y-4">
                <input
                  value={formName}
                  readOnly
                  aria-label="Họ và tên"
                  className="h-14 w-full rounded-none border-0 bg-[#D8EAFF] px-5 text-base font-medium text-[#0D56A6] outline-none"
                  placeholder="Họ và tên"
                />
                <input
                  value={formEmail}
                  readOnly
                  aria-label="Email"
                  className="h-14 w-full rounded-none border-0 bg-[#D8EAFF] px-5 text-base font-medium text-[#0D56A6] outline-none"
                  placeholder="Email"
                />
                <select
                  value={selectedMode}
                  onChange={(event) => setSelectedMode(event.target.value as ProductMode)}
                  aria-label="Chọn hình thức học"
                  className="h-14 w-full rounded-none border-0 bg-[#D8EAFF] px-5 text-base font-medium text-slate-700 outline-none"
                >
                  {(["ONLINE", "OFFLINE"] as ProductMode[]).map((mode) => (
                    <option
                      key={mode}
                      value={mode}
                      disabled={!selectableModes.includes(mode)}
                    >
                      {getModeLabel(mode)}
                    </option>
                  ))}
                </select>
              </div>

              {!classLoading && selectableModes.length === 0 ? (
                <p className="mt-4 rounded-[4px] bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">
                  Chưa có lớp phù hợp để đăng ký khóa học này.
                </p>
              ) : null}

              {error ? (
                <p className="mt-4 rounded-[4px] bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={!canRegister || walletLoading}
                className="mt-5 h-14 w-full rounded-none bg-[#0D56A6] text-base font-black uppercase text-white transition hover:bg-[#0B4A8E] disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {submitting ? "Đang đăng kí..." : "Đăng kí ngay"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </section>
  );
}

function CourseSkeleton() {
  return (
    <section className="mx-auto max-w-[1180px] px-4 py-3">
      <div className="mb-3 h-7 w-52 animate-pulse rounded bg-slate-100" />
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: 10 }).map((_, index) => (
          <div
            key={index}
            className="h-[220px] animate-pulse rounded-[4px] border border-slate-200 bg-white shadow-sm"
          >
            <div className="h-[126px] bg-slate-100" />
            <div className="space-y-2 p-3">
              <div className="h-4 rounded bg-slate-100" />
              <div className="h-4 w-2/3 rounded bg-slate-100" />
              <div className="h-3 w-1/2 rounded bg-slate-100" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function HomeCourseSections() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadCourses() {
      try {
        const [categoryRes, productRes] = await Promise.all([
          categoryApi.getAll(),
          productApi.getAll({ limit: 100 }),
        ]);

        if (!mounted) return;
        setCategories(categoryRes.items || []);
        setProducts(productRes.items || []);
      } catch (error) {
        console.error("Load home courses failed:", error);
        if (!mounted) return;
        setCategories([]);
        setProducts([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void loadCourses();

    return () => {
      mounted = false;
    };
  }, []);

  const sections = useMemo(
    () => buildCourseSections(products, categories),
    [products, categories]
  );

  if (loading) {
    return (
      <div id="khoa-hoc" className="scroll-mt-24 bg-white pb-8 pt-6">
        <CourseSkeleton />
      </div>
    );
  }

  if (!sections.length) {
    return (
      <div id="khoa-hoc" className="scroll-mt-24 bg-white pb-8 pt-6">
        <section className="mx-auto max-w-[1180px] px-4 py-8">
          <div className="rounded-[4px] border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-sm font-medium text-slate-500">
            Chưa có khóa học để hiển thị.
          </div>
        </section>
      </div>
    );
  }

  return (
    <div id="khoa-hoc" className="scroll-mt-24 bg-white pb-8 pt-6">
      {sections.map((section, index) => (
        <CourseSectionBlock
          key={section.id}
          section={section}
          index={index}
          categories={categories}
        />
      ))}
    </div>
  );
}
