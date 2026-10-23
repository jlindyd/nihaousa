"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setPref } from "@/lib/ui";
import type { Lang } from "@/lib/types";
import { useLang } from "./LangProvider";

const OPTIONS: { id: Lang; label: string; html: string }[] = [
  { id: "s", label: "简", html: "zh-Hans" },
  { id: "t", label: "繁", html: "zh-Hant" },
  { id: "e", label: "EN", html: "en" },
];

/** 简 / 繁 / EN switch. Saves the choice in a cookie and re-renders the page. */
export function LangSwitch() {
  const { lang } = useLang();
  const router = useRouter();
  const [, start] = useTransition();
  return (
    <div className="seg lang" role="group" aria-label="Language">
      {OPTIONS.map((o) => (
        <button
          key={o.id}
          lang={o.html}
          aria-pressed={o.id === lang}
          onClick={() => {
            setPref("nh-lang", o.id);
            start(() => router.refresh());
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
