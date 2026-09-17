"use client";

import {
  BackpackIcon,
  BikeIcon,
  BookIcon,
  BusIcon,
  CableIcon,
  CalculatorIcon,
  CoffeeIcon,
  DumbbellIcon,
  FlaskConicalIcon,
  GlassesIcon,
  GraduationCapIcon,
  HeadphonesIcon,
  KeyRoundIcon,
  LampDeskIcon,
  LaptopIcon,
  MicroscopeIcon,
  MusicIcon,
  PaletteIcon,
  PizzaIcon,
  PrinterIcon,
  RulerIcon,
  ShirtIcon,
  TicketIcon,
  UmbrellaIcon,
  WalletIcon,
  WatchIcon,
} from "lucide-react";
import { IconCloud } from "@/components/ui/icon-cloud";

const icons = [
  KeyRoundIcon, UmbrellaIcon, CalculatorIcon, HeadphonesIcon, BikeIcon, LaptopIcon, CableIcon, WalletIcon, BackpackIcon,
  BookIcon, CoffeeIcon, WatchIcon, GlassesIcon, TicketIcon, LampDeskIcon, PrinterIcon, RulerIcon, ShirtIcon, PizzaIcon,
  BusIcon, DumbbellIcon, FlaskConicalIcon, MicroscopeIcon, MusicIcon, PaletteIcon, GraduationCapIcon,
];

/** The stuff of campus life: what gets lost, lent, found, and passed on. Drag to spin. */
export function CampusIconCloud() {
  return (
    <div className="relative mx-auto flex size-[24rem] items-center justify-center overflow-hidden text-foreground" aria-hidden>
      <IconCloud showControl={false} icons={icons.map((Icon, i) => <Icon key={i} size={64} strokeWidth={1.6} color="currentColor" />)} />
    </div>
  );
}
