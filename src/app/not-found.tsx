import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Wordmark } from "@/components/shell/wordmark";

export default function NotFound() {
  return (
    <main id="main" className="flex flex-1 flex-col">
      <div className="mx-auto w-full max-w-6xl px-4 py-5">
        <Wordmark />
      </div>
      <div className="mx-auto flex max-w-xl flex-1 flex-col items-center justify-center px-4 py-20 text-center">
        <p className="stamp">404 · Not on the board</p>
        <h1 className="mt-3 text-6xl">This notice has been taken down.</h1>
        <p className="mt-4 text-muted-foreground">It may have expired, moved, or never been pinned. Notices here take themselves down on purpose.</p>
        <Link href="/" className={`${buttonVariants()} mt-8`}>
          Back to the front page
        </Link>
      </div>
    </main>
  );
}
