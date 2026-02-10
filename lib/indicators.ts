// Local type definition
interface CandleData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MAData {
    time: number;
    value: number;
}

export interface EMAData {
  time: number;
  value: number;
}

export interface ATRData {
  time: number;
  value: number;
}

export interface BollingerBandsData {
  time: number;
  upper: number;
  middle: number;
  lower: number;
}

export interface MACDData {
  time: number;
  macd: number;
  signal: number;
  histogram: number;
}

export interface RSIData {
  time: number;
  value: number;
}

export interface StochasticRSIData {
  time: number;
  k: number;
  d: number;
}

export function calculateMA(candles: CandleData[], period: number): MAData[] {
  if (candles.length < period) return [];
  
  const maData: MAData[] = [];
  
  for (let i = period - 1; i < candles.length; i++) {
    let sum = 0;
    
    for (let j = i - period + 1; j <= i; j++) {
      sum += candles[j].close;
    }
    
    const average = sum / period;
    
    maData.push({
      time: Math.floor(candles[i].timestamp / 1000),
      value: average
    });
  }
  
  return maData;
}

// Exponential Moving Average
export function calculateEMA(candles: CandleData[], period: number): EMAData[] {
  if (candles.length < period) return [];
  
  const emaData: EMAData[] = [];
  const multiplier = 2 / (period + 1);
  
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += candles[i].close;
  }
  let ema = sum / period;
  
  emaData.push({
    time: Math.floor(candles[period - 1].timestamp / 1000),
    value: ema
  });
  
  for (let i = period; i < candles.length; i++) {
    ema = (candles[i].close * multiplier) + (ema * (1 - multiplier));
    
    emaData.push({
      time: Math.floor(candles[i].timestamp / 1000),
      value: ema
    });
  }
  
  return emaData;
}

// Average True Range (ATR)
export function calculateATR(candles: CandleData[], period: number = 14): ATRData[] {
  if (candles.length < period + 1) return [];
  
  const trueRanges: number[] = [];
  const atrData: ATRData[] = [];
  
  // Calculate True Range for each candle (starting from index 1)
  for (let i = 1; i < candles.length; i++) {
    const current = candles[i];
    const previous = candles[i - 1];
    
    // True Range = MAX of:
    // 1. High - Low
    // 2. |High - Previous Close|
    // 3. |Low - Previous Close|
    const tr1 = current.high - current.low;
    const tr2 = Math.abs(current.high - previous.close);
    const tr3 = Math.abs(current.low - previous.close);
    
    const trueRange = Math.max(tr1, tr2, tr3);
    trueRanges.push(trueRange);
  }
  
  // Calculate ATR using EMA of True Range
  if (trueRanges.length < period) return [];
  
  const multiplier = 2 / (period + 1);
  
  // First ATR is SMA of first 'period' true ranges
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += trueRanges[i];
  }
  let atr = sum / period;
  
  atrData.push({
    time: Math.floor(candles[period].timestamp / 1000), // period + 1 because we start TR from index 1
    value: atr
  });
  
  // Calculate remaining ATR values using EMA
  for (let i = period; i < trueRanges.length; i++) {
    atr = (trueRanges[i] * multiplier) + (atr * (1 - multiplier));
    
    atrData.push({
      time: Math.floor(candles[i + 1].timestamp / 1000), // i + 1 because TR array is offset by 1
      value: atr
    });
  }
  
  return atrData;
}

export function calculateMultipleMA(candles: CandleData[], periods: number[]) {
  const result: { [key: string]: MAData[] } = {};
  
  periods.forEach(period => {
    result[`MA${period}`] = calculateMA(candles, period);
  });
  
  return result;
}

export function calculateMultipleEMA(candles: CandleData[], periods: number[]) {
  const result: { [key: string]: EMAData[] } = {};
  
  periods.forEach(period => {
    result[`EMA${period}`] = calculateEMA(candles, period);
  });
  
  return result;
}

// Bollinger Bands
export function calculateBollingerBands(candles: CandleData[], period: number = 20, multiplier: number = 2): BollingerBandsData[] {
  if (candles.length < period) return [];
  
  const bollingerData: BollingerBandsData[] = [];
  
  for (let i = period - 1; i < candles.length; i++) {
    // Calculate SMA (Middle Band)
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) {
      sum += candles[j].close;
    }
    const sma = sum / period;
    
    // Calculate Standard Deviation
    let variance = 0;
    for (let j = i - period + 1; j <= i; j++) {
      variance += Math.pow(candles[j].close - sma, 2);
    }
    const stdDev = Math.sqrt(variance / period);
    
    // Calculate Upper and Lower Bands
    const upper = sma + (stdDev * multiplier);
    const lower = sma - (stdDev * multiplier);
    
    bollingerData.push({
      time: Math.floor(candles[i].timestamp / 1000),
      upper,
      middle: sma,
      lower
    });
  }
  
  return bollingerData;
}

