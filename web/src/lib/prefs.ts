import { cookies } from "next/headers";
import { LANGS } from "./i18n";
import type { Lang } from "./types";

export interface Prefs {
  lang: Lang;
  theme: "dark" | "light";
  large: boolean;
}

/** Reads display preferences from cookies. Server only. */
export async function getPrefs(): Promise<Prefs> {
  const jar = await cookies();
  const lang = jar.get("nh-lang")?.value as Lang | undefined;
  return {
    lang: lang && LANGS.includes(lang) ? lang : "s",
    theme: jar.get("nh-theme")?.value === "light" ? "light" : "dark",
    large: jar.get("nh-large")?.value === "1",
  };
}
