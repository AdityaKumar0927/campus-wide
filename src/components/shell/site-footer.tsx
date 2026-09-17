import Link from "next/link";

const repo = "https://github.com/AdityaKumar0927/campus-wide";

const columns = [
  {
    heading: "Product",
    links: [
      { label: "How it works", href: "/#how-it-works" },
      { label: "For universities", href: "/#universities" },
      { label: "Safety", href: "/#safety" },
      { label: "Preview the app", href: "/feed" },
    ],
  },
  {
    heading: "Trust",
    links: [
      { label: "Security policy", href: `${repo}/blob/main/SECURITY.md` },
      { label: "Code of conduct", href: `${repo}/blob/main/CODE_OF_CONDUCT.md` },
      { label: "security.txt", href: "/.well-known/security.txt" },
    ],
  },
  {
    heading: "Project",
    links: [
      { label: "Source on GitHub", href: repo },
      { label: "Roadmap", href: `${repo}/blob/main/ROADMAP.md` },
      { label: "Architecture", href: `${repo}/blob/main/ARCHITECTURE.md` },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="masthead-rule mt-24 bg-background">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-3">
          <p className="font-heading text-2xl">
            Campus <em className="text-primary">Wide</em>
          </p>
          <p className="max-w-xs text-sm text-muted-foreground">
            Built for students, by students. No ads, no data sales, no payments, and nothing is ever resold.
          </p>
        </div>
        {columns.map((col) => (
          <nav key={col.heading} aria-label={col.heading}>
            <p className="mb-3 text-xs font-semibold tracking-wider text-muted-foreground uppercase">{col.heading}</p>
            <ul className="space-y-2 text-sm">
              {col.links.map((l) => {
                const cls =
                  "-my-1 inline-block rounded-sm py-1 underline-offset-4 hover:underline focus-visible:ring-3 focus-visible:ring-ring/50";
                // Static files and external URLs are not app routes: a plain anchor avoids Link prefetching
                // them as RSC requests (which 404).
                const isAppRoute = l.href.startsWith("/") && !l.href.startsWith("/.well-known/");
                return (
                  <li key={l.href}>
                    {isAppRoute ? (
                      <Link href={l.href} className={cls}>
                        {l.label}
                      </Link>
                    ) : (
                      <a href={l.href} className={cls} rel={l.href.startsWith("http") ? "noopener" : undefined}>
                        {l.label}
                      </a>
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-rule">
        <p className="mx-auto max-w-6xl px-4 py-4 text-xs text-muted-foreground">
          Open source under the MIT licence. Policies and a lawyer-reviewed privacy notice arrive in Phase 7.
        </p>
      </div>
    </footer>
  );
}
