import type { IconProps } from "./board-icons";

/**
 * The stuff of campus life, in the same hand as the module icons: what gets lost, lent, found and
 * passed on. Drawn for the icon cloud, where each one is rasterised once at 64px, so strokes stay
 * simple. Stroke colour is fixed because the cloud renders them as images, outside the cascade.
 */
function S({ size = 24, children, color = "currentColor", ...props }: IconProps & { color?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      {children}
    </svg>
  );
}

export const KeyStuff = (p: IconProps) => <S {...p}><circle cx="8" cy="9" r="3.6" /><path d="M10.8 11.6l7.4 7.4M15 15.8l1.8-1.8M17.4 18.2l1.8-1.8" /></S>;
export const UmbrellaStuff = (p: IconProps) => <S {...p}><path d="M3.6 12.4c1.4-5 4.6-7.6 8.4-7.6s7 2.6 8.4 7.6c-1.4-1-2.8-1-4.2 0-1.4-1-2.8-1-4.2 0-1.4-1-2.8-1-4.2 0-1.4-1-2.8-1-4.2 0z" /><path d="M12 12.6v6.2a1.8 1.8 0 0 1-3.6 0" /></S>;
export const CalculatorStuff = (p: IconProps) => <S {...p}><rect x="6" y="3.6" width="12" height="16.8" rx="1.6" /><path d="M8.6 6.6h6.8v3H8.6z" /><path d="M9 13h.01M12 13h.01M15 13h.01M9 16.6h.01M12 16.6h.01M15 16.6h.01" strokeWidth={2.2} /></S>;
export const HeadphonesStuff = (p: IconProps) => <S {...p}><path d="M4.6 14V12a7.4 7.4 0 0 1 14.8 0v2" /><rect x="4.2" y="13.4" width="4" height="6" rx="1.4" /><rect x="15.8" y="13.4" width="4" height="6" rx="1.4" /></S>;
export const BikeStuff = (p: IconProps) => <S {...p}><circle cx="6" cy="16" r="3.4" /><circle cx="18" cy="16" r="3.4" /><path d="M6 16l3.6-7h6.4l2 7M9.6 9l4.2 7M13 6.4h2.4" /></S>;
export const LaptopStuff = (p: IconProps) => <S {...p}><rect x="5" y="5.4" width="14" height="9.6" rx="1.4" /><path d="M2.8 18.2h18.4M9.8 15v3.2M14.2 15v3.2" /></S>;
export const ChargerStuff = (p: IconProps) => <S {...p}><path d="M6 8.4h6v5.2a3 3 0 0 1-6 0z" /><path d="M7.6 8.4V5.4M10.4 8.4V5.4M9 16.6c0 2.4 2 2.4 4 2.4s4 0 4-2.4" /></S>;
export const WalletStuff = (p: IconProps) => <S {...p}><rect x="3.6" y="7" width="16.8" height="12" rx="1.8" /><path d="M3.6 10h16.8M15.4 14.2h2.4" /><path d="M6 7V6a1.4 1.4 0 0 1 1.4-1.4h9" /></S>;
export const BackpackStuff = (p: IconProps) => <S {...p}><path d="M6.4 9.4a5.6 5.6 0 0 1 11.2 0v10a1.6 1.6 0 0 1-1.6 1.6H8a1.6 1.6 0 0 1-1.6-1.6z" /><path d="M9.4 5.6V4.2M14.6 5.6V4.2M8.6 14.4h6.8v4H8.6z" /></S>;
export const BookStuff = (p: IconProps) => <S {...p}><path d="M5.4 4.6h9.2a2 2 0 0 1 2 2v13H7.4a2 2 0 0 1-2-2z" /><path d="M5.4 15.6a2 2 0 0 1 2-2h9.2M8.4 8.6h5" /></S>;
export const CoffeeStuff = (p: IconProps) => <S {...p}><path d="M5 9.4h11v6.2a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4z" /><path d="M16 11h1.4a2.2 2.2 0 0 1 0 4.4H16M8.4 3.8c-.8 1.2.8 2 0 3.2M11.6 3.8c-.8 1.2.8 2 0 3.2" /></S>;
export const WatchStuff = (p: IconProps) => <S {...p}><circle cx="12" cy="12" r="5.2" /><path d="M12 9.2V12l1.8 1.4M9.6 6.8l.6-3h3.6l.6 3M9.6 17.2l.6 3h3.6l.6-3" /></S>;
export const GlassesStuff = (p: IconProps) => <S {...p}><circle cx="7" cy="13.4" r="3.4" /><circle cx="17" cy="13.4" r="3.4" /><path d="M10.4 13.4c.6-1.2 2.6-1.2 3.2 0M3.6 13.4L5 8.6M20.4 13.4L19 8.6" /></S>;
export const TicketStuff = (p: IconProps) => <S {...p}><path d="M3.8 8.6a2 2 0 0 0 0 4v3.8h16.4v-3.8a2 2 0 0 1 0-4V4.8H3.8z" /><path d="M13.4 6.4v1.4M13.4 10.4v1.4M13.4 14.4v1.2" strokeDasharray="1 1.4" /></S>;
export const LampStuff = (p: IconProps) => <S {...p}><path d="M7 4.6h7l4 7H11z" /><path d="M14.6 11.6v6.6" /><path d="M9.6 20h9M7 12.4a2.4 2.4 0 0 0 4.8 0" /></S>;
export const BottleStuff = (p: IconProps) => <S {...p}><path d="M9.6 3.6h4.8v2.8l1.4 2.4v10a1.6 1.6 0 0 1-1.6 1.6h-4.4a1.6 1.6 0 0 1-1.6-1.6v-10l1.4-2.4z" /><path d="M8.2 12.6h7.6M8.2 15.8h7.6" /></S>;
export const JacketStuff = (p: IconProps) => <S {...p}><path d="M8.4 4.4L12 6.4l3.6-2 4 2-1.6 4.4-2-.6V20H8V10.2l-2 .6L4.4 6.4z" /><path d="M12 6.4v13.6" strokeDasharray="1.2 1.6" /></S>;
export const ScarfStuff = (p: IconProps) => <S {...p}><path d="M7.6 4.4h8.8v4.2a4.4 4.4 0 0 1-8.8 0z" /><path d="M9 8.6l-2.2 11 4-1.4 1.2-6.4M15 8.6l2.2 11-4-1.4" /></S>;
export const PencilStuff = (p: IconProps) => <S {...p}><path d="M5.4 15.6L15.8 5.2l3 3L8.4 18.6l-4 1z" /><path d="M13.8 7.2l3 3M6.6 14.8l2.6 2.6" /></S>;
export const NotebookStuff = (p: IconProps) => <S {...p}><rect x="6" y="3.8" width="12.4" height="16.4" rx="1.6" /><path d="M4.4 7.4H7.6M4.4 11.8H7.6M4.4 16.2H7.6M10.6 8.4h4.6M10.6 12h4.6" /></S>;
export const HatStuff = (p: IconProps) => <S {...p}><path d="M3.6 10.4L12 6l8.4 4.4L12 14.8z" /><path d="M7.4 12.4v3.4c2.8 2.4 6.4 2.4 9.2 0v-3.4M20.4 10.4v4.4" /></S>;
export const CableStuff = (p: IconProps) => <S {...p}><path d="M5 5.4h4v4H5z" /><path d="M7 9.4v2.2c0 3 10 2 10 5.2v1.6" /><path d="M15.4 18.4h3.2M17 5.4v4" strokeDasharray="0 0" /></S>;

export const stuffIcons = [
  KeyStuff, UmbrellaStuff, CalculatorStuff, HeadphonesStuff, BikeStuff, LaptopStuff, ChargerStuff, WalletStuff, BackpackStuff,
  BookStuff, CoffeeStuff, WatchStuff, GlassesStuff, TicketStuff, LampStuff, BottleStuff, JacketStuff, ScarfStuff, PencilStuff,
  NotebookStuff, HatStuff, CableStuff,
];
