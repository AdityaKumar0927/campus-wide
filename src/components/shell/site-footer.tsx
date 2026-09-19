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
    heading: "Policies",
    links: [
      { label: "All policies", href: "/policies" },
      { label: "Privacy notice", href: "/policies/privacy" },
      { label: "Terms of service", href: "/policies/terms" },
      { label: "House rules and safety", href: "/policies/safety-rules" },
    ],
  },
  {
    heading: "Trust",
    links: [
      { label: "Report something", href: "/policies/dsa-contact" },
      { label: "Accessibility", href: "/policies/accessibility" },
      { label: "Security", href: "/policies/security" },
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
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-5">
        <div className="space-y-3">
          <p className="font-heading text-2xl font-medium tracking-[-0.045em]">
            Campus<span className="text-primary">Wide</span>
          </p>
          <p className="max-w-xs text-sm text-muted-foreground">
            Built for students, by students. No ads, no data sales, no payments, and nothing is ever resold.
          </p>
        </div>
        {columns.map((col) => (
          <nav key={col.heading} aria-label={col.heading}>
            <p className="stamp mb-3">{col.heading}</p>
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
          Open source under the MIT licence. Student-run and not affiliated with any university. The policies are drafts until a lawyer has reviewed them.
        </p>
      </div>
    </footer>
  );
}
