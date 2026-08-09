import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ReviewForm } from "./review-form";

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  approved: "One Approved",
  rejected: "Rejected",
};

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-[#fff7e6] text-amber-700",
  approved: "bg-[#e6f6ec] text-green-700",
  rejected: "bg-red-50 text-red-700",
};

type Topic = {
  id: string;
  topic_number: number;
  title: string;
  description: string | null;
  keywords: string[];
};

export default async function SupervisorReviewPage(props: PageProps<"/supervisor/review/[id]">) {
  const { id } = await props.params;
  const supabase = await createClient();

  const { data: pkg } = await supabase
    .from("submission_packages")
    .select("id, status, student_id, session_id, supervisor_comment, approved_topic_id, decided_at")
    .eq("id", id)
    .maybeSingle();

  if (!pkg) notFound();

  const [{ data: student }, { data: session }, { data: topics }] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", pkg.student_id).single(),
    supabase.from("academic_sessions").select("label").eq("id", pkg.session_id).single(),
    supabase
      .from("submission_topics")
      .select("id, topic_number, title, description, keywords")
      .eq("package_id", pkg.id)
      .order("topic_number")
      .returns<Topic[]>(),
  ]);

  const topicList = topics ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-card bg-card-secondary p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg text-navy">{student?.full_name ?? "—"}</h2>
            <p className="mt-1 text-sm text-navy/70">{session?.label ?? "—"}</p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLE[pkg.status]}`}>
            {STATUS_LABEL[pkg.status]}
          </span>
        </div>
      </div>

      {pkg.status === "pending" ? (
        <ReviewForm packageId={pkg.id} topics={topicList} />
      ) : (
        <div className="flex flex-col gap-5">
          <div className="grid gap-4 sm:grid-cols-3">
            {topicList.map((topic) => (
              <div
                key={topic.id}
                className={`rounded-card border-2 p-4 ${
                  topic.id === pkg.approved_topic_id
                    ? "border-primary bg-white"
                    : "border-transparent bg-card"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wide text-navy/50">
                    Topic {topic.topic_number}
                  </span>
                  {topic.id === pkg.approved_topic_id ? (
                    <span className="text-xs font-semibold text-primary">Approved</span>
                  ) : null}
                </div>
                <p className="mt-1 text-sm font-semibold text-navy">{topic.title}</p>
                {topic.description ? (
                  <p className="mt-1 text-xs text-navy/70">{topic.description}</p>
                ) : null}
                {topic.keywords?.length ? (
                  <p className="mt-1 text-xs text-navy/50">{topic.keywords.join(", ")}</p>
                ) : null}
              </div>
            ))}
          </div>

          <div className="rounded-card bg-card p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-navy/50">
              Your comment
            </p>
            <p className="mt-1 text-sm text-navy/80">{pkg.supervisor_comment}</p>
            {pkg.decided_at ? (
              <p className="mt-3 text-xs text-navy/50">
                Decided {new Date(pkg.decided_at).toLocaleDateString()}
              </p>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
