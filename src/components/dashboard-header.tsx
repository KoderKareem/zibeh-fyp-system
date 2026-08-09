import Link from "next/link";
import { logout } from "@/lib/auth/actions";
import { createClient } from "@/lib/supabase/server";
import { NotificationBell } from "@/components/notification-bell";

export async function DashboardHeader({
  heading,
  fullName,
  homeHref,
}: {
  heading: string;
  fullName: string;
  homeHref: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: notifications } = user
    ? await supabase
        .from("notifications")
        .select("id, title, body, link, is_read, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10)
    : { data: [] };

  const { count: unreadCount } = user
    ? await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_read", false)
    : { count: 0 };

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-navy/10 px-6 py-4 sm:px-10">
      <Link href={homeHref} className="flex flex-col hover:opacity-80">
        <span className="text-xs font-semibold uppercase tracking-widest text-primary">
          Zibeh FYP Repository
        </span>
        <h1 className="text-xl text-navy">{heading}</h1>
      </Link>

      <div className="flex items-center gap-3 sm:gap-4">
        <NotificationBell notifications={notifications ?? []} unreadCount={unreadCount ?? 0} />
        <span className="hidden truncate text-sm text-navy/70 sm:inline sm:max-w-[160px]">
          {fullName}
        </span>
        <form action={logout}>
          <button
            type="submit"
            className="rounded-full border border-navy/15 px-3 py-2 text-xs font-semibold text-navy transition-colors hover:bg-navy/5 sm:px-4 sm:text-sm"
          >
            Log out
          </button>
        </form>
      </div>
    </header>
  );
}
