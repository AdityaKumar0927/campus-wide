import { buildExportBundle } from "@/lib/export/bundle";
import { getSession } from "@/lib/dal/session";

/** Self-service data export (docs/BRIEF.md §7). Signed in, own data only, nothing cached. */
export async function GET() {
  const session = await getSession();
  if (!session) return new Response("Sign in first.", { status: 401 });
  const { bytes, filename } = await buildExportBundle(session.userId);
  return new Response(bytes as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
