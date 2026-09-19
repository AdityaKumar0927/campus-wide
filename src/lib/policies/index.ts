import type { ComponentType } from "react";

/**
 * The policy set (docs/BRIEF.md §7). Content lives in content/policies/*.mdx; versions are recorded in
 * policy_versions by scripts/sync-policies.mjs, and required ones must be accepted at the next sign-in.
 */
export interface PolicyMeta {
  slug: string;
  title: string;
  summary: string;
  /** Members must accept a new version before the board opens again. */
  required: boolean;
  group: "members" | "campus" | "trust";
  load: () => Promise<{ default: ComponentType }>;
}

export const POLICIES: PolicyMeta[] = [
  { slug: "terms", title: "Terms of Service", summary: "The contract between you and the board.", required: true, group: "members", load: () => import("@/content/policies/terms.mdx") },
  { slug: "privacy", title: "Privacy Notice", summary: "What we keep, why, and for how long.", required: true, group: "members", load: () => import("@/content/policies/privacy.mdx") },
  { slug: "community-guidelines", title: "Community Guidelines and Acceptable Use", summary: "How to behave, and what happens if you do not.", required: true, group: "members", load: () => import("@/content/policies/community-guidelines.mdx") },
  { slug: "safety-rules", title: "House Rules and Safety", summary: "What you agree to before your first notice.", required: true, group: "members", load: () => import("@/content/policies/safety-rules.mdx") },
  { slug: "cookies", title: "Cookie Policy", summary: "Strictly necessary cookies only; GPC honoured.", required: false, group: "members", load: () => import("@/content/policies/cookies.mdx") },
  { slug: "marketplace", title: "Marketplace Safety and Prohibited Items", summary: "Safe-exchange spots, no payments, what may not be listed.", required: false, group: "members", load: () => import("@/content/policies/marketplace.mdx") },
  { slug: "meal-sharing", title: "Meal Sharing Policy", summary: "Guest meals in person, holder present, nothing sold.", required: false, group: "members", load: () => import("@/content/policies/meal-sharing.mdx") },
  { slug: "age", title: "Age and Eligibility Policy", summary: "Adults on a campus, 17 and over.", required: false, group: "members", load: () => import("@/content/policies/age.mdx") },
  { slug: "accessibility", title: "Accessibility Statement", summary: "WCAG 2.2 AA, checked on every build.", required: false, group: "trust", load: () => import("@/content/policies/accessibility.mdx") },
  { slug: "security", title: "Security Policy", summary: "How to report a vulnerability; what protects the service.", required: false, group: "trust", load: () => import("@/content/policies/security.mdx") },
  { slug: "copyright", title: "Copyright and DMCA Policy", summary: "Notices, counter-notices, the designated agent.", required: false, group: "trust", load: () => import("@/content/policies/copyright.mdx") },
  { slug: "dsa-contact", title: "Point of Contact (DSA)", summary: "Who to write to; how decisions are explained and appealed.", required: false, group: "trust", load: () => import("@/content/policies/dsa-contact.mdx") },
  { slug: "dsa-transparency", title: "Content Moderation Transparency Report", summary: "The template we publish each period.", required: false, group: "trust", load: () => import("@/content/policies/dsa-transparency.mdx") },
  { slug: "law-enforcement", title: "Law Enforcement and Campus Requests Policy", summary: "Minimum necessary, valid process, members told.", required: false, group: "trust", load: () => import("@/content/policies/law-enforcement.mdx") },
  { slug: "subprocessors", title: "Subprocessor List", summary: "Who handles data on our behalf.", required: false, group: "campus", load: () => import("@/content/policies/subprocessors.mdx") },
  { slug: "dpa", title: "Data Processing Addendum (template)", summary: "For a university that adopts the board officially.", required: false, group: "campus", load: () => import("@/content/policies/dpa.mdx") },
];

export function policyBySlug(slug: string): PolicyMeta | undefined {
  return POLICIES.find((p) => p.slug === slug);
}
