import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Card } from "@/components/Card";
import { Hero } from "@/components/Hero";
import { Row } from "@/components/Row";
import { featuredFor, genreGroups, isRegion, rankedInRegion } from "@/lib/catalog";
import { makeT } from "@/lib/i18n";
import { getPrefs } from "@/lib/prefs";

export async function generateMetadata({ params }: PageProps<"/region/[region]">): Promise<Metadata> {
  const { region } = await params;
  if (!isRegion(region)) return {};
  const { lang } = await getPrefs();
  return { title: makeT(lang)(region) };
}

export default async function RegionPage({ params }: PageProps<"/region/[region]">) {
  const { region } = await params;
  if (!isRegion(region)) notFound();
  const { lang } = await getPrefs();
  const t = makeT(lang);
  const featured = featuredFor(region);
  const ranked = rankedInRegion(region).slice(0, 10);

  if (!ranked.length) {
    return (
      <div className="wrap pad">
        <h1 style={{ fontSize: 28 }}>{t(region)}</h1>
        <div className="empty"><p>{t("nothingYet")}</p></div>
      </div>
    );
  }
  return (
    <>
      {featured && <Hero show={featured} />}
      <div className="wrap">
        <Row title={t("top10", t(region))}>
          {ranked.map((s, i) => (
            <div className="t10" key={s.id}>
              <span className="rank">{i + 1}</span>
              <Card show={s} lang={lang} tag="genre" />
            </div>
          ))}
        </Row>
        {genreGroups(region).map(({ genre, shows }) => (
          <Row key={genre} title={t(genre)} sub={t("nShows", shows.length)}>
            {shows.map((s) => <Card key={s.id} show={s} lang={lang} tag="genre" />)}
          </Row>
        ))}
      </div>
    </>
  );
}
