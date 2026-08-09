import { logout } from "@/lib/auth/actions";
import { createClient } from "@/lib/supabase/server";
import { NotificationBell } from "@/components/notification-bell";

export async function DashboardHeader({
  heading,
  fullName,
}: {
  heading: string;
  fullName: string;
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
    <header className="flex items-center justify-between border-b border-navy/10 px-6 py-4 sm:px-10">
      <div>
        <span className="text-xs font-semibold uppercase tracking-widest text-primary">
          Zibeh FYP Repository
        </span>
        <h1 className="text-xl text-navy">{heading}</h1>
      </div>

      <div className="flex items-center gap-4">
        <NotificationBell notifications={notifications ?? []} unreadCount={unreadCount ?? 0} />
        <span className="text-sm text-navy/70">{fullName}</span>
        <form action={logout}>
          <button
            type="submit"
            className="rounded-full border border-navy/15 px-4 py-2 text-sm font-semibold text-navy transition-colors hover:bg-navy/5"
          >
            Log out
          </button>
        </form>
      </div>
    </header>
  );
}
