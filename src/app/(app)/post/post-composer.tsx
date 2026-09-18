"use client";

import { useActionState, useState, type CSSProperties } from "react";
import { ImagePicker } from "@/components/board/image-picker";
import { Button } from "@/components/ui/button";
import { POST_TYPE_META, type PostType } from "@/lib/posts/types";
import { cn } from "@/lib/utils";
import { createPost, type ComposerState } from "./actions";
import { TypeFields, type TypeFieldsContext } from "./type-fields";

interface SpaceOption {
  id: string;
  name: string;
}

/** The composer is a blank notice: pick the paper, write the line, add the facts, pin it. */
export function PostComposer({
  openTypes,
  spaces,
  universityId,
  initialType,
  initialSpaceId,
  ctx,
}: {
  openTypes: PostType[];
  spaces: SpaceOption[];
  universityId: string;
  initialType?: PostType;
  initialSpaceId?: string;
  ctx: TypeFieldsContext;
}) {
  const [type, setType] = useState<PostType>(initialType && openTypes.includes(initialType) ? initialType : openTypes[0]);
  const [state, formAction, pending] = useActionState<ComposerState, FormData>(createPost, {});
  const meta = POST_TYPE_META[type];
  const paper = { "--stock": `var(--stock-${meta.stock})`, "--pin-hue": meta.pinHue } as CSSProperties;

  return (
    <form action={formAction} className="space-y-6">
      <fieldset>
        <legend className="stamp">What kind of notice?</legend>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {openTypes.map((t) => {
            const m = POST_TYPE_META[t];
            const active = t === type;
            return (
              <label
                key={t}
                className={cn(
                  "notice cursor-pointer px-3 pt-4 pb-3 text-sm transition-transform has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50",
                  active ? "-translate-y-0.5 ring-2 ring-primary" : "ring-1 ring-transparent hover:ring-rule",
                )}
                style={{ "--stock": `var(--stock-${m.stock})`, "--pin-hue": m.pinHue } as CSSProperties}
              >
                <input type="radio" name="type" value={t} checked={active} onChange={() => setType(t)} className="sr-only" />
                <span className="font-medium">{m.label}</span>
                <span className="mt-1 block text-xs text-muted-foreground">{m.hint}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="notice px-5 pt-6 pb-5" style={paper}>
        <div className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium">
              {meta.titleLabel}
            </label>
            <input id="title" name="title" required minLength={3} maxLength={200} autoComplete="off" className="mt-1 w-full border-0 border-b border-rule bg-transparent px-0 py-2 font-heading text-2xl outline-none focus-visible:border-primary" />
          </div>
          <TypeFields key={type} type={type} ctx={ctx} />
          <div>
            <label htmlFor="body" className="block text-sm font-medium">
              {meta.bodyLabel}
            </label>
            <textarea id="body" name="body" rows={5} maxLength={10000} className="mt-1 w-full rounded-md border border-input bg-card/60 px-3 py-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="spaceId" className="block text-sm font-medium">
                Where does it belong?
              </label>
              <select id="spaceId" name="spaceId" defaultValue={initialSpaceId ?? ""} className="mt-1 h-9 w-full rounded-md border border-input bg-card px-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
                <option value="">The whole campus</option>
                {spaces.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="expiresInDays" className="block text-sm font-medium">
                Take it down after
              </label>
              <select id="expiresInDays" name="expiresInDays" key={`exp-${type}`} defaultValue={meta.defaultExpiryDays ?? ""} className="mt-1 h-9 w-full rounded-md border border-input bg-card px-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
                <option value="">{type === "event" || type === "ride" ? "When it happens" : "When it is resolved"}</option>
                <option value="7">A week</option>
                <option value="30">A month</option>
                <option value="90">A term</option>
              </select>
            </div>
          </div>
          {meta.imagesAllowed && <ImagePicker universityId={universityId} />}
        </div>
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
      <div className="flex items-center gap-3">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Pinning…" : "Pin it to the board"}
        </Button>
        <span className="text-xs text-muted-foreground">Your name and @UID go with it. Nothing here is anonymous.</span>
      </div>
    </form>
  );
}
