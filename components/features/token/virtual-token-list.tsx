import { useRef, memo, useEffect } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import TrenchTokenCard, { type TrenchTokenData } from "@/components/features/trench/trench-token-card";
import { useTimerStore } from "@/store/timerStore";

interface VirtualTokenListProps {
  tokens: TrenchTokenData[];
  onHoverChange?: (isHovered: boolean) => void;
  panelId: string;
}

const VirtualTokenList = memo(({ tokens, onHoverChange, panelId }: VirtualTokenListProps) => {
  const parentRef = useRef<HTMLDivElement>(null);
  const setVisibleTokens = useTimerStore((state) => state.setVisibleTokens);

  const virtualizer = useVirtualizer({
    count: tokens.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 120,
    overscan: 2,
  });

  const virtualItems = virtualizer.getVirtualItems();

  // Update visible tokens whenever virtual items change
  useEffect(() => {
    if (virtualItems.length > 0 && tokens.length > 0) {
      const visibleAddresses = virtualItems
        .filter(item => item.index < tokens.length)
        .map(item => tokens[item.index]?.tokenAddress)
        .filter(Boolean);
      
      if (visibleAddresses.length > 0) {
        setVisibleTokens(panelId, visibleAddresses);
      }
    }
  }, [virtualItems, tokens.length, setVisibleTokens, panelId]);

  return (
    <div 
      ref={parentRef} 
      className="flex-1 overflow-y-auto overflow-x-hidden"
      onMouseEnter={() => onHoverChange?.(true)}
      onMouseLeave={() => onHoverChange?.(false)}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {virtualItems.map((virtualItem) => {
          const token = tokens[virtualItem.index];
          return (
            <div
              key={token.tokenAddress}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <TrenchTokenCard token={token} />
            </div>
          );
        })}
      </div>
    </div>
  );
});

VirtualTokenList.displayName = "VirtualTokenList";

export default VirtualTokenList;
