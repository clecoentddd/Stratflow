
"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

type StradarLogoProps = {
  className?: string;
  size?: number;
  priority?: boolean;
  alt?: string;
};

export const StradarLogo = ({
  className,
  size = 32,
  priority = false,
  alt = "Stradar",
}: StradarLogoProps) => {
  return (
    <span
      className={cn("relative inline-flex", className)}
      style={{ width: size, height: size }}
    >
      <Image
        src="/radar.svg"
        alt={alt}
        fill
        sizes={`${size}px`}
        priority={priority}
        className="object-contain"
      />
    </span>
  );
};
