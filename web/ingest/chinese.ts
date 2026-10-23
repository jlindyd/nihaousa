import * as OpenCC from "opencc-js";
import { pinyin } from "pinyin-pro";

const toTrad = OpenCC.Converter({ from: "cn", to: "twp" });
const toSimp = OpenCC.Converter({ from: "tw", to: "cn" });

export const toTraditional = (s: string) => toTrad(s);
export const toSimplified = (s: string) => toSimp(s);

/** Same show in 简体 and 繁體 gets the same key, whichever script a channel used. */
export function nameKey(s: string): string {
  return toSimplified(s).toLowerCase().replace(/[\s\p{P}\p{S}]/gu, "");
}

/** "Gucheng Wangshi" style romanization, used as the English-script subtitle until a real translation exists. */
export function romanize(s: string): string {
  if (!/[一-鿿]/.test(s)) return s;
  return pinyin(s, { toneType: "none", type: "array" })
    .filter((w) => w.trim())
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/**
 * Pinyin three ways so any reasonable typing matches: joined ("zhoumodachufang"),
 * spaced ("zhou mo da chu fang") and initials ("zmdcf").
 */
export function pinyinSearch(s: string): string {
  if (!/[一-鿿]/.test(s)) return s.toLowerCase();
  const syllables = pinyin(s, { toneType: "none", type: "array" }).filter((w) => w.trim()).map((w) => w.toLowerCase());
  return `${syllables.join("")} ${syllables.join(" ")} ${syllables.map((w) => w[0]).join("")}`;
}
