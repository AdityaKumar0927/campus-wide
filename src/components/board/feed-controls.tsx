import Link from "next/link";
import { POST_TYPE_META, type PostType } from "@/lib/posts/types";
import { cn } from "@/lib/utils";

type Sort = "new" | "helpful" | "active";
const SORTS: { key: Sort; label: string }[] = [
  { key: "new", label: "Newest" },
  { key: "active", label: "Active" },
  { key: "helpful", label: "Most helpful" },
];

/** Sort and type filters as plain links: shareable, back-button friendly, no client state. */
export function FeedControls({
  basePath,
  sort,
  type,
  types,
  extra = {},
}: {
  basePath: string;
  sort: Sort;
  type: PostType | "all";
  types: (PostType | "all")[];
  extra?: Record<string, string | undefined>;
}) {
  const href = (patch: { sort?: Sort; type?: PostType | "all" }) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(extra)) if (v) params.set(k, v);
    const s = patch.sort ?? sort;
    const t = patch.type ?? type;
    if (s !== "new") params.set("sort", s);
    if (t !== "all") params.set("type", t);
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };
  const chip = (active: boolean) =>
    cn(
      "inline-flex h-8 items-center rounded-full border px-3 text-xs font-medium outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50",
      active ? "border-primary bg-primary text-primary-foreground" : "border-rule bg-card text-foreground hover:bg-muted",
    );
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <nav aria-label="Sort" className="flex flex-wrap gap-2">
        {SORTS.map((s) => (
          <Link key={s.key} href={href({ sort: s.key })} className={chip(sort === s.key)} aria-current={sort === s.key ? "true" : undefined}>
            {s.label}
          </Link>
        ))}
      </nav>
      {types.length > 1 && (
        <nav aria-label="Type" className="flex flex-wrap gap-2">
          {types.map((t) => (
            <Link key={t} href={href({ type: t })} className={chip(type === t)} aria-current={type === t ? "true" : undefined}>
              {t === "all" ? "Everything" : POST_TYPE_META[t].plural}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
