import { logout } from "@/lib/auth/actions";

export function DashboardHeader({
  heading,
  fullName,
}: {
  heading: string;
  fullName: string;
}) {
  return (
    <header className="flex items-center justify-between border-b border-navy/10 px-6 py-4 sm:px-10">
      <div>
        <span className="text-xs font-semibold uppercase tracking-widest text-primary">
          Zibeh FYP Repository
        </span>
        <h1 className="text-xl text-navy">{heading}</h1>
      </div>

      <div className="flex items-center gap-4">
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
