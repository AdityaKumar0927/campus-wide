import type { Metadata } from "next";
import { ModulePage } from "@/components/board/module-page";

export const metadata: Metadata = { title: "Lost & found" };

export default async function Page({ searchParams }: { searchParams: Promise<{ page?: string; sort?: string; type?: string }> }) {
  return <ModulePage basePath="/lost-found" title="Lost & found" kicker="Keys, bottles, calculators, cats in hats" blurb="Post what you found, claim what you lost. Hand-off at a staffed desk." types={["lost", "found"]} composeType="lost" searchParams={await searchParams} />;
}
