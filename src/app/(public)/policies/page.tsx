import type { Metadata } from "next";
import Link from "next/link";
import { Kicker } from "@/components/kicker";
import { POLICIES } from "@/lib/policies";

export const metadata: Metadata = {
  title: "Policies",
  description: "Everything Campus Wide promises, in plain words: terms, privacy, house rules, moderation, security, and the documents a university needs.",
};

const GROUPS: { key: "members" | "trust" | "campus"; title: string; blurb: string }[] = [
  { key: "members", title: "For members", blurb: "What you agree to, what we keep, and how to behave." },
  { key: "trust", title: "Trust and safety", blurb: "How decisions are made, explained, and appealed." },
  { key: "campus", title: "For a university", blurb: "What an office needs before adopting the board." },
];

export default function PoliciesPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <Kicker>Drafts for review, not legal advice</Kicker>
      <h1 className="mt-3 text-5xl md:text-6xl">Policies</h1>
      <p className="mt-4 text-muted-foreground">
        Written to be read, with placeholders in brackets where an operator fills in a name or an address. A lawyer reviews them before they apply to anyone. The ones marked required are shown at sign-up and again whenever they change.
      </p>
      {GROUPS.map((g) => (
        <section key={g.key} className="mt-10">
          <h2 className="text-2xl">{g.title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{g.blurb}</p>
          <ul className="mt-3 divide-y divide-rule rounded-md border border-rule bg-card">
            {POLICIES.filter((p) => p.group === g.key).map((p) => (
              <li key={p.slug} className="px-4 py-3">
                <Link href={`/policies/${p.slug}`} className="font-medium underline-offset-4 hover:underline">
                  {p.title}
                </Link>
                {p.required && <span className="stamp ml-2">required</span>}
                <p className="text-sm text-muted-foreground">{p.summary}</p>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
