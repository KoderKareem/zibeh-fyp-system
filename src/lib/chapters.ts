export const CHAPTERS = [
  { number: 1, title: "Introduction" },
  { number: 2, title: "Literature Review" },
  { number: 3, title: "Methodology / System Design" },
  { number: 4, title: "Implementation & Results" },
  { number: 5, title: "Summary, Conclusion & Recommendations" },
] as const;

export const CHAPTER_COUNT = CHAPTERS.length;

export function chapterTitle(chapterNumber: number) {
  return CHAPTERS.find((c) => c.number === chapterNumber)?.title ?? "";
}

export type ChapterStatus = "pending" | "approved" | "revision_requested";

export type ChapterRow = {
  id: string;
  chapter_number: number;
  status: ChapterStatus;
  document_path: string;
  original_filename: string | null;
  submission_count: number;
  supervisor_comment: string | null;
  submitted_at: string;
  decided_at: string | null;
};

export const CHAPTER_COLUMNS =
  "id, chapter_number, status, document_path, original_filename, submission_count, supervisor_comment, submitted_at, decided_at";

export const DOCUMENT_BUCKET = "project-documents";
export const MAX_DOCUMENT_BYTES = 20 * 1024 * 1024; // 20MB
export const ALLOWED_DOCUMENT_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);
