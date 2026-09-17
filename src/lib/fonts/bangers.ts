import { Bangers } from "next/font/google";

/** Comic display face, used in exactly one place (the feedback thank-you). Loaded on demand. */
export const bangers = Bangers({ weight: "400", subsets: ["latin"], variable: "--font-bangers", display: "swap", preload: false });
