import generated from "../../data/catalog.generated.json";
import { GENRES, REGIONS, showTags } from "./i18n";
import type { Episode, Lang, RegionId, Show } from "./types";

/*
 * Sample catalog. Titles are made up.
 * This module is the only place that knows where shows come from, so the pages
 * keep working when it is replaced by database queries (Supabase) fed by the
 * YouTube ingest pipeline.
 */
const SAMPLE_SHOWS: Show[] = [
  // ---- Mainland ----
  { id: 2, r: "cn", g: "drama", hue: 350, eps: 36, isNew: true, year: 2025,
    s: ["古城往事", "一座古城里三代人的故事，从戏楼到书院，节奏舒缓。", "古装 爱情 历史 剧情"],
    t: ["古城往事", "一座古城裡三代人的故事，從戲樓到書院，節奏舒緩。", "古裝 愛情 歷史 劇情"],
    e: ["Tales of the Old City", "Three generations in an old city, from the opera house to the academy. Slow and gentle.", "period drama romance history"], pin: "gucheng wangshi" },
  { id: 9, r: "cn", g: "drama", hue: 30, eps: 40, isNew: false, year: 2025,
    s: ["幸福小院", "一个胡同小院里的邻里日常，家长里短，温暖治愈。", "家庭 温暖 轻松 邻里 妈妈"],
    t: ["幸福小院", "一個胡同小院裡的鄰里日常，家長里短，溫暖治癒。", "家庭 溫暖 輕鬆 鄰里 媽媽"],
    e: ["The Little Courtyard", "Daily life among neighbors in a courtyard. Warm and comforting.", "family warm light"], pin: "xingfu xiaoyuan" },
  { id: 3, r: "cn", g: "variety", hue: 42, eps: 18, isNew: true, year: 2026,
    s: ["老友记事", "几位老朋友一起旅行、聊天，轻松不烧脑，适合全家一起看。", "轻松 搞笑 朋友 聊天 妈妈 综艺"],
    t: ["老友記事", "幾位老朋友一起旅行、聊天，輕鬆不燒腦，適合全家一起看。", "輕鬆 搞笑 朋友 聊天 媽媽 綜藝"],
    e: ["Old Friends", "Old friends travel and talk. Light, easy, good for the whole family.", "light funny friends travel"], pin: "laoyou jishi" },
  { id: 4, r: "cn", g: "news", hue: 214, eps: 300, isNew: true, year: 2026,
    s: ["每日新闻联播", "每天二十分钟，国内外要闻一次看完。", "新闻 时事 每日"],
    t: ["每日新聞聯播", "每天二十分鐘，國內外要聞一次看完。", "新聞 時事 每日"],
    e: ["Daily News Brief", "Twenty minutes a day covers the main stories at home and abroad.", "news daily"], pin: "meiri xinwen" },
  { id: 5, r: "cn", g: "life", hue: 150, eps: 40, isNew: false, year: 2026,
    s: ["养生小课堂", "医生讲解日常保健，每集十分钟，字幕清晰。", "养生 健康 老人 中医 妈妈"],
    t: ["養生小課堂", "醫生講解日常保健，每集十分鐘，字幕清晰。", "養生 健康 老人 中醫 媽媽"],
    e: ["Healthy Living", "A doctor explains everyday health care. Ten minutes, clear subtitles.", "wellness health seniors"], pin: "yangsheng ke" },
  { id: 8, r: "cn", g: "doc", hue: 190, eps: 10, isNew: false, year: 2023,
    s: ["山河行", "十集纪录片，沿着大河走过八个省。", "纪录片 旅行 风景 历史"],
    t: ["山河行", "十集紀錄片，沿著大河走過八個省。", "紀錄片 旅行 風景 歷史"],
    e: ["Rivers and Mountains", "A ten-part documentary following a great river through eight provinces.", "documentary travel scenery"], pin: "shanhe xing" },
  { id: 10, r: "cn", g: "kids", hue: 55, eps: 60, isNew: false, year: 2024,
    s: ["小熊识字", "每集教五个汉字，适合三到六岁的孩子。", "儿童 识字 动画 学中文"],
    t: ["小熊識字", "每集教五個漢字，適合三到六歲的孩子。", "兒童 識字 動畫 學中文"],
    e: ["Little Bear ABC", "Five Chinese characters per episode, for ages three to six.", "kids learning cartoon"], pin: "xiaoxiong shizi" },

  // ---- Taiwan ----
  { id: 13, r: "tw", g: "drama", hue: 200, eps: 28, isNew: true, year: 2026,
    s: ["海边小镇", "台湾东海岸小镇里的家庭与友情，画面清新。", "家庭 友情 治愈 剧情"],
    t: ["海邊小鎮", "台灣東海岸小鎮裡的家庭與友情，畫面清新。", "家庭 友情 治癒 劇情"],
    e: ["Seaside Town", "Family and friendship in a small town on Taiwan's east coast.", "family friendship drama"], pin: "haibian xiaozhen" },
  { id: 7, r: "tw", g: "variety", hue: 95, eps: 12, isNew: false, year: 2025,
    s: ["爸妈上学记", "父母和孩子互换身份去上学，笑中带泪。", "轻松 家庭 亲子 温暖 妈妈"],
    t: ["爸媽上學記", "父母和孩子互換身份去上學，笑中帶淚。", "輕鬆 家庭 親子 溫暖 媽媽"],
    e: ["Back to School", "Parents and kids swap roles and go to school. Funny and moving.", "family light warm"], pin: "bama shangxue ji" },
  { id: 11, r: "tw", g: "variety", hue: 305, eps: 22, isNew: true, year: 2026,
    s: ["夜话台北", "深夜脱口秀，聊时事也聊生活。", "台湾 脱口秀 搞笑 轻松"],
    t: ["夜話台北", "深夜脫口秀，聊時事也聊生活。", "台灣 脫口秀 搞笑 輕鬆"],
    e: ["Taipei Nights", "A late-night talk show about current events and daily life.", "taiwan talk show funny"], pin: "yehua taibei" },
  { id: 14, r: "tw", g: "news", hue: 218, eps: 365, isNew: true, year: 2026,
    s: ["台湾晚间新闻", "每晚半小时，台湾与国际新闻。", "新闻 时事 台湾"],
    t: ["台灣晚間新聞", "每晚半小時，台灣與國際新聞。", "新聞 時事 台灣"],
    e: ["Taiwan Evening News", "Half an hour each evening of Taiwan and world news.", "news taiwan daily"], pin: "taiwan wanjian xinwen" },
  { id: 1, r: "tw", g: "life", hue: 18, eps: 24, isNew: true, year: 2026,
    s: ["周末大厨房", "每集一道家常菜，步骤清楚，适合第一次下厨的人。", "家常菜 美食 轻松 做饭 妈妈 烹饪"],
    t: ["週末大廚房", "每集一道家常菜，步驟清楚，適合第一次下廚的人。", "家常菜 美食 輕鬆 做飯 媽媽 烹飪"],
    e: ["Weekend Kitchen", "One home-style dish per episode, with clear steps for first-time cooks.", "home cooking food easy"], pin: "zhoumo dachufang" },
  { id: 15, r: "tw", g: "life", hue: 25, eps: 32, isNew: false, year: 2025,
    s: ["夜市美食地图", "走遍台湾各地夜市，一集介绍一个小吃摊。", "美食 夜市 台湾 小吃"],
    t: ["夜市美食地圖", "走遍台灣各地夜市，一集介紹一個小吃攤。", "美食 夜市 台灣 小吃"],
    e: ["Night Market Food Map", "A tour of Taiwan's night markets, one food stall per episode.", "food night market taiwan snacks"], pin: "yeshi meishi ditu" },

  // ---- Hong Kong ----
  { id: 16, r: "hk", g: "drama", hue: 10, eps: 30, isNew: true, year: 2026,
    s: ["茶餐厅日常", "粤语喜剧，一家茶餐厅里的人和事。", "粤语 喜剧 搞笑 香港"],
    t: ["茶餐廳日常", "粵語喜劇，一家茶餐廳裡的人和事。", "粵語 喜劇 搞笑 香港"],
    e: ["Tea Restaurant Stories", "A Cantonese comedy about the people of a neighborhood café.", "cantonese comedy funny hong kong"], pin: "chacanting richang" },
  { id: 6, r: "hk", g: "drama", hue: 270, eps: 30, isNew: false, year: 2024,
    s: ["港岛风云", "粤语原声，港岛警队与商界的暗战。", "粤语 警匪 剧情 香港"],
    t: ["港島風雲", "粵語原聲，港島警隊與商界的暗戰。", "粵語 警匪 劇情 香港"],
    e: ["Harbour Lights", "Cantonese audio. A quiet war between the police and business on the island.", "cantonese crime hong kong"], pin: "gangdao fengyun" },
  { id: 19, r: "hk", g: "variety", hue: 250, eps: 26, isNew: false, year: 2025,
    s: ["维港夜话", "粤语谈话节目，嘉宾聊生活与时事。", "粤语 聊天 轻松 香港"],
    t: ["維港夜話", "粵語談話節目，嘉賓聊生活與時事。", "粵語 聊天 輕鬆 香港"],
    e: ["Harbour Talk", "A Cantonese talk show where guests discuss life and current events.", "cantonese talk light hong kong"], pin: "weigang yehua" },
  { id: 17, r: "hk", g: "news", hue: 205, eps: 400, isNew: true, year: 2026,
    s: ["香港今日", "粤语新闻，每天早晚两次更新。", "粤语 新闻 时事 香港"],
    t: ["香港今日", "粵語新聞，每天早晚兩次更新。", "粵語 新聞 時事 香港"],
    e: ["Hong Kong Today", "Cantonese news, updated morning and evening.", "cantonese news hong kong"], pin: "xianggang jinri" },
  { id: 18, r: "hk", g: "life", hue: 45, eps: 20, isNew: false, year: 2025,
    s: ["点心大师", "师傅示范点心做法，从虾饺到蛋挞。", "美食 粤语 点心 做饭"],
    t: ["點心大師", "師傅示範點心做法，從蝦餃到蛋撻。", "美食 粵語 點心 做飯"],
    e: ["Dim Sum Masters", "Masters show how dim sum is made, from shrimp dumplings to egg tarts.", "food cantonese dim sum cooking"], pin: "dianxin dashi" },
  { id: 20, r: "hk", g: "kids", hue: 60, eps: 48, isNew: false, year: 2024,
    s: ["广东话儿歌", "用粤语唱儿歌，适合教孩子说广东话。", "儿童 粤语 儿歌 学中文"],
    t: ["廣東話兒歌", "用粵語唱兒歌，適合教孩子說廣東話。", "兒童 粵語 兒歌 學中文"],
    e: ["Cantonese Rhymes", "Nursery rhymes in Cantonese, good for teaching kids the language.", "kids cantonese rhymes learning"], pin: "guangdonghua erge" },
];

