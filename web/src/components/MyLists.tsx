"use client";

import Link from "next/link";
import { getShow } from "@/lib/catalog";
import { KEYS, useIdList, useProgress } from "@/lib/store";
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
  const section = (title: string, ids: number[], sub?: string) => (
    <Row title={title} sub={sub}>
      {ids.length ? (
        pick(ids).map((s) => <Card key={s.id} show={s} lang={lang} />)
      ) : (
        <p style={{ color: "var(--muted)" }}>{t("emptyList")}</p>
      )}
    </Row>
  );
  return (
    <>
      <ContinueRow />
      {section(t("later"), later.ids)}
      {section(t("favs"), favs.ids)}
      {section(t("followingRow"), follow.ids, t("customS"))}
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
