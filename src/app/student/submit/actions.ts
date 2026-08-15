"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type SimilarMatch = { title: string; similarity: number };

type Warning = {
  topicNumber: number;
  submittedTitle: string;
  matches: SimilarMatch[];
};

export type SubmitState =
  | { error: string }
  | { warnings: Warning[] }
  | null;

function readTopic(formData: FormData, n: number) {
  const title = String(formData.get(`topic${n}_title`) ?? "").trim();
  const caseStudy = String(formData.get(`topic${n}_case_study`) ?? "").trim();
  const description = String(formData.get(`topic${n}_description`) ?? "").trim();
  const keywords = String(formData.get(`topic${n}_keywords`) ?? "")
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);
  return { title, caseStudy, description, keywords };
}

export async function submitPackage(
  _prevState: SubmitState,
  formData: FormData,
): Promise<SubmitState> {
  const topics = [1, 2, 3].map((n) => readTopic(formData, n));
  const confirmed = formData.get("confirmed") === "true";

  for (const [i, topic] of topics.entries()) {
    if (!topic.title) {
      return { error: `Enter a title for topic ${i + 1}.` };
    }
    if (!topic.caseStudy) {
      return { error: `Enter a case study for topic ${i + 1}.` };
    }
  }

  const supabase = await createClient();

  if (!confirmed) {
    const results = await Promise.all(
      topics.map((topic) =>
        supabase.rpc("search_similar_projects", { search_title: topic.title }),
      ),
    );

    const warnings: Warning[] = results
      .map((res, i) => ({
        topicNumber: i + 1,
        submittedTitle: topics[i].title,
        matches: ((res.data ?? []) as SimilarMatch[]).map((m) => ({
          title: m.title,
          similarity: m.similarity,
        })),
      }))
      .filter((w) => w.matches.length > 0);

    if (warnings.length > 0) {
      return { warnings };
    }
  }

  const { error } = await supabase.rpc("submit_submission_package", {
    p_topics: topics.map((t) => ({
      title: t.title,
      case_study: t.caseStudy,
      description: t.description,
      keywords: t.keywords,
    })),
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/student/history");
}
