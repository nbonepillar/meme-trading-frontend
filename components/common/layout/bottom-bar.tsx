"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

const bottomBarTabs = [
  "Wallet Tracker",
  "X Tracker",
  "Holding",
  "Watchlist",
  "Trade",
  "Trending",
  "Rank",
  "Pnl",
  "Signal"
];

export default function BottomBar() {
  const [activeTabs, setActiveTabs] = useState<Set<string>>(new Set());

  const toggleTab = (tab: string) => {
    setActiveTabs((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(tab)) {
        newSet.delete(tab);
      } else {
        newSet.add(tab);
      }
      return newSet;
    });
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 h-[30px] z-40 flex items-center px-6" style={{ backgroundColor: 'rgb(12, 12, 15)', borderTop: '1px solid rgb(39, 40, 46)' }}>
      <div className="flex items-center gap-1">
        {bottomBarTabs.map((tab) => {
          const isActive = activeTabs.has(tab);
          return (
            <Button
              key={tab}
              variant={isActive ? "secondary" : "ghost"}
              size="sm"
              className={`h-6 px-3 text-[11px] ${isActive ? "bg-accent text-accent-foreground" : ""}`}
              onClick={() => toggleTab(tab)}
            >
              {tab}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
