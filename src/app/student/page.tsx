import Link from "next/link";

export default function StudentPage() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Link
        href="/student/submit"
        className="rounded-card bg-card p-6 transition-colors hover:bg-card/70"
      >
        <h2 className="text-lg text-navy">Submit topics</h2>
        <p className="mt-2 text-sm text-navy/70">
          Submit your 3 topic options as one package for your supervisor to
          review.
        </p>
      </Link>

      <Link
        href="/student/history"
        className="rounded-card bg-card-secondary p-6 transition-colors hover:bg-card-secondary/70"
      >
        <h2 className="text-lg text-navy">Submission history</h2>
        <p className="mt-2 text-sm text-navy/70">
          Track the status of your past packages and read your supervisor&apos;s
          comments.
        </p>
      </Link>
    </div>
  );
}
