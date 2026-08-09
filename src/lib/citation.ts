const INSTITUTION = "Zibeh Institute of Technology";

export type CitationInput = {
  authorName: string;
  title: string;
  year: string;
  department: string | null;
};

function institutionLine(department: string | null) {
  return department ? `${department}, ${INSTITUTION}` : INSTITUTION;
}

export function buildApaCitation({ authorName, title, year, department }: CitationInput) {
  return `${authorName}. (${year}). ${title} [Unpublished final year project]. ${institutionLine(department)}.`;
}

export function buildIeeeCitation({ authorName, title, year, department }: CitationInput) {
  return `${authorName}, "${title}," Final year project, ${institutionLine(department)}, ${year}.`;
}
