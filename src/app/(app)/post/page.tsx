import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Kicker } from "@/components/kicker";
import { getSession } from "@/lib/dal/session";
import { listSpaces } from "@/lib/dal/spaces";
import { OPEN_TYPES } from "@/lib/posts/open-types";
import { POST_TYPES, type PostType } from "@/lib/posts/types";
import { PostComposer } from "./post-composer";

export const metadata: Metadata = { title: "Pin a notice" };

export default async function PostPage({ searchParams }: { searchParams: Promise<{ type?: string; space?: string }> }) {
  const session = await getSession();
  if (!session?.universityId) redirect("/sign-in?next=/post");
  const { type, space } = await searchParams;
  const spaces = await listSpaces();
  const initialType = POST_TYPES.includes(type as PostType) ? (type as PostType) : undefined;
  return (
    <div className="space-y-6">
      <header className="border-b border-rule pb-4">
        <Kicker>Illinois Tech</Kicker>
        <h1 className="mt-1 text-5xl">Pin a notice</h1>
      </header>
      <PostComposer openTypes={OPEN_TYPES} spaces={spaces.map((s) => ({ id: s.id, name: s.name }))} universityId={session.universityId} initialType={initialType} initialSpaceId={space} />
    </div>
  );
}
