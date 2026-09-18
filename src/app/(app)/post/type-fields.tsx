import type { DiningLocation, SafeSpot } from "@/lib/dal/campus";
import type { PostType } from "@/lib/posts/types";
import { MoreTypeFields, Field, input, label } from "./type-fields-more";

export interface TypeFieldsContext {
  timezone: string;
  safeSpots: SafeSpot[];
  dining: DiningLocation[];
  mealsPolicy: string | null;
  mealAttestedThisTerm: boolean;
  term: string;
}

/** Type-specific inputs. Plain form fields: the server builds the payload (payload-from-form.ts). */
export function TypeFields({ type, ctx }: { type: PostType; ctx: TypeFieldsContext }) {
  switch (type) {
    case "event":
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="startsAt" text="Starts">
            <input id="startsAt" name="startsAt" type="datetime-local" required className={input} />
          </Field>
          <Field id="endsAt" text="Ends (optional)">
            <input id="endsAt" name="endsAt" type="datetime-local" className={input} />
          </Field>
          <Field id="location" text="Where">
            <input id="location" name="location" required maxLength={200} className={input} placeholder="MTCC, The Bog" />
          </Field>
          <Field id="rsvpLimit" text="Cap on RSVPs (optional)">
            <input id="rsvpLimit" name="rsvpLimit" type="number" min={1} max={5000} className={input} />
          </Field>
        </div>
      );
    case "listing":
      return (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field id="price" text="Price (USD)">
              <input id="price" name="price" type="number" min={0} max={5000} step="0.01" className={input} />
            </Field>
            <Field id="condition" text="Condition">
              <select id="condition" name="condition" defaultValue="good" className={input}>
                <option value="new">New</option>
                <option value="like_new">Like new</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
              </select>
            </Field>
            <Field id="category" text="Category">
              <select id="category" name="category" defaultValue="other" className={input}>
                {["textbooks", "electronics", "furniture", "bikes", "clothing", "kitchen", "tickets", "other"].map((c) => (
                  <option key={c} value={c}>
                    {c[0].toUpperCase() + c.slice(1)}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="free" className="size-4 accent-primary" /> Free, just come and get it
          </label>
          <p className="text-xs text-muted-foreground">
            No payments through the board. Meet at a safe-exchange spot: {ctx.safeSpots.map((s) => s.name).join("; ") || "a staffed public desk"}. Meal swipes, dining dollars, IDs, alcohol, nicotine, medication, weapons, and academic work are not allowed.
          </p>
        </div>
      );
    case "meal": {
      const commons = ctx.dining.filter((d) => d.guest_meals);
      const periods = commons[0]?.periods ?? [{ name: "Dinner", start: "16:30", end: "20:30", days: "" }];
      return (
        <div className="space-y-4">
          <fieldset>
            <legend className={label}>What is this?</legend>
            <div className="mt-1 flex flex-wrap gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input type="radio" name="mealMode" value="offer" defaultChecked className="accent-primary" /> I am offering a guest meal
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" name="mealMode" value="request" className="accent-primary" /> A student needs a meal (only holders see this)
              </label>
            </div>
          </fieldset>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field id="mealDate" text="Day">
              <input id="mealDate" name="mealDate" type="date" required className={input} />
            </Field>
            <Field id="mealPeriod" text="Meal period">
              <select id="mealPeriod" name="mealPeriod" className={input}>
                {periods.map((p) => (
                  <option key={p.name} value={`${p.name} ${p.start}-${p.end}`}>
                    {p.name} ({p.start}-{p.end})
                  </option>
                ))}
              </select>
            </Field>
            <Field id="location" text="Where">
              <input id="location" name="location" defaultValue={commons[0]?.name ?? "The Commons"} readOnly className={input} />
            </Field>
          </div>
          {ctx.mealsPolicy && <p className="rounded-md border border-rule bg-[var(--stock-yellow)] px-3 py-2 text-xs">{ctx.mealsPolicy}</p>}
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" name="mealAttest" required defaultChecked={ctx.mealAttestedThisTerm} className="mt-0.5 size-4 accent-primary" />
            <span>I hold the All Access plan this term ({ctx.term}). Self-reported: a false claim costs someone a walk to the MTCC, and two no-show reports suspend my offers.</span>
          </label>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" name="mealPolicy" required className="mt-0.5 size-4 accent-primary" />
            <span>I will be at the register with my own HawkCard. Nothing is sold, lent, or traded, and no card, PIN, or photo changes hands.</span>
          </label>
        </div>
      );
    }
    default:
      return <MoreTypeFields type={type} />;
  }
}
