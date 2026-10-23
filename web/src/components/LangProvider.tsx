"use client";

import { createContext, useContext, useMemo } from "react";
import { makeT, type TFn } from "@/lib/i18n";
import type { Lang } from "@/lib/types";

const Ctx = createContext<{ lang: Lang; t: TFn }>({ lang: "s", t: makeT("s") });

export function LangProvider({ lang, children }: { lang: Lang; children: React.ReactNode }) {
  const value = useMemo(() => ({ lang, t: makeT(lang) }), [lang]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useLang = () => useContext(Ctx);
