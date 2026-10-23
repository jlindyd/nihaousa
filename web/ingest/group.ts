import { nameKey } from "./chinese.ts";
import type { ChannelEntry, RawPlaylist, RawVideo, ReviewItem } from "./types.ts";

/* ---------- Reading a video title ---------- */

const EPISODE_PATTERNS: RegExp[] = [
  /第\s*(\d{1,4})\s*[期集话話回]/,
  /\b(?:episode|ep|e)\s*\.?\s*(\d{1,4})\b/i,
  /[#＃]\s*(\d{1,4})\b/,
  /(?:^|[\s|｜])(\d{1,3})\s*[话話集](?=$|[\s|｜])/,
  /[（(]\s*(\d{1,3})\s*[）)]\s*$/,
];
const DATE_PATTERNS: RegExp[] = [/(20\d{2})\s*[-./年]\s*(\d{1,2})\s*[-./月]\s*(\d{1,2})/, /\b(20\d{2})(\d{2})(\d{2})\b/];

export interface ParsedTitle {
  showName?: string;
  episode?: number;
  /** YYYY-MM-DD when the title carries a date */
  date?: string;
}

export function parseTitle(title: string): ParsedTitle {
  const out: ParsedTitle = {};
  for (const re of EPISODE_PATTERNS) {
    const m = re.exec(title);
    if (m) {
      out.episode = Number(m[1]);
      break;
    }
  }
  for (const re of DATE_PATTERNS) {
    const m = re.exec(title);
    if (m) {
      out.date = `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
      break;
    }
  }
  out.showName = extractShowName(title);
  return out;
}

/** Emoji and the invisible joiners that glue them together. Channels decorate titles with them. */
const DECORATION = /[\p{Extended_Pictographic}‍️⃣]/gu;
export const stripDecoration = (s: string) => s.replace(DECORATION, " ").replace(/\s+/g, " ").trim();

/** Cuts to a number of characters without ever splitting an emoji in two, which would leave invalid JSON behind. */
export const safeSlice = (s: string, max: number) => Array.from(s).slice(0, max).join("");
/** Drops any half-emoji (lone surrogate) so a string is always safe to store as JSON. */
export const wellFormed = (s: string) => s.replace(/[\ud800-\udbff](?![\udc00-\udfff])|(?<![\ud800-\udbff])[\udc00-\udfff]/g, "");

function extractShowName(rawTitle: string): string | undefined {
  const title = stripDecoration(rawTitle);
  const quoted = /[《「『]([^》」』]{1,30})[》」』]/.exec(title);
  if (quoted) return quoted[1].trim();
  let s = title.replace(/[【\[][^】\]]*[】\]]/g, " ");
  for (const re of EPISODE_PATTERNS) s = s.replace(re, " ");
  for (const re of DATE_PATTERNS) s = s.replace(re, " ");
  s = s.replace(/\b(?:full|hd|1080p|4k|eng sub|engsub)\b/gi, " ");
  const first = s.split(/[|｜\-–—:：/／]/).map((x) => x.trim()).find(Boolean);
  return first && first.length >= 2 ? safeSlice(first, 40) : undefined;
}

/* ---------- Playlists that are really series ---------- */

const GENERIC_PLAYLIST =
  /^(uploads?|all( videos)?|videos?|popular|latest|recent|favorites?|liked|shorts|live|streams?|全部|所有|最新|最近|精选|精選|热播|熱播|合集|直播|收藏|推荐|推薦)$/i;

/** Drops words that describe the playlist, not the show: "全集", "Full Episodes". */
export function cleanPlaylistTitle(title: string): string {
  return stripDecoration(title)
    .replace(/[【\[][^】\]]*[】\]]/g, " ")
    .replace(/\b(?:full episodes?|all episodes?|playlist)\b/gi, " ")
    .replace(/(?:全集|完整版|全部剧集|全部劇集|合集|播放清单|播放清單)/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const isSeriesPlaylist = (p: RawPlaylist) => p.itemCount >= 3 && !GENERIC_PLAYLIST.test(p.title.trim()) && cleanPlaylistTitle(p.title).length >= 2;

/* ---------- Grouping ---------- */

export type Confidence = "high" | "medium" | "low";

export interface GroupedEpisode {
  video: RawVideo;
  number: number;
  /** Other copies of the same episode, best first. Used as fallbacks. */
  alt: RawVideo[];
}

export interface GroupedShow {
  /** Stable per channel: the same show gets the same key on every run. */
  key: string;
  name: string;
  playlistId?: string;
  confidence: Confidence;
  episodes: GroupedEpisode[];
}

export interface GroupResult {
  shows: GroupedShow[];
  review: ReviewItem[];
}

const better = (a: RawVideo, b: RawVideo) =>
  a.definition !== b.definition ? (a.definition === "hd" ? -1 : 1) : b.durationSec - a.durationSec || a.publishedAt.localeCompare(b.publishedAt);

/** Pick the series playlist a video belongs to, preferring the one that matches the title's show name. */
function choosePlaylist(v: RawVideo, parsed: ParsedTitle, playlists: RawPlaylist[]): RawPlaylist | undefined {
  const candidates = playlists.filter((p) => isSeriesPlaylist(p) && p.videoIds.includes(v.id));
  if (!candidates.length) return undefined;
  if (parsed.showName) {
    const want = nameKey(parsed.showName);
    const match = candidates.find((p) => {
      const have = nameKey(cleanPlaylistTitle(p.title));
      return have.includes(want) || want.includes(have);
    });
    if (match) return match;
  }
  return [...candidates].sort((a, b) => a.itemCount - b.itemCount)[0];
}

export function groupChannel(channel: ChannelEntry, videos: RawVideo[], playlists: RawPlaylist[], opts: { minEpisodes?: number } = {}): GroupResult {
  // Several separate shows can come out of one channel, so a lone video is probably a stray clip.
  // A channel marked as one program is the show already, so one episode is enough.
  const minEpisodes = opts.minEpisodes ?? (channel.singleShow ? 1 : 2);
  const review: ReviewItem[] = [];
  const flag = (v: RawVideo, reason: string, suggestion?: string) =>
    review.push({ videoId: v.id, title: v.title, channel: channel.name, reason, suggestion });

  interface Item { video: RawVideo; parsed: ParsedTitle; episode?: number }
  const buckets = new Map<string, { name: string; playlistId?: string; items: Item[]; viaPlaylist: boolean }>();

  for (const video of videos) {
    const parsed = parseTitle(video.title);
    let key: string;
    let name: string;
    let playlistId: string | undefined;
    let viaPlaylist = false;

    if (channel.singleShow) {
      key = `ch:${nameKey(channel.name)}`;
      name = channel.name;
    } else {
      const pl = choosePlaylist(video, parsed, playlists);
      if (pl) {
        name = cleanPlaylistTitle(pl.title);
        key = `show:${nameKey(name)}`;
        playlistId = pl.id;
        viaPlaylist = true;
      } else if (parsed.showName) {
        name = parsed.showName;
        key = `show:${nameKey(name)}`;
      } else {
        flag(video, "could not tell which show this is");
        continue;
      }
    }
    const b = buckets.get(key) ?? { name, playlistId, items: [], viaPlaylist };
    b.items.push({ video, parsed, episode: parsed.episode });
    b.viaPlaylist ||= viaPlaylist;
    b.playlistId ??= playlistId;
    buckets.set(key, b);
  }

  const shows: GroupedShow[] = [];
  for (const [key, b] of buckets) {
    // A whole-channel show is a daily or weekly program. Numbers inside its titles
    // (dates, "1/3" parts, hashtags) are not reliable, so episodes follow the date.
    if (channel.singleShow) for (const it of b.items) it.episode = undefined;
    const withNumber = b.items.filter((i) => i.episode != null);
    const allNumbered = withNumber.length === b.items.length;
    const noneNumbered = withNumber.length === 0;
    const byDate = [...b.items].sort((x, y) => (x.parsed.date ?? x.video.publishedAt).localeCompare(y.parsed.date ?? y.video.publishedAt));

    let confidence: Confidence;
    let keep: Item[] = b.items;
    if (allNumbered) {
      confidence = b.viaPlaylist || channel.singleShow || b.items.length >= minEpisodes ? "high" : "low";
    } else if (noneNumbered) {
      byDate.forEach((it, i) => (it.episode = i + 1));
      keep = byDate;
      confidence = b.viaPlaylist || channel.singleShow ? "medium" : "low";
    } else {
      keep = withNumber;
      for (const it of b.items) if (it.episode == null) flag(it.video, `episode number unclear in "${b.name}"`, `${b.name}`);
      confidence = "medium";
    }

    if (keep.length < minEpisodes) {
      for (const it of keep) flag(it.video, `only ${keep.length} video for "${b.name}"`, b.name);
      continue;
    }
    if (confidence === "low") {
      for (const it of keep) flag(it.video, `low confidence grouping into "${b.name}"`, b.name);
      continue;
    }

    const byNumber = new Map<number, RawVideo[]>();
    for (const it of keep) byNumber.set(it.episode!, [...(byNumber.get(it.episode!) ?? []), it.video]);
    const episodes: GroupedEpisode[] = [...byNumber.entries()]
      .map(([number, vids]) => {
        const sorted = [...vids].sort(better);
        return { video: sorted[0], number, alt: sorted.slice(1) };
      })
      .sort((x, y) => x.number - y.number);
    shows.push({ key, name: b.name, playlistId: b.playlistId, confidence, episodes });
  }
  return { shows, review };
}
