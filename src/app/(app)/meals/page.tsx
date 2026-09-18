import type { Metadata } from "next";
import { ModulePage } from "@/components/board/module-page";

export const metadata: Metadata = { title: "Meal gifting" };

export default async function Page({ searchParams }: { searchParams: Promise<{ page?: string; sort?: string; type?: string }> }) {
  return (
    <ModulePage
      basePath="/meals"
      title="Meal gifting"
      kicker="Guest meals at The Commons, holder present"
      blurb="An All Access holder treats a fellow student to one of their guest meals, in person, at the register. Nothing is sold, lent, or traded. Ever."
      types={["meal"]}
      composeType="meal"
      searchParams={await searchParams}
      offNote="The board opens once the Office of Residential Life confirms in writing that guest meals may be used this way (PLAN.md Decision M-5). Until then nothing here is for sale, for trade, or for lending: the HawkCard is non-transferable."
    />
  );
}
