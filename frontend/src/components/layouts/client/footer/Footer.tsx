import Image from "next/image";
import Link from "next/link";

const newsLinks = [
  "Quy định - Hướng dẫn",
  "Thư viện",
  "Tin tức",
  "Sự kiện",
  "Thành tích học viên",
];

const programLinks = [
  "Luyện thi TOEIC",
  "Luyện thi TOEFL",
  "Luyện thi Tin học",
  "Các khóa học khác",
];

const policyLinks = [
  "Chính sách bảo mật",
  "Thanh toán",
  "Tuyển dụng",
  "Về chúng tôi",
];

function SocialIcon({
  src,
  alt,
  href = "/",
}: {
  src: string;
  alt: string;
  href?: string;
}) {
  return (
    <Link
      href={href}
      aria-label={alt}
      className="inline-flex items-center justify-center transition hover:opacity-80"
    >
      <Image
        src={src}
        alt={alt}
        width={42}
        height={42}
        className="h-10.5 w-10.5 object-contain"
      />
    </Link>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <h3 className="text-[15px] font-semibold uppercase tracking-[0.02em] text-white/85">
        {children}
      </h3>
      <div className="mt-3 h-px w-full bg-white/45" />
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="bg-[#002654] text-white">
      <div className="mx-auto max-w-310 px-6 pb-10 pt-10 md:px-8 lg:px-10">
        <div className="grid gap-10 lg:grid-cols-[1.35fr_0.65fr_0.65fr]">
          <div>
            <div className="mb-8 flex h-24 items-center justify-center lg:justify-start">
              <Link href="/" className="-ml-12 inline-block lg:-ml-14">
                <Image
                  src="/Logo.png"
                  alt="Everest"
                  width={240}
                  height={100}
                  className="h-auto w-40 object-contain brightness-0 invert md:w-46.25 lg:w-52.5"
                  priority
                />
              </Link>
            </div>

            <div className="mt-2">
              <SectionTitle>THÔNG TIN LIÊN HỆ</SectionTitle>

              <div className="space-y-3 text-[16px] leading-7 text-white">
                <p>
                  <span className="font-bold">Hotline:</span>{" "}
                  <span className="font-semibold">1900 636 929</span>
                </p>
                <p>
                  <span className="font-bold">Email:</span>{" "}
                  <Link
                    href="mailto:info@iigvietnam.edu.vn"
                    className="font-medium hover:underline"
                  >
                    info@everestvietnam.edu.vn
                  </Link>
                </p>
              </div>
            </div>

            <div className="mt-8">
              <SectionTitle>ĐỊA CHỈ VĂN PHÒNG</SectionTitle>

              <div className="space-y-4 text-[16px] leading-7 text-white">
                <p>
                  <span className="font-bold">Trụ sở chính:</span> 75 Giang Văn
                  Minh, Phường Ngọc Hà, Hà Nội
                </p>

                <p>
                  <span className="font-bold">Văn Phòng Trung Yên:</span> Tầng
                  3, Trung Yên Plaza, 1 Trung Hòa, Phường Yên Hòa, Hà Nội
                </p>

                <p>
                  <span className="font-bold">Chi nhánh TP.Đà Nẵng:</span> 161
                  Núi Thành, Phường Hòa Cường, TP. Đà Nẵng
                </p>

                <p>
                  <span className="font-bold">Chi nhánh TP.Hồ Chí Minh:</span>{" "}
                  Tầng 1, Tháp 1, The Sun Avenue, 28 Mai Chí Thọ, Phường Bình
                  Trưng, TP. HCM
                </p>
              </div>
            </div>

            <div className="mt-8">
              <p className="text-[16px] font-semibold text-white">
                Theo dõi Everest Việt Nam tại
              </p>

              <div className="mt-4 flex items-center gap-4">
                <SocialIcon
                  src="/footer/facebook.svg"
                  alt="Facebook"
                  href="/"
                />
                <SocialIcon src="/footer/tiktok.svg" alt="TikTok" href="/" />
                <SocialIcon src="/footer/youtube.svg" alt="YouTube" href="/" />
                <SocialIcon src="/footer/zalo.svg" alt="Zalo" href="/" />
              </div>
            </div>

            <div className="mt-8">
              <p className="text-[16px] font-semibold text-white">
                Chúng tôi kết nối thanh toán qua
              </p>

              <div className="mt-4">
                <Image
                  src="/footer/VNPayLogo.png"
                  alt="VNPAY"
                  width={170}
                  height={52}
                  className="h-auto w-42.5"
                />
              </div>
            </div>
          </div>

          <div className="lg:pt-32">
            <SectionTitle>TIN TỨC</SectionTitle>

            <ul className="space-y-3">
              {newsLinks.map((item) => (
                <li key={item}>
                  <Link
                    href="/"
                    className="text-[16px] font-semibold leading-7 text-white transition hover:text-white/75"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:pt-32">
            <SectionTitle>CHƯƠNG TRÌNH HỌC</SectionTitle>

            <ul className="space-y-3">
              {programLinks.map((item) => (
                <li key={item}>
                  <Link
                    href="/"
                    className="text-[16px] font-semibold leading-7 text-white transition hover:text-white/75"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 h-px w-full bg-white/35" />

        <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3 text-[15px] font-semibold leading-7 text-white">
            <p>© 2024 Everest-Learning. All rights reserved.</p>
            <p>Công ty cổ phần Công nghệ giáo dục Everest</p>
            <p>Mã số thuế: 9856345677</p>

            <div className="pt-3">
              <Image
                src="/footer/bo-cong-thuong.svg"
                alt="Đã thông báo Bộ Công Thương"
                width={150}
                height={58}
                className="h-auto w-37.5"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 pt-1 text-[15px] font-medium text-white/90 lg:justify-end">
            {policyLinks.map((item, index) => (
              <div key={item} className="flex items-center">
                <Link href="/" className="transition hover:text-white">
                  {item}
                </Link>
                {index !== policyLinks.length - 1 && (
                  <span className="mx-3 text-white/55">|</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}