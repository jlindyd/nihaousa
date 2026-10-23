import { pinyinSearch, romanize, toSimplified, toTraditional } from "./chinese.ts";
import { filterAll } from "./filters.ts";
import { groupChannel, safeSlice, stripDecoration, wellFormed, type GroupedShow } from "./group.ts";
import type { ChannelEntry, Generated, Overrides, RawChannel, ReviewItem } from "./types.ts";
import type { Episode, GenreId, RegionId, Show } from "../src/lib/types.ts";

const DAY = 86_400_000;
/** YouTube policy: stored API data must be refreshed or deleted within 30 days. */
export const MAX_AGE_DAYS = 30;

const GENRE_WORDS: [GenreId, RegExp][] = [
  ["news", /新闻|新聞|news|晚间|晚間|财经|財經|时事|時事/i],
  ["kids", /儿童|兒童|kids|动画|動畫|幼儿|幼兒|童谣|童謠|儿歌|兒歌/i],
  ["doc", /纪录|紀錄|documentary|纪实|紀實/i],
  ["variety", /综艺|綜藝|variety|真人秀|脱口秀|脫口秀|talk show|访谈|訪談/i],
  ["drama", /电视剧|電視劇|drama|剧场|劇場|连续剧|連續劇|剧集|劇集/i],
  ["life", /美食|料理|养生|養生|健康|生活|旅行|家居|cooking|food|lifestyle/i],
];

export function guessGenre(entry: ChannelEntry, name: string, titles: string[]): GenreId {
  if (entry.genre) return entry.genre;
  const sample = [name, entry.name, ...titles.slice(0, 5)].join(" ");
  return GENRE_WORDS.find(([, re]) => re.test(sample))?.[0] ?? "life";
}

/** Stable positive integer id from a string (FNV-1a). Shows keep their id across rebuilds. */
export function stableId(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return 1000 + (h % 900_000_000);
}

/** First paragraph of a YouTube description: no links, no emoji, cut at 140 characters. */
const firstParagraph = (s: string) => safeSlice(stripDecoration(s.split(/\n\s*\n/)[0].replace(/https?:\/\/\S+/g, "")), 140);

export function toShow(g: GroupedShow, entry: ChannelEntry, channelId: string, now: number): { show: Show; episodes: Episode[]; id: string } {
  const sourceScript = entry.script ?? (entry.region === "cn" ? "s" : "t");
  const asS = (x: string) => (sourceScript === "s" ? x : toSimplified(x));
  const asT = (x: string) => (sourceScript === "t" ? x : toTraditional(x));

  const eps = g.episodes;
  const newest = eps.reduce((a, b) => (a.video.publishedAt > b.video.publishedAt ? a : b));
  const oldest = eps.reduce((a, b) => (a.video.publishedAt < b.video.publishedAt ? a : b));
  const genre = guessGenre(entry, g.name, eps.map((e) => e.video.title));
  const rawDesc = firstParagraph(newest.video.description);
  const tags = wellFormed(stripDecoration([...new Set(eps.flatMap((e) => e.video.tags))].slice(0, 6).join(" ")));
  const id = stableId(`${channelId}:${g.key}`);

  const show: Show = {
    id,
    r: entry.region,
    g: genre,
    hue: id % 360,
    eps: eps.length,
    isNew: now - Date.parse(newest.video.publishedAt) < 7 * DAY,
    year: new Date(oldest.video.publishedAt).getFullYear(),
    s: [asS(g.name), asS(rawDesc), asS(tags)],
    t: [asT(g.name), asT(rawDesc), asT(tags)],
    e: [romanize(g.name), rawDesc, tags],
    pin: pinyinSearch(g.name),
    channel: entry.name,
    channelId,
    thumb: newest.video.id,
  };
  const episodes: Episode[] = eps
    .map((e) => ({
      number: e.number,
      minutes: Math.round(e.video.durationSec / 60),
      publishedAt: e.video.publishedAt,
      youtubeId: e.video.id,
      title: e.video.title,
    }))
    .sort((a, b) => b.number - a.number);
  return { show, episodes, id: String(id) };
}

export interface BuildInput {
  registry: ChannelEntry[];
  raw: Record<string, RawChannel>;
  overrides?: Overrides;
  now?: number;
  allowStale?: boolean;
}

export interface BuildResult {
  generated: Generated;
  review: ReviewItem[];
  /** One line per channel for the run summary */
  summary: { channel: string; videos: number; kept: number; shows: number; episodes: number; dropped: Record<string, number> }[];
  stale: string[];
}

export function build({ registry, raw, overrides = {}, now = Date.now(), allowStale = false }: BuildInput): BuildResult {
  const shows: Show[] = [];
  const episodes: Record<string, Episode[]> = {};
  const review: ReviewItem[] = [];
  const summary: BuildResult["summary"] = [];
  const stale: string[] = [];
  const hideVideos = new Set(overrides.hideVideos ?? []);
  let oldest = now;

  for (const entry of registry) {
    const data = entry.id ? raw[entry.id] : undefined;
    if (!data) continue;
    const age = now - Date.parse(data.fetchedAt);
    if (age > MAX_AGE_DAYS * DAY && !allowStale) {
      stale.push(entry.name);
      continue;
    }
    oldest = Math.min(oldest, Date.parse(data.fetchedAt));

    const usable = data.videos.filter((v) => !hideVideos.has(v.id));
    const { kept, dropped } = filterAll(usable, entry);
    const grouped = groupChannel(entry, kept, data.playlists);
    review.push(...grouped.review);

    let nEpisodes = 0;
    for (const g of grouped.shows) {
      if (overrides.hideShows?.includes(g.key)) continue;
      const fix = overrides.shows?.[g.key];
      const built = toShow({ ...g, name: fix?.name ?? g.name }, { ...entry, region: (fix?.region ?? entry.region) as RegionId, genre: fix?.genre ?? entry.genre }, data.channelId, now);
      shows.push(built.show);
      episodes[built.id] = built.episodes;
      nEpisodes += built.episodes.length;
    }
    summary.push({ channel: entry.name, videos: data.videos.length, kept: kept.length, shows: grouped.shows.length, episodes: nEpisodes, dropped });
  }

  shows.sort((a, b) => a.id - b.id);
  return {
    generated: {
      generatedAt: new Date(now).toISOString(),
      expiresAt: shows.length ? new Date(oldest + MAX_AGE_DAYS * DAY).toISOString() : null,
      shows,
      episodes,
    },
    review,
    summary,
    stale,
  };
}
