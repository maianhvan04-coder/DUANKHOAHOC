"use client";

export default function KnowledgeNewsletter() {
  return (
    <section className="w-full py-10">
      <div className="w-full bg-[#dcecf8] px-4 py-7 md:px-8 lg:px-12">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-[24px] font-bold text-slate-800 md:text-[30px]">
            Cập nhật kiến thức mới nhất
          </h2>

          <p className="mt-2 text-[14px] text-slate-700 md:text-[15px]">
            Đăng ký để nhận thông tin về các bài viết, khóa học và sự kiện
            giáo dục hằng tuần.
          </p>

          <form className="mx-auto mt-5 flex max-w-[560px] flex-col gap-3 sm:flex-row">
            <input
              type="email"
              placeholder="Địa chỉ email của bạn..."
              className="h-[46px] flex-1 rounded-full bg-white px-5 text-sm text-slate-700 outline-none placeholder:text-slate-400"
            />

            <button
              type="submit"
              className="h-[46px] rounded-full bg-[#0b4b84] px-6 text-sm font-semibold text-white transition hover:bg-[#08365f]"
            >
              Đăng ký ngay
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}