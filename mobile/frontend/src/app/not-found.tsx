import Image from "next/image";
import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      <Image
        src="/404/404-dog.webp"
        alt="404 background"
        fill
        priority
        className="object-cover"
      />

      <div className="absolute inset-0 bg-black/20" />

      <div className="relative z-10 flex min-h-screen items-end">
        <div className="w-full px-6 pb-12 md:px-10 md:pb-16 lg:px-16 lg:pb-20">
          <div className="max-w-130">
            <h1 className="text-[110px] font-extrabold leading-none tracking-[-0.06em] text-white md:text-[180px] lg:text-[230px]">
              404
            </h1>

            <p className="-mt-2 text-[18px] font-medium text-white/95 md:mt-0 md:text-[24px]">
              These are not the cookies you were looking for.
            </p>

            <div className="mt-8">
              <Link
                href="/"
                className="inline-flex min-w-42.5 items-center justify-center rounded-full bg-white px-8 py-4 text-[18px] font-semibold text-[#111827] transition hover:scale-[1.02] hover:bg-white/90"
              >
                Back Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}