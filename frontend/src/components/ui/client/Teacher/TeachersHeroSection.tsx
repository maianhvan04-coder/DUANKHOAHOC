import Image from "next/image";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function DecorativeStackIcon({ className }: { className?: string }) {
  return (
    <div className={cn("relative h-10 w-10 opacity-60", className)}>
      <span className="absolute left-0 top-4 h-4 w-6 rotate-20 rounded-[3px] border-2 border-[#d9e7f3]" />
      <span className="absolute left-1.5 top-2 h-4 w-6 rotate-20 rounded-[3px] border-2 border-[#d9e7f3]" />
      <span className="absolute left-3 top-0 h-4 w-6 rotate-20 rounded-[3px] border-2 border-[#d9e7f3]" />
    </div>
  );
}

export default function TeachersSection() {
  return (
    <section className="relative overflow-hidden bg-[#eef3f8] py-16 md:py-24">
      <div className="mx-auto flex max-w-297 flex-col items-center gap-10 px-4 md:flex-row md:px-0">
        <div className="w-full text-center md:w-3/5 md:text-left">
          <h1 className="mb-4 text-[40px] font-black leading-tight text-[#001B38]">
            Đội ngũ giáo viên
          </h1>

          <p className="text-[#001B38] text-[20px] md:text-[20px] leading-relaxed max-w-150 font-bold md:mx-0 px-4 md:px-0">
            Đội ngũ giáo viên tại IIG Việt Nam được tuyển chọn kỹ càng với trình độ
            chuyên môn cao, sở hữu các chứng chỉ quốc tế và được chứng nhận giảng dạy
            bởi ETS; là những Thạc sĩ, giảng viên tại các trường Đại học lớn, có nhiều
            năm kinh nghiệm đào tạo các chương trình tiếng Anh và Tin học theo chuẩn
            quốc tế. Không chỉ giỏi chuyên môn, đội ngũ giáo viên IIG còn đóng vai trò
            định hướng và đồng hành, giúp học viên học đúng trọng tâm, hiểu đúng bản
            chất và đạt kết quả phù hợp với mục tiêu cá nhân.
          </p>
          <DecorativeStackIcon className="mt-8 hidden md:block" />
        </div>

        <div className="relative flex w-full justify-center md:w-2/5">
          <div className="relative h-75 w-75 md:h-100 md:w-100">
            <Image
              src="/teacher/teachers-group.png"
              alt="Teaching Staff"
              fill
              sizes="(max-width: 768px) 300px, 400px"
              className="object-contain"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
}