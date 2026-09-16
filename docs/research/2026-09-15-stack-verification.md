# Stack verification — 2026-09-15

Live-checked against the npm registry (`registry.npmjs.org/<pkg>/latest`), GitHub releases, and
official docs on 2026-09-15. These are the versions Phase 1 pins. Re-run this check before each
major phase; Dependabot keeps patches current afterwards.

## 1. Package versions (npm `latest` on 2026-09-15)

| Package | Version | engines.node | Notes |
|---|---|---|---|
| next | 16.3.5 | >=20.9.0 | Released 2026-09-11 (backported fixes). No Next.js 17 exists; 16.4 is canary only. |
| react / react-dom | 19.3.0 | — | |
| typescript | 7.0.2 (`latest`) | >=16.20 | **7.x is the Go-native compiler.** Next.js docs still state minimum TS 5.1. Decision: pin whatever `create-next-app@latest` scaffolds (JS-based 5.x/6.x line) for ecosystem compatibility; evaluate `tsgo` for faster `typecheck` later. |
| tailwindcss / @tailwindcss/postcss | 4.3.3 | — | Still installed via `@tailwindcss/postcss` + `@import "tailwindcss"`. |
| shadcn (CLI) | 4.21.0 | >=20.18.1 | **Base UI is the default primitive for new inits since Jul 2026** (Radix still selectable). Supports Tailwind v4 + React 19; shadcn's own docs app pins next 16.3.x. |
| drizzle-orm | 0.45.2 | — | |
| drizzle-kit | 0.31.10 | — | |
| postgres (postgres.js) | 3.4.9 | >=12 | |
| @supabase/supabase-js | 2.116.0 | **>=22.0.0** | Forces Node 22+. |
| @supabase/ssr | 0.12.7 | — | |
| resend | 6.28.1 | >=20 | |
| react-email / @react-email/components | 6.9.5 / 1.0.12 | >=20 | |
| zod | 4.6.5 | — | Zod 4 API. |
| next-themes | 0.4.6 | — | |
| serwist / @serwist/next / @serwist/turbopack | 9.5.12 | @serwist/next >=18 | **`@serwist/next` is webpack-only.** Turbopack path is `@serwist/turbopack` (route-handler `createSerwistRoute`, needs esbuild) with open bugs (#360 Vercel runtime crash, #366 assetPrefix) and the umbrella `next dev --turbo` issue #54 still open. See decision D-07. |
| vitest | 5.0.1 | ^22.12 \|\| ^24 \|\| >=26 | Forces Node 22.12+/24. |
| @playwright/test | 1.63.0 | >=20 | |
| @axe-core/playwright | 4.13.0 | — | |
| eslint / eslint-config-next | 10.10.0 / 16.3.5 | ^20.19 \|\| ^22.13 \|\| >=24 | Flat config. |
| @huggingface/transformers | 4.2.0 | — | Transformers.js v4 line. |
| @upstash/ratelimit / @upstash/redis | 2.1.0 / 1.38.4 | — | |
| @marsidev/react-turnstile | 1.6.1 | — | |
| motion | 13.3.0 | — | |
| lucide-react | 1.46.0 | — | |
| pnpm | 12.4.2 | >=18 | Local machine has pnpm 9.4.0 → upgrade via `corepack`. |

## 2. Runtime decisions confirmed from docs

- **Node.js**: Node 24 "Krypton" is Active LTS (LTS since 2025-10-28; maintenance from 2026-10-20; EOL 2028-04-30). Node 22 is Maintenance LTS. **Node 25 is EOL (2026-06-01)** and is not offered by Vercel (Vercel offers 24.x default, 22.x, 20.x). The local machine currently runs Node 25.6.1 → **install Node 24 LTS** (`.nvmrc` = `24`). Sources: nodejs.org/en/about/previous-releases, vercel.com/docs/functions/runtimes/node-js/node-js-versions.
- **Next.js 16 `proxy.ts` replaces `middleware.ts`**: "The `middleware` file convention is deprecated and has been renamed to `proxy`… The file must export a single function, either as a default export or named `proxy`." Proxy runs on the Node.js runtime by default. `middleware.ts` still exists for Edge use but is deprecated. Source: nextjs.org/docs/app/api-reference/file-conventions/proxy; nextjs.org/blog/next-16.
- **Next.js minimum Node**: 20.9 (installation docs + `engines`). Node 18 dropped in 16.
- **Tailwind v4 + Next.js**: `pnpm add tailwindcss @tailwindcss/postcss postcss`; `postcss.config.mjs` → `{ "@tailwindcss/postcss": {} }`; `@import "tailwindcss";` in `globals.css`. Source: tailwindcss.com/docs/installation/framework-guides/nextjs.
- **shadcn**: `pnpm dlx shadcn@latest init` on a fresh `create-next-app` project; Tailwind v4 + React 19 supported; Base UI default since Jul 2026 changelog entry "Base UI as the Default". Source: ui.shadcn.com/docs/changelog.

## 3. Service free tiers (official pricing/docs pages, 2026-09-15)

| Service | Verified free-tier facts | Source |
|---|---|---|
| **Supabase Free** | 500 MB database (shared CPU, 500 MB RAM); 1 GB file storage; 5 GB egress + 5 GB cached egress; 50,000 MAU; 500,000 edge-function invocations; Realtime 200 concurrent connections / 2M messages per month; **limit of 2 active projects**; backups not included. **Paused after "low activity over a 7-day period"** (needs a few DB/API requests each day; dashboard visits count). Paused projects restorable for up to 1 year. Paid projects cannot be paused. | supabase.com/pricing; supabase.com/docs/guides/platform/free-project-pausing |
| **Supabase Auth: passkeys** | **Passkeys (WebAuthn) are in public beta as a primary sign-in method since 2026-05-28**; API marked experimental ("may change without notice"); requires supabase-js ≥ 2.105.0. **Not** available as an MFA factor (MFA = TOTP + phone only). | supabase.com/changelog/46458-passkeys-for-supabase-auth-beta; supabase.com/docs/guides/auth/passkeys; supabase.com/docs/guides/auth/auth-mfa |
| **Vercel Hobby** | 100 GB fast data transfer; 10 GB fast origin transfer; 1M function invocations; 1M edge requests; 4 CPU-hrs / 360 GB-hrs; 200 projects; runtime logs 1 hour; Web Analytics 50k events/month. **No monthly build-minute quota is published any more**; caps are 45 min per build, 1 concurrent build, 100 deployments/day. **"Hobby teams are restricted to non-commercial personal use only."** Commercial = financial gain for anyone involved (payments, ads, being paid to build/host). "Asking for Donations does not fall under commercial usage." | vercel.com/docs/plans/hobby (2026-08-31); vercel.com/docs/limits/fair-use-guidelines (2026-07-29); vercel.com/docs/limits |
| **Resend Free** | **100 emails/day, 3,000/month**; 3 domains; 30-day retention; ticket support. | resend.com/pricing |
| **Upstash Redis Free** | **500K commands/month** (max 10k/s); 256 MB storage; 10 GB bandwidth/month; 1 database. | upstash.com/pricing/redis |
| **Cloudflare Turnstile Free** | Free plan: up to 20 widgets, 10 hostnames per widget, unlimited challenges, 7-day analytics. | developers.cloudflare.com/turnstile/plans (2026-08-14) |
| **Analytics** | **Umami Cloud Hobby**: "completely free" (docs); numeric limits UNVERIFIED (pricing page is client-rendered). **PostHog**: 1M events/month free, no card, EU cloud in Frankfurt at no extra cost. **Plausible**: **no free cloud tier** (30-day trial, then $9/mo); Community Edition is self-host only (AGPL). | docs.umami.is/docs/cloud/faq; posthog.com/pricing; plausible.io/#pricing |
| **Groq** | Main text models (gpt-oss-120b/20b, qwen3.8-27b): 30 RPM / 1K RPD / 8K TPM / 200K TPD; compound: 30 RPM / 250 RPD. Limits are per organization. **"Groq is not permitted to use Inputs or Outputs for training"** (Services Agreement §4.2, 2026-06-22); no default retention; Zero Data Retention toggle available. | console.groq.com/docs/rate-limits; console.groq.com/docs/legal/services-agreement; console.groq.com/docs/your-data |
| **Google Gemini API free** | Per-model free RPM/TPM/RPD tables **removed from public docs** (now "view in AI Studio"). **Free tier content IS used to improve Google products**; terms say "Do not submit sensitive, confidential, or personal information to the Unpaid Services." | ai.google.dev/gemini-api/docs/rate-limits (2026-09-02); ai.google.dev/gemini-api/docs/pricing; ai.google.dev/gemini-api/terms |
| **OpenRouter `:free`** | 20 RPM; **50 requests/day without purchased credits**, 1,000/day after ≥$10 lifetime credits. | openrouter.ai/docs/api-reference/limits |
| **GitHub** | **Public repos: Actions minutes free/unlimited on standard runners; CodeQL code scanning free; secret scanning on by default.** Private repos on GitHub Free: 2,000 Actions min/month, 500 MB storage; **CodeQL requires a paid GitHub Code Security license**. Dependabot (alerts, security + version updates) free on all plans. | docs.github.com (about-billing-for-github-actions; github-security-features; githubs-plans) |

### Deltas from the brief that change the plan
1. **Passkeys**: available (beta) as a *sign-in* method, not MFA → ship as an optional, feature-flagged "beta" sign-in after magic link/OTP are solid (Phase 2b), guarded against API changes.
2. **Plausible** is not free-hosted → analytics choice is **Umami Cloud Hobby (default) or PostHog EU** (cookieless config). Plausible only if self-hosted, which costs a server.
3. **Gemini free tier trains on inputs** → excluded from the default server-AI provider list. **Groq is the default server fallback** (no training, ZDR); OpenRouter `:free` is a low-quota secondary (50 RPD).
4. **CodeQL is free only on public repos** → recommend a **public** repository (also gives unlimited Actions minutes). If private, CodeQL is dropped and Semgrep OSS / ESLint security rules substitute.
5. **Serwist**: Turbopack support is not via `@serwist/next` → PWA build uses the Serwist core library compiled with esbuild in a prebuild script (bundler-agnostic), with `@serwist/turbopack` as the fallback option.
6. **Node 24 LTS** (not 25) locally and on Vercel; pnpm 12 via corepack.
7. **Vercel Hobby "build minutes"** figure no longer exists; the binding caps are 45 min/build, 1 concurrent build, 100 deploys/day. Donations are explicitly allowed on Hobby.

## 4. Platform capabilities confirmed from official docs (2026-09-15)

| Topic | Finding | Source |
|---|---|---|
| Supabase SSR (Next.js) | `createServerClient(url, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, { cookies: { getAll, setAll } })`. **"Always use `supabase.auth.getClaims()` to protect pages and user data. Never trust `getSession()` inside server code such as Proxy."** `getUser()` only when a fresh Auth-server record is needed. Proxy refreshes the token by calling `getClaims()`. | supabase.com/docs/guides/auth/server-side/nextjs |
| Drizzle RLS | Policies declared with `pgPolicy(...)` inside `pgTable`; adding a policy enables RLS automatically; `pgTable.withRLS(...)` for RLS without policies. `drizzle-orm/supabase` exports `anonRole`, `authenticatedRole`, `serviceRole`, `authUid`, `authUsers`. Role management opt-in via `entities: { roles: { provider: 'supabase' } }` in `drizzle.config.ts`. | orm.drizzle.team/docs/rls |
| Drizzle + Supabase connection | `drizzle-orm/postgres-js` with `postgres(DATABASE_URL, { prepare: false })` through the pooler for serverless; direct connection for long-running processes. | orm.drizzle.team/docs/connect-supabase |
| Magic link / OTP | Both via `signInWithOtp()`; magic link by default, OTP when the template includes `{{ .Token }}`. One request per 60 s; links expire after 1 hour; `shouldCreateUser: false` disables auto-signup. | supabase.com/docs/guides/auth/auth-email-passwordless |
| Passkeys | Experimental; opt-in `createClient(url, key, { auth: { experimental: { passkey: true } } })`; `registerPasskey()`, `signInWithPasskey()`, `auth.passkey.list/update/delete()`. Requires supabase-js ≥ 2.105.0. | supabase.com/docs/guides/auth/passkeys |
| SAML SSO | Pro plan and above; $0.015 per SSO MAU beyond quota; managed via `supabase sso` CLI. | supabase.com/docs/guides/auth/enterprise-sso/auth-sso-saml |
| Auth email delivery | Built-in mailer = 2 messages/hour, best-effort; **custom SMTP strongly recommended**. Resend SMTP: `smtp.resend.com`, port 465, user `resend`, password = API key. Send-Email auth hook replaces SMTP when custom logic/templates are needed. | supabase.com/docs/guides/auth/auth-smtp; resend.com/docs/send-with-supabase-smtp; supabase.com/docs/guides/auth/auth-hooks/send-email-hook |
| Transformers.js | `@huggingface/transformers` 4.2.0; WebGPU via `device: "webgpu"` (global support ≈85 % as of Mar 2026; still experimental in some browsers). Embeddings: `mixedbread-ai/mxbai-embed-xsmall-v1` (`pooling: "mean", normalize: true`) or `onnx-community/all-MiniLM-L6-v2-ONNX`. Toxicity: `Xenova/toxic-bert` text-classification. | github.com/huggingface/transformers.js (docs source) |
| Chrome Prompt API | Web availability from **Chrome 148 stable** (extensions since 138); object is `LanguageModel`; desktop only (Windows 10/11, macOS 13+, Linux, Chromebook Plus); needs 22 GB free disk and >4 GB VRAM or 16 GB RAM + 4 cores. Not on Android/iOS. | developer.chrome.com/docs/ai/built-in-apis; /docs/ai/prompt-api |
| Web Push on iOS | Supported for Home Screen web apps since iOS 16.4; permission request must follow a user gesture. Declarative Web Push shipped in iOS 18.4 / macOS 15.5 (no service worker required). | developer.apple.com (usernotifications web push); webkit.org/blog/13878; webkit.org/blog/16535 |
| CSP with nonces (Next 16) | Nonce generated in `proxy.ts`, passed via `x-nonce` request header, read with `(await headers()).get('x-nonce')`. **Requires dynamic rendering on every page**; incompatible with PPR; force with `await connection()`. Alternatives: static CSP in `next.config`, experimental SRI. | nextjs.org/docs/app/guides/content-security-policy |
| CVE-2025-29927 | Affected <15.2.3 / <14.2.25 / <13.5.9 / <12.3.5; Vercel-hosted apps were not impacted; mitigation is to filter `x-middleware-subrequest` before it reaches Next. | github.com/advisories/GHSA-f82v-jwr5-mffw; vercel.com/blog/postmortem-on-next-js-middleware-bypass |
| Hipo university list | MIT licence; raw JSON `raw.githubusercontent.com/Hipo/university-domains-list/master/world_universities_and_domains.json`; API `universities.hipolabs.com/search?name=…&country=…`. | github.com/Hipo/university-domains-list |
| Vercel cron (Hobby) | 100 cron jobs, **minimum once per day**, ±59 min precision; more frequent expressions fail at deploy. Billed as function invocations. | vercel.com/docs/cron-jobs/usage-and-pricing (2026-07-15) |
