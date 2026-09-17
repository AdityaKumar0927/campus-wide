import { PinMark } from "@/components/shell/wordmark";
import { Ripple } from "@/components/ui/ripple";
import { cn } from "@/lib/utils";

/**
 * Chicago, drawn by hand as a dot-filled land mass against Lake Michigan, with Illinois Tech pinned.
 * Coordinates are real (lat/lng) projected into a 400×440 box; the shoreline runs from Wilmette to the
 * Indiana line. Everything is static SVG except the soft ripple that marks the pin as live.
 */

const LNG = { min: -87.98, max: -87.5 };
const LAT = { min: 41.62, max: 42.09 };
const W = 400;
const H = 440;
const x = (lng: number) => ((lng - LNG.min) / (LNG.max - LNG.min)) * W;
const y = (lat: number) => ((LAT.max - lat) / (LAT.max - LAT.min)) * H;

// Shoreline, north to south (lat, lng).
const shore: [number, number][] = [
  [42.09, -87.685], [42.06, -87.673], [42.03, -87.663], [42.0, -87.655], [41.975, -87.64], [41.955, -87.632],
  [41.935, -87.627], [41.915, -87.622], [41.9, -87.618], [41.893, -87.6], [41.889, -87.598], [41.885, -87.612],
  [41.872, -87.612], [41.862, -87.608], [41.855, -87.603], [41.845, -87.598], [41.835, -87.597], [41.822, -87.59],
  [41.808, -87.585], [41.795, -87.578], [41.782, -87.572], [41.77, -87.563], [41.758, -87.553], [41.745, -87.54],
  [41.73, -87.53], [41.71, -87.525], [41.69, -87.52], [41.66, -87.52], [41.62, -87.52],
];

const landPath = [
  `M ${x(LNG.min)} ${y(LAT.max)}`,
  ...shore.map(([lat, lng]) => `L ${x(lng).toFixed(1)} ${y(lat).toFixed(1)}`),
  `L ${x(LNG.min)} ${y(LAT.min)} Z`,
].join(" ");

const IIT = { lat: 41.8349, lng: -87.627 };
const places: { name: string; lat: number; lng: number }[] = [
  { name: "The Loop", lat: 41.881, lng: -87.63 },
  { name: "Hyde Park", lat: 41.794, lng: -87.59 },
  { name: "Pilsen", lat: 41.856, lng: -87.665 },
  { name: "Midway", lat: 41.786, lng: -87.752 },
];

export function ChicagoMap({ className }: { className?: string }) {
  const px = x(IIT.lng);
  const py = y(IIT.lat);
  return (
    <figure className={cn("relative", className)} aria-label="Map of Chicago with Illinois Tech pinned in Bronzeville">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-hidden>
        <defs>
          <pattern id="land-dots" width="8" height="8" patternUnits="userSpaceOnUse">
            <circle cx="4" cy="4" r="0.95" fill="currentColor" />
          </pattern>
          <pattern id="water-lines" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(-25)">
            <line x1="0" y1="0" x2="0" y2="8" stroke="currentColor" strokeWidth="0.5" />
          </pattern>
          <clipPath id="frame">
            <rect x="0" y="0" width={W} height={H} rx="18" />
          </clipPath>
        </defs>
        <g clipPath="url(#frame)">
          <rect x="0" y="0" width={W} height={H} className="fill-[var(--card)]" />
          <rect x="0" y="0" width={W} height={H} fill="url(#water-lines)" className="text-[var(--rule)]" opacity="0.5" />
          <path d={landPath} fill="url(#land-dots)" className="text-[var(--cork)] opacity-80" />
          <path d={landPath} fill="none" stroke="var(--rule)" strokeWidth="1.2" />
          {places.map((p) => (
            <g key={p.name} className="text-[var(--muted-foreground)]">
              <circle cx={x(p.lng)} cy={y(p.lat)} r="2" fill="currentColor" />
              <text x={x(p.lng) + 6} y={y(p.lat) + 3.5} fontSize="9" fontFamily="var(--font-mono)" fill="currentColor" letterSpacing="0.6">
                {p.name.toUpperCase()}
              </text>
            </g>
          ))}
          <text x={x(-87.56)} y={y(41.95)} fontSize="9" fontFamily="var(--font-mono)" fill="var(--muted-foreground)" letterSpacing="1" transform={`rotate(-72 ${x(-87.56)} ${y(41.95)})`}>
            LAKE MICHIGAN
          </text>
          <text x={x(IIT.lng) + 12} y={y(IIT.lat) + 4} fontSize="10" fontWeight="700" fontFamily="var(--font-heading)" fill="var(--foreground)" letterSpacing="-0.2">
            Illinois Tech
          </text>
          <text x={x(IIT.lng) + 12} y={y(IIT.lat) + 15} fontSize="8" fontFamily="var(--font-mono)" fill="var(--muted-foreground)" letterSpacing="0.6">
            MIES CAMPUS · BRONZEVILLE
          </text>
        </g>
      </svg>
      {/* Live marker: soft red ripple under the pin at Illinois Tech's coordinates. */}
      <div className="pointer-events-none absolute" style={{ left: `${(px / W) * 100}%`, top: `${(py / H) * 100}%`, transform: "translate(-50%, -50%)" }}>
        <div className="relative flex size-24 items-center justify-center">
          <Ripple mainCircleSize={28} mainCircleOpacity={0.4} numCircles={4} color="oklch(0.72 0.15 25)" />
          <PinMark className="relative z-10 size-7 text-[oklch(0.58_0.18_27)] drop-shadow-sm" />
        </div>
      </div>
      <figcaption className="stamp absolute bottom-3 left-4 flex items-center gap-2">
        <span className="relative inline-flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-[oklch(0.7_0.16_25)] opacity-75 motion-reduce:hidden" />
          <span className="relative inline-flex size-2 rounded-full bg-[oklch(0.62_0.18_27)]" />
        </span>
        Live at Illinois Tech
      </figcaption>
    </figure>
  );
}