/** Output of the YouTube ingest (npm run ingest). Empty until channels have been imported. */
const live = generated as unknown as { shows: Show[]; episodes: Record<string, Episode[]> };
export const USING_LIVE_DATA = live.shows.length > 0;

/** Real shows replace the samples as soon as any exist, so made-up titles never sit beside real ones. */
export const SHOWS: Show[] = USING_LIVE_DATA ? live.shows : SAMPLE_SHOWS;

export const getShow = (id: number) => SHOWS.find((s) => s.id === id);
export const showsInRegion = (r: RegionId) => SHOWS.filter((s) => s.r === r);
export const isRegion = (v: string): v is RegionId => (REGIONS as string[]).includes(v);

/** New shows first, then by id. */
export function rankedInRegion(r: RegionId): Show[] {
  return [...showsInRegion(r)].sort((a, b) => Number(b.isNew) - Number(a.isNew) || a.id - b.id);
}

const SAMPLE_FEATURED: Record<RegionId, number> = { cn: 2, tw: 13, hk: 16 };

/** The show for a region's banner, or undefined when the region has no shows. */
export function featuredFor(r: RegionId): Show | undefined {
  return USING_LIVE_DATA ? rankedInRegion(r)[0] : getShow(SAMPLE_FEATURED[r]);
}

