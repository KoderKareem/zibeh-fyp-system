export const PACKAGE_STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  approved: "One Approved",
  rejected: "Rejected",
};

export const PACKAGE_STATUS_STYLE: Record<string, string> = {
  pending: "bg-[#fff7e6] text-amber-700",
  approved: "bg-[#e6f6ec] text-green-700",
  rejected: "bg-red-50 text-red-700",
};

export const REVIEW_STATUS_LABEL: Record<string, string> = {
  pending: "Awaiting review",
  approved: "Published",
  rejected: "Rejected",
};

export const REVIEW_STATUS_STYLE: Record<string, string> = {
  pending: "bg-[#fff7e6] text-amber-700",
  approved: "bg-[#e6f6ec] text-green-700",
  rejected: "bg-red-50 text-red-700",
};

// "not_submitted" isn't stored — it's the absence of a project_chapters row.
export const CHAPTER_STATUS_LABEL: Record<string, string> = {
  not_submitted: "Not Submitted",
  pending: "Pending Review",
  approved: "Approved",
  revision_requested: "Revision Requested",
};

export const CHAPTER_STATUS_STYLE: Record<string, string> = {
  not_submitted: "bg-navy/5 text-navy/60",
  pending: "bg-[#fff7e6] text-amber-700",
  approved: "bg-[#e6f6ec] text-green-700",
  revision_requested: "bg-red-50 text-red-700",
};
