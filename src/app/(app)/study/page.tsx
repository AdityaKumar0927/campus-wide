import type { Metadata } from "next";
import { ModulePage } from "@/components/board/module-page";

export const metadata: Metadata = { title: "Study groups" };

export default async function Page({ searchParams }: { searchParams: Promise<{ page?: string; sort?: string; type?: string }> }) {
  return <ModulePage basePath="/study" title="Study groups" kicker="Small groups fill fast" blurb="Find people taking the same class this term." types={["study"]} composeType="study" searchParams={await searchParams} />;
}
