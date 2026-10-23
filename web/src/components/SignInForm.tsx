"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { getBrowserClient } from "@/lib/supabase/client";
import { useAuth } from "./AuthProvider";
import { useLang } from "./LangProvider";

export function SignInForm({ next, failed }: { next: string; failed: boolean }) {
  const { t } = useLang();
  const { configured, user, signOut } = useAuth();
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">(failed ? "error" : "idle");

  const redirectTo = () => `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

  const google = async () => {
    setState("idle");
    const { error } = (await getBrowserClient()?.auth.signInWithOAuth({ provider: "google", options: { redirectTo: redirectTo() } })) ?? {};
    if (error) setState("error");
  };

  const emailLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setState("sending");
    const { error } = (await getBrowserClient()?.auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: redirectTo() } })) ?? {};
    setState(error ? "error" : "sent");
  };

  return (
    <div className="signin">
      <span className="logo-chip" style={{ width: 96, height: 96, borderRadius: 28, margin: "0 auto 12px" }}>
        <Image src="/logo.png" alt="" width={80} height={80} />
      </span>
      <h1>{t("signInTitle")}</h1>

      {!configured ? (
        <p>{t("authOff")}</p>
      ) : user ? (
        <>
          <p>{t("signedInAs", user.email)}</p>
          <div className="sso">
            <Link className="btn" href={next}>{t("home")}</Link>
            <button onClick={signOut}>{t("signOut")}</button>
          </div>
        </>
      ) : (
        <>
          <p>{t("signInSub")}</p>
          <div className="sso">
            <button onClick={google}>{t("google")}</button>
          </div>
          <p style={{ margin: "18px 0 8px", fontSize: 14 }}>{t("orEmail")}</p>
          {state === "sent" ? (
            <p role="status" style={{ color: "var(--fg)" }}>{t("linkSent", email.trim())}</p>
          ) : (
            <form className="sso" onSubmit={emailLink}>
              <input
                className="field"
                type="email"
                required
                autoComplete="email"
                inputMode="email"
                placeholder={t("emailPh")}
                aria-label={t("emailPh")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button type="submit" className="primary" disabled={state === "sending"}>
                {state === "sending" ? t("sending") : t("sendLink")}
              </button>
            </form>
          )}
          {state === "error" && <p role="alert" style={{ color: "var(--accent)" }}>{t("authError")}</p>}
          <p style={{ fontSize: 14, marginTop: 18 }}>
            {t("signInFine")} <Link href="/privacy" style={{ textDecoration: "underline" }}>{t("privacy")}</Link>
          </p>
        </>
      )}
    </div>
  );
}
