'use client';

interface PriceDisplayProps {
  price: number | string | undefined;
  className?: string;
  showDebug?: boolean; // Option to display debugging information
  chainId?: number; // Chain ID to determine price formatting
}

export function PriceDisplay({ price, className = "", showDebug = false, chainId = 501 }: PriceDisplayProps) {
  // Debug logging
  if (showDebug) {
    console.log('[PriceDisplay] Rendering with price:', price, typeof price, 'chainId:', chainId);
  }
  
  if (!price || price === 0 || price === '0') return <span className={className}>0.00</span>;
  
  // Convert to number for comparison
  let priceNum = typeof price === 'string' ? parseFloat(price) : price;
  
  // For BNB (chainId = 0), divide by 1e9
  if (chainId === 0) {
    priceNum = priceNum / 1e9;
    if (showDebug) {
      console.log('[PriceDisplay] BNB price after division:', priceNum);
    }
  }
  
  // Convert to string, handling scientific notation
  let priceStr: string;
  if (chainId === 0) {
    // For BNB, use the divided value
    if (priceNum < 0.000001) {
      priceStr = priceNum.toFixed(20).replace(/\.?0+$/, '');
    } else {
      priceStr = priceNum.toString();
    }
  } else if (typeof price === 'string') {
    priceStr = price;
  } else {
    // For numbers, use toFixed to avoid scientific notation
    if (priceNum < 0.000001) {
      // For very small numbers, convert to fixed with enough decimals
      priceStr = priceNum.toFixed(20).replace(/\.?0+$/, ''); // Remove trailing zeros
    } else {
      priceStr = priceNum.toString();
    }
  }
  
  // For prices >= 0.01, show with max 5 decimal places
  if (priceNum >= 0.01) {
    const decimals = priceNum >= 1 ? 2 : Math.min(5, priceStr.split('.')[1]?.length || 2);
    return (
      <span className={className} title={showDebug ? `Original: ${price}, ChainId: ${chainId}` : undefined}>
        {priceNum.toFixed(decimals)}
      </span>
    );
  }
  
  // For very small prices, use gmgn format with subscript
  const decimalIndex = priceStr.indexOf('.');
  
  if (decimalIndex === -1) {
    return <span className={className}>{priceStr}</span>;
  }
  
  // Count leading zeros after decimal point
  let zeroCount = 0;
  for (let i = decimalIndex + 1; i < priceStr.length; i++) {
    if (priceStr[i] === '0') {
      zeroCount++;
    } else {
      break;
    }
  }
  
  // If 3 or more zeros, use gmgn format with subscript: 0.0₃16000
  if (zeroCount >= 3) {
    const significantPart = priceStr.substring(decimalIndex + 1 + zeroCount);
    // Take only first 5 significant digits
    const displayPart = significantPart.substring(0, 5);
    return (
      <span 
        className={className}
        title={showDebug ? `Original: ${price}, ChainId: ${chainId}, Zeros: ${zeroCount}, Significant: ${significantPart}` : undefined}
      >
        0.0<sub className="text-[10px]">{zeroCount}</sub>{displayPart}
      </span>
    );
  }
  
  // Otherwise show normally with max 5 decimal places
  const decimalPart = priceStr.substring(decimalIndex + 1);
  const limitedDecimal = decimalPart.substring(0, 5);
  return (
    <span className={className} title={showDebug ? `Original: ${price}, ChainId: ${chainId}` : undefined}>
      {priceStr.substring(0, decimalIndex + 1)}{limitedDecimal}
    </span>
  );
}