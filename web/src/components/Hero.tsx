"use client";

import Link from "next/link";
import { useState } from "react";
import { showDesc, showSub, showTitle } from "@/lib/i18n";
import { useProgress, useWatched } from "@/lib/store";
import type { Show } from "@/lib/types";
import { InfoIcon, PlayIcon } from "./icons";
import { useLang } from "./LangProvider";

interface HeroProps {
  show: Show;
  dots?: React.ReactNode;
  /** Show-page variant: back link, episode count, no "More info" button. */
  detail?: boolean;
  /** Extra buttons after Play. */
  extra?: React.ReactNode;
}

/** Full-bleed featured banner. */
export function Hero({ show, dots, detail, extra }: HeroProps) {
  const { lang, t } = useLang();
  const progress = useProgress()[show.id];
  const watched = useWatched()[show.id] ?? 0;
  /* The watch page moves to the nearest real episode when the number does not exist (gaps in numbering). */
  const next = progress?.ep ?? watched + 1;
  const resumed = !!progress || watched > 0;
  const sub = showSub(show, lang);
  return (
    <section className={`full hero${detail ? " show-hero" : ""}`} style={{ "--h": show.hue } as React.CSSProperties}>
      <div className="hero-art" aria-hidden="true">{showTitle(show, lang)}</div>
      <div className="wrap hero-in">
        <div className="hero-body">
          {detail && <Link className="back" href={`/region/${show.r}`}>‹ {t(show.r)}</Link>}
          <div className="badges">
            <span className="rtag">{t(show.r)}</span><span>{t(show.g)}</span><span>{show.year}</span>
            {detail && <span>{t("epsTotal", show.eps)}</span>}
            <span className="off">✓ {t("official")}</span>
          </div>
          <h1>{showTitle(show, lang)}</h1>
          {sub && <div className="en">{sub}</div>}
          <p>{showDesc(show, lang)}</p>
          <div className="actions">
            <Link className="btn play" href={`/watch/${show.id}/${next}`}>
              <PlayIcon />{resumed ? t("cont", next) : detail ? t("start", next) : t("play")}
            </Link>
            {!detail && <Link className="btn info" href={`/show/${show.id}`}><InfoIcon />{t("info")}</Link>}
            {extra}
          </div>
        </div>
        {dots}
      </div>
    </section>
  );
}

/** Home banner that rotates between featured shows. */
export function HomeHero({ shows }: { shows: Show[] }) {
  const [i, setI] = useState(0);
  const { t } = useLang();
  return (
    <Hero
      show={shows[i]}
      dots={
        <div className="dots">
          {shows.map((s, idx) => (
            <button key={s.id} className="dot" aria-pressed={idx === i} aria-label={t(s.r)} onClick={() => setI(idx)} />
          ))}
        </div>
      }
    />
  );
}
