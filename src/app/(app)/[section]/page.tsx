import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ComingSoonIllustration } from "@/components/illustrations";
import { EmptyState } from "@/components/empty-state";
import { placeholderSections } from "@/components/shell/nav-items";

type Params = { section: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { section } = await params;
  const meta = placeholderSections[section];
  return { title: meta ? meta.label : "Not found" };
}

/** Placeholder for sections whose real pages land in later phases; keeps navigation free of dead links. */
export default async function SectionPage({ params }: { params: Promise<Params> }) {
  const { section } = await params;
  const meta = placeholderSections[section];
  if (!meta) notFound();

  return (
    <div className="space-y-6">
      <header className="border-b border-rule pb-4">
        <p className="stamp">Illinois Tech</p>
        <h1 className="mt-1 text-5xl">{meta.label}</h1>
      </header>
      <EmptyState
        illustration={<ComingSoonIllustration className="w-44" />}
        stock="manila"
        stamp={`Coming in Phase ${meta.phase}`}
        title={`${meta.label} is not on the board yet.`}
        description={meta.blurb}
      />
    </div>
  );
}
