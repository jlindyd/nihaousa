"use client";

import Link from "next/link";
import { getShow } from "@/lib/catalog";
import { KEYS, useIdList, useProgress, write } from "@/lib/store";
import type { Show } from "@/lib/types";
import { useAuth } from "./AuthProvider";
import { Card } from "./Card";
import { useLang } from "./LangProvider";
import { Row } from "./Row";

const pick = (ids: number[]) => ids.map(getShow).filter((s): s is Show => !!s);

/** "Continue watching" row. Renders nothing for a first-time visitor. */
export function ContinueRow() {
  const { lang, t } = useLang();
  const progress = useProgress();
  const items = Object.entries(progress)
    .map(([id, p]) => ({ show: getShow(Number(id)), p }))
    .filter((x): x is { show: Show; p: (typeof progress)[number] } => !!x.show);
  if (!items.length) return null;
  return (
    <Row title={t("contW")}>
      {items.map(({ show, p }) => (
        <Card key={show.id} show={show} lang={lang} ep={p.ep} pct={p.pct} sub={`${t("epN", p.ep)} · ${p.pct}%`} />
      ))}
    </Row>
  );
}

/** The My List page: everything a guest has saved on this device. */
export function MyLists() {
  const { lang, t } = useLang();
  const { configured, loading, user } = useAuth();
  const later = useIdList(KEYS.later);
  const favs = useIdList(KEYS.favs);
  const follow = useIdList(KEYS.follow);
  const section = (title: string, ids: number[], sub?: string) => {
    const shows = pick(ids);
    return (
      <Row title={title} sub={sub}>
        {shows.length ? (
          shows.map((s) => <Card key={s.id} show={s} lang={lang} />)
        ) : (
          <p style={{ color: "var(--muted)" }}>{t("emptyList")}</p>
        )}
      </Row>
    );
  };

  // Saved shows the catalog no longer has (taken down, or no recent episodes). They stay saved
  // but cannot be drawn, so say so instead of hiding them silently.
  const missing = [...new Set([...later.ids, ...favs.ids, ...follow.ids])].filter((id) => !getShow(id));
  const clearMissing = () => {
    const keep = (ids: number[]) => ids.filter((id) => !!getShow(id));
    write(KEYS.later, keep(later.ids));
    write(KEYS.favs, keep(favs.ids));
    write(KEYS.follow, keep(follow.ids));
  };

  return (
    <>
      <ContinueRow />
      {section(t("later"), later.ids)}
      {section(t("favs"), favs.ids)}
      {section(t("followingRow"), follow.ids, t("customS"))}
      {missing.length > 0 && (
        <div className="prompt">
          <p>{t("missingSaved", missing.length)}</p>
          <button className="btn ghost" onClick={clearMissing}>{t("clearMissing")}</button>
        </div>
      )}
      {configured && loading ? null : configured && !user ? (
        <div className="prompt">
          <p>{t("signInPrompt")}</p>
          <Link className="btn" href="/signin?next=/my">{t("signIn")}</Link>
        </div>
      ) : (
        <p className="note">{user ? `${t("signedInAs", user.email)}. ${t("syncedNote")}` : t("savedHere")}</p>
      )}
    </>
  );
}
