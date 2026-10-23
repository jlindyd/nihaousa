"use client";

import Link from "next/link";
import { useRef } from "react";
import { LeftIcon, RightIcon } from "./icons";
import { useLang } from "./LangProvider";

interface Props {
  title: string;
  sub?: string;
  /** "See all" link target */
  more?: string;
  children: React.ReactNode;
}

/** Horizontal row with scroll arrows on desktop. */
export function Row({ title, sub, more, children }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const { t } = useLang();
  const scroll = (dir: number) => {
    const el = ref.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" });
  };
  return (
    <section className="row">
      <div className="row-head">
        <h2>{title}{sub ? <span>{sub}</span> : null}</h2>
        {more && <Link href={more}>{t("more")}</Link>}
      </div>
      <div className="rail">
        <button className="arrow l" onClick={() => scroll(-1)} aria-label="Scroll left"><LeftIcon /></button>
        <div className="scroller" ref={ref}>{children}</div>
        <button className="arrow r" onClick={() => scroll(1)} aria-label="Scroll right"><RightIcon /></button>
      </div>
    </section>
  );
}
