import type { GenreId, Lang, RegionId, Show } from "./types";

export const LANGS: Lang[] = ["s", "t", "e"];
export const REGIONS: RegionId[] = ["cn", "tw", "hk"];
export const GENRES: GenreId[] = ["drama", "variety", "news", "life", "doc", "kids"];
export const REGION_HUE: Record<RegionId, number> = { cn: 8, tw: 195, hk: 280 };
export const HTML_LANG: Record<Lang, string> = { s: "zh-Hans", t: "zh-Hant", e: "en" };

export const CHIPS: Record<Lang, string[]> = {
  s: ["轻松", "古装", "粤语", "家常菜", "养生", "新闻", "儿童"],
  t: ["輕鬆", "古裝", "粵語", "家常菜", "養生", "新聞", "兒童"],
  e: ["light", "period", "cantonese", "cooking", "wellness", "news", "kids"],
};

export const CHANNEL_LABEL: Record<Lang, string> = { s: "示例频道", t: "示例頻道", e: "Sample channel" };

const s = {
  home: "首页", cn: "大陆", tw: "台湾", hk: "香港", mylist: "我的列表", me: "我的", search: "搜索",
  drama: "电视剧", variety: "综艺", news: "新闻", life: "生活", doc: "纪录片", kids: "儿童", all: "全部",
  ph: "搜索节目、拼音或关键词", play: "播放", info: "详情", byRegion: "按地区浏览",
  contW: "继续观看", top10: (R: string) => `${R} 本周 Top 10`, latest: (R: string) => `${R} 最新上线`,
  more: "全部 ›", back: "返回", nShows: (n: number) => `${n} 个节目`, epN: (n: number) => `第${n}期`,
  epsTotal: (n: number) => `共 ${n} 集`, epsShort: (n: number) => `${n}集`,
  official: "官方频道", start: (n: number) => `播放 第${n}期`, cont: (n: number) => `继续 第${n}期`,
  follow: "关注 · 新集提醒", following: "已关注", share: "分享", tabEps: "剧集", tabMore: "更多类似",
  source: (c: string) => `来源：${c} · 每小时自动检查更新`, done: "已看", mins: (n: number) => `${n} 分钟`,
  today: "今天", yesterday: "昨天",
  signIn: "登录", signOut: "退出登录", signInTitle: "登录，保存你的节目",
  signInSub: "用你已有的邮箱登录，不用设置密码。登录后，你的列表和观看记录会在手机和电脑之间同步。",
  google: "使用 Google 登录", orEmail: "或用其他邮箱", emailPh: "你的邮箱地址", sendLink: "发送登录链接", sending: "发送中…",
  linkSent: (e: string) => `登录链接已发到 ${e}。打开邮件，点一下链接就可以了。`,
  authError: "登录没有成功，请再试一次。", authOff: "登录功能还没有开通。",
  signInFine: "我们只用你的邮箱来保存列表和观看记录。详见隐私政策。",
  privacy: "隐私政策", ytTerms: "YouTube 服务条款",
  signedInAs: (e: string) => `已登录：${e}`, syncedNote: "你的列表和观看记录已保存到账号，在手机和电脑之间同步。",
  signInPrompt: "登录后，你的列表和观看记录会在手机和电脑之间同步。",
  onYouTube: "在 YouTube 观看",
  playerNote: "这是示例节目，还没有关联 YouTube 视频。正式节目会在这里显示 YouTube 官方播放器。",
  addList: "加入列表", inList: "已在列表", markW: "标记已看", markedW: "✓ 已标记", copied: "链接已复制",
  report: "举报", reported: "已收到举报，谢谢", later: "稍后再看", favs: "我的收藏", next: "接下来",
  caught: "已经是最新一期。", alsoLike: "同地区更多节目",
  savedHere: "你的列表和观看记录保存在这台设备上。登录功能即将推出，到时可以在手机和电脑同步。",
  followingRow: "正在关注", customS: "新集提醒", emptyList: "还没有节目。在播放页点“加入列表”。",
  askAI: "AI 问问", allRegions: "全部地区",
  searchEmpty: "输入节目名、拼音或关键词，例如 “zhoumo”、“古装”、“粤语”。",
  found: (n: number) => `找到 ${n} 个结果`, noRes: (q: string) => `没有找到 “${q}”。试试别的词，或者问问 AI。`, askBtn: "用 AI 问问",
  aiDefault: "我妈妈喜欢看的轻松节目", aiAnswer: (n: number) => `我从节目库里挑了 ${n} 个，节奏轻松，适合一起看。按地区分开列出。`,
  aiPreview: "预览：AI 搜索将在后续版本推出。这里是示意。", why: "推荐原因：", sep: "、",
  note: "节目名为示例。大陆、台湾、香港的节目分开呈现，不混在一起。",
  langLabel: "语言", theme: "深色 / 浅色", large: "大字", nothingYet: "这里还没有节目。",
};
const t: typeof s = {
  home: "首頁", cn: "大陸", tw: "台灣", hk: "香港", mylist: "我的清單", me: "我的", search: "搜尋",
  drama: "電視劇", variety: "綜藝", news: "新聞", life: "生活", doc: "紀錄片", kids: "兒童", all: "全部",
  ph: "搜尋節目、拼音或關鍵字", play: "播放", info: "詳情", byRegion: "按地區瀏覽",
  contW: "繼續觀看", top10: (R) => `${R} 本週 Top 10`, latest: (R) => `${R} 最新上線`,
  more: "全部 ›", back: "返回", nShows: (n) => `${n} 個節目`, epN: (n) => `第${n}期`,
  epsTotal: (n) => `共 ${n} 集`, epsShort: (n) => `${n}集`,
  official: "官方頻道", start: (n) => `播放 第${n}期`, cont: (n) => `繼續 第${n}期`,
  follow: "關注 · 新集提醒", following: "已關注", share: "分享", tabEps: "劇集", tabMore: "更多類似",
  source: (c) => `來源：${c} · 每小時自動檢查更新`, done: "已看", mins: (n) => `${n} 分鐘`,
  today: "今天", yesterday: "昨天",
  signIn: "登入", signOut: "登出", signInTitle: "登入，儲存你的節目",
  signInSub: "用你已有的電子郵件登入，不用設定密碼。登入後，你的清單和觀看紀錄會在手機和電腦之間同步。",
  google: "使用 Google 登入", orEmail: "或用其他電子郵件", emailPh: "你的電子郵件地址", sendLink: "寄送登入連結", sending: "寄送中…",
  linkSent: (e) => `登入連結已寄到 ${e}。打開郵件，點一下連結就可以了。`,
  authError: "登入沒有成功，請再試一次。", authOff: "登入功能還沒有開通。",
  signInFine: "我們只用你的電子郵件來儲存清單和觀看紀錄。詳見隱私權政策。",
  privacy: "隱私權政策", ytTerms: "YouTube 服務條款",
  signedInAs: (e) => `已登入：${e}`, syncedNote: "你的清單和觀看紀錄已儲存到帳號，在手機和電腦之間同步。",
  signInPrompt: "登入後，你的清單和觀看紀錄會在手機和電腦之間同步。",
  onYouTube: "在 YouTube 觀看",
  playerNote: "這是示例節目，還沒有關聯 YouTube 影片。正式節目會在這裡顯示 YouTube 官方播放器。",
  addList: "加入清單", inList: "已在清單", markW: "標記已看", markedW: "✓ 已標記", copied: "連結已複製",
  report: "檢舉", reported: "已收到檢舉，謝謝", later: "稍後再看", favs: "我的收藏", next: "接下來",
  caught: "已經是最新一期。", alsoLike: "同地區更多節目",
  savedHere: "你的清單和觀看紀錄儲存在這台裝置上。登入功能即將推出，屆時可在手機和電腦同步。",
  followingRow: "正在關注", customS: "新集提醒", emptyList: "還沒有節目。在播放頁點「加入清單」。",
  askAI: "AI 問問", allRegions: "全部地區",
  searchEmpty: "輸入節目名、拼音或關鍵字，例如 “zhoumo”、“古裝”、“粵語”。",
  found: (n) => `找到 ${n} 個結果`, noRes: (q) => `沒有找到 “${q}”。試試別的詞，或者問問 AI。`, askBtn: "用 AI 問問",
  aiDefault: "我媽媽喜歡看的輕鬆節目", aiAnswer: (n) => `我從節目庫裡挑了 ${n} 個，節奏輕鬆，適合一起看。按地區分開列出。`,
  aiPreview: "預覽：AI 搜尋將在後續版本推出。這裡是示意。", why: "推薦原因：", sep: "、",
  note: "節目名為示例。大陸、台灣、香港的節目分開呈現，不混在一起。",
  langLabel: "語言", theme: "深色 / 淺色", large: "大字", nothingYet: "這裡還沒有節目。",
};
const e: typeof s = {
  home: "Home", cn: "Mainland", tw: "Taiwan", hk: "Hong Kong", mylist: "My List", me: "Me", search: "Search",
  drama: "Dramas", variety: "Variety", news: "News", life: "Life", doc: "Documentary", kids: "Kids", all: "All",
  ph: "Search shows, pinyin or keywords", play: "Play", info: "More info", byRegion: "Browse by region",
  contW: "Continue watching", top10: (R) => `Top 10 in ${R} this week`, latest: (R) => `New in ${R}`,
  more: "See all ›", back: "Back", nShows: (n) => `${n} shows`, epN: (n) => `Episode ${n}`,
  epsTotal: (n) => `${n} episodes`, epsShort: (n) => `${n} eps`,
  official: "Official channel", start: (n) => `Play Episode ${n}`, cont: (n) => `Continue Episode ${n}`,
  follow: "Follow for new episodes", following: "Following", share: "Share", tabEps: "Episodes", tabMore: "More like this",
  source: (c) => `Source: ${c} · Checked for new episodes hourly`, done: "Watched", mins: (n) => `${n} min`,
  today: "Today", yesterday: "Yesterday",
  signIn: "Sign in", signOut: "Sign out", signInTitle: "Sign in to save your shows",
  signInSub: "Use the email you already have. No password to set up. Your lists and watch history will sync across your phone and computer.",
  google: "Continue with Google", orEmail: "or use another email", emailPh: "Your email address", sendLink: "Email me a sign-in link", sending: "Sending…",
  linkSent: (e) => `We sent a sign-in link to ${e}. Open the email and tap the link.`,
  authError: "Sign-in didn't work. Please try again.", authOff: "Sign-in isn't available yet.",
  signInFine: "We only use your email to save your lists and watch history. See the privacy policy.",
  privacy: "Privacy", ytTerms: "YouTube Terms of Service",
  signedInAs: (e) => `Signed in as ${e}`, syncedNote: "Your lists and watch history are saved to your account and sync across your devices.",
  signInPrompt: "Sign in to sync your lists and watch history across your phone and computer.",
  onYouTube: "Watch on YouTube",
  playerNote: "This is a sample show with no YouTube video attached yet. Real shows play through YouTube's official player here.",
  addList: "Add to list", inList: "In my list", markW: "Mark watched", markedW: "✓ Marked", copied: "Link copied",
  report: "Report", reported: "Report received. Thank you.", later: "Watch later", favs: "Favorites", next: "Up next",
  caught: "You're caught up.", alsoLike: "More from this region",
  savedHere: "Your lists and watch history are saved on this device. Sign-in is coming, and will sync them across phone and computer.",
  followingRow: "Following", customS: "New episode alerts", emptyList: "Nothing here yet. Tap “Add to list” on a video.",
  askAI: "Ask AI", allRegions: "All regions",
  searchEmpty: "Type a show name, pinyin or keyword, such as “zhoumo”, “cantonese” or “family”.",
  found: (n) => `${n} results`, noRes: (q) => `No results for “${q}”. Try another word, or ask AI.`, askBtn: "Ask AI instead",
  aiDefault: "Something light my mom would enjoy", aiAnswer: (n) => `I picked ${n} shows from the catalog that are easy to watch together, listed by region.`,
  aiPreview: "Preview: AI search is planned for a later version. This is an illustration.", why: "Why: ", sep: ", ",
  note: "Show titles are samples. Mainland, Taiwan and Hong Kong shows are kept apart, never mixed.",
  langLabel: "Language", theme: "Dark / light", large: "Larger text", nothingYet: "Nothing here yet.",
};

export const L = { s, t, e };
export type Key = keyof typeof s;
export type TFn = (key: Key, ...args: (string | number)[]) => string;

export function makeT(lang: Lang): TFn {
  const dict = L[lang];
  return (key, ...args) => {
    const v = dict[key];
    return typeof v === "function" ? (v as (...a: (string | number)[]) => string)(...args) : v;
  };
}

export const showTitle = (sh: Show, lang: Lang) => sh[lang][0];
export const showDesc = (sh: Show, lang: Lang) => sh[lang][1];
export const showTags = (sh: Show, lang: Lang) => sh[lang][2].split(" ");
/** English name shown as a subtitle under Chinese titles. */
export const showSub = (sh: Show, lang: Lang) => (lang === "e" ? "" : sh.e[0]);

const LOCALE: Record<Lang, string> = { s: "zh-CN", t: "zh-TW", e: "en-US" };
export function formatDate(iso: string, lang: Lang, t: TFn): string {
  const d = new Date(iso);
  const days = Math.floor((Date.now() - d.getTime()) / 86_400_000);
  if (days <= 0) return t("today");
  if (days === 1) return t("yesterday");
  return new Intl.DateTimeFormat(LOCALE[lang], { month: "short", day: "numeric" }).format(d);
}
