import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { WatchActions } from "@/components/Actions";
import { Card } from "@/components/Card";
import { Player } from "@/components/Player";
import { Row } from "@/components/Row";
import { WideToggle } from "@/components/WideToggle";
import { getEpisode, getEpisodes, getShow, moreLike } from "@/lib/catalog";
import { CHANNEL_LABEL, formatDate, makeT, showDesc, showTitle } from "@/lib/i18n";
import { getPrefs } from "@/lib/prefs";
import { posterBg, thumbUrl } from "@/lib/ui";
import type { Episode, Lang, Show } from "@/lib/types";
import type { TFn } from "@/lib/i18n";

export async function generateMetadata({ params }: PageProps<"/watch/[id]/[ep]">): Promise<Metadata> {
  const { id, ep } = await params;
  const show = getShow(Number(id));
  if (!show) return {};
  const { lang } = await getPrefs();
  return { title: `${showTitle(show, lang)} · ${makeT(lang)("epN", Number(ep))}` };
}

/** Episode as a card in a row: thumbnail, title as uploaded, date. */
function EpisodeCard({ show, ep, lang, t }: { show: Show; ep: Episode; lang: Lang; t: TFn }) {
  return (
    <Link className="card" href={`/watch/${show.id}/${ep.number}`}>
      <div className="poster" style={posterBg(show.hue)}>
        {ep.youtubeId ? (
          // eslint-disable-next-line @next/next/no-img-element -- YouTube serves the right size
          <img className="timg" src={thumbUrl(ep.youtubeId)} alt="" loading="lazy" />
        ) : (
          <div className="zh">{showTitle(show, lang)}</div>
        )}
        <span className="pl"><i><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4.5v15a1 1 0 001.5.86l12-7.5a1 1 0 000-1.72l-12-7.5A1 1 0 007 4.5z" /></svg></i></span>
      </div>
      <div className="meta">
        <b className="clamp2">{ep.title ?? t("epN", ep.number)}</b>
        <span>{formatDate(ep.publishedAt, lang, t)}</span>
      </div>
    </Link>
  );
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
  const { lang, wide } = await getPrefs();
  const t = makeT(lang);
  const title = showTitle(show, lang);
  const heading = episode.title ?? `${t("epN", number)} ${title}`;
  const ascending = [...all].sort((a, b) => a.number - b.number);
  const next = ascending.filter((e) => e.number > number).slice(0, wide ? 12 : 3);
  const before = [...ascending].reverse().filter((e) => e.number < number).slice(0, 12);
  const related = moreLike(show, wide ? undefined : 3);

  const player = <Player showId={show.id} ep={number} title={heading} youtubeId={episode.youtubeId} />;
  const info = (
    <>
      <h1 style={{ fontSize: 26, marginTop: 16 }}>{heading}</h1>
      <div style={{ color: "var(--muted)" }}>
        <span className="official">✓ {t("official")}</span> · {t(show.r)} · {show.channel ?? CHANNEL_LABEL[lang]} · {formatDate(episode.publishedAt, lang, t)}
        {episode.youtubeId && (
          <> · <a href={`https://www.youtube.com/watch?v=${episode.youtubeId}`} target="_blank" rel="noopener" style={{ textDecoration: "underline" }}>{t("onYouTube")}</a></>
        )}
      </div>
      <WatchActions showId={show.id} ep={number} />
      <p style={{ maxWidth: "62ch", marginTop: 12 }}>{showDesc(show, lang)}</p>
    </>
  );

  /* Wide (default): the video takes the whole width, sized so it always fits the screen's height.
     Up next and more shows sit underneath as rows. */
  if (wide) {
    return (
      <div className="wrap-wide pad">
        <div className="stage">
          <div className="bar">
            <Link className="back" href={`/show/${show.id}`}>‹ {title}</Link>
            <WideToggle wide />
          </div>
          {player}
          {info}
        </div>
        <div className="wrap" style={{ maxWidth: "none" }}>
          {next.length > 0 && (
            <Row title={t("next")}>
              {next.map((e) => <EpisodeCard key={e.number} show={show} ep={e} lang={lang} t={t} />)}
            </Row>
          )}
          {before.length > 0 && (
            <Row title={t("earlier")}>
              {before.map((e) => <EpisodeCard key={e.number} show={show} ep={e} lang={lang} t={t} />)}
            </Row>
          )}
          {related.length > 0 && (
            <Row title={t("alsoLike")}>
              {related.map((s) => <Card key={s.id} show={s} lang={lang} tag="genre" />)}
            </Row>
          )}
        </div>
      </div>
    );
  }

  /* Compact: video on the left, suggestions on the right. */
  return (
    <div className="wrap pad">
      <div className="bar">
        <Link className="back" href={`/show/${show.id}`}>‹ {title}</Link>
        <WideToggle wide={false} />
      </div>
      <div className="split">
        <div>
          {player}
          {info}
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
          {related.map((s) => (
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