// MACD (Moving Average Convergence Divergence)
export function calculateMACD(candles: CandleData[], fastPeriod: number = 12, slowPeriod: number = 26, signalPeriod: number = 9): MACDData[] {
  if (candles.length < slowPeriod + signalPeriod) return [];
  
  // Calculate EMAs
  const fastEMA = calculateEMA(candles, fastPeriod);
  const slowEMA = calculateEMA(candles, slowPeriod);
  
  if (fastEMA.length === 0 || slowEMA.length === 0) return [];
  
  // Calculate MACD Line
  const macdLine: { time: number; value: number }[] = [];
  const minLength = Math.min(fastEMA.length, slowEMA.length);
  
  for (let i = 0; i < minLength; i++) {
    if (fastEMA[i].time === slowEMA[i].time) {
      macdLine.push({
        time: fastEMA[i].time,
        value: fastEMA[i].value - slowEMA[i].value
      });
    }
  }
  
  // Calculate Signal Line (EMA of MACD)
  const signalEMA = calculateEMAFromValues(macdLine, signalPeriod);
  
  // Combine MACD, Signal, and Histogram
  const macdData: MACDData[] = [];
  const signalStartIndex = signalPeriod - 1;
  
  for (let i = signalStartIndex; i < macdLine.length && i - signalStartIndex < signalEMA.length; i++) {
    const macdValue = macdLine[i].value;
    const signalValue = signalEMA[i - signalStartIndex].value;
    
    macdData.push({
      time: macdLine[i].time,
      macd: macdValue,
      signal: signalValue,
      histogram: macdValue - signalValue
    });
  }
  
  return macdData;
}

// Helper function for MACD signal calculation
function calculateEMAFromValues(values: { time: number; value: number }[], period: number) {
  if (values.length < period) return [];
  
  const emaData: { time: number; value: number }[] = [];
  const multiplier = 2 / (period + 1);
  
  // First EMA is SMA
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += values[i].value;
  }
  let ema = sum / period;
  
  emaData.push({
    time: values[period - 1].time,
    value: ema
  });
  
  // Calculate remaining EMAs
  for (let i = period; i < values.length; i++) {
    ema = (values[i].value * multiplier) + (ema * (1 - multiplier));
    emaData.push({
      time: values[i].time,
      value: ema
    });
  }
  
  return emaData;
}

// RSI (Relative Strength Index)
export function calculateRSI(candles: CandleData[], period: number = 14): RSIData[] {
  if (candles.length < period + 1) return [];
  
  const rsiData: RSIData[] = [];
  const gains: number[] = [];
  const losses: number[] = [];
  
  // Calculate gains and losses
  for (let i = 1; i < candles.length; i++) {
    const change = candles[i].close - candles[i - 1].close;
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);
  }
  
  if (gains.length < period) return [];
  
  // Calculate first RS and RSI (using SMA)
  let avgGain = gains.slice(0, period).reduce((sum, gain) => sum + gain, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((sum, loss) => sum + loss, 0) / period;
  
  let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  let rsi = 100 - (100 / (1 + rs));
  
  rsiData.push({
    time: Math.floor(candles[period].timestamp / 1000),
    value: rsi
  });
  
  // Calculate remaining RSI values (using EMA)
  for (let i = period; i < gains.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
    
    rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    rsi = 100 - (100 / (1 + rs));
    
    rsiData.push({
      time: Math.floor(candles[i + 1].timestamp / 1000),
      value: rsi
    });
  }
  
  return rsiData;
}

// Stochastic RSI
export function calculateStochasticRSI(candles: CandleData[], rsiPeriod: number = 14, stochPeriod: number = 14, kPeriod: number = 3, dPeriod: number = 3): StochasticRSIData[] {
  // First calculate RSI
  const rsiData = calculateRSI(candles, rsiPeriod);
  if (rsiData.length < stochPeriod) return [];
  
  const stochRSIData: StochasticRSIData[] = [];
  
  // Calculate Stochastic RSI
  for (let i = stochPeriod - 1; i < rsiData.length; i++) {
    const rsiSlice = rsiData.slice(i - stochPeriod + 1, i + 1);
    const rsiHigh = Math.max(...rsiSlice.map(r => r.value));
    const rsiLow = Math.min(...rsiSlice.map(r => r.value));
    
    const stochRSI = rsiHigh === rsiLow ? 0 : (rsiData[i].value - rsiLow) / (rsiHigh - rsiLow);
    
    stochRSIData.push({
      time: rsiData[i].time,
      k: stochRSI,
      d: stochRSI // Will be smoothed later
    });
  }
  
  // Smooth %K
  if (stochRSIData.length >= kPeriod) {
    for (let i = kPeriod - 1; i < stochRSIData.length; i++) {
      let sum = 0;
      for (let j = i - kPeriod + 1; j <= i; j++) {
        sum += stochRSIData[j].k;
      }
      stochRSIData[i].k = sum / kPeriod;
    }
  }
  
  // Smooth %D
  if (stochRSIData.length >= dPeriod) {
    for (let i = dPeriod - 1; i < stochRSIData.length; i++) {
      let sum = 0;
      for (let j = i - dPeriod + 1; j <= i; j++) {
        sum += stochRSIData[j].k;
      }
      stochRSIData[i].d = sum / dPeriod;
    }
  }
  
  return stochRSIData;
}

// Calculate multiple ATR periods at once
export function calculateMultipleATR(candles: CandleData[], periods: number[]) {
  const result: { [key: string]: ATRData[] } = {};
  
  periods.forEach(period => {
    result[`ATR${period}`] = calculateATR(candles, period);
  });
  
  return result;
}

export function calculateAllIndicators(candles: CandleData[], periods: number[]) {
  return {
    ma: calculateMultipleMA(candles, periods),
    ema: calculateMultipleEMA(candles, periods),
    atr: calculateMultipleATR(candles, periods),
    bollinger: calculateBollingerBands(candles, 20, 2),
    macd: calculateMACD(candles, 12, 26, 9),
    rsi: calculateRSI(candles, 14),
    stochRsi: calculateStochasticRSI(candles, 14, 14, 3, 3)
  };
}