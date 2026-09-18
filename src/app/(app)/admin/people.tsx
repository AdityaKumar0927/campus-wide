import { Button } from "@/components/ui/button";
import { listDomains, listMembers } from "@/lib/dal/admin";
import { adminStats, listFeedback } from "@/lib/dal/moderation";
import { formatDateTime } from "@/lib/text";
import { removeDomain, setMemberRole } from "./actions";
import { DomainForm, FindMemberForm } from "./admin-forms";

export function AdminSection({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="space-y-3 rounded-md border border-rule bg-card p-4">
      <h2 id={id} className="text-2xl">
        {title}
      </h2>
      {children}
    </section>
  );
}

/** Domains, moderators, member lookup, numbers, feedback. */
export async function AdminPeople({ member, selfId }: { member?: string; selfId: string }) {
  const [domains, mods, stats, feedback, found] = await Promise.all([
    listDomains(),
    listMembers({ roles: ["moderator", "university_admin"] }),
    adminStats(),
    listFeedback(20),
    member ? listMembers({ username: member, limit: 500 }) : Promise.resolve([]),
  ]);
  return (
    <>
      <AdminSection id="domains" title="Email domains">
        <ul className="divide-y divide-rule rounded-md border border-rule text-sm">
          {domains.map((d) => (
            <li key={d.id} className="flex items-center justify-between gap-3 px-3 py-2">
              <span>
                <span className="font-mono">{d.domain}</span> · {d.role} · {d.source}
              </span>
              {d.source === "admin" && (
                <form action={removeDomain.bind(null, d.id)}>
                  <Button type="submit" size="sm" variant="ghost">
                    Remove
                  </Button>
                </form>
              )}
            </li>
          ))}
        </ul>
        <DomainForm />
      </AdminSection>

      <AdminSection id="moderators" title="Moderators and admins">
        <ul className="divide-y divide-rule rounded-md border border-rule text-sm">
          {mods.map((m) => (
            <li key={m.id} className="flex items-center justify-between gap-3 px-3 py-2">
              <span>
                {m.profile?.display_name ?? "Former member"} <span className="font-mono text-xs text-muted-foreground">@{m.profile?.campus_username}</span> · {m.campus_role.replace("_", " ")}
              </span>
              {m.user_id !== selfId && (
                <form action={setMemberRole.bind(null, m.user_id, "student")}>
                  <Button type="submit" size="sm" variant="ghost">
                    Demote
                  </Button>
                </form>
              )}
            </li>
          ))}
        </ul>
        <FindMemberForm />
        {member && found.length === 0 && <p className="text-sm text-muted-foreground">No member with the handle @{member}.</p>}
        {found.map((m) => (
          <div key={m.id} className="flex flex-wrap items-center gap-2 rounded-md border border-rule px-3 py-2 text-sm">
            <span>
              {m.profile?.display_name} <span className="font-mono text-xs text-muted-foreground">@{m.profile?.campus_username}</span> · {m.campus_role.replace("_", " ")} · {m.status}
            </span>
            {m.user_id !== selfId &&
              (["moderator", "university_admin", "student"] as const)
                .filter((r) => r !== m.campus_role)
                .map((r) => (
                  <form key={r} action={setMemberRole.bind(null, m.user_id, r)}>
                    <Button type="submit" size="sm" variant="outline">
                      Make {r.replace("_", " ")}
                    </Button>
                  </form>
                ))}
          </div>
        ))}
      </AdminSection>

      <AdminSection id="numbers" title="Numbers">
        <pre className="overflow-auto rounded-md bg-muted p-3 text-xs whitespace-pre-wrap">{JSON.stringify(stats, null, 2)}</pre>
      </AdminSection>

      <AdminSection id="feedback" title="Feedback">
        {feedback.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing yet.</p>
        ) : (
          <ul className="divide-y divide-rule rounded-md border border-rule text-sm">
            {feedback.map((f) => (
              <li key={f.id} className="px-3 py-2">
                <p className="stamp">
                  {f.sentiment} · {formatDateTime(f.created_at)}
                  {f.page_url ? ` · ${f.page_url}` : ""}
                  {f.forwarded_to ? " · forwarded" : ""}
                </p>
                <p className="whitespace-pre-wrap">{f.message}</p>
              </li>
            ))}
          </ul>
        )}
      </AdminSection>
    </>
  );
}
