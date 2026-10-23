import Link from "next/link";
import { Card } from "@/components/Card";
import { HomeHero } from "@/components/Hero";
import { ContinueRow } from "@/components/MyLists";
import { Row } from "@/components/Row";
import { homeFeatured, rankedInRegion, showsInRegion, USING_LIVE_DATA } from "@/lib/catalog";
import { REGIONS, REGION_HUE, makeT } from "@/lib/i18n";
import { getPrefs } from "@/lib/prefs";

export default async function Home() {
  const { lang } = await getPrefs();
  const t = makeT(lang);
  const featured = homeFeatured();
  return (
    <>
      {featured.length > 0 && <HomeHero shows={featured} />}
      <div className="wrap">
        <div className="tiles" aria-label={t("byRegion")} style={featured.length ? undefined : { marginTop: 24 }}>
          {REGIONS.map((r) => (
            <Link
              key={r}
              className="tile"
              href={`/region/${r}`}
              style={{ background: `linear-gradient(145deg,hsl(${REGION_HUE[r]} 55% 42%),hsl(${REGION_HUE[r] + 30} 55% 20%))` }}
            >
              <b>{t(r)}</b>
              <span>{t("nShows", showsInRegion(r).length)}</span>
            </Link>
          ))}
        </div>
        <ContinueRow />
        {REGIONS.filter((r) => showsInRegion(r).length > 0).map((r) => (
          <Row key={r} title={t("latest", t(r))} more={`/region/${r}`}>
            {rankedInRegion(r).map((s) => <Card key={s.id} show={s} lang={lang} tag="genre" />)}
          </Row>
        ))}
        {!USING_LIVE_DATA && <p className="note">{t("note")}</p>}
      </div>
    </>
  );
}
