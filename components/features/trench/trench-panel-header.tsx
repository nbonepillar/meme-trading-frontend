"use client";

import { Search, Play, Pause } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/store/uiStore";

interface TrenchPanelHeaderProps {
    title: string;
    isPaused?: boolean;
}

export default function TrenchPanelHeader({ title, isPaused = false }: TrenchPanelHeaderProps) {
    const quickBuyAmount = useUIStore((state) => state.quickBuyAmount);
    const setQuickBuyAmount = useUIStore((state) => state.setQuickBuyAmount);

    return (
        <div className="h-[35px] flex items-center justify-between px-4" style={{ borderBottom: '1px solid rgb(39, 40, 46)' }}>
            <span className="text-sm font-medium">{title}</span>

            <div className="flex items-center gap-1">

                {/* Icon Buttons */}
                <div className="flex items-center gap-1 ml-2">
                    {/* Play/Pause Icon */}
                    {isPaused ? (
                        <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 text-yellow-500"
                            aria-label="Paused"
                        >
                            <Pause className="h-3.5 w-3.5 fill-current" />
                        </Button>
                    ) : (
                        <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 text-green-500"
                            aria-label="Playing"
                        >
                            <Play className="h-3.5 w-3.5 fill-current" />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
