import type { Metadata } from "next";
import { ModulePage } from "@/components/board/module-page";

export const metadata: Metadata = { title: "Polls" };

export default async function Page({ searchParams }: { searchParams: Promise<{ page?: string; sort?: string; type?: string }> }) {
  return <ModulePage basePath="/polls" title="Polls" kicker="One vote per verified student" blurb="Quick campus questions. Change your vote until it closes." types={["poll"]} composeType="poll" searchParams={await searchParams} />;
}