/** One banner per region that has shows. */
export function homeFeatured(): Show[] {
  return REGIONS.map(featuredFor).filter((s): s is Show => !!s);
}

export function genreGroups(r: RegionId): { genre: (typeof GENRES)[number]; shows: Show[] }[] {
  const list = showsInRegion(r);
  return GENRES.map((genre) => ({ genre, shows: list.filter((s) => s.g === genre) })).filter((g) => g.shows.length);
}

/** More shows from the same region only. Same genre first. Regions never mix. */
export function moreLike(show: Show, limit?: number): Show[] {
  const list = showsInRegion(show.r)
    .filter((x) => x.id !== show.id)
    .sort((a, b) => Number(b.g === show.g) - Number(a.g === show.g));
  return limit ? list.slice(0, limit) : list;
}

const LABELS = ["s", "t", "e"] as const;
function haystack(s: Show): string {
  return [...LABELS.map((l) => s[l].join(" ")), s.pin].join(" ").toLowerCase();
}

export function searchShows(q: string): Show[] {
  const terms = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return [];
  return SHOWS.filter((s) => {
    const h = haystack(s);
    return terms.every((t) => h.includes(t));
  });
}

/** Placeholder for the planned AI search: keyword overlap on tags. */
export function aiPick(q: string, lang: Lang): Show[] {
  const hits = SHOWS.filter((s) => [...s.s[2].split(" "), ...s.t[2].split(" ")].some((w) => q.includes(w)));
  void lang;
  if (hits.length) return hits;
  const samples = [3, 9, 1, 7, 19].map(getShow).filter((s): s is Show => !!s);
  return samples.length ? samples : SHOWS.slice(0, 5);
}

export function tagsFor(s: Show, lang: Lang) {
  return showTags(s, lang);
}

/** Newest first. Sample shows get made-up episodes with no YouTube ids. */
export function getEpisodes(show: Show): Episode[] {
  if (USING_LIVE_DATA) return live.episodes[String(show.id)] ?? [];
  const out: Episode[] = [];
  for (let i = 0; i < show.eps; i++) {
    const number = show.eps - i;
    const d = new Date();
    d.setDate(d.getDate() - i);
    out.push({
      number,
      minutes: show.g === "news" ? 20 : 42 - (number % 7),
      publishedAt: d.toISOString(),
    });
  }
  return out;
}

export function getEpisode(show: Show, number: number): Episode | undefined {
  return getEpisodes(show).find((e) => e.number === number);
}
