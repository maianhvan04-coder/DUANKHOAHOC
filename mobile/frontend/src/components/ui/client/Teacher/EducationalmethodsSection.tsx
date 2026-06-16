import Image from "next/image";

const methods = [
    {
        id: 1,
        title: "Đường hướng giao tiếp",
        description:
            "Phương pháp giảng dạy tập trung vào việc sử dụng ngôn ngữ trong ngữ cảnh thực tế, tăng cường trao đổi và thực hành. Các kỹ năng Nghe – Nói – Đọc – Viết được triển khai song song, giúp học viên phát triển toàn diện năng lực tiếng Anh và tự tin vận dụng sau khóa học.",
    },
    {
        id: 2,
        title: "Tích hợp Kỹ năng",
        description:
            "Chương trình học được thiết kế theo hướng tích hợp, luyện song song Listening & Reading với Speaking & Writing trong cùng một lộ trình, giúp học viên phát triển đồng đều cả 4 kỹ năng, tăng phản xạ ngôn ngữ ngay cả trong cuộc sống hằng ngày.",
    },
    {
        id: 3,
        title: "Phương pháp Xoắn Ốc",
        description:
            "Kiến thức được lặp lại có chủ đích và nâng dần độ khó qua từng cấp độ, giúp học viên ghi nhớ sâu, hiểu bản chất và tránh tình trạng “học trước – quên sau”. Các chủ điểm quen thuộc được khai thác ở nhiều góc độ, tạo nền tảng vững chắc và liền mạch.",
    },
    {
        id: 4,
        title: "Phương pháp Scaffolding",
        description:
            "Nội dung học được thiết kế theo từng bước nhỏ, triển khai qua các video ngắn gọn kết hợp bài tập thực hành xen kẽ, giúp học viên tiếp cận kiến thức một cách có hệ thống, giúp giảm áp lực khi học và tăng khả năng ghi nhớ, từ đó dễ dàng vận dụng kiến thức vào bài thi và thực tế.",
    },
];



function MethodItem({
    id,
    title,
    description,
}: {
    id: number;
    title: string;
    description: string;
}) {
    return (
        <div className="flex gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#0E4D8C] text-[18px] font-bold text-white">
                {id}
            </div>

            <div className="pt-1">
                <h3 className="mb-2 text-[20px] font-bold leading-tight text-[#001B38] md:text-[22px]">
                    {title}
                </h3>

                <p className="max-w-140 text-[14px] leading-[1.8] text-[#575757] md:text-[15px]">
                    {description}
                </p>
            </div>
        </div>
    );
}

export default function EducationMethodSection() {
    return (
        <section className="bg-[#f7f7f7] py-8 md:py-12">
            <div className="mx-auto w-full max-w-297 px-4 md:px-0">
                <h2 className="mb-8 text-[24px] font-extrabold text-[#001B38] md:mb-10 md:text-[40px]">
                    Phương pháp giáo dục
                </h2>

                <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-8">
                    <div className="w-full lg:w-[52%]">
                        <div className="space-y-7 md:space-y-8">
                            {methods.map((item) => (
                                <MethodItem
                                    key={item.id}
                                    id={item.id}
                                    title={item.title}
                                    description={item.description}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="relative w-full lg:w-[48%]">
                        <div className="relative mx-auto h-80 w-75 md:h-115 md:w-117.5">
                            <div className="absolute bottom-0 left-1/2 z-10 h-80 w-75 -translate-x-1/2 md:h-110 md:w-138.5">
                                <Image
                                    src="/teacher/teacher_smiling_education.png"
                                    alt="Methodology"
                                    fill
                                    priority
                                    sizes="(max-width: 768px) 300px, 554px"
                                    className="object-contain object-bottom"
                                />
                            </div>

                            <div className="absolute bottom-13 right-11.5 z-20">
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}