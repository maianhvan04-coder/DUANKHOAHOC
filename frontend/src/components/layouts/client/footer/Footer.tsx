import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

const companyLinks = [
  "Giới thiệu",
  "Phòng truyền thông",
  "Học sinh tiêu biểu",
  "Điều khoản chính sách",
  "Quy chế hoạt động",
  "Tuyển dụng",
];

const programLinks = [
  "Luyện thi chứng chỉ ngoại ngữ",
  "Luyện thi tin học văn phòng",
  "Lập trình Online",
  "Lớp 1 - Lớp 12",
  "Luyện thi THPT",
  "Luyện thi vào lớp 10",
  "Hệ thống trung tâm Everest",
  "Kho học liệu trực tuyến",
];

const supportLinks = [
  "Cập nhật tin tức - sự kiện Everest",
  "Diễn đàn học tập",
  "Thư viện học liệu",
  "Thông tin tuyển sinh",
  "Chia sẻ kinh nghiệm học tập THPT",
  "Chia sẻ kinh nghiệm học tập THCS",
  "Kiểm tra, thi thử",
];

const partnerLinks = ["Liên hệ", "Góp ý về dịch vụ", "Giải đáp thắc mắc"];

function LinkList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2 text-sm leading-6 text-slate-700">
      {items.map((item) => (
        <li key={item}>
          <Link href="/" className="transition hover:text-[#0D56A6]">
            {item}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function StoreBadge({ children }: { children: ReactNode }) {
  return (
    <Link
      href="/"
      className="flex h-12 w-40 items-center justify-center rounded-[4px] bg-black px-4 text-white shadow-sm transition hover:bg-slate-900"
    >
      {children}
    </Link>
  );
}

function SocialIcon({ src, alt }: { src: string; alt: string }) {
  return (
    <Link href="/" aria-label={alt} className="transition hover:opacity-80">
      <Image src={src} alt={alt} width={34} height={34} className="h-8.5 w-8.5" />
    </Link>
  );
}

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white text-slate-800">
      <div className="mx-auto grid max-w-[1180px] gap-8 px-4 py-10 md:grid-cols-2 lg:grid-cols-[170px_1.35fr_1fr_0.65fr_180px]">
        <div>
          <Link href="/" className="inline-flex">
            <Image
              src="/Logo-icon.png"
              alt="Everest"
              width={110}
              height={110}
              className="h-24 w-24 object-contain"
            />
          </Link>
          <div className="mt-5">
            <LinkList items={companyLinks} />
          </div>
        </div>

        <div>
          <h3 className="mb-4 text-base font-bold">Chương trình học tiêu biểu</h3>
          <LinkList items={programLinks} />
        </div>

        <div>
          <h3 className="mb-4 text-base font-bold">Dịch vụ hỗ trợ học tập</h3>
          <LinkList items={supportLinks} />
        </div>

        <div>
          <h3 className="mb-4 text-base font-bold">Khách hàng/Đối tác</h3>
          <LinkList items={partnerLinks} />
        </div>

        <div>
          <h3 className="mb-4 text-base font-bold uppercase">Tải ứng dụng</h3>
          <div className="space-y-3">
            <StoreBadge>
              <span className="mr-3 text-lg">▶</span>
              <span>
                <span className="block text-[10px] leading-none">GET IT ON</span>
                <span className="block text-lg font-semibold leading-5">Google Play</span>
              </span>
            </StoreBadge>
            <StoreBadge>
              <span className="mr-3 text-lg font-bold">A</span>
              <span>
                <span className="block text-[10px] leading-none">Available on the</span>
                <span className="block text-lg font-semibold leading-5">App Store</span>
              </span>
            </StoreBadge>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200">
        <div className="mx-auto grid max-w-[1180px] gap-6 px-4 py-5 text-xs leading-5 text-slate-500 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p>Cơ quan chủ quản: Công ty Cổ phần Công nghệ Giáo dục Everest</p>
            <p>MST: 012183602 do Sở kế hoạch và Đầu tư thành phố Hà Nội cấp ngày 13 tháng 03 năm 2007</p>
            <p>
              Địa chỉ: Tầng 4, Tòa nhà 25T2, Đường Nguyễn Thị Thập, Phường Trung Hòa,
              Quận Cầu Giấy, Hà Nội.
            </p>
            <p>Hotline: 19006933 - Email: hotro@everest.edu.vn</p>
          </div>

          <div className="flex flex-wrap items-center gap-3 lg:justify-end">
            <SocialIcon src="/footer/zalo.svg" alt="Zalo" />
            <SocialIcon src="/footer/facebook.svg" alt="Facebook" />
            <SocialIcon src="/footer/youtube.svg" alt="YouTube" />
            <SocialIcon src="/footer/tiktok.svg" alt="TikTok" />
            <Image
              src="/footer/bo-cong-thuong.svg"
              alt="Đã thông báo Bộ Công Thương"
              width={130}
              height={50}
              className="h-auto w-32"
            />
          </div>
        </div>
      </div>
    </footer>
  );
}
