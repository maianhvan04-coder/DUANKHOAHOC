import Image from "next/image";
// import { ChevronRight } from "lucide-react";

const relatedPosts = [
  {
    id: 1,
    title: "Hướng dẫn thanh toán bằng VNPAY-QR",
    image: "/teacher/post-1.png",
    href: "#",
  },
  {
    id: 2,
    title: "Ôn luyện thi TOEIC Part 7: Chủ điểm ngữ pháp và từ vựng thường gặp",
    image: "/teacher/post-1.png",
    href: "#",
  },
  {
    id: 3,
    title: "Tự tin mở khóa sự nghiệp ngành Hàng không với chứng chỉ TOEIC",
    image: "/teacher/post-1.png",
    href: "#",
  },
  {
    id: 4,
    title: "Bộ đôi khóa học giúp học sinh lớp 6–9 bứt phá trước cuộc thi TOEFL Junior Challenge",
    image: "/teacher/post-1.png",
    href: "#",
  },
];

function PostCard({
  title,
  image,
  href,
}: {
  title: string;
  image: string;
  href: string;
}) {
  return (
    <a href={href} className="group block">
      <div className="relative aspect-327/216 overflow-hidden rounded-2xl bg-white">
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover transition duration-300 group-hover:scale-[1.03]"
        />
      </div>

      <h3 className="mt-4 text-[18px] font-bold leading-[1.45] text-[#3E3E3E]">
        {title}
      </h3>
    </a>
  );
}

export default function RelatedPostsSection() {
  return (
    <section className="bg-[#f7f7f7] py-10 md:py-14">
      <div className="mx-auto w-full max-w-297 px-4 md:px-6">
        <h2 className="mb-8 text-center text-[28px] font-extrabold leading-tight text-[#001B38] md:mb-10 md:text-[40px]">
          Bài viết liên quan
        </h2>

        <div className="relative">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4 xl:gap-7">
            {relatedPosts.map((post) => (
              <PostCard
                key={post.id}
                title={post.title}
                image={post.image}
                href={post.href}
              />
            ))}
          </div>

          {/* <button
            type="button"
            className="absolute right-[-10px] top-[78px] hidden h-14 w-14 items-center justify-center rounded-full bg-white text-[#001B38] shadow-[0_4px_16px_rgba(0,0,0,0.12)] lg:flex"
            aria-label="Xem thêm bài viết"
          >
            <ChevronRight className="h-7 w-7" />
          </button> */}
        </div>
      </div>
    </section>
  );
}