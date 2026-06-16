"use client";

import Image from "next/image";

export default function CommunityImage({
  src,
  alt,
}: {
  src: string;
  alt: string;
}) {
  return (
    <div className="mx-auto w-full max-w-160">
      <div className="relative aspect-[1.08/1] w-full overflow-hidden rounded-[28px]">
        <Image
          src={src}
          alt={alt}
          fill
          className="object-contain"
          priority
        />
      </div>
    </div>
  );
}