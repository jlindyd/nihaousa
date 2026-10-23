import Link from "next/link";
import { makeT, showSub, showTitle } from "@/lib/i18n";
import { posterBg, thumbUrl } from "@/lib/ui";
import type { Lang, Show } from "@/lib/types";
import { PlayIcon } from "./icons";

interface Props {
  show: Show;
  lang: Lang;
  /** Which label goes top-left. Region pages use the genre. */
  tag?: "region" | "genre";
  /** Link straight to an episode (Continue watching). */
  ep?: number;
  pct?: number;
  sub?: string;
  /** Overrides the default "new today" badge. */
  hideNew?: boolean;
}

/** Wide 16:9 card. Works in server and client components. */
export function Card({ show, lang, tag = "region", ep, pct, sub, hideNew }: Props) {
  const t = makeT(lang);
  const subtitle = sub ?? [showSub(show, lang), t("epsShort", show.eps)].filter(Boolean).join(" · ");
  return (
    <Link className="card" href={ep ? `/watch/${show.id}/${ep}` : `/show/${show.id}`}>
      <div className="poster" style={posterBg(show.hue)}>
        {/* eslint-disable-next-line @next/next/no-img-element -- YouTube serves the right size */}
        {show.thumb && <img className="timg" src={thumbUrl(show.thumb)} alt="" loading="lazy" />}
        <span className="tag">{tag === "genre" ? t(show.g) : t(show.r)}</span>
        {show.isNew && pct == null && !hideNew && <span className="new">{t("today")}</span>}
        {!show.thumb && <div className="zh">{showTitle(show, lang)}</div>}
        {pct != null && <div className="progress"><i style={{ width: `${pct}%` }} /></div>}
        <span className="pl"><i><PlayIcon /></i></span>
      </div>
      <div className="meta"><b>{showTitle(show, lang)}</b><span>{subtitle}</span></div>
    </Link>
  );
}
