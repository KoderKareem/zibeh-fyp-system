import Link from "next/link";

const VARIANT_BG: Record<"primary" | "secondary", string> = {
  primary: "bg-card",
  secondary: "bg-card-secondary",
};

export function DashboardCard({
  href,
  title,
  description,
  variant = "primary",
}: {
  href: string;
  title: string;
  description: string;
  variant?: "primary" | "secondary";
}) {
  return (
    <Link
      href={href}
      className={`group relative block cursor-pointer rounded-card border border-navy/10 ${VARIANT_BG[variant]} p-6 pr-10 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md`}
    >
      <span
        aria-hidden="true"
        className="absolute right-5 top-5 text-lg leading-none text-navy/30 transition-all group-hover:translate-x-0.5 group-hover:text-primary"
      >
        →
      </span>
      <h2 className="text-lg text-navy">{title}</h2>
      <p className="mt-2 pr-2 text-sm text-navy/70">{description}</p>
    </Link>
  );
}
