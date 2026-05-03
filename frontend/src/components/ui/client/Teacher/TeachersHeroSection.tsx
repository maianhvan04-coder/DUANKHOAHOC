import Image from "next/image";

export default function TeachersSection() {
  return (
    <section className="relative overflow-hidden bg-[#92D3F1]">
      <div className="mx-auto flex min-h-[148px] max-w-[1240px] items-center px-4 md:min-h-[166px] md:px-6">
        <div className="relative z-10 max-w-[620px] py-9">
          <h1 className="text-[36px] font-black leading-tight text-white drop-shadow-sm md:text-[44px]">
            Đội ngũ giáo viên
          </h1>
          <p className="mt-2 text-[17px] font-semibold leading-7 text-white/95 md:text-[20px]">
            Gặp gỡ các chuyên gia hàng đầu của chúng tôi
          </p>
        </div>

        <div className="pointer-events-none absolute inset-y-0 right-[max(16px,calc((100vw-1240px)/2+24px))] hidden w-[420px] md:block">
          <div className="absolute bottom-[-74px] right-0 h-[240px] w-[420px] rounded-[50%] bg-white/32" />
          <Image
            src="/teacher/teachers-group.png"
            alt="Đội ngũ giáo viên Everest"
            fill
            sizes="420px"
            className="object-contain object-right-bottom"
            priority
          />
        </div>
      </div>
    </section>
  );
}
