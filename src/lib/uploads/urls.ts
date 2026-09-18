import { supabaseEnv } from "@/lib/supabase/env";

export const POST_IMAGES_BUCKET = "post-images";

/** Public URL for an object in the post-images bucket (paths are unguessable UUIDs under the campus folder). */
export function postImageUrl(path: string): string {
  return `${supabaseEnv.url}/storage/v1/object/public/${POST_IMAGES_BUCKET}/${path}`;
}
