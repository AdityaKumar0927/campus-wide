import { ImageResponse } from "next/og";

/**
 * App icons, drawn from the same pin mark as the wordmark so nothing is checked in as a binary.
 * `/icons/icon-192.png`, `/icons/icon-512.png`, `/icons/maskable-512.png`, `/icons/apple-icon.png`.
 */
export const dynamic = "force-static";

const SIZES: Record<string, { size: number; maskable: boolean }> = {
  "icon-192.png": { size: 192, maskable: false },
  "icon-512.png": { size: 512, maskable: false },
  "maskable-192.png": { size: 192, maskable: true },
  "maskable-512.png": { size: 512, maskable: true },
  "apple-icon.png": { size: 180, maskable: true },
};

export function generateStaticParams() {
  return Object.keys(SIZES).map((name) => ({ name }));
}

export async function GET(_req: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const spec = SIZES[name];
  if (!spec) return new Response("Not found", { status: 404 });
  const { size, maskable } = spec;
  // Maskable icons need the mark inside the safe zone (80% of the canvas).
  const pin = Math.round(size * (maskable ? 0.46 : 0.62));
  return new ImageResponse(
    (
      <div style={{ width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center", background: "#faf8f4" }}>
        <svg width={pin} height={pin * 1.125} viewBox="0 0 16 18" style={{ transform: "rotate(-18deg)" }}>
          <circle cx="8" cy="6" r="5" fill="#1f5c3f" />
          <circle cx="6.3" cy="4.4" r="1.4" fill="rgba(255,255,255,0.55)" />
          <path d="M8 11v6" stroke="#1f5c3f" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </div>
    ),
    { width: size, height: size },
  );
}
