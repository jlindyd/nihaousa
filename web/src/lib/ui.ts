import type { CSSProperties } from "react";

/** Gradient stand-in for a video thumbnail. Real shows use the YouTube thumbnail. */
export const posterBg = (hue: number): CSSProperties => ({
  background: `linear-gradient(160deg,hsl(${hue} 48% 40%),hsl(${(hue + 34) % 360} 52% 22%))`,
});

/** 16:9 thumbnail YouTube serves for a video (320x180). */
export const thumbUrl = (videoId: string) => `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`;

export function setPref(name: "nh-lang" | "nh-theme" | "nh-large" | "nh-wide", value: string) {
  document.cookie = `${name}=${value}; path=/; max-age=31536000; samesite=lax`;
}

export function toggleTheme() {
  const root = document.documentElement;
  const next = root.dataset.theme === "light" ? "dark" : "light";
  root.dataset.theme = next;
  setPref("nh-theme", next);
}

export function toggleLarge() {
  const on = document.documentElement.classList.toggle("large");
  setPref("nh-large", on ? "1" : "0");
}
