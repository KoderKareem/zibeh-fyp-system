import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PACKAGE_STATUS_LABEL as STATUS_LABEL, PACKAGE_STATUS_STYLE as STATUS_STYLE } from "@/lib/status";

type Topic = {
  id: string;
  topic_number: number;
  title: string;
  case_study: string | null;
  description: string | null;
  keywords: string[];
};

type PackageRow = {
  id: string;
  status: "pending" | "approved" | "rejected";
  supervisor_comment: string | null;
  created_at: string;
  approved_topic_id: string | null;
  session: { label: string } | null;
  supervisor: { full_name: string } | null;
  topics: Topic[];
};

export default async function StudentHistoryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: packages } = await supabase
    .from("submission_packages")
    .select(
      `id, status, supervisor_comment, created_at, approved_topic_id,
       session:academic_sessions(label),
       supervisor:profiles!submission_packages_supervisor_id_fkey(full_name),
       topics:submission_topics!submission_topics_package_id_fkey(id, topic_number, title, case_study, description, keywords)`,
    )
    .eq("student_id", user!.id)
    .order("created_at", { ascending: false })
    .returns<PackageRow[]>();

  if (!packages || packages.length === 0) {
    return (
      <div className="rounded-card bg-card p-6">
        <p className="text-sm text-navy/70">
          You haven&apos;t submitted any topic packages yet.{" "}
          <Link href="/student/submit" className="font-semibold text-primary">
            Submit your first package
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {packages.map((pkg) => (
        <div key={pkg.id} className="rounded-card bg-card-secondary p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm text-navy/60">
              {pkg.session ? `${pkg.session.label} · ` : ""}
              Submitted {new Date(pkg.created_at).toLocaleDateString()}
            </span>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLE[pkg.status]}`}
            >
              {STATUS_LABEL[pkg.status]}
            </span>
          </div>

          <p className="mt-1 text-sm text-navy/70">
            Supervisor: {pkg.supervisor?.full_name ?? "—"}
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {[...pkg.topics]
              .sort((a, b) => a.topic_number - b.topic_number)
              .map((topic) => (
                <div
                  key={topic.id}
                  className={`rounded-lg border p-3 ${
                    topic.id === pkg.approved_topic_id
                      ? "border-primary bg-white"
                      : "border-navy/10 bg-white/60"
                  }`}
                >
                  <p className="text-sm font-semibold text-navy">
                    {topic.title}
                    {topic.id === pkg.approved_topic_id ? (
                      <span className="ml-2 text-xs font-semibold text-primary">
                        Approved
                      </span>
                    ) : null}
                  </p>
                  {topic.case_study ? (
                    <p className="mt-1 text-xs font-medium text-navy/60">{topic.case_study}</p>
                  ) : null}
                  {topic.description ? (
                    <p className="mt-1 text-xs text-navy/70">{topic.description}</p>
                  ) : null}
                  {topic.keywords?.length ? (
                    <p className="mt-1 text-xs text-navy/50">
                      {topic.keywords.join(", ")}
                    </p>
                  ) : null}
                </div>
              ))}
          </div>

          {pkg.supervisor_comment ? (
            <div className="mt-4 rounded-lg bg-white p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-navy/50">
                Supervisor comment
              </p>
              <p className="mt-1 text-sm text-navy/80">{pkg.supervisor_comment}</p>
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
