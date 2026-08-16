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
