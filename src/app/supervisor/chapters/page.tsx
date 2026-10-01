import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { chapterTitle } from "@/lib/chapters";
import { CHAPTER_STATUS_LABEL, CHAPTER_STATUS_STYLE } from "@/lib/status";

type Chapter = {
  id: string;
  student_id: string;
  chapter_number: number;
  status: "pending" | "approved" | "revision_requested";
  submission_count: number;
  submitted_at: string;
  decided_at: string | null;
};

export default async function SupervisorChaptersPage() {
  const supabase = await createClient();

  // RLS limits this to chapters from students currently assigned to me.
  const { data: chapters } = await supabase
    .from("project_chapters")
    .select("id, student_id, chapter_number, status, submission_count, submitted_at, decided_at")
    .order("submitted_at", { ascending: true })
    .returns<Chapter[]>();

  const all = chapters ?? [];
  const pending = all.filter((c) => c.status === "pending");
  const reviewed = all
    .filter((c) => c.status !== "pending")
    .sort((a, b) => (b.decided_at ?? "").localeCompare(a.decided_at ?? ""));

  const studentIds = [...new Set(all.map((c) => c.student_id))];
  const { data: students } = studentIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", studentIds)
    : { data: [] as { id: string; full_name: string }[] };
  const studentNameById = new Map((students ?? []).map((s) => [s.id, s.full_name]));

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-card bg-card-secondary p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-navy/50">Pending review</p>
        <p className="mt-1 text-3xl font-semibold text-navy">{pending.length}</p>
      </div>

      <ChapterTable
        heading="Awaiting your review"
        chapters={pending}
        studentNameById={studentNameById}
        emptyText="No chapters are waiting for review."
        dateLabel="Submitted"
      />

      <ChapterTable
        heading="Reviewed"
        chapters={reviewed}
        studentNameById={studentNameById}
        emptyText="You haven't reviewed any chapters yet."
        dateLabel="Reviewed"
      />
    </div>
  );
}

function ChapterTable({
  heading,
  chapters,
  studentNameById,
  emptyText,
  dateLabel,
}: {
  heading: string;
  chapters: Chapter[];
  studentNameById: Map<string, string>;
  emptyText: string;
  dateLabel: "Submitted" | "Reviewed";
}) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-base text-navy">{heading}</h2>
      <div className="rounded-card bg-card overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-navy/10 text-xs uppercase tracking-wide text-navy/50">
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Chapter</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">{dateLabel}</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {chapters.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-navy/60">
                  {emptyText}
                </td>
              </tr>
            ) : (
              chapters.map((chapter) => {
                const date = dateLabel === "Submitted" ? chapter.submitted_at : chapter.decided_at;
                return (
                  <tr key={chapter.id} className="border-b border-navy/5 last:border-0">
                    <td className="px-4 py-3 text-navy">
                      {studentNameById.get(chapter.student_id) ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-navy/70">
                      {chapter.chapter_number}: {chapterTitle(chapter.chapter_number)}
                      {chapter.submission_count > 1 ? (
                        <span className="mt-0.5 block text-xs font-medium text-navy/50">
                          Resubmission (attempt {chapter.submission_count})
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${CHAPTER_STATUS_STYLE[chapter.status]}`}
                      >
                        {CHAPTER_STATUS_LABEL[chapter.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-navy/60">
                      {date ? new Date(date).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/supervisor/chapters/${chapter.id}`}
                        className="text-xs font-semibold text-primary hover:underline"
                      >
                        {chapter.status === "pending" ? "Review" : "View"}
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
