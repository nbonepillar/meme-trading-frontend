import { memo, useMemo } from "react";
import { useTimerStore } from "@/store/timerStore";

interface TokenTimerProps {
  timestamp: number;
  symbol: string;
  tokenAddress: string;
}

const TokenTimer = memo(({ timestamp, symbol, tokenAddress }: TokenTimerProps) => {
  const isVisible = useTimerStore((state) => state.isTokenVisible(tokenAddress));
  const now = useTimerStore((state) => state.now);

  const { time, color } = useMemo(() => {
    const diff = Math.floor((now - timestamp) / 1000);

    if (diff < 60) {
      return { time: `${diff}s`, color: 'text-green-500' };
    } else if (diff < 3600) {
      const minutes = Math.floor(diff / 60);
      return { time: `${minutes}m`, color: 'text-yellow-500' };
    } else if (diff < 86400) {
      const hours = Math.floor(diff / 3600);
      return { time: `${hours}h`, color: 'text-red-500' };
    } else {
      const days = Math.floor(diff / 86400);
      return { time: `${days}d`, color: 'text-muted-foreground' };
    }
  }, [now, timestamp, isVisible]);

  return (
    <span className={`text-sm font-mono font-semibold ${color}`} data-testid={`text-elapsed-time-${symbol}`}>
      {time}
    </span>
  );
});

TokenTimer.displayName = "TokenTimer";

export default TokenTimer;
