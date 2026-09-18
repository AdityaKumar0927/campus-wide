import type { Metadata } from "next";
import { ModulePage } from "@/components/board/module-page";

export const metadata: Metadata = { title: "Rides" };

export default async function Page({ searchParams }: { searchParams: Promise<{ page?: string; sort?: string; type?: string }> }) {
  return <ModulePage basePath="/rides" title="Rides" kicker="Airport runs, breaks, the odd Costco trip" blurb="Take a seat, split the cost in person. Rides expire the moment they leave." types={["ride"]} composeType="ride" searchParams={await searchParams} />;
}
