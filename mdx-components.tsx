import Link from "next/link";
import type { AnchorHTMLAttributes, ComponentProps, CSSProperties } from "react";

/** The not-legal-advice banner every policy carries (docs/BRIEF.md §7). */
function Banner() {
  return (
    <p role="note" className="notice my-6 px-4 pt-5 pb-4 text-sm" style={{ "--stock": "var(--stock-yellow)" } as CSSProperties}>
      <span className="stamp">Draft for review</span>
      <br />
      This is not legal advice. Placeholders in [BRACKETS] are filled in by the operator, and a lawyer reviews the whole document before it applies to anyone.
    </p>
  );
}

function PolicyLink({ href = "", ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  const className = "underline underline-offset-4";
  return href.startsWith("/") ? <Link href={href} className={className} {...props} /> : <a href={href} className={className} rel="noopener noreferrer" {...props} />;
}

/**
 * Policy documents read like documents: generous line height, real tables, quiet rules.
 * The parameter is typed structurally rather than with `MDXComponents`: importing that type pulls in a
 * second copy of the React types from outside the project and every element then fails to typecheck.
 */
export function useMDXComponents(components: Record<string, unknown>) {
  return {
    Banner,
    h1: (props: ComponentProps<"h1">) => <h1 className="text-4xl md:text-5xl" {...props} />,
    h2: (props: ComponentProps<"h2">) => <h2 className="mt-10 text-2xl" {...props} />,
    h3: (props: ComponentProps<"h3">) => <h3 className="mt-6 text-xl" {...props} />,
    p: (props: ComponentProps<"p">) => <p className="mt-4 text-[15px] leading-relaxed" {...props} />,
    ul: (props: ComponentProps<"ul">) => <ul className="mt-4 list-disc space-y-1 pl-6 text-[15px] leading-relaxed" {...props} />,
    ol: (props: ComponentProps<"ol">) => <ol className="mt-4 list-decimal space-y-1 pl-6 text-[15px] leading-relaxed" {...props} />,
    table: (props: ComponentProps<"table">) => (
      <div className="mt-4 overflow-x-auto">
        <table className="w-full border-collapse text-sm" {...props} />
      </div>
    ),
    th: (props: ComponentProps<"th">) => <th className="border-b border-rule px-2 py-1.5 text-left font-medium" {...props} />,
    td: (props: ComponentProps<"td">) => <td className="border-b border-rule px-2 py-1.5 align-top" {...props} />,
    code: (props: ComponentProps<"code">) => <code className="rounded bg-muted px-1 font-mono text-[0.85em]" {...props} />,
    a: PolicyLink,
    strong: (props: ComponentProps<"strong">) => <strong className="font-semibold" {...props} />,
    ...components,
  };
}
