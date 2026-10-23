"use client";

import { useRouter } from "next/navigation";
import { useEffect, useTransition } from "react";
import { setPref } from "@/lib/ui";
import { useLang } from "./LangProvider";

/**
 * Switches the watch page between theater mode (big player, suggestions underneath; the default)
 * and the standard view (smaller player, suggestions on the right). Press "t" to switch, as on YouTube.
 */
export function WideToggle({ wide }: { wide: boolean }) {
  const { t } = useLang();
  const router = useRouter();
  const [, start] = useTransition();

  const toggle = () => {
    setPref("nh-wide", wide ? "0" : "1");
    start(() => router.refresh());
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const typing = el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
      if (e.key.toLowerCase() === "t" && !e.ctrlKey && !e.metaKey && !e.altKey && !typing) {
        setPref("nh-wide", wide ? "0" : "1");
        start(() => router.refresh());
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [wide, router]);

  return (
    <button className="btn ghost hide-m" onClick={toggle} title={`${wide ? t("smallerPlayer") : t("biggerPlayer")} (t)`}>
      {wide ? t("smallerPlayer") : t("biggerPlayer")}
    </button>
  );
}
