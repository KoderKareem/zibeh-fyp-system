import Link from "next/link";
import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { SubmitForm } from "./submit-form";

function Blocked({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-card bg-card p-6">
      <p className="text-sm text-navy/80">{children}</p>
    </div>
  );
}

export default async function SubmitPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profile }, { data: settings }, { data: pendingPackage }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("supervisor_id")
        .eq("id", user!.id)
        .single(),
      supabase
        .from("system_settings")
        .select("submissions_open, active_session:academic_sessions(label)")
        .eq("id", 1)
        .single(),
      supabase
        .from("submission_packages")
        .select("id")
        .eq("student_id", user!.id)
        .eq("status", "pending")
        .maybeSingle(),
    ]);

  const { data: supervisor } = profile?.supervisor_id
    ? await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", profile.supervisor_id)
        .single()
    : { data: null };
  const activeSession = (settings?.active_session ?? null) as { label: string } | null;

  if (!profile?.supervisor_id) {
    return (
      <Blocked>
        You haven&apos;t been assigned a supervisor yet. Contact an
        administrator before submitting your topics.
      </Blocked>
    );
  }

  if (!settings?.submissions_open) {
    return <Blocked>Submissions are currently closed.</Blocked>;
  }

  if (pendingPackage) {
    return (
      <Blocked>
        You already have a submission pending review.{" "}
        <Link href="/student/history" className="font-semibold text-primary">
          View its status
        </Link>
        .
      </Blocked>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-card bg-card-secondary p-5">
        <h2 className="text-lg text-navy">Submit your 3 topic options</h2>
        <p className="mt-1 text-sm text-navy/70">
          {activeSession ? `${activeSession.label} · ` : ""}
          Supervisor: {supervisor?.full_name ?? "—"}. Your supervisor will
          approve exactly one topic or reject the whole set.
        </p>
      </div>

      <SubmitForm />
    </div>
  );
}
