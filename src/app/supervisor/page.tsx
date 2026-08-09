import Link from "next/link";

export default function SupervisorPage() {
  return (
    <Link
      href="/supervisor/dashboard"
      className="block rounded-card bg-card-secondary p-6 transition-colors hover:bg-card-secondary/70"
    >
      <h2 className="text-lg text-navy">Submission packages</h2>
      <p className="mt-2 text-sm text-navy/70">
        Review packages from your assigned students — approve one topic or reject the whole set.
      </p>
    </Link>
  );
}
