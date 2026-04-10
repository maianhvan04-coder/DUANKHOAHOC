"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  BrickWallShield,
  CalendarCheck,
  ChevronDown,
  Globe,
  LogOut,
  Search,
  ShoppingCart,
  User,
} from "lucide-react";
import { categoryApi, type CategoryItem } from "@/app/api/category.api";
import { clearToken, clearUser } from "@/lib/utils/storage";
import { useAuth } from "@/hooks/auth/useAuth";
import { hasAnyRole } from "@/lib/helpers/auth/access";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function resolveAvatarUrl(avatar?: string | null): string | null {
  if (!avatar) return null;
  if (/^https?:\/\//i.test(avatar)) return avatar;
  return avatar;
}

const MENU = [
  { label: "Giới thiệu", href: "/gioi-thieu" },
  { label: "Chương trình học", href: "/chuong-trinh-hoc" },
  { label: "Giáo viên", href: "/giang-vien" },
  { label: "Học viên", href: "/hoc-vien" },
  { label: "Góc kiến thức", href: "/goc-kien-thuc" },
];

export default function Navbar() {
  const router = useRouter();
  const profileMenuRef = useRef<HTMLDivElement | null>(null);

  const { user, access, hydrated, isLoading } = useAuth();

  const [scrolled, setScrolled] = useState(false);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [openCourseMenu, setOpenCourseMenu] = useState(false);
  const [openProfileMenu, setOpenProfileMenu] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const checkingAuth = !hydrated || isLoading;
  const isLoggedIn = !!user;

  const canAccessAdmin = hasAnyRole(access, ["ADMIN", "MANAGER", "TEACHER"]);

  useEffect(() => {
    let cancelled = false;
    let rafId = 0;

    const updateScroll = () => {
      const next = window.scrollY > 80;
      setScrolled((prev) => (prev !== next ? next : prev));
    };

    const onScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = window.requestAnimationFrame(updateScroll);
    };

    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const res = await categoryApi.getAll();

        if (cancelled) return;
        setCategories(Array.isArray(res?.items) ? res.items : []);
      } catch {
        if (cancelled) return;
        setCategories([]);
      } finally {
        if (!cancelled) {
          setLoadingCategories(false);
        }
      }
    };

    updateScroll();
    void fetchCategories();

    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!profileMenuRef.current) return;

      if (!profileMenuRef.current.contains(event.target as Node)) {
        setOpenProfileMenu(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenProfileMenu(false);
        setOpenCourseMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      clearToken();
      clearUser();
      setOpenProfileMenu(false);
      router.push("/login");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  };

  const userInitial =
    user?.name?.trim()?.charAt(0)?.toUpperCase() ||
    user?.email?.trim()?.charAt(0)?.toUpperCase() ||
    "Q";

  const userAvatar = resolveAvatarUrl(user?.avatar);

  return (
    <>
      <div aria-hidden="true" className="h-[160px]" />

      <header className="pointer-events-none fixed inset-x-0 top-0 z-50">
        <div className="relative h-[160px] w-full">
          <div
            className={cn(
              "pointer-events-auto absolute inset-x-0 top-0 z-40 border-b border-slate-200 bg-white",
              "transition-[opacity,transform] duration-300 will-change-transform",
              scrolled
                ? "pointer-events-none -translate-y-full opacity-0"
                : "translate-y-0 opacity-100"
            )}
          >
            <div className="mx-auto flex h-[82px] max-w-[1240px] items-center gap-4 px-4 md:px-6">
              <div className="flex shrink-0 items-center gap-3 text-[#0B2C5F] lg:min-w-[180px]">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-[14px]">
                  ☎
                </span>
                <span className="whitespace-nowrap text-[14px] font-semibold">
                  1900636929
                </span>
              </div>

              <div className="min-w-0 flex-1">
                <div className="mx-auto flex h-12 w-full max-w-[560px] items-center rounded-2xl border border-slate-300 bg-white px-4">
                  <Search className="h-5 w-5 shrink-0 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Bạn muốn tìm kiếm khóa học gì?"
                    className="ml-3 w-full min-w-0 bg-transparent text-[14px] text-slate-700 outline-none placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div className="flex shrink-0 items-center justify-end gap-3 text-[#0B2C5F] lg:min-w-[260px]">
                {checkingAuth ? (
                  <div className="h-12 w-[180px]" />
                ) : !isLoggedIn ? (
                  <>
                    <Link
                      href="/login"
                      className="inline-flex h-12 min-w-[132px] items-center justify-center rounded-xl border border-[#0D56A6] bg-white px-5 text-[14px] font-semibold text-[#0D56A6] transition hover:bg-[#F5F9FF]"
                    >
                      Đăng nhập
                    </Link>

                    <Link
                      href="/register"
                      className="inline-flex h-12 min-w-[120px] items-center justify-center rounded-xl bg-[#0D56A6] px-5 text-[14px] font-semibold text-white transition hover:bg-[#0B4A8E]"
                    >
                      Đăng ký
                    </Link>

                    <button
                      type="button"
                      className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#0D56A6] text-[#0D56A6] transition hover:bg-[#0D56A6] hover:text-white"
                      aria-label="Ngôn ngữ"
                    >
                      <Globe className="h-5 w-5" strokeWidth={2} />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className="transition hover:opacity-75"
                      aria-label="Thông báo"
                    >
                      <Bell className="h-6 w-6" strokeWidth={2} />
                    </button>

                    <Link
                      href="/gio-hang"
                      className="transition hover:opacity-75"
                      aria-label="Giỏ hàng"
                    >
                      <ShoppingCart className="h-6 w-6" strokeWidth={2} />
                    </Link>

                    <div ref={profileMenuRef} className="relative">
                      <button
                        type="button"
                        title={user?.name || user?.email || "Tài khoản"}
                        onClick={() => setOpenProfileMenu((prev) => !prev)}
                        className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-[#0B2C5F] transition hover:bg-slate-200"
                        aria-label="Mở menu tài khoản"
                      >
                        {userAvatar ? (
                          <img
                            src={userAvatar}
                            alt={user?.name || "Avatar"}
                            className="h-full w-full object-cover"
                          />
                        ) : user?.name || user?.email ? (
                          <span className="text-[14px] font-bold">
                            {userInitial}
                          </span>
                        ) : (
                          <User className="h-5 w-5" strokeWidth={2} />
                        )}
                      </button>

                      <div
                        className={cn(
                          "absolute right-0 top-[calc(100%+12px)] z-[90] w-[240px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.12)] transition-all duration-200",
                          openProfileMenu
                            ? "visible translate-y-0 opacity-100"
                            : "invisible -translate-y-1 opacity-0"
                        )}
                      >
                        <div className="border-b border-slate-100 px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-[#0B2C5F]">
                              {userAvatar ? (
                                <img
                                  src={userAvatar}
                                  alt={user?.name || "Avatar"}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <span className="text-sm font-bold">
                                  {userInitial}
                                </span>
                              )}
                            </div>

                            <div className="min-w-0">
                              <p className="line-clamp-1 text-[14px] font-semibold text-[#0B2C5F]">
                                {user?.name || "Người dùng"}
                              </p>
                              <p className="line-clamp-1 mt-1 text-[12px] text-slate-500">
                                {user?.email || ""}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="p-2">
                          <Link
                            href="/tai-khoan"
                            onClick={() => setOpenProfileMenu(false)}
                            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-[14px] font-medium text-[#0B2C5F] transition hover:bg-[#F5F9FF] hover:text-[#0D56A6]"
                          >
                            <User className="h-4 w-4" />
                            <span>Tài khoản</span>
                          </Link>

                          <Link
                            href="/lich-hoc"
                            onClick={() => setOpenProfileMenu(false)}
                            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-[14px] font-medium text-[#0B2C5F] transition hover:bg-[#F5F9FF] hover:text-[#0D56A6]"
                          >
                            <CalendarCheck className="h-4 w-4" />
                            <span>Lịch học</span>
                          </Link>

                          {canAccessAdmin && (
                            <Link
                              href="/admin"
                              onClick={() => setOpenProfileMenu(false)}
                              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-[14px] font-medium text-[#0B2C5F] transition hover:bg-[#F5F9FF] hover:text-[#0D56A6]"
                            >
                              <BrickWallShield className="h-4 w-4" />
                              <span>Vào trang Admin</span>
                            </Link>
                          )}

                          <button
                            type="button"
                            onClick={handleLogout}
                            disabled={loggingOut}
                            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-[14px] font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <LogOut className="h-4 w-4" />
                            <span>
                              {loggingOut ? "Đang đăng xuất..." : "Đăng xuất"}
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-[#0D56A6] text-[#0D56A6] transition hover:bg-[#0D56A6] hover:text-white"
                      aria-label="Ngôn ngữ"
                    >
                      <Globe className="h-5 w-5" strokeWidth={2} />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          <div
            className={cn(
              "pointer-events-auto absolute inset-x-0 top-0 z-30 bg-white",
              "transition-[transform,box-shadow] duration-300 will-change-transform",
              scrolled
                ? "translate-y-0 shadow-[0_10px_30px_rgba(15,23,42,0.08)]"
                : "translate-y-[82px]"
            )}
          >
            <div className="mx-auto flex h-[78px] max-w-[1240px] items-center gap-4 px-4 md:px-6">
              <div className="flex shrink-0 items-center justify-start lg:w-[180px]">
                <Link href="/" className="-ml-2 shrink-0">
                  <Image
                    src="/Logo.png"
                    alt="IIG Việt Nam"
                    width={155}
                    height={64}
                    className={cn(
                      "block h-auto object-contain transition-[width] duration-300",
                      scrolled ? "w-[142px]" : "w-[155px]"
                    )}
                    priority
                  />
                </Link>
              </div>

              <div className="min-w-0 flex-1">
                <nav className="hidden items-center justify-center gap-6 lg:flex xl:gap-9">
                  {MENU.slice(0, 2).map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      className="whitespace-nowrap text-[14px] font-semibold text-[#0B2C5F] transition hover:text-[#0D56A6]"
                    >
                      {item.label}
                    </Link>
                  ))}

                  <div
                    className="relative"
                    onMouseEnter={() => setOpenCourseMenu(true)}
                    onMouseLeave={() => setOpenCourseMenu(false)}
                  >
                    <button
                      type="button"
                      onClick={() => setOpenCourseMenu((prev) => !prev)}
                      className="inline-flex items-center gap-1 whitespace-nowrap text-[14px] font-semibold text-[#0B2C5F] transition hover:text-[#0D56A6]"
                    >
                      Khóa học
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 transition-transform duration-200",
                          openCourseMenu && "rotate-180"
                        )}
                      />
                    </button>

                    <div
                      className={cn(
                        "absolute left-1/2 top-full z-50 w-[320px] -translate-x-1/2 pt-3",
                        openCourseMenu
                          ? "visible opacity-100"
                          : "invisible opacity-0"
                      )}
                    >
                      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_16px_40px_rgba(15,23,42,0.12)] transition-all duration-200">
                        {loadingCategories ? (
                          <div className="px-4 py-3 text-[14px] text-slate-500">
                            Đang tải danh mục...
                          </div>
                        ) : categories.length === 0 ? (
                          <div className="px-4 py-3 text-[14px] text-slate-500">
                            Chưa có danh mục
                          </div>
                        ) : (
                          categories.map((category) => (
                            <Link
                              key={category._id}
                              href={`/course#category-${category._id}`}
                              onClick={() => setOpenCourseMenu(false)}
                              className="block rounded-xl px-4 py-3 text-[14px] font-medium text-[#0B2C5F] transition hover:bg-[#F5F9FF] hover:text-[#0D56A6]"
                            >
                              {category.name}
                            </Link>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {MENU.slice(2).map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      className="whitespace-nowrap text-[14px] font-semibold text-[#0B2C5F] transition hover:text-[#0D56A6]"
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>
              </div>

              <div className="flex shrink-0 justify-end lg:w-[180px]">
                {!checkingAuth && isLoggedIn ? (
                  <Link
                    href="/khoa-hoc-cua-toi"
                    className="inline-flex h-11 items-center justify-center rounded-[10px] bg-[#0D56A6] px-6 text-[14px] font-semibold text-white transition hover:bg-[#0B4A8E]"
                  >
                    Khoá học của tôi
                  </Link>
                ) : (
                  <div className="h-11 w-[180px]" />
                )}
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}