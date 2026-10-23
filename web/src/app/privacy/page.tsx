import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy" };

/*
 * DRAFT. Written to cover what the site does today and what YouTube's API Services policy asks a site to say.
 * Have it reviewed, and fill in CONTACT, before the site is public.
 */
const CONTACT = ""; // e.g. "privacy@example.com"

export default function PrivacyPage() {
  return (
    <div className="wrap pad">
      <article className="prose">
        <p className="note" style={{ marginTop: 0 }}>Draft. This page needs a contact email and a review before the site goes public.</p>
        <h1>Privacy</h1>
        <p>NiHaoUSA collects Chinese-language shows from YouTube channels and organizes them in one place. This page explains what we keep about you.</p>

        <h2>What we keep</h2>
        <ul>
          <li><b>If you sign in:</b> your email address, and the name and photo on your Google account if you use Google sign-in. We never receive your Google password and we do not ask for access to your YouTube account.</li>
          <li><b>Your lists:</b> the shows you save, follow or favorite, and where you stopped watching. This is how Continue Watching and My List work across your devices.</li>
          <li><b>Preferences:</b> your language, light or dark mode and text size, kept in cookies in your browser.</li>
        </ul>
        <p>If you do not sign in, your lists and history stay in your own browser and are not sent to us.</p>

        <h2>YouTube</h2>
        <p>
          Videos play in YouTube&apos;s own embedded player. NiHaoUSA uses YouTube API Services, and by using this site you agree to be bound by the{" "}
          <a href="https://www.youtube.com/t/terms" target="_blank" rel="noopener">YouTube Terms of Service</a>. YouTube and Google may collect information when
          a video loads or plays, as described in the{" "}
          <a href="https://policies.google.com/privacy" target="_blank" rel="noopener">Google Privacy Policy</a>.
        </p>
        <p>
          If you signed in with Google, you can remove this site&apos;s access at any time in your{" "}
          <a href="https://security.google.com/settings/security/permissions" target="_blank" rel="noopener">Google security settings</a>.
          Deleting data here does not delete anything stored by YouTube or Google.
        </p>

        <h2>Cookies</h2>
        <p>We use cookies to keep you signed in and to remember your display preferences. We do not use advertising cookies, and no third party serves ads on this site at the moment.</p>

        <h2>Deleting your data</h2>
        <p>
          Ask us to delete your account and everything saved in it, and we will do it within 7 days.
          {CONTACT ? <> Write to <a href={`mailto:${CONTACT}`}>{CONTACT}</a>.</> : <> (Contact email to be added.)</>}
        </p>
      </article>
    </div>
  );
}
