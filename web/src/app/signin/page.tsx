import type { Metadata } from "next";
import { SignInForm } from "@/components/SignInForm";

export const metadata: Metadata = { title: "Sign in" };

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
const safePath = (p: string) => (p.startsWith("/") && !p.startsWith("//") ? p : "/");

export default async function SignInPage({ searchParams }: PageProps<"/signin">) {
  const sp = await searchParams;
  return (
    <div className="wrap pad">
      <SignInForm next={safePath(first(sp.next))} failed={first(sp.error) === "1"} />
    </div>
  );
}
