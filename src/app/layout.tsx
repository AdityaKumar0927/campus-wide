import type { Metadata, Viewport } from "next";
import { Instrument_Sans, Newsreader } from "next/font/google";
import { headers } from "next/headers";
import { ThemeProvider } from "@/components/theme-provider";
import { SkipLink } from "@/components/shell/skip-link";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

// Self-hosted at build time by next/font: no requests to Google from the browser.
// Static instances keep the payload small, and display: "optional" means a slow first load falls back
// to the system stack instead of delaying Largest Contentful Paint; the font is cached for the next page.
const sans = Instrument_Sans({
  variable: "--font-instrument-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "optional",
});
const serif = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  display: "optional",
});

const appUrl = process.env.APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: { default: "Campus Wide", template: "%s · Campus Wide" },
  description:
    "A calmer, kinder campus community for verified students: questions and answers, events, a no-payment marketplace, meal gifting, lost and found, rides, study groups, and more.",
  applicationName: "Campus Wide",
  openGraph: {
    type: "website",
    siteName: "Campus Wide",
    title: "Campus Wide",
    description: "Your campus, helping itself.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf8f4" },
    { media: "(prefers-color-scheme: dark)", color: "#221f1c" },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Reading the request headers opts every route into dynamic rendering, which nonce-based CSP
  // requires (ARCHITECTURE.md §10). The nonce is forwarded to next-themes' inline script.
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <html lang="en" suppressHydrationWarning className={`${sans.variable} ${serif.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <SkipLink />
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange nonce={nonce}>
          <TooltipProvider>{children}</TooltipProvider>
          <Toaster position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}
