# NiHaoUSA web

Curated Chinese shows from Mainland China, Taiwan and Hong Kong, organized in one place. Built with Next.js (App Router).

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # production build
```

## How it is organized

| Path | What it does |
|---|---|
| `src/lib/catalog.ts` | The catalog. The only file that knows where shows come from: the ingest output when it exists, sample data otherwise. |
| `ingest/` | The YouTube ingest: API client, filters, grouping, build, command line, tests. |
| `data/` | Channel registry, overrides, generated catalog, review queue. `data/raw/` is not committed. |
| `src/lib/i18n.ts` | All interface text in 简体 / 繁體 / English, plus region and genre lists. |
| `src/lib/store.ts` | Guest lists, follows and watch history in the browser's localStorage. Swap for the database when accounts arrive. |
| `src/lib/prefs.ts` | Language, theme and text size, read from cookies on the server. |
| `src/components/Player.tsx` | YouTube's official embedded player, unmodified. Saves position for "Continue watching". |
| `src/app/` | Pages: `/`, `/region/[region]`, `/show/[id]`, `/watch/[id]/[ep]`, `/search`, `/my`. |

## YouTube ingest

The ingest turns a list of channels into the catalog the site shows. Until channels are imported the site shows sample shows.

```
data/channels.json  →  fetch  →  data/raw/  →  build  →  data/catalog.generated.json
 (you edit this)      (API)     (≤ 30 days)   (filters +    (the site reads this)
                                               grouping)     data/review.json (unsure videos)
```

1. Create a YouTube Data API v3 key in Google Cloud Console and put it in `web/.env.local`: `YOUTUBE_API_KEY=...`
2. Add channels to `data/channels.json` (see `data/channels.example.json`). Each needs a `name`, a `region` (`cn`, `tw` or `hk`) and one of `id`, `handle` or `url`.
3. Run:

```bash
npm run ingest -- run      # resolve ids, fetch the last 7 days from YouTube, build the catalog
npm run ingest -- fetch --days 365   # bulk load further back (earlier videos are kept and refreshed)
npm run ingest -- status   # what is imported, how old the data is
npm run ingest -- health   # re-check every video, then run `build` again
npm run ingest -- build    # rebuild from data already fetched (no API calls)
npm run test:ingest        # tests for filters and grouping (no API key needed)
```

What the build does:

- **Filters** drop videos that are not embeddable, not public, blocked in the US, live, shorter than 8 minutes (set `minMinutes` per channel), longer than 4 hours, or titled as a trailer, clip or highlight.
- **Grouping** finds each video's show from the channel's series playlists, then from `《show name》` in the title, then from the title text. Episode numbers come from `第N集`, `EP N`, `#N` or a date. Videos without numbers are numbered by date.
- **Duplicates:** when two videos are the same episode, the HD copy wins.
- **Review:** anything it is unsure about (a lone video, unclear numbering) goes to `data/review.json` instead of the site.
- **Fixes that last:** put hand-made fixes in `data/overrides.json` (hide a show or video, rename a show, move it to another region). Every rebuild applies them.
- **30-day rule:** `build` refuses raw data older than 30 days. Run `fetch` (or `run`) at least monthly, ideally daily.
- **Titles** are converted between 简体 and 繁體 automatically, and pinyin is generated for search. English subtitles are pinyin until a translation step is added.

Channel settings worth knowing (see `ingest/types.ts` for all): `singleShow: true` for a channel that is one program (a daily show or a news broadcast), `genre`, `minMinutes`, `sinceDays`, `excludeTitle`.

Quota: a week of one channel costs roughly 40 to 100 units, a full catch-up of 24,000 videos roughly 1,000. The default daily quota is 10,000 units.

## Sign-in

Passwordless sign-in through Supabase: **Continue with Google**, or an **email link** for any other address. Signed-in viewers get their lists, follows and watch history saved to their account and synced across devices. Until Supabase is connected the site works as before and nobody sees sign-in buttons.

Setup (once):

1. Create a free project at https://supabase.com. In **Project Settings → API**, copy the **Project URL** and the **publishable** (or anon) key, and put them in `web/.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
   ```
2. In the Supabase **SQL Editor**, run everything in `supabase/schema.sql`. It creates one table and the rules that let each person see only their own row.
3. **Authentication → URL Configuration:** set Site URL to `http://localhost:3000` for now, and add `http://localhost:3000/auth/callback` to the Redirect URLs. Add the real domain and its `/auth/callback` before launch.
4. **Email link:** works out of the box (Supabase sends the email). The free built-in sender is rate limited, so use a custom SMTP sender before launch.
5. **Google:** in Google Cloud Console create an OAuth client (type *Web application*), set its authorized redirect URI to the callback URL shown in **Authentication → Providers → Google**, then paste the client ID and secret there and switch the provider on.

How it fits together: `src/components/AuthProvider.tsx` knows who is signed in; `src/lib/sync.ts` merges a guest's local lists into the account on first sign-in and then keeps both in step; `src/app/auth/callback/route.ts` finishes the login; `src/proxy.ts` keeps the session fresh. The privacy page at `/privacy` is a draft that needs a contact email.

## Rules to keep

- Mainland, Taiwan and Hong Kong are never mixed in a row, search result or "more like this".
- Nothing is drawn over the YouTube player, and no YouTube audio or video is downloaded or stored.
- YouTube API data may be kept 30 days at most, then refreshed or deleted.
- Credit the YouTube channel on every episode, and link YouTube's Terms of Service and a privacy policy that references Google's.

## Not built yet

- Running the ingest on a schedule (daily fetch and health check)
- A screen for the review queue and overrides
- Database and sign-in (Supabase)
- AI search (the "Ask AI" tab is a labeled preview)
- Directory and other community services
