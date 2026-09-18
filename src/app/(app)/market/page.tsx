import type { Metadata } from "next";
import { ModulePage } from "@/components/board/module-page";

export const metadata: Metadata = { title: "Marketplace" };

export default async function Page({ searchParams }: { searchParams: Promise<{ page?: string; sort?: string; type?: string }> }) {
  return <ModulePage basePath="/market" title="Marketplace" kicker="No payments, no strangers" blurb="Take a tab to message the seller. Meet at a safe-exchange spot. Nothing is paid through the board." types={["listing"]} composeType="listing" searchParams={await searchParams} />;
}
