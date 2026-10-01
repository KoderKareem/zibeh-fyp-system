import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { chapterTitle } from "@/lib/chapters";
import { CHAPTER_STATUS_LABEL, CHAPTER_STATUS_STYLE } from "@/lib/status";
import { ChapterReviewForm } from "./chapter-review-form";

type Chapter = {
  id: string;
  student_id: string;
  chapter_number: number;
  status: "pending" | "approved" | "revision_requested";
  original_filename: string | null;
  submission_count: number;
  supervisor_comment: string | null;
  submitted_at: string;
  decided_at: string | null;
};

export default async function SupervisorChapterReviewPage(
  props: PageProps<"/supervisor/chapters/[id]">,
) {
  const { id } = await props.params;
  const supabase = await createClient();

  const { data: chapter } = await supabase
    .from("project_chapters")
    .select(
      "id, student_id, chapter_number, status, original_filename, submission_count, supervisor_comment, submitted_at, decided_at",
    )
    .eq("id", id)
    .maybeSingle()
    .returns<Chapter>();

  if (!chapter) notFound();

  const { data: student } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", chapter.student_id)
    .single();

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div className="rounded-card bg-card-secondary p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg text-navy">
              Chapter {chapter.chapter_number}: {chapterTitle(chapter.chapter_number)}
            </h2>
            <p className="mt-1 text-sm text-navy/70">
              {student?.full_name ?? "—"} · Submitted{" "}
              {new Date(chapter.submitted_at).toLocaleDateString()}
              {chapter.submission_count > 1 ? ` (attempt ${chapter.submission_count})` : ""}
            </p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${CHAPTER_STATUS_STYLE[chapter.status]}`}
          >
            {CHAPTER_STATUS_LABEL[chapter.status]}
          </span>
        </div>

        <div className="mt-4">
          <a
            href={`/chapters/document/${chapter.id}`}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-navy/15 bg-white px-4 py-2 text-sm font-semibold text-navy hover:bg-navy/5"
          >
            View document{chapter.original_filename ? ` (${chapter.original_filename})` : ""}
          </a>
        </div>
      </div>

      {chapter.supervisor_comment ? (
        <div className="rounded-card bg-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-navy/50">
            {chapter.status === "pending" ? "Your previous comment" : "Your comment"}
          </p>
          <p className="mt-1 text-sm text-navy/80">{chapter.supervisor_comment}</p>
          {chapter.status !== "pending" && chapter.decided_at ? (
            <p className="mt-3 text-xs text-navy/50">
              Decided {new Date(chapter.decided_at).toLocaleDateString()}
            </p>
          ) : null}
        </div>
      ) : null}

      {chapter.status === "pending" ? (
        <ChapterReviewForm chapterId={chapter.id} />
      ) : (
        <p className="text-sm text-navy/60">This chapter has already been reviewed.</p>
      )}
    </div>
  );
}
