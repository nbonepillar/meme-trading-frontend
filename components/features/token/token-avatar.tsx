import { memo, useState } from "react";
import { createPortal } from "react-dom";
import { formatAddress } from "@/lib/formatters";
import { useToastContext } from "@/contexts/ToastContext";

interface TokenAvatarProps {
  imageUrl: string;
  name: string;
  symbol: string;
  address: string;
}

const TokenAvatar = memo(({ imageUrl, name, symbol, address }: TokenAvatarProps) => {
  const [copySuccess, setCopySuccess] = useState(false);
  const [showZoom, setShowZoom] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const { success } = useToastContext();

  const handleCopyAddress = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      // Try modern clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(address);
        setCopySuccess(true);
        success('Address copied to clipboard!');
        setTimeout(() => setCopySuccess(false), 1000);
      } else {
        // Fallback for non-secure contexts (HTTP)
        const textArea = document.createElement('textarea');
        textArea.value = address;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          const successful = document.execCommand('copy');
          if (successful) {
            setCopySuccess(true);
            success('Address copied to clipboard!');
            setTimeout(() => setCopySuccess(false), 1000);
          } else {
            throw new Error('execCommand failed');
          }
        } finally {
          document.body.removeChild(textArea);
        }
      }
    } catch (err) {
      console.error('Failed to copy address:', err);
      success('Failed to copy address');
    }
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    console.log('[TokenAvatar] Mouse enter, position:', { x: rect.right, y: rect.bottom });
    setPosition({
      x: rect.right,
      y: rect.bottom
    });
    setShowZoom(true);
  };

  return (
    <>
      <div className="flex flex-col items-center gap-1 shrink-0">
        <div className="relative border-2 border-green-500 rounded-[9px] p-[3px]">
          <div 
            className="h-[70px] w-[70px] rounded-[6px] overflow-hidden bg-muted flex items-center justify-center cursor-pointer" 
            data-testid={`img-token-logo-${symbol}`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={() => {
              console.log('[TokenAvatar] Mouse leave');
              setShowZoom(false);
            }}
          >
            <img
              src={imageUrl}
              alt={name}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement!.textContent = symbol.slice(0, 2);
              }}
            />
          </div>
        </div>
        <div 
          onClick={handleCopyAddress}
          className="flex items-center gap-1 cursor-pointer group"
          title={copySuccess ? "Copied!" : "Click to copy address"}
        >
          <span 
            className={`text-[9px] font-mono transition-colors ${
              copySuccess ? 'text-green-400' : 'text-muted-foreground group-hover:text-white'
            }`}
            data-testid={`text-token-address-${symbol}`}
          >
            {formatAddress(address)}
          </span>
          {copySuccess ? (
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="10" 
              height="10" 
              viewBox="0 0 16 16" 
              fill="currentColor"
              className="text-green-400"
            >
              <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
            </svg>
          ) : (
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="10" 
              height="10" 
              viewBox="0 0 16 16" 
              fill="currentColor"
              className={`transition-colors ${
                copySuccess ? 'text-green-400' : 'text-muted-foreground group-hover:text-white'
              }`}
            >
              <path d="M4 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V2zm2-1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H6zM2 5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1h1v1a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1v1H2z"/>
            </svg>
          )}
        </div>
      </div>
      {showZoom && createPortal(
        <div 
          className="fixed pointer-events-none"
          style={{
            left: `${position.x - 35}px`,
            top: `${position.y - 35}px`,
            zIndex: 999999
          }}
        >
          <img
            src={imageUrl}
            alt={name}
            className="rounded-lg object-cover border-2 border-blue-400 shadow-2xl"
            style={{ 
              backgroundColor: 'rgb(17, 18, 20)',
              width: '350px',
              height: '350px'
            }}
            onLoad={() => console.log('[TokenAvatar] Zoom image loaded')}
          />
        </div>,
        document.body
      )}
    </>
  );
});

TokenAvatar.displayName = "TokenAvatar";

export default TokenAvatar;
