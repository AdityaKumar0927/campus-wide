import type { MetadataRoute } from "next";

/** Installable on Android, iOS (Add to Home Screen), and desktop. Kept deliberately small. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Campus Wide",
    short_name: "CampusWide",
    description: "A notice board for your whole campus: questions, events, things to pass on, rides, and meals shared in person.",
    start_url: "/feed",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#faf8f4",
    theme_color: "#faf8f4",
    categories: ["education", "social"],
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Pin a notice", short_name: "Pin", url: "/post" },
      { name: "Questions", short_name: "Questions", url: "/questions" },
      { name: "Inbox", short_name: "Inbox", url: "/inbox" },
    ],
  };
}
