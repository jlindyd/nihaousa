import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { WatchActions } from "@/components/Actions";
import { Player } from "@/components/Player";
import { getEpisode, getEpisodes, getShow, moreLike } from "@/lib/catalog";
import { CHANNEL_LABEL, formatDate, makeT, showDesc, showTitle } from "@/lib/i18n";
import { getPrefs } from "@/lib/prefs";
import { posterBg, thumbUrl } from "@/lib/ui";

export async function generateMetadata({ params }: PageProps<"/watch/[id]/[ep]">): Promise<Metadata> {
  const { id, ep } = await params;
  const show = getShow(Number(id));
  if (!show) return {};
  const { lang } = await getPrefs();
  return { title: `${showTitle(show, lang)} · ${makeT(lang)("epN", Number(ep))}` };
}

export default async function WatchPage({ params }: PageProps<"/watch/[id]/[ep]">) {
  const { id, ep } = await params;
  const show = getShow(Number(id));
  if (!show) notFound();
  const all = getEpisodes(show);
  if (!all.length) notFound();
  const requested = Number(ep);
  const episode = getEpisode(show, requested);
  if (!episode) {
    // Numbering can have gaps. Go to the next episode that exists, or the latest one.
    const ascending = [...all].sort((a, b) => a.number - b.number);
    redirect(`/watch/${show.id}/${(ascending.find((e) => e.number > requested) ?? ascending[ascending.length - 1]).number}`);
  }
  const number = episode.number;
  const { lang } = await getPrefs();
  const t = makeT(lang);
  const title = showTitle(show, lang);
  const heading = episode.title ?? `${t("epN", number)} ${title}`;
  const next = all.filter((e) => e.number > number).sort((a, b) => a.number - b.number).slice(0, 3);

  return (
    <div className="wrap pad">
      <Link className="back" href={`/show/${show.id}`}>‹ {title}</Link>
      <div className="split">
        <div>
          <Player showId={show.id} ep={number} title={heading} youtubeId={episode.youtubeId} />
          <h1 style={{ fontSize: 26, marginTop: 16 }}>{heading}</h1>
          <div style={{ color: "var(--muted)" }}>
            <span className="official">✓ {t("official")}</span> · {t(show.r)} · {show.channel ?? CHANNEL_LABEL[lang]} · {formatDate(episode.publishedAt, lang, t)}
            {episode.youtubeId && (
              <> · <a href={`https://www.youtube.com/watch?v=${episode.youtubeId}`} target="_blank" rel="noopener" style={{ textDecoration: "underline" }}>{t("onYouTube")}</a></>
            )}
          </div>
          <WatchActions showId={show.id} ep={number} />
          <p style={{ maxWidth: "62ch", marginTop: 12 }}>{showDesc(show, lang)}</p>
        </div>
        <aside className="panel">
          <h3>{t("next")}</h3>
          {next.length ? next.map((e) => (
            <Link key={e.number} className="mini" href={`/watch/${show.id}/${e.number}`}>
              <div className="poster" style={posterBg(show.hue)}>
                {e.youtubeId ? (
                  // eslint-disable-next-line @next/next/no-img-element -- YouTube serves the right size
                  <img className="timg" src={thumbUrl(e.youtubeId)} alt="" loading="lazy" />
                ) : (
                  <div className="zh">{title}</div>
                )}
              </div>
              <div><b>{e.title ?? t("epN", e.number)}</b><span>{formatDate(e.publishedAt, lang, t)}</span></div>
            </Link>
          )) : <p style={{ color: "var(--muted)" }}>{t("caught")}</p>}
          <h3 style={{ marginTop: 14 }}>{t("alsoLike")}</h3>
          {moreLike(show, 3).map((s) => (
            <Link key={s.id} className="mini" href={`/show/${s.id}`}>
              <div className="poster" style={posterBg(s.hue)}><div className="zh">{showTitle(s, lang)}</div></div>
              <div><b>{showTitle(s, lang)}</b><span>{t(s.g)} · {t("epsShort", s.eps)}</span></div>
            </Link>
          ))}
        </aside>
      </div>
    </div>
  );
}
