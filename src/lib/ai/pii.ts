/**
 * Scrubs the obvious identifiers before anything leaves the server for an AI provider
 * (PLAN.md: no PII in server-side AI calls). Deliberately eager: better a lost word than a leak.
 */
const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const URL_RE = /\bhttps?:\/\/\S+/gi;
const PHONE = /(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/g;
const HANDLE = /(^|[^\w])@[a-z0-9_]{2,}/gi;
const LONG_NUMBER = /\b\d{7,}\b/g;

export function scrubPii(text: string): string {
  return text
    .replace(URL_RE, "[link]")
    .replace(EMAIL, "[email]")
    .replace(PHONE, "[phone]")
    .replace(HANDLE, (m, lead: string) => `${lead}[handle]`)
    .replace(LONG_NUMBER, "[number]");
}
