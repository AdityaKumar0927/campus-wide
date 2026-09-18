"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { downscaleImage } from "@/lib/uploads/downscale";
import { POST_IMAGES_BUCKET, postImageUrl } from "@/lib/uploads/urls";

/**
 * Picks up to four photos, downsizes them in the browser, uploads straight to the campus folder of
 * the post-images bucket (RLS checks the folder and the owner), and hands the paths to the form.
 */
export function ImagePicker({ universityId, max = 4 }: { universityId: string; max?: number }) {
  const [paths, setPaths] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, max - paths.length);
    e.target.value = "";
    if (files.length === 0) return;
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const added: string[] = [];
    for (const file of files) {
      try {
        const blob = await downscaleImage(file);
        const path = `${universityId}/${crypto.randomUUID()}.webp`;
        const { error: upErr } = await supabase.storage.from(POST_IMAGES_BUCKET).upload(path, blob, { contentType: "image/webp", cacheControl: "31536000" });
        if (upErr) throw upErr;
        added.push(path);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed.");
      }
    }
    setPaths((p) => [...p, ...added]);
    setBusy(false);
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-3">
        <label className="inline-flex h-9 cursor-pointer items-center rounded-md border border-rule bg-card px-3 text-sm font-medium hover:bg-muted has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50">
          <input type="file" accept="image/*" multiple className="sr-only" onChange={onChange} disabled={busy || paths.length >= max} />
          {busy ? "Uploading…" : paths.length >= max ? `${max} photos max` : "Add photos"}
        </label>
        <span className="text-xs text-muted-foreground">Resized in your browser. No faces needed.</span>
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {paths.length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label="Attached photos">
          {paths.map((p) => (
            <li key={p} className="relative">
              <input type="hidden" name="images" value={p} />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={postImageUrl(p)} alt="" className="size-20 rounded-sm border border-rule object-cover" />
              <button
                type="button"
                aria-label="Remove photo"
                onClick={() => setPaths((list) => list.filter((x) => x !== p))}
                className="absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full border border-rule bg-card text-xs shadow-sm"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
