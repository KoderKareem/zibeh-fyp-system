import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DelegateForm } from "./delegate-form";
import { AdminDecideForm } from "./admin-decide-form";

type Topic = {
  id: string;
  topic_number: number;
  title: string;
  case_study: string | null;
  description: string | null;
  keywords: string[];
};

export default async function AdminPendingSubmissionPage(
  props: PageProps<"/admin/submissions/pending/[id]">,
) {
  const { id } = await props.params;
  const supabase = await createClient();

  const { data: pkg } = await supabase
    .from("submission_packages")
    .select("id, status, supervisor_id, student_id, session_id")
    .eq("id", id)
    .maybeSingle();

  if (!pkg || pkg.status !== "pending" || pkg.supervisor_id) notFound();

  const [{ data: student }, { data: session }, { data: topics }, { data: supervisors }] =
    await Promise.all([
      supabase.from("profiles").select("full_name").eq("id", pkg.student_id).single(),
      supabase.from("academic_sessions").select("label").eq("id", pkg.session_id).single(),
      supabase
        .from("submission_topics")
        .select("id, topic_number, title, case_study, description, keywords")
        .eq("package_id", pkg.id)
        .order("topic_number")
        .returns<Topic[]>(),
      supabase.from("profiles").select("id, full_name").eq("role", "supervisor").order("full_name"),
    ]);

  const topicList = topics ?? [];
  const supervisorList = supervisors ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-card bg-card-secondary p-5">
        <h2 className="text-lg text-navy">{student?.full_name ?? "—"}</h2>
        <p className="mt-1 text-sm text-navy/70">{session?.label ?? "—"}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {topicList.map((topic) => (
          <div key={topic.id} className="rounded-card bg-card p-4">
            <span className="text-xs font-semibold uppercase tracking-wide text-navy/50">
              Topic {topic.topic_number}
            </span>
            <p className="mt-1 text-sm font-semibold text-navy">{topic.title}</p>
            {topic.case_study ? (
              <p className="mt-1 text-xs font-medium text-navy/60">{topic.case_study}</p>
            ) : null}
            {topic.description ? (
              <p className="mt-1 text-xs text-navy/70">{topic.description}</p>
            ) : null}
            {topic.keywords?.length ? (
              <p className="mt-1 text-xs text-navy/50">{topic.keywords.join(", ")}</p>
            ) : null}
          </div>
        ))}
      </div>

      <div className="rounded-card bg-card-secondary p-5">
        <h3 className="text-base font-semibold text-navy">Delegate to a supervisor</h3>
        <p className="mt-1 text-sm text-navy/70">
          They&apos;ll make the approve/reject decision themselves, and automatically become this
          student&apos;s supervisor once they approve.
        </p>
        <div className="mt-4">
          <DelegateForm packageId={pkg.id} supervisors={supervisorList} />
        </div>
      </div>

      <div className="rounded-card bg-card p-5">
        <h3 className="text-base font-semibold text-navy">Decide directly</h3>
        <p className="mt-1 text-sm text-navy/70">
          Approve one topic or reject the whole set yourself, as admin.
        </p>
        <div className="mt-4">
          <AdminDecideForm packageId={pkg.id} topics={topicList} supervisors={supervisorList} />
        </div>
      </div>
    </div>
  );
}
