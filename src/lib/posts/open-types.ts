import { POST_TYPES, POST_TYPE_META, type PostType } from "./types";

/** Types the composer offers for a campus: every module whose flag is on (meal gifting is off by default). */
export function openTypes(flags: Record<string, boolean> | undefined): PostType[] {
  return POST_TYPES.filter((t) => {
    const flag = POST_TYPE_META[t].flag;
    return !flag || Boolean(flags?.[flag]);
  });
}
