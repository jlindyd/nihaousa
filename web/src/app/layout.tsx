import type { Metadata, Viewport } from "next";
import { DM_Sans, Noto_Sans_SC, Noto_Sans_TC } from "next/font/google";
import { AuthProvider } from "@/components/AuthProvider";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { LangProvider } from "@/components/LangProvider";
import { HTML_LANG } from "@/lib/i18n";
import { getPrefs } from "@/lib/prefs";
import "./globals.css";

const dm = DM_Sans({ variable: "--font-dm", subsets: ["latin"], display: "swap" });
const sc = Noto_Sans_SC({ variable: "--font-sc", weight: ["400", "500", "700"], display: "swap", preload: false });
const tc = Noto_Sans_TC({ variable: "--font-tc", weight: ["400", "500", "700"], display: "swap", preload: false });

/** Search engines are told to stay away unless NEXT_PUBLIC_ALLOW_INDEXING=1, so staging never shows up in Google. */
const allowIndexing = process.env.NEXT_PUBLIC_ALLOW_INDEXING === "1";

export const metadata: Metadata = {
  title: { default: "NiHaoUSA 你好 USA", template: "%s · NiHaoUSA" },
  description: "Chinese shows from Mainland, Taiwan and Hong Kong, organized in one place for the Chinese community in the US.",
  robots: allowIndexing ? { index: true, follow: true } : { index: false, follow: false },
};
export const viewport: Viewport = { viewportFit: "cover", themeColor: "#121010" };

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const { lang, theme, large } = await getPrefs();
  return (
    <html
      lang={HTML_LANG[lang]}
      data-theme={theme}
      className={`${dm.variable} ${sc.variable} ${tc.variable}${large ? " large" : ""}`}
      suppressHydrationWarning
    >
      <body>
        <LangProvider lang={lang}>
          <AuthProvider>
            <Header />
            <main>{children}</main>
            <Footer />
          </AuthProvider>
        </LangProvider>
      </body>
    </html>
  );
}
