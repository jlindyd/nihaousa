"use client";

import Link from "next/link";
import { useProgress, useWatched } from "@/lib/store";
import { posterBg, thumbUrl } from "@/lib/ui";
import { useLang } from "./LangProvider";

export interface EpisodeRow {
  number: number;
  minutes: number;
  /** already formatted for the viewer's language */
  date: string;
  /** YouTube video id, for the thumbnail */
  thumb?: string;
  /** title as uploaded */
  title?: string;
}

interface Props {
  showId: number;
  title: string;
  hue: number;
  episodes: EpisodeRow[];
}

/** Episode rows with the viewer's watched marks and progress. */
export function EpisodeList({ showId, title, hue, episodes }: Props) {
  const { t } = useLang();
  const watched = useWatched()[showId] ?? 0;
  const progress = useProgress()[showId];
  return (
    <div className="eps">
      {episodes.map((e) => {
        const done = e.number <= watched;
        const current = progress?.ep === e.number;
        return (
          <Link key={e.number} className={`ep ${done ? "done" : ""}`} href={`/watch/${showId}/${e.number}`}>
            <span className="n">{e.number}</span>
            <span className="thumb" style={posterBg(hue + (e.number % 5) * 9)}>
              {/* eslint-disable-next-line @next/next/no-img-element -- YouTube serves the right size */}
              {e.thumb && <img className="timg" src={thumbUrl(e.thumb)} alt="" loading="lazy" />}
              {current && <i style={{ width: `${progress.pct}%`, zIndex: 1 }} />}
            </span>
            <span className="t">
              <b>{e.title ?? `${t("epN", e.number)} ${title}`}</b>
              <span>{e.date} · {t("mins", e.minutes)}</span>
            </span>
            <span className="st">{done ? `✓ ${t("done")}` : current ? `${progress.pct}%` : ""}</span>
          </Link>
        );
      })}
    </div>
  );
}
