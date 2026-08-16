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

  const [{ data: settings }, { data: pendingPackage }] = await Promise.all([
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

  const activeSession = (settings?.active_session ?? null) as { label: string } | null;

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
          An administrator will review your submission and either assign it to a
          supervisor or decide it directly.
        </p>
      </div>

      <SubmitForm />
    </div>
  );
}
