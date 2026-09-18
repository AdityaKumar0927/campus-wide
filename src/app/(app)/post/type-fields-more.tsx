import type { PostType } from "@/lib/posts/types";

export const input = "mt-1 h-9 w-full rounded-md border border-input bg-card px-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50";
export const label = "block text-sm font-medium";

export function Field({ id, text, children, hint }: { id: string; text: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <label htmlFor={id} className={label}>
        {text}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

const cap = (c: string) => c[0].toUpperCase() + c.slice(1);

/** Lost and found, rides, study groups, roommates, polls. */
export function MoreTypeFields({ type }: { type: PostType }) {
  switch (type) {
    case "lost":
    case "found":
      return (
        <div className="grid gap-4 sm:grid-cols-3">
          <Field id="where" text={type === "lost" ? "Where you last had it" : "Where you found it"}>
            <input id="where" name="where" required maxLength={160} className={input} placeholder="Galvin Library, 3rd floor" />
          </Field>
          <Field id="when" text="When">
            <input id="when" name="when" maxLength={80} className={input} placeholder="Tuesday evening" />
          </Field>
          <Field id="category" text="What kind of thing">
            <select id="category" name="category" defaultValue="other" className={input}>
              {["keys", "cards", "electronics", "bottle", "clothing", "bag", "books", "glasses", "other"].map((c) => (
                <option key={c} value={c}>
                  {cap(c)}
                </option>
              ))}
            </select>
          </Field>
          {type === "found" && (
            <Field id="heldAt" text="Where it is now (optional)" hint="A staffed desk is best: Public Safety, the library, the MTCC Welcome Desk.">
              <input id="heldAt" name="heldAt" maxLength={160} className={input} />
            </Field>
          )}
        </div>
      );
    case "ride":
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="from" text="From">
            <input id="from" name="from" required maxLength={120} className={input} placeholder="Rowe Village" />
          </Field>
          <Field id="to" text="To">
            <input id="to" name="to" required maxLength={120} className={input} placeholder="ORD, Terminal 3" />
          </Field>
          <Field id="departsAt" text="Leaves">
            <input id="departsAt" name="departsAt" type="datetime-local" required className={input} />
          </Field>
          <Field id="seats" text="Seats">
            <input id="seats" name="seats" type="number" min={1} max={8} defaultValue={2} className={input} />
          </Field>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input type="checkbox" name="costSplit" defaultChecked className="size-4 accent-primary" /> Split fuel or fare in person
          </label>
        </div>
      );
    case "study":
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="course" text="Course or topic">
            <input id="course" name="course" required maxLength={40} className={input} placeholder="CHEM 239" />
          </Field>
          <Field id="meets" text="When">
            <input id="meets" name="meets" maxLength={120} className={input} placeholder="Thursdays 7 pm" />
          </Field>
          <Field id="location" text="Where">
            <input id="location" name="location" maxLength={120} className={input} placeholder="Galvin Library, 2nd floor" />
          </Field>
          <Field id="capacity" text="Cap (optional)">
            <input id="capacity" name="capacity" type="number" min={2} max={50} className={input} />
          </Field>
        </div>
      );
    case "roommate":
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="kind" text="This is">
            <select id="kind" name="kind" defaultValue="roommate" className={input}>
              <option value="roommate">A room, roommate wanted</option>
              <option value="sublet">A sublet</option>
              <option value="looking">Me, looking for a place</option>
            </select>
          </Field>
          <Field id="rent" text="Rent per month (USD, optional)">
            <input id="rent" name="rent" type="number" min={0} max={10000} className={input} />
          </Field>
          <Field id="moveIn" text="From">
            <input id="moveIn" name="moveIn" type="date" required className={input} />
          </Field>
          <Field id="moveOut" text="Until (optional)">
            <input id="moveOut" name="moveOut" type="date" className={input} />
          </Field>
          <Field id="location" text="Where">
            <input id="location" name="location" maxLength={160} className={input} placeholder="31st and Michigan" />
          </Field>
        </div>
      );
    case "poll":
      return (
        <div className="space-y-3">
          <fieldset>
            <legend className={label}>Options (two to six)</legend>
            <div className="mt-1 grid gap-2 sm:grid-cols-2">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <input key={i} name="option" maxLength={80} required={i < 2} aria-label={`Option ${i + 1}`} className={input} placeholder={i < 2 ? `Option ${i + 1}` : "Optional"} />
              ))}
            </div>
          </fieldset>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="multiple" className="size-4 accent-primary" /> People can pick more than one
          </label>
        </div>
      );
    default:
      return null;
  }
}
