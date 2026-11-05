"use client";

import { useRef, type ReactNode } from "react";
import { Icon } from "./icon";

const navButton = "grid h-10 w-12 place-items-center rounded-full border bg-surface-2 text-lg hover:bg-surface-3 md:w-16";

// Native scroll-snap does the work; the buttons just scroll by one card.
export function Carousel({ title, children }: { title: string; children: ReactNode }) {
  const track = useRef<HTMLDivElement>(null);

  function scroll(direction: number) {
    const el = track.current;
    const card = el?.firstElementChild as HTMLElement | null;
    if (!el || !card) return;
    const step = card.offsetWidth + parseFloat(getComputedStyle(el).columnGap);
    el.scrollBy({ left: step * direction, behavior: "smooth" });
  }

  return (
    <section className="section-y" aria-label="Testimonials">
      <div className="page-container mb-8 flex items-center justify-between gap-4">
        <h2 className="text-[clamp(26px,4vw,36px)] tracking-[-.025em]">{title}</h2>
        <div className="flex gap-2">
          <button className={navButton} type="button" aria-label="Previous testimonial" onClick={() => scroll(-1)}>
            <Icon name="left" />
          </button>
          <button className={navButton} type="button" aria-label="Next testimonial" onClick={() => scroll(1)}>
            <Icon name="right" />
          </button>
        </div>
      </div>
      {/* Side padding lines the first card up with the page container. */}
      <div
        className="flex scroll-px-[max(24px,calc((100vw-1280px)/2+24px))] snap-x snap-mandatory gap-4 overflow-x-auto px-[max(24px,calc((100vw-1280px)/2+24px))] [scrollbar-width:none] md:gap-10 [&::-webkit-scrollbar]:hidden"
        ref={track}
        tabIndex={0}
      >
        {children}
      </div>
    </section>
  );
}
