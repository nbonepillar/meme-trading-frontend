import { memo } from "react";
import { Globe, MessageSquare, Send } from "lucide-react";

interface TokenSocialProps {
  xUrl: string | null;
  telegramUrl: string | null;
}

const TokenSocial = memo(({ xUrl, telegramUrl }: TokenSocialProps) => {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        className="w-4 h-4 flex items-center justify-center hover:opacity-70 transition-opacity"
        onClick={(e) => {
          e.stopPropagation();
          if (xUrl) window.open(xUrl, '_blank');
        }}
        disabled={!xUrl}
        title="X (Twitter)"
      >
        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      </button>

      <button
        type="button"
        className="w-4 h-4 flex items-center justify-center hover:opacity-70 transition-opacity"
        onClick={(e) => e.stopPropagation()}
        title="Website"
      >
        <Globe className="w-3 h-3" />
      </button>

      <button
        type="button"
        className="w-4 h-4 flex items-center justify-center hover:opacity-70 transition-opacity"
        onClick={(e) => {
          e.stopPropagation();
          if (telegramUrl) window.open(telegramUrl, '_blank');
        }}
        disabled={!telegramUrl}
        title="Telegram"
      >
        <Send className="w-3 h-3" />
      </button>

      <button
        type="button"
        className="w-4 h-4 flex items-center justify-center hover:opacity-70 transition-opacity"
        onClick={(e) => e.stopPropagation()}
        title="Message"
      >
        <MessageSquare className="w-3 h-3" />
      </button>
    </div>
  );
});

TokenSocial.displayName = "TokenSocial";

export default TokenSocial;
