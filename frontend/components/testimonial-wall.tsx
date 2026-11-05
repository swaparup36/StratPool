"use client";

import { useState } from "react";
import type { Testimonial } from "@/content/site";
import { Avatar, ButtonRow, buttonClass } from "./ui";

const INITIAL = 6;

export function TestimonialWall({ items }: { items: Testimonial[] }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <div className="columns-1 gap-5 md:columns-2 lg:columns-3">
        {(expanded ? items : items.slice(0, INITIAL)).map((t) => (
          <figure className="mb-5 break-inside-avoid rounded-xl border bg-surface-2 p-5" key={t.quote}>
            <blockquote className="text-muted">{t.quote}</blockquote>
            <figcaption className="mt-4 flex items-center gap-3 text-sm">
              <Avatar id={t.avatar} className="size-10 rounded-full" />
              <div>
                <strong className="block font-medium">{t.name}</strong>
                <span className="text-[13px] text-subtle">
                  {t.role}, {t.company}
                </span>
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
      {!expanded && items.length > INITIAL && (
        <ButtonRow center className="mt-6">
          <button className={buttonClass("secondary")} type="button" onClick={() => setExpanded(true)}>
            Show more
          </button>
        </ButtonRow>
      )}
    </>
  );
}
