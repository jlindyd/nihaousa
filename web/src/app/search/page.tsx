import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/Card";
import { aiPick, searchShows, tagsFor } from "@/lib/catalog";
import { CHIPS, REGIONS, makeT } from "@/lib/i18n";
import { getPrefs } from "@/lib/prefs";
import type { RegionId, Show } from "@/lib/types";

export const metadata: Metadata = { title: "Search" };

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const sp = await searchParams;
  const q = first(sp.q);
  const mode = first(sp.mode) === "ai" ? "ai" : "search";
  const regionParam = first(sp.region);
  const region: RegionId | "all" = (REGIONS as string[]).includes(regionParam) ? (regionParam as RegionId) : "all";
  const { lang } = await getPrefs();
  const t = makeT(lang);

  const href = (over: { q?: string; mode?: string; region?: string }) => {
    const p = new URLSearchParams();
    const nq = over.q ?? q;
    const nm = over.mode ?? mode;
    const nr = over.region ?? region;
    if (nq) p.set("q", nq);
    if (nm !== "search") p.set("mode", nm);
    if (nr !== "all") p.set("region", nr);
    return `/search?${p.toString()}`;
  };

  const inScope = (s: Show) => region === "all" || s.r === region;
  const grouped = (list: Show[], withWhy = false) =>
    REGIONS.filter((r) => region === "all" || r === region).map((r) => {
      const g = list.filter((s) => s.r === r);
      if (!g.length) return null;
      return (
        <section className="group" key={r}>
          <h2>{t(r)}<span>{t("nShows", g.length)}</span></h2>
          <div className="grid">
            {g.map((s) => withWhy ? (
              <div key={s.id}>
                <Card show={s} lang={lang} tag="genre" />
                <div className="why">{t("why")}{tagsFor(s, lang).slice(0, 3).join(t("sep"))}</div>
              </div>
            ) : (
              <Card key={s.id} show={s} lang={lang} tag="genre" />
            ))}
          </div>
        </section>
      );
    });

  let body: React.ReactNode;
  if (mode === "search") {
    const results = searchShows(q).filter(inScope);
    if (!q.trim()) {
      body = (
        <div className="empty">
          <p>{t("searchEmpty")}</p>
          <div className="chips" style={{ justifyContent: "center" }}>
            {CHIPS[lang].map((c) => <Link key={c} className="chip" href={href({ q: c })}>{c}</Link>)}
          </div>
        </div>
      );
    } else if (!results.length) {
      body = (
        <div className="empty">
          <p>{t("noRes", q)}</p>
          <Link className="btn" href={href({ mode: "ai" })}>{t("askBtn")}</Link>
        </div>
      );
    } else {
      body = (
        <>
          <p style={{ color: "var(--muted)" }}>{t("found", results.length)}: “{q}”</p>
          {grouped(results)}
        </>
      );
    }
  } else {
    const prompt = q.trim() || t("aiDefault");
    const picks = aiPick(prompt, lang).filter(inScope);
    body = (
      <>
        <div className="ai-box">
          <span className="logo-chip" style={{ width: 52, height: 52, borderRadius: 16 }}><Image src="/logo.png" alt="" width={42} height={42} /></span>
          <div>
            <p><b>“{prompt}”</b></p>
            <p style={{ marginTop: 6 }}>{t("aiAnswer", picks.length)}</p>
            <span className="preview-note">{t("aiPreview")}</span>
          </div>
        </div>
        {grouped(picks, true)}
      </>
    );
  }

  return (
    <div className="wrap pad">
      <h1 style={{ fontSize: 28, marginBottom: 12 }}>{t("search")}</h1>
      <div className="seg" role="group">
        <Link href={href({ mode: "search" })} aria-current={mode === "search"}>{t("search")}</Link>
        <Link href={href({ mode: "ai" })} aria-current={mode === "ai"}>{t("askAI")}</Link>
      </div>
      <div className="chips">
        {(["all", ...REGIONS] as const).map((r) => (
          <Link key={r} className="chip" href={href({ region: r })} aria-current={region === r}>
            {r === "all" ? t("allRegions") : t(r)}
          </Link>
        ))}
      </div>
      <div style={{ marginTop: 6 }}>{body}</div>
    </div>
  );
}
