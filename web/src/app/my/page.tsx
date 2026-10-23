import type { Metadata } from "next";
import { MyLists } from "@/components/MyLists";
import { makeT } from "@/lib/i18n";
import { getPrefs } from "@/lib/prefs";

export const metadata: Metadata = { title: "My List" };

export default async function MyPage() {
  const { lang } = await getPrefs();
  return (
    <div className="wrap pad">
      <h1 style={{ fontSize: 28 }}>{makeT(lang)("mylist")}</h1>
      <MyLists />
    </div>
  );
}
