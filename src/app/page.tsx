export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center bg-white px-6 py-16">
      <div className="w-full max-w-3xl flex flex-col items-center gap-10 text-center">
        <div className="flex flex-col items-center gap-3">
          <span className="text-sm font-semibold uppercase tracking-widest text-primary">
            — Zibeh Institute of Technology —
          </span>
          <h1 className="text-4xl text-navy">
            FYP Repository &amp; Approval System
          </h1>
          <p className="max-w-xl text-base text-navy/70">
            Submit topics, track approvals, and browse past final year
            projects — all in one place.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <a
            href="#"
            className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1b8bc0]"
          >
            Get Started
          </a>
          <a
            href="#"
            className="rounded-full border border-navy/15 px-6 py-3 text-sm font-semibold text-navy transition-colors hover:bg-navy/5"
          >
            Browse Repository
          </a>
        </div>

        <div className="grid w-full gap-4 sm:grid-cols-2">
          <div className="rounded-card bg-card p-6 text-left">
            <h2 className="text-lg text-navy">For Students</h2>
            <p className="mt-2 text-sm text-navy/70">
              Submit three topic options as a package and track their status
              in one dashboard.
            </p>
          </div>
          <div className="rounded-card bg-card-secondary p-6 text-left">
            <h2 className="text-lg text-navy">For Supervisors</h2>
            <p className="mt-2 text-sm text-navy/70">
              Review submitted packages, approve one topic, and leave
              feedback for your students.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
