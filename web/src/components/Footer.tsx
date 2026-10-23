"use client";

import Link from "next/link";
import { toggleLarge, toggleTheme } from "@/lib/ui";
import { LangSwitch } from "./LangSwitch";
import { useLang } from "./LangProvider";

export function Footer() {
  const { t } = useLang();
  return (
    <footer className="wrap">
      <div className="foot">
        <span>{t("langLabel")}</span>
        <LangSwitch />
        <button className="btn ghost" onClick={toggleTheme}>{t("theme")}</button>
        <button className="btn ghost" onClick={toggleLarge}>{t("large")}</button>
      </div>
      <div className="foot" style={{ marginTop: 0, borderTop: 0, paddingTop: 0 }}>
        <Link href="/privacy" style={{ textDecoration: "underline" }}>{t("privacy")}</Link>
        <a href="https://www.youtube.com/t/terms" target="_blank" rel="noopener" style={{ textDecoration: "underline" }}>{t("ytTerms")}</a>
      </div>
    </footer>
  );
}
