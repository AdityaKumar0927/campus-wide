import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PostList } from "@/components/board/post-list";
import { Kicker } from "@/components/kicker";
import { listPosts } from "@/lib/dal/posts";
import { getProfileByUsername } from "@/lib/dal/profiles";
import { getSession } from "@/lib/dal/session";

type Params = { username: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { username } = await params;
  return { title: `@${username}` };
}

/** What the campus sees of a member: the derived name, the counts, the notices. Never a photo or an email. */
export default async function ProfilePage({ params, searchParams }: { params: Promise<Params>; searchParams: Promise<{ page?: string }> }) {
  const { username } = await params;
  const { page: pageParam } = await searchParams;
  const [profile, session] = await Promise.all([getProfileByUsername(username), getSession()]);
  if (!profile) notFound();
  const page = Math.max(1, Number.parseInt(pageParam ?? "1", 10) || 1);
  const posts = await listPosts({ authorId: profile.user_id, page });
  const me = session?.userId === profile.user_id;
  const base = `/u/${profile.campus_username}`;
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-rule pb-4">
        <div className="flex items-center gap-4">
          <span aria-hidden className="flex size-14 items-center justify-center rounded-full border border-rule bg-[var(--stock-blue)] text-lg font-medium">
            {profile.initials}
          </span>
          <div>
            <Kicker>
              <span className="font-mono">@{profile.campus_username}</span>
              {profile.privacy_mode ? " · privacy mode" : ""}
            </Kicker>
            <h1 className="mt-1 text-4xl">{profile.display_name}</h1>
          </div>
        </div>
        <dl className="flex gap-6 text-sm">
          <div>
            <dt className="stamp">Helped</dt>
            <dd className="font-heading text-2xl">{profile.helped_count}</dd>
          </div>
          <div>
            <dt className="stamp">Thanks</dt>
            <dd className="font-heading text-2xl">{profile.thanks_count}</dd>
          </div>
        </dl>
      </header>
      {profile.bio && <p className="max-w-xl text-sm text-muted-foreground">{profile.bio}</p>}
      {me && (
        <p className="text-xs text-muted-foreground">
          This is how others see you.{" "}
          <Link href="/settings" className="underline underline-offset-4">
            Settings
          </Link>
        </p>
      )}
      <PostList page={posts} hrefForPage={(n) => (n > 1 ? `${base}?page=${n}` : base)} empty={{ stamp: "Nothing pinned", title: `${profile.display_name} has not pinned anything yet.` }} />
    </div>
  );
}
