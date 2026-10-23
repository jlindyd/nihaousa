import type { ChannelEntry, RawVideo } from "./types.ts";

/** Title words that mark a video as something other than a full episode. */
const NOT_EPISODE =
  /预告|預告|花絮|精彩|集锦|集錦|片段|预览|預覽|混剪|解说|解說|看点|看點|幕后|幕後|抢先看|搶先看|宣传|宣傳|\btrailer\b|\bteaser\b|\bpreview\b|\breaction\b|\bshorts?\b|#shorts|\bhighlights?\b|\bbehind the scenes\b|\bclip\b/i;

export interface FilterResult {
  keep: boolean;
  /** Why a video was dropped. Empty when kept. */
  reason: string;
}

export const DEFAULT_MIN_MINUTES = 8;
/** Longer than this is almost always a looped stream or a compilation. */
export const MAX_HOURS = 4;

export function filterVideo(v: RawVideo, channel: ChannelEntry): FilterResult {
  const drop = (reason: string): FilterResult => ({ keep: false, reason });

  if (v.unavailable) return drop("no longer available");
  if (v.privacy !== "public") return drop("not public");
  if (!v.embeddable) return drop("embedding disabled");
  if (v.live !== "none") return drop("live or upcoming stream");
  if (v.blockedIn?.includes("US")) return drop("blocked in the US");
  if (v.allowedIn && !v.allowedIn.includes("US")) return drop("not available in the US");

  const minutes = v.durationSec / 60;
  if (minutes < (channel.minMinutes ?? DEFAULT_MIN_MINUTES)) return drop("too short");
  if (minutes > MAX_HOURS * 60) return drop("too long");

  if (NOT_EPISODE.test(v.title)) return drop("trailer, clip or highlight");
  for (const pattern of channel.excludeTitle ?? []) {
    if (new RegExp(pattern, "i").test(v.title)) return drop("channel exclude rule");
  }
  return { keep: true, reason: "" };
}

/** Applies the filter to a list and counts the reasons, for the run summary. */
export function filterAll(videos: RawVideo[], channel: ChannelEntry) {
  const kept: RawVideo[] = [];
  const dropped: Record<string, number> = {};
  for (const v of videos) {
    const r = filterVideo(v, channel);
    if (r.keep) kept.push(v);
    else dropped[r.reason] = (dropped[r.reason] ?? 0) + 1;
  }
  return { kept, dropped };
}
