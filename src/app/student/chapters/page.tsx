import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CHAPTER_COLUMNS, CHAPTER_COUNT, CHAPTERS, type ChapterRow } from "@/lib/chapters";
import { CHAPTER_STATUS_LABEL, CHAPTER_STATUS_STYLE } from "@/lib/status";
import { ChapterUploadForm } from "./chapter-upload-form";

export default async function StudentChaptersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: pkg }, { data: profile }] = await Promise.all([
    supabase
      .from("submission_packages")
      .select("id")
      .eq("student_id", user!.id)
      .eq("status", "approved")
      .order("decided_at", { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle(),
    supabase.from("profiles").select("supervisor_id").eq("id", user!.id).single(),
  ]);

  if (!pkg) {
    return (
      <div className="rounded-card bg-card p-6">
        <p className="text-sm text-navy/70">
          Chapter submission opens once one of your topics is approved.{" "}
          <Link href="/student/history" className="font-semibold text-primary">
            Check your submission history
          </Link>
          .
        </p>
      </div>
    );
  }

  if (!profile?.supervisor_id) {
    return (
      <div className="rounded-card bg-card p-6">
        <p className="text-sm text-navy/70">
          Your topic is approved. Chapter submission opens once a supervisor has been assigned to
          you — you&apos;ll get a notification when that happens.
        </p>
      </div>
    );
  }

  const [{ data: chapters }, { data: supervisor }] = await Promise.all([
    supabase
      .from("project_chapters")
      .select(CHAPTER_COLUMNS)
      .eq("package_id", pkg.id)
      .returns<ChapterRow[]>(),
    supabase.from("profiles").select("full_name").eq("id", profile.supervisor_id).maybeSingle(),
  ]);

  const chapterByNumber = new Map((chapters ?? []).map((c) => [c.chapter_number, c]));
  const approvedCount = (chapters ?? []).filter((c) => c.status === "approved").length;
  const allApproved = approvedCount === CHAPTER_COUNT;

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-card bg-card-secondary p-5">
        <p className="text-sm text-navy/70">Supervisor: {supervisor?.full_name ?? "—"}</p>
        <p className="mt-1 text-sm text-navy/70">
          {approvedCount} of {CHAPTER_COUNT} chapters approved. Each chapter unlocks once the
          previous one is approved.
        </p>
        {allApproved ? (
          <p className="mt-3 text-sm font-semibold text-navy">
            All chapters approved —{" "}
            <Link href="/student/history" className="text-primary">
              upload your final project
            </Link>
            .
          </p>
        ) : null}
      </div>

      {CHAPTERS.map(({ number, title }) => {
        const chapter = chapterByNumber.get(number);
        const previousApproved =
          number === 1 || chapterByNumber.get(number - 1)?.status === "approved";
        const statusKey = chapter?.status ?? "not_submitted";

        return (
          <div key={number} className="rounded-card bg-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base text-navy">
                Chapter {number}: {title}
              </h2>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${CHAPTER_STATUS_STYLE[statusKey]}`}
              >
                {CHAPTER_STATUS_LABEL[statusKey]}
              </span>
            </div>

            {chapter ? (
              <p className="mt-2 text-sm text-navy/70">
                <a
                  href={`/chapters/document/${chapter.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-primary hover:underline"
                >
                  {chapter.original_filename ?? "View document"}
                </a>{" "}
                · Submitted {new Date(chapter.submitted_at).toLocaleDateString()}
                {chapter.submission_count > 1 ? ` (attempt ${chapter.submission_count})` : ""}
              </p>
            ) : null}

            {chapter?.supervisor_comment ? (
              <div className="mt-3 rounded-lg bg-white p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-navy/50">
                  {chapter.status === "pending" ? "Previous supervisor comment" : "Supervisor comment"}
                </p>
                <p className="mt-1 text-sm text-navy/80">{chapter.supervisor_comment}</p>
              </div>
            ) : null}

            {!chapter && previousApproved ? (
              <ChapterUploadForm chapterNumber={number} buttonLabel={`Submit Chapter ${number}`} />
            ) : null}

            {!chapter && !previousApproved ? (
              <p className="mt-2 text-sm text-navy/50">
                Locked until Chapter {number - 1} is approved.
              </p>
            ) : null}

            {chapter?.status === "revision_requested" ? (
              <ChapterUploadForm
                chapterNumber={number}
                buttonLabel={`Re-upload Chapter ${number}`}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
