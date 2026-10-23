import Image from "next/image";
import Link from "next/link";
import { makeT } from "@/lib/i18n";
import { getPrefs } from "@/lib/prefs";

export default async function NotFound() {
  const { lang } = await getPrefs();
  const t = makeT(lang);
  return (
    <div className="wrap pad">
      <div className="empty">
        <span className="logo-chip" style={{ width: 84, height: 84, borderRadius: 24, margin: "0 auto 12px" }}>
          <Image src="/logo.png" alt="" width={68} height={68} />
        </span>
        <p>{t("nothingYet")}</p>
        <Link className="btn" href="/">{t("home")}</Link>
      </div>
    </div>
  );
}
