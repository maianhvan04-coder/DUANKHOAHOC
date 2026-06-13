"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  BookOpen,
  ChevronDown,
  GraduationCap,
  Mail,
  Phone,
  X,
} from "lucide-react";
import { teacherApi, type TeacherItem } from "@/app/api/teacher.api";

const INITIAL_VISIBLE = 8;
const LOAD_MORE_STEP = 8;

const FALLBACK_IMAGES = [
  "/home/teachers/teacher-1.png",
  "/home/teachers/teacher-2.png",
  "/home/teachers/teacher-3.png",
];

type SelectedTeacherProfile = {
  item: TeacherItem;
  image: string;
};

function formatNumber(value?: number) {
  return new Intl.NumberFormat("vi-VN").format(value || 0);
}

function isAllowedAvatar(src?: string | null) {
  if (!src) return false;
  if (src.startsWith("/")) return true;

  try {
    const url = new URL(src);
    return url.protocol === "https:" && url.hostname === "res.cloudinary.com";
  } catch {
    return false;
  }
}

function getTeacherImage(item: TeacherItem, index: number) {
  if (isAllowedAvatar(item.avatar)) return item.avatar;
  return FALLBACK_IMAGES[index % FALLBACK_IMAGES.length];
}

function getClassCount(item: TeacherItem) {
  return item.classCount || 0;
}

function TeacherCard({
  item,
  index,
  onViewProfile,
}: {
  item: TeacherItem;
  index: number;
  onViewProfile: (item: TeacherItem, index: number) => void;
}) {
  const classCount = getClassCount(item);
  const image = getTeacherImage(item, index);

  return (
    <article className="flex min-h-[166px] gap-3 rounded-[10px] border border-[#D3DCE8] bg-white p-3 shadow-[0_6px_18px_rgba(15,23,42,0.09)]">
      <div className="relative h-[142px] w-[104px] shrink-0 overflow-hidden rounded-md bg-[#D7EEF7]">
        <Image
          src={image}
          alt={item.name || "Giáo viên Everest"}
          fill
          sizes="104px"
          className="object-cover object-top"
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <h3 className="line-clamp-1 text-[17px] font-black leading-6 text-black">
          {item.name || "Giáo viên Everest"}
        </h3>

        <p className="line-clamp-1 text-[15px] leading-6 text-black">
          {item.specialty || "Tiếng Anh Giao Tiếp"}
        </p>

        <p className="line-clamp-1 text-[15px] leading-6 text-black">
          {classCount ? `${formatNumber(classCount)} lớp học` : "Chưa có lớp học"}
        </p>

        <button
          type="button"
          onClick={() => onViewProfile(item, index)}
          className="mt-auto h-9 rounded-md bg-[#0D56A6] px-4 text-[14px] font-semibold text-white transition hover:bg-[#0B4A8E] focus:outline-none focus:ring-4 focus:ring-[#0D56A6]/20"
        >
          Xem hồ sơ
        </button>
      </div>
    </article>
  );
}

