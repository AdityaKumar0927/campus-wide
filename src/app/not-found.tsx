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
        <p className="font-heading text-sm italic text-muted-foreground">Page not found</p>
        <h1 className="mt-2 text-5xl">This corridor leads nowhere.</h1>
        <p className="mt-4 text-muted-foreground">The page may have moved, expired, or never existed. Posts here expire on purpose.</p>
        <Link href="/" className={`${buttonVariants()} mt-8`}>
          Back to the front page
        </Link>
      </div>
    </main>
  );
}
