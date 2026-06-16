import type { ReactNode } from "react";
import { BookOpen, GraduationCap } from "lucide-react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <section className="min-h-screen bg-[#f3f4f6]">
      <div className="mx-auto flex min-h-screen max-w-[1180px] items-center justify-center px-4 py-8">
        <div className="grid w-full max-w-[980px] overflow-hidden rounded-[8px] border border-slate-200 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.08)] lg:grid-cols-[420px_1fr]">
          <div className="flex items-center justify-center px-6 py-8 md:px-10">
            <div className="w-full max-w-[300px]">{children}</div>
          </div>

          <aside className="hidden bg-[#082c69] p-6 lg:block">
            <div className="flex h-full min-h-[640px] flex-col items-center justify-center rounded-[4px] bg-[#082c69] px-8 py-10 text-white">
              <div className="relative mb-10 flex h-[300px] w-[300px] items-center justify-center rounded-full bg-[radial-gradient(circle_at_center,#edf5ff_0%,#dbeafe_58%,#c9defd_100%)]">
                <div className="absolute bottom-8 left-1/2 h-5 w-[190px] -translate-x-1/2 rounded-full bg-[#8eb1df]/40 blur-md" />

                <div className="absolute left-[58px] top-[118px] h-[82px] w-[108px] rounded-[18px] border-[6px] border-[#5e7fae] bg-[#9bb8df]" />
                <div className="absolute left-[72px] top-[190px] h-[10px] w-[78px] rounded-full bg-[#56729d]" />
                <div className="absolute left-[92px] top-[176px] h-[18px] w-[34px] rounded-b-xl bg-[#6e8cb8]" />

                <div className="absolute right-[44px] top-[150px] flex flex-col gap-2">
                  <div className="h-10 w-16 rounded-[10px] border border-[#7d98c2] bg-[#dce9fb]" />
                  <div className="h-10 w-16 rounded-[10px] border border-[#7d98c2] bg-[#edf4ff]" />
                  <div className="h-10 w-16 rounded-[10px] border border-[#7d98c2] bg-[#dce9fb]" />
                </div>

                <div className="absolute left-1/2 top-[80px] h-[54px] w-[54px] -translate-x-1/2 rounded-full bg-[#f5c9a9]" />
                <div className="absolute left-1/2 top-[70px] h-[30px] w-[62px] -translate-x-1/2 rounded-t-full rounded-b-[18px] bg-[#314b73]" />
                <div className="absolute left-1/2 top-[126px] h-[30px] w-[26px] -translate-x-1/2 rounded-b-xl bg-[#f5c9a9]" />
                <div className="absolute left-1/2 top-[142px] h-[82px] w-[122px] -translate-x-1/2 rounded-[32px] bg-[#93b5df]" />
                <div className="absolute left-[110px] top-[150px] h-[78px] w-[26px] rotate-[20deg] rounded-full bg-[#87a8d6]" />
                <div className="absolute right-[108px] top-[150px] h-[78px] w-[26px] -rotate-[12deg] rounded-full bg-[#87a8d6]" />
              </div>

              <div className="w-full max-w-[320px]">
                <h2 className="text-[24px] font-extrabold leading-[1.35]">
                  Chinh phục đỉnh cao
                  <br />
                  tri thức với Everest.
                </h2>

                <p className="mt-4 text-[15px] leading-7 text-white/80">
                  Nền tảng giáo dục trực tuyến hàng đầu Việt Nam.
                </p>

                <div className="mt-8 flex items-center gap-3 text-white/75">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
                    <GraduationCap className="h-5 w-5" />
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}