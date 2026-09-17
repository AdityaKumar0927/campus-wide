import { flushSync } from "react-dom";

/**
 * Circular view-transition wipe from an element when the theme changes (adapted from Magic UI's
 * animated-theme-toggler). Falls back to an instant switch without the View Transitions API or
 * when the user prefers reduced motion. The class is toggled synchronously inside the transition
 * callback so the snapshot captures the new theme; next-themes then persists the same value.
 */
export function withThemeWipe(origin: HTMLElement | null, targetIsDark: boolean, apply: () => void, duration = 450) {
  const root = document.documentElement;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!origin || reduced || typeof document.startViewTransition !== "function") {
    apply();
    return;
  }
  const { top, left, width, height } = origin.getBoundingClientRect();
  const x = left + width / 2;
  const y = top + height / 2;
  const w = window.innerWidth;
  const h = window.innerHeight;
  const maxRadius = Math.hypot(Math.max(x, w - x), Math.max(y, h - y));
  const at = `${(x / w) * 100}% ${(y / h) * 100}%`;
  const radius = `${(maxRadius / (Math.hypot(w, h) / Math.SQRT2)) * 100}%`;

  const transition = document.startViewTransition(() => {
    flushSync(() => {
      root.classList.toggle("dark", targetIsDark);
      root.style.colorScheme = targetIsDark ? "dark" : "light";
      apply();
    });
  });
  transition.ready
    .then(() => {
      root.animate(
        { clipPath: [`circle(0% at ${at})`, `circle(${radius} at ${at})`] },
        { duration, easing: "ease-in-out", fill: "forwards", pseudoElement: "::view-transition-new(root)" },
      );
    })
    .catch(() => {});
}
