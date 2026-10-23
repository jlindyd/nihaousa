import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ShowActions } from "@/components/Actions";
import { Card } from "@/components/Card";
import { EpisodeList } from "@/components/EpisodeList";
import { Hero } from "@/components/Hero";
import { getEpisodes, getShow, moreLike } from "@/lib/catalog";
import { CHANNEL_LABEL, formatDate, makeT, showDesc, showTitle } from "@/lib/i18n";
import { getPrefs } from "@/lib/prefs";

export async function generateMetadata({ params }: PageProps<"/show/[id]">): Promise<Metadata> {
  const show = getShow(Number((await params).id));
  if (!show) return {};
  const { lang } = await getPrefs();
  return { title: showTitle(show, lang), description: showDesc(show, lang) };
}

export default async function ShowPage({ params, searchParams }: PageProps<"/show/[id]">) {
  const show = getShow(Number((await params).id));
  if (!show) notFound();
  const tab = (await searchParams).tab === "more" ? "more" : "eps";
  const { lang } = await getPrefs();
  const t = makeT(lang);
  const episodes = getEpisodes(show).slice(0, 30).map((e) => ({
    number: e.number,
    minutes: e.minutes,
    date: formatDate(e.publishedAt, lang, t),
    thumb: e.youtubeId,
    title: e.title,
  }));
  return (
    <>
      <Hero show={show} detail extra={<ShowActions showId={show.id} />} />
      <div className="wrap">
        <div className="tabs">
          <Link href={`/show/${show.id}`} aria-current={tab === "eps"}>{t("tabEps")}</Link>
          <Link href={`/show/${show.id}?tab=more`} aria-current={tab === "more"}>{t("tabMore")} · {t(show.r)}</Link>
        </div>
        {tab === "eps" ? (
          <>
            <EpisodeList showId={show.id} title={showTitle(show, lang)} hue={show.hue} episodes={episodes} />
            <p style={{ color: "var(--muted)", fontSize: 14, marginTop: 16 }}>{t("source", show.channel ?? CHANNEL_LABEL[lang])}</p>
          </>
        ) : (
          <div className="grid" style={{ marginTop: 20 }}>
            {moreLike(show).map((s) => <Card key={s.id} show={s} lang={lang} tag="genre" />)}
          </div>
        )}
      </div>
    </>
  );
}
