import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <section className="relative min-h-screen overflow-hidden">
      {/* background */}
      <div className="absolute inset-0 bg-[linear-gradient(135deg,#0B4F9F_0%,#0A2F63_40%,#071B39_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.16),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.12),transparent_26%)]" />
      <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-[#3B82F6]/20 blur-3xl" />

      {/* content */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10">
        <div className="w-full max-w-180 rounded-[14px  p-8 shadow-[0_20px_60px_rgba(0,0,0,0.15)] md:p-10">
          {children}
        </div>
      </div>
    </section>
  );
}