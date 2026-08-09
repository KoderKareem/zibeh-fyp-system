"use client";

import { useState } from "react";

export function CitationBox({ label, citation }: { label: string; citation: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="rounded-lg bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-navy/50">{label}</span>
        <button
          type="button"
          onClick={async () => {
            await navigator.clipboard.writeText(citation);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          className="shrink-0 text-xs font-semibold text-primary hover:underline"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <p className="mt-2 text-sm break-words text-navy/80">{citation}</p>
    </div>
  );
}
