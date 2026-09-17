import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "Campus Wide: your campus, helping itself. A notice board for the whole campus.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Static assets read once at module scope (Next.js docs pattern). Instrument Serif is OFL-licensed;
// see src/assets/fonts/InstrumentSerif-OFL.txt.
const fontsDir = join(process.cwd(), "src", "assets", "fonts");
const serif = await readFile(join(fontsDir, "InstrumentSerif-Regular.ttf"));
const serifItalic = await readFile(join(fontsDir, "InstrumentSerif-Italic.ttf")).catch(() => null);

const paper = "#faf7f2";
const ink = "#2b2620";
const green = "#2c6a4a";
const notices = [
  { bg: "#dce9f6", stamp: "QUESTION · 2H AGO", text: "Anyone have a TI-84 for Thursday?", rot: -2 },
  { bg: "#f6e9c2", stamp: "FOR SALE · BIKE", text: "Commuter bike, lock included.", rot: 1.5 },
  { bg: "#fbf3b9", stamp: "LOST · LIBRARY 3F", text: "Blue Hydro Flask, cat sticker.", rot: -1 },
];

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: paper,
          backgroundImage: "radial-gradient(circle, #d9d2c6 1.5px, transparent 2px)",
          backgroundSize: "28px 28px",
          color: ink,
          fontFamily: "Instrument Serif",
          padding: 64,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: 640 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 30 }}>
            <div style={{ width: 16, height: 16, borderRadius: 999, background: green, transform: "rotate(-18deg)" }} />
            <span>Campus</span>
            <span style={{ color: green, fontStyle: "italic" }}>Wide</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 96, lineHeight: 0.98, letterSpacing: -2 }}>Your campus,</div>
            <div style={{ fontSize: 96, lineHeight: 0.98, letterSpacing: -2, color: green, fontStyle: "italic" }}>
              helping itself.
            </div>
          </div>
          <div style={{ fontFamily: "monospace", fontSize: 18, letterSpacing: 2, color: "#6b6258" }}>
            A NOTICE BOARD FOR THE WHOLE CAMPUS · VERIFIED · NO ADS
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 26, marginLeft: 48, justifyContent: "center" }}>
          {notices.map((n) => (
            <div
              key={n.text}
              style={{
                display: "flex",
                flexDirection: "column",
                width: 400,
                padding: "26px 22px 20px",
                background: n.bg,
                borderRadius: 4,
                boxShadow: "0 12px 24px -18px rgba(0,0,0,0.45)",
                transform: `rotate(${n.rot}deg)`,
                position: "relative",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: -9,
                  left: 190,
                  width: 18,
                  height: 18,
                  borderRadius: 999,
                  background: "radial-gradient(circle at 35% 32%, #f0a58a, #b8452a 72%)",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.4)",
                }}
              />
              <div style={{ fontFamily: "monospace", fontSize: 14, letterSpacing: 2, color: "#6b6258" }}>{n.stamp}</div>
              <div style={{ fontSize: 30, marginTop: 8, lineHeight: 1.15 }}>{n.text}</div>
            </div>
          ))}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Instrument Serif", data: serif, style: "normal", weight: 400 },
        ...(serifItalic ? [{ name: "Instrument Serif", data: serifItalic, style: "italic" as const, weight: 400 as const }] : []),
      ],
    },
  );
}
