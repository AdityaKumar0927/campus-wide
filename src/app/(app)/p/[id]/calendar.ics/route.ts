import { getPost } from "@/lib/dal/posts";
import { buildIcs } from "@/lib/posts/ics";
import { getSession } from "@/lib/dal/session";

/** The event as a calendar file. Signed-in members only (the post read runs through RLS). */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return new Response("Sign in first.", { status: 401 });
  const post = await getPost(id);
  if (!post || post.type !== "event") return new Response("Not an event.", { status: 404 });
  const p = post.payload as { startsAt?: string; endsAt?: string; location?: string };
  if (!p.startsAt) return new Response("This event has no date.", { status: 404 });
  const appUrl = process.env.APP_URL ?? "http://localhost:3000";
  const ics = buildIcs({ uid: post.id, title: post.title, description: post.body, location: p.location, startsAt: p.startsAt, endsAt: p.endsAt, url: `${appUrl}/p/${post.id}` });
  const filename = `${post.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 60) || "event"}.ics`;
  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
