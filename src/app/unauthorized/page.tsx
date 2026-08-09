import Link from "next/link";
import { logout } from "@/lib/auth/actions";

export default function UnauthorizedPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-white px-6 py-16 text-center">
      <div className="w-full max-w-sm rounded-card bg-card-secondary p-8">
        <h1 className="text-2xl text-navy">You don&apos;t have access</h1>
        <p className="mt-2 text-sm text-navy/70">
          Your account doesn&apos;t have permission to view that page.
        </p>

        <div className="mt-6 flex flex-col items-center gap-3">
          <Link
            href="/"
            className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1b8bc0]"
          >
            Back to home
          </Link>
          <form action={logout}>
            <button
              type="submit"
              className="text-sm font-semibold text-navy/70 hover:text-navy"
            >
              Log out
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
