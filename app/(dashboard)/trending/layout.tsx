"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown } from "lucide-react";

const trendingTabs = [
  { label: "New pair", path: "/trending/new-pair" },
  { label: "Trending", path: "/trending" },
  { label: "Surge", path: "/trending/surge" },
  { label: "xStocks", path: "/trending/xstocks" },
  { label: "NextBC", path: "/trending/nextbc" },
  { label: "Pump Live", path: "/trending/pump-live" },
];

export default function TrendingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const pathname = usePathname();
  const router = useRouter();

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  // Check if tab is active
  const isTabActive = (tabPath: string) => {
    if (tabPath === "/trending") {
      return pathname === "/trending";
    }
    return pathname === tabPath;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Top bar - 60px height */}
      <div className="h-[60px] flex items-center px-6 gap-2" style={{ backgroundColor: 'rgb(12, 12, 15)' }}>
        {trendingTabs.map((tab) => {
          const isActive = isTabActive(tab.path);
          return (
            <Button
              key={tab.path}
              variant={isActive ? "secondary" : "ghost"}
              size="sm"
              className={`h-8 px-4 text-sm ${isActive ? "bg-accent text-accent-foreground" : ""}`}
              onClick={() => router.push(tab.path)}
            >
              {tab.label}
            </Button>
          );
        })}
      </div>

      {/* Second bar - 35px height - Sort buttons */}
      <div className="h-[35px] flex items-center relative" style={{ backgroundColor: 'rgb(12, 12, 15)', borderTop: '1px solid rgb(39, 40, 46)', borderBottom: '1px solid rgb(39, 40, 46)' }}>
        <div className="absolute left-0 w-[25%] px-3 flex items-center">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-[10px] font-medium flex items-center gap-1"
            onClick={() => handleSort("Total/Age")}
          >
            Token/Age
            <div className="flex flex-col">
              <ChevronUp className="h-2 w-2 -mb-1" />
              <ChevronDown className="h-2 w-2" />
            </div>
          </Button>
        </div>
        <div className="absolute left-[25%] w-[7%] px-1 flex items-center">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-1 text-[10px] font-medium flex items-center gap-0.5"
            onClick={() => handleSort("MC")}
          >
            MC
            <div className="flex flex-col">
              <ChevronUp className="h-2 w-2 -mb-1" />
              <ChevronDown className="h-2 w-2" />
            </div>
          </Button>
        </div>
        <div className="absolute left-[32%] w-[7%] px-1 flex items-center">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-1 text-[10px] font-medium flex items-center gap-0.5"
            onClick={() => handleSort("ATH MC")}
          >
            ATH MC
            <div className="flex flex-col">
              <ChevronUp className="h-2 w-2 -mb-1" />
              <ChevronDown className="h-2 w-2" />
            </div>
          </Button>
        </div>
        <div className="absolute left-[39%] w-[7%] px-1 flex items-center">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-1 text-[10px] font-medium flex items-center gap-0.5"
            onClick={() => handleSort("Liq")}
          >
            Liq
            <div className="flex flex-col">
              <ChevronUp className="h-2 w-2 -mb-1" />
              <ChevronDown className="h-2 w-2" />
            </div>
          </Button>
        </div>
        <div className="absolute left-[46%] w-[7%] px-1 flex items-center">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-1 text-[10px] font-medium flex items-center gap-0.5"
            onClick={() => handleSort("Vol")}
          >
            Vol
            <div className="flex flex-col">
              <ChevronUp className="h-2 w-2 -mb-1" />
              <ChevronDown className="h-2 w-2" />
            </div>
          </Button>
        </div>
        <div className="absolute left-[53%] w-[7%] px-1 flex items-center">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-1 text-[10px] font-medium flex items-center gap-0.5"
            onClick={() => handleSort("TXs")}
          >
            TXs
            <div className="flex flex-col">
              <ChevronUp className="h-2 w-2 -mb-1" />
              <ChevronDown className="h-2 w-2" />
            </div>
          </Button>
        </div>
        <div className="absolute left-[60%] w-[7%] px-1 flex items-center">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-1 text-[10px] font-medium flex items-center gap-0.5"
            onClick={() => handleSort("Holders")}
          >
            Holders
            <div className="flex flex-col">
              <ChevronUp className="h-2 w-2 -mb-1" />
              <ChevronDown className="h-2 w-2" />
            </div>
          </Button>
        </div>
        <div className="absolute left-[67%] w-[6%] px-1 flex items-center">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-1 text-[10px] font-medium flex items-center gap-0.5"
            onClick={() => handleSort("Total Fees")}
          >
            Fees
            <div className="flex flex-col">
              <ChevronUp className="h-2 w-2 -mb-1" />
              <ChevronDown className="h-2 w-2" />
            </div>
          </Button>
        </div>
        <div className="absolute left-[73%] w-[27%] px-1 flex items-center">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-1 text-[10px] font-medium flex items-center gap-0.5"
            onClick={() => handleSort("Token Info")}
          >
            Token Info
            <div className="flex flex-col">
              <ChevronUp className="h-2 w-2 -mb-1" />
              <ChevronDown className="h-2 w-2" />
            </div>
          </Button>
        </div>
      </div>

      {/* Main panel */}
      <div className="flex-1 overflow-hidden relative">
        {children}
      </div>
    </div>
  );
}
