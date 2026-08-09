import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export async function SiteHeader({ title }: { title?: string } = {}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let homeHref = "/repository";
  if (user) {
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (profile) homeHref = `/${profile.role}`;
  }

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-navy/10 px-6 py-4 sm:px-10">
      <Link href={homeHref} className="flex flex-col hover:opacity-80">
        <span className="text-xs font-semibold uppercase tracking-widest text-primary">
          Zibeh FYP Repository
        </span>
        {title ? <h1 className="text-xl text-navy">{title}</h1> : null}
      </Link>

      <div className="flex flex-wrap items-center gap-3">
        <Link href="/" className="text-sm font-semibold text-navy/70 hover:text-navy">
          Home
        </Link>
        {user ? (
          <Link
            href={homeHref}
            className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover"
          >
            Go to dashboard
          </Link>
        ) : (
          <>
            <Link href="/login" className="text-sm font-semibold text-navy/70 hover:text-navy">
              Log in
            </Link>
            <Link
              href="/register"
              className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover"
            >
              Register
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
