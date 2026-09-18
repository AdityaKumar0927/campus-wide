import { getSession } from "@/lib/dal/session";
import { createClient } from "@/lib/supabase/server";

/** The whole thread as JSON, for handing to Public Safety or a moderator. Participants only. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return new Response("Sign in first.", { status: 401 });
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("export_relay_thread", { p_thread_id: id });
  if (error || !data) return new Response("Not your thread.", { status: 404 });
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="campus-wide-thread-${id}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
