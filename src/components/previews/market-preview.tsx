"use client";

import { useState } from "react";
import { Chip, PreviewNotice } from "./frame";

const TABS = 6;

export function MarketPreview() {
  const [taken, setTaken] = useState(2);
  const [mine, setMine] = useState(false);
  const [shareMine, setShareMine] = useState(false);
  const sellerShared = true; // sample: the seller already opted in
  const revealed = mine && shareMine && sellerShared;

  return (
    <PreviewNotice stock="manila" stamp="For sale · Bike · $60 · North campus" title="Blue commuter bike, new brakes, lock included. Meet at the library desk." pinHue={250} rotate="-rotate-[0.4deg]">
      {!mine ? (
        <>
          <p className="text-xs text-muted-foreground">Take a tab to message the seller. Your email stays in your pocket.</p>
          <ul className="tear-tabs -mx-4" aria-label={`${TABS - taken} contact tabs left`}>
            {Array.from({ length: TABS }, (_, i) => (
              <li key={i} data-taken={i < taken ? "" : undefined}>
                {i >= taken ? (
                  <button
                    type="button"
                    className="w-full rounded-sm px-1 py-0.5 outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
                    onClick={() => {
                      setTaken((t) => t + 1);
                      setMine(true);
                    }}
                  >
                    take one
                  </button>
                ) : (
                  <span aria-hidden>take one</span>
                )}
              </li>
            ))}
          </ul>
        </>
      ) : (
        <div className="space-y-2 rounded-md border border-rule bg-[var(--card)] p-2.5">
          <p className="stamp">Relay thread · through the board</p>
          <p className="text-[13px]"><span className="font-mono text-[11px] text-muted-foreground">@jdoe01</span> Is the bike still available? I can do Thursday.</p>
          <p className="text-[13px]"><span className="font-mono text-[11px] text-muted-foreground">Seller</span> Yes. Library front desk at four?</p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Chip active={shareMine} pressed={shareMine} onClick={() => setShareMine((s) => !s)}>Share my email</Chip>
            <span className="text-xs text-muted-foreground">Seller: shared</span>
          </div>
          <p className="text-xs text-muted-foreground">{revealed ? "Both agreed: seller@hawk.illinoistech.edu is now visible to you." : "Addresses appear only when both of you agree."}</p>
        </div>
      )}
      <p className="mt-auto text-xs text-muted-foreground">No payments here. Meet at the MTCC Welcome Desk or the Tech Central lobby.</p>
    </PreviewNotice>
  );
}