function ProfileField({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-[#D3DCE8] bg-[#F8FBFF] p-4">
      <div className="flex items-center gap-2 text-[#0D56A6]">
        {icon}
        <span className="text-[13px] font-bold uppercase tracking-[0.08em]">
          {label}
        </span>
      </div>
      <p className="mt-2 text-[15px] leading-6 text-black">{value}</p>
    </div>
  );
}

function TeacherProfileModal({
  profile,
  onClose,
}: {
  profile: SelectedTeacherProfile | null;
  onClose: () => void;
}) {
  if (!profile) return null;

  const { item, image } = profile;
  const classCount = getClassCount(item);

  return (
    <div
      className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-950/55 px-4 py-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="teacher-profile-title"
      onMouseDown={onClose}
    >
      <div
        className="max-h-[88vh] w-full max-w-[920px] overflow-y-auto rounded-xl bg-white shadow-[0_28px_90px_rgba(15,23,42,0.28)]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 md:px-6">
          <div>
            <p className="text-[13px] font-bold uppercase tracking-[0.14em] text-[#0D56A6]">
              Hồ sơ giáo viên
            </p>
            <h2
              id="teacher-profile-title"
              className="mt-1 text-[26px] font-black leading-tight text-black md:text-[32px]"
            >
              {item.name || "Giáo viên Everest"}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-black focus:outline-none focus:ring-4 focus:ring-[#0D56A6]/15"
            aria-label="Đóng hồ sơ giáo viên"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-6 p-5 md:grid-cols-[260px_minmax(0,1fr)] md:p-6">
          <div>
            <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-[#D7EEF7]">
              <Image
                src={image}
                alt={item.name || "Giáo viên Everest"}
                fill
                sizes="260px"
                className="object-cover object-top"
              />
            </div>

            <div className="mt-4">
              <div className="rounded-lg bg-[#F8FBFF] p-3 text-center ring-1 ring-[#D3DCE8]">
                <div className="flex justify-center text-[#0D56A6]">
                  <BookOpen className="h-5 w-5" />
                </div>
                <p className="mt-1 text-[18px] font-black text-black">
                  {formatNumber(classCount)}
                </p>
                <p className="text-[12px] font-semibold text-slate-500">
                  Lớp học
                </p>
              </div>
            </div>
          </div>

          <div className="min-w-0">
            <div className="grid gap-3 sm:grid-cols-2">
              <ProfileField
                icon={<GraduationCap className="h-4 w-4" />}
                label="Chuyên môn"
                value={item.specialty || "Tiếng Anh Giao Tiếp"}
              />
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <ProfileField
                icon={<Mail className="h-4 w-4" />}
                label="Email"
                value={item.email || "Chưa cập nhật email"}
              />
              <ProfileField
                icon={<Phone className="h-4 w-4" />}
                label="Số điện thoại"
                value={item.phone || "Chưa cập nhật số điện thoại"}
              />
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default function PublicTeachersPage() {
  const [items, setItems] = useState<TeacherItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [specialtyFilter, setSpecialtyFilter] = useState("");
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);
  const [selectedProfile, setSelectedProfile] =
    useState<SelectedTeacherProfile | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        setLoading(true);
        const data = await teacherApi.listPublic();
        if (mounted) setItems(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Load teachers failed:", error);
        if (mounted) setItems([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void loadData();

    return () => {
      mounted = false;
    };
  }, []);

  const specialtyOptions = useMemo(() => {
    return Array.from(
      new Set(
        items
          .map((item) => item.specialty?.trim())
          .filter((value): value is string => Boolean(value))
      )
    );
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      return !specialtyFilter || item.specialty === specialtyFilter;
    });
  }, [items, specialtyFilter]);

  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE);
  }, [specialtyFilter]);

  useEffect(() => {
    if (!selectedProfile) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedProfile(null);
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedProfile]);

  const visibleItems = filteredItems.slice(0, visibleCount);
  const hasMore = visibleCount < filteredItems.length;

  return (
    <section className="bg-white py-8 md:py-10">
      <div className="mx-auto max-w-[1240px] px-4 md:px-6">
        <div className="mx-auto max-w-[430px]">
          <label className="block">
            <span className="mb-2 block text-[17px] font-bold text-black">
              Chuyên môn
            </span>
            <span className="relative block">
              <select
                value={specialtyFilter}
                onChange={(event) => setSpecialtyFilter(event.target.value)}
                className="h-11 w-full appearance-none rounded-md border border-[#C9D3E0] bg-white px-4 pr-10 text-[15px] text-black outline-none transition focus:border-[#0D56A6] focus:ring-4 focus:ring-[#0D56A6]/10"
              >
                <option value="">e.g. Ngoại ngữ, Kỹ năng mềm, Công nghệ</option>
                {specialtyOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-600" />
            </span>
          </label>

        </div>

        <div className="mt-7">
          {loading ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <div
                  key={index}
                  className="flex min-h-[166px] animate-pulse gap-3 rounded-[10px] border border-[#D3DCE8] bg-white p-3 shadow-[0_6px_18px_rgba(15,23,42,0.09)]"
                >
                  <div className="h-[142px] w-[104px] shrink-0 rounded-md bg-slate-100" />
                  <div className="flex flex-1 flex-col">
                    <div className="h-5 w-32 rounded bg-slate-100" />
                    <div className="mt-3 h-4 w-28 rounded bg-slate-100" />
                    <div className="mt-3 h-4 w-24 rounded bg-slate-100" />
                    <div className="mt-auto h-9 rounded-md bg-slate-100" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="rounded-[10px] border border-[#D3DCE8] bg-white p-10 text-center shadow-[0_6px_18px_rgba(15,23,42,0.08)]">
              <h2 className="text-[20px] font-black text-black">
                Không tìm thấy giáo viên phù hợp
              </h2>
              <p className="mt-2 text-[15px] text-slate-600">
                Hãy thử đổi chuyên môn hoặc khoảng kinh nghiệm.
              </p>
            </div>
          ) : (
            <>
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                {visibleItems.map((item, index) => (
                  <TeacherCard
                    key={item._id || `${item.name}-${index}`}
                    item={item}
                    index={index}
                    onViewProfile={(teacher, teacherIndex) =>
                      setSelectedProfile({
                        item: teacher,
                        image: getTeacherImage(teacher, teacherIndex),
                      })
                    }
                  />
                ))}
              </div>

              {hasMore && (
                <div className="mt-8 flex justify-center">
                  <button
                    type="button"
                    onClick={() =>
                      setVisibleCount((current) => current + LOAD_MORE_STEP)
                    }
                    className="h-11 rounded-md bg-[#0D56A6] px-7 text-[15px] font-semibold text-white transition hover:bg-[#0B4A8E] focus:outline-none focus:ring-4 focus:ring-[#0D56A6]/20"
                  >
                    Xem thêm giáo viên
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <TeacherProfileModal
        profile={selectedProfile}
        onClose={() => setSelectedProfile(null)}
      />
    </section>
  );
}
