import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Kicker } from "@/components/kicker";
import { POLICIES, policyBySlug } from "@/lib/policies";

type Params = { slug: string };

export function generateStaticParams() {
  return POLICIES.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const policy = policyBySlug(slug);
  return policy ? { title: policy.title, description: policy.summary } : { title: "Policy" };
}

export default async function PolicyPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const policy = policyBySlug(slug);
  if (!policy) notFound();
  const { default: Document } = await policy.load();
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <nav aria-label="Breadcrumb" className="text-sm">
        <Link href="/policies" className="text-muted-foreground underline-offset-4 hover:underline">
          ← Policies
        </Link>
      </nav>
      <Kicker>{policy.required ? "Required reading" : "Reference"}</Kicker>
      <article className="mt-3">
        <Document />
      </article>
    </div>
  );
}
