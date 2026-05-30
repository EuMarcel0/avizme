"use client";

import Image from "next/image";
import { Autoplay, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import { cn } from "@/lib/utils";

import "swiper/css";
import "swiper/css/pagination";

const AUTH_SLIDES = Array.from({ length: 6 }, (_, index) => ({
  src: `/images/SLIDE-${index + 1}.png`,
  alt: `Avizme — slide ${index + 1}`,
}));

type AuthSlidesSwiperProps = {
  className?: string;
};

export function AuthSlidesSwiper({ className }: AuthSlidesSwiperProps) {
  return (
    <Swiper
      modules={[Autoplay, Pagination]}
      autoplay={{
        delay: 5000,
        disableOnInteraction: false,
      }}
      pagination={{
        clickable: true,
      }}
      loop
      className={cn("auth-slides-swiper h-full w-full", className)}
    >
      {AUTH_SLIDES.map((slide, index) => (
        <SwiperSlide key={slide.src} className="h-full">
          <div className="relative h-full w-full overflow-hidden rounded-xl">
            <Image
              src={slide.src}
              alt={slide.alt}
              fill
              priority={index === 0}
              className="rounded-xl object-contain object-center"
              sizes="(max-width: 1024px) 90vw, 50vw"
            />
          </div>
        </SwiperSlide>
      ))}
    </Swiper>
  );
}
