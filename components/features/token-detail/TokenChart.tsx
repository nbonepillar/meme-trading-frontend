'use client';

import { memo, useEffect, useRef, useState, useMemo } from 'react';
import { 
  createChart, 
  IChartApi, 
  CandlestickSeries, 
  HistogramSeries,
  LineSeries,
  CandlestickData, 
  HistogramData,
  LineData,
  CrosshairMode,
  ISeriesApi
} from 'lightweight-charts';
import { useTokenDetailContext } from './TokenDetailContext';
import { calculateAllIndicators } from '@/lib/indicators';
import { subscribeToChartData } from '@/lib/chart-websocket';
import { useChartDataStore, KlineData } from '@/store/chartDataStore';
import { useUIStore } from '@/store/uiStore';
import IndicatorModal from './IndicatorModal';

const TokenChart = memo(function TokenChart() {
  const { tokenData, selectedTimeframe, onTimeframeChange } = useTokenDetailContext();
  const { selectedChainId } = useUIStore();
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  
  // Extract only the address to avoid re-renders when other tokenData fields change
  const tokenAddress = tokenData?.address;
  
  // Chart Data Store
  const {
    klines,
    isLoading,
    error,
    setChartData,
    setLoading,
    setError,
    clearData
  } = useChartDataStore();
  
  // MA Series refs
  const ma5SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const ma20SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const ma50SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  
  // EMA Series refs
  const ema5SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const ema20SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const ema50SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  
  // ATR Chart and Series refs
  const atr14SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const atr21SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);

  // Bollinger Bands refs
  const bollingerUpperRef = useRef<ISeriesApi<'Line'> | null>(null);
  const bollingerMiddleRef = useRef<ISeriesApi<'Line'> | null>(null);
  const bollingerLowerRef = useRef<ISeriesApi<'Line'> | null>(null);

  // MACD refs
  const macdLineRef = useRef<ISeriesApi<'Line'> | null>(null);
  const macdSignalRef = useRef<ISeriesApi<'Line'> | null>(null);
  const macdHistogramRef = useRef<ISeriesApi<'Histogram'> | null>(null);

  // RSI refs
  const rsiLineRef = useRef<ISeriesApi<'Line'> | null>(null);
  const rsiUpperLineRef = useRef<ISeriesApi<'Line'> | null>(null);
  const rsiLowerLineRef = useRef<ISeriesApi<'Line'> | null>(null);

  // Stochastic RSI refs
  const stochRsiKRef = useRef<ISeriesApi<'Line'> | null>(null);
  const stochRsiDRef = useRef<ISeriesApi<'Line'> | null>(null);
  
  const [isClient, setIsClient] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>('disconnected');
  const [userInteracted, setUserInteracted] = useState(false);

  const [showIndicators, setShowIndicators] = useState({
    MA5: true,
    MA20: true,
    MA50: false,
    EMA5: false,
    EMA20: false,
    EMA50: false,
    ATR14: false,
    ATR21: false,
    bollinger: false,
    macd: false,
    rsi: false,
    stochRsi: false
  });

  const [showIndicatorModal, setShowIndicatorModal] = useState(false);

  const calculatePanelLayout = () => {
    const activeIndicators: string[] = [];
    if (showIndicators.ATR14 || showIndicators.ATR21) activeIndicators.push('atr');
    if (showIndicators.rsi) activeIndicators.push('rsi');
    if (showIndicators.stochRsi) activeIndicators.push('stochRsi');
    if (showIndicators.macd) activeIndicators.push('macd');

    const mainPanelHeight = 0.6;
    const volumeHeight = 0.15;
    const indicatorPanelHeight = activeIndicators.length > 0 ? (0.25 / activeIndicators.length) : 0;

    return {
      main: { top: 0, bottom: mainPanelHeight + volumeHeight },
      volume: { top: mainPanelHeight, bottom: volumeHeight },
      indicators: activeIndicators.map((indicator, index) => ({
        id: indicator,
        top: mainPanelHeight + volumeHeight + (index * indicatorPanelHeight),
        bottom: indicatorPanelHeight
      }))
    };
  };

  const updatePanelLayout = () => {
    if (!chartRef.current) return;

    const activeIndicators: string[] = [];
    if (showIndicators.ATR14 || showIndicators.ATR21) activeIndicators.push('atr');
    if (showIndicators.rsi) activeIndicators.push('rsi');
    if (showIndicators.stochRsi) activeIndicators.push('stochRsi');
    if (showIndicators.macd) activeIndicators.push('macd');

    if (activeIndicators.length === 0) {
      // No indicators: original layout (main chart + volume only)
      chartRef.current.priceScale('right').applyOptions({
        scaleMargins: {
          top: 0.05,
          bottom: 0.25,
        },
      });

      chartRef.current.priceScale('volume').applyOptions({
        scaleMargins: {
          top: 0.75,
          bottom: 0,
        },
      });
    } else {
      // Dynamically adjust height based on indicator count
      const indicatorCount = activeIndicators.length;
      const indicatorHeight = Math.min(0.15, 0.3 / indicatorCount); // Max 15%, reduce if many indicators
      
      // Main chart: fixed 50%
      chartRef.current.priceScale('right').applyOptions({
        scaleMargins: {
          top: 0.05,
          bottom: 0.5,
        },
      });

      // Volume: 50% ~ 70% (20%)
      chartRef.current.priceScale('volume').applyOptions({
        scaleMargins: {
          top: 0.5,
          bottom: 0.3,
        },
      });

      // Place each indicator sequentially starting from 70%
      activeIndicators.forEach((indicator, index) => {
        const startPosition = 0.7 + (index * indicatorHeight);
        const endPosition = Math.min(0.95, startPosition + indicatorHeight); // Max 95% only
        
        const topMargin = Math.min(0.95, startPosition); // Limit to not exceed 1
        const bottomMargin = Math.max(0.05, 1.0 - endPosition); // Limit to not go below 0

        console.log(`${indicator}: top=${topMargin}, bottom=${bottomMargin}, index=${index}`);

        chartRef.current!.priceScale(indicator).applyOptions({
          scaleMargins: {
            top: topMargin,
            bottom: bottomMargin,
          },
          visible: true,
        });
      });
    }

    // Hide inactive indicators
    const allIndicators = ['atr', 'macd', 'rsi', 'stochRsi'];
    allIndicators.forEach(indicator => {
      if (!activeIndicators.includes(indicator)) {
        chartRef.current!.priceScale(indicator).applyOptions({
          visible: false,
        });
      }
    });
  };

  const timeframes = [
    { label: '1m', value: '1m' },
    { label: '5m', value: '5m' },
    { label: '15m', value: '15m' },
    { label: '30m', value: '30m' },
    { label: '1h', value: '1h' },
    { label: '4h', value: '4h' },
    { label: '12h', value: '12h' },
    { label: '24h', value: '24h' },
  ];

  // Setup client-side rendering
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Setup WebSocket for chart data (both initial and real-time)
  useEffect(() => {
    if (!tokenAddress || !isClient) return;
    
    console.log('[TokenChart] 🚀 Setting up WebSocket for chart data');
    setLoading(true);
    setError(null);
    
    const unsubscribe = subscribeToChartData(
      `chart-${tokenAddress}`,
      tokenAddress,
      selectedChainId, // Use selected chain ID from UIStore
      selectedTimeframe, // interval
      (klineData: KlineData) => {
        console.log('[TokenChart] Received real-time kline update:', klineData);
      },
      (connected: boolean) => {
        console.log('[TokenChart] WebSocket connection status:', connected);
        setConnectionStatus(connected ? 'connected' : 'disconnected');
        setIsConnected(connected);
        if (connected) {
          setError(null);
        } else {
          setError('WebSocket disconnected');
        }
      }
    );
    
    return () => {
      console.log('[TokenChart] 🧹 Cleaning up WebSocket and clearing chart data');
      unsubscribe();
      // Clear chart data when leaving token detail page
      clearData();
      setConnectionStatus('disconnected');
      setIsConnected(false);
    };
  }, [tokenAddress, isClient, selectedTimeframe, selectedChainId, clearData, setLoading, setError]);

  // Initialize chart once
  useEffect(() => {
    if (!isClient || !chartContainerRef.current || !tokenAddress) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
      layout: {
        background: { color: 'rgb(17, 18, 20)' },
        textColor: '#888888',
      },
      grid: {
        vertLines: { color: '#1a1a1a' },
        horzLines: { color: '#1a1a1a' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: '#666666',
          style: 0,
          width: 1,
          labelVisible: true,
        },
        horzLine: {
          color: '#666666',
          style: 0,
          width: 1,
          labelVisible: true,
        },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: true,
        borderColor: 'transparent',
        rightOffset: 0,
        barSpacing: 6,
        fixLeftEdge: false,
        fixRightEdge: false,
        lockVisibleTimeRangeOnResize: false,
        shiftVisibleRangeOnNewBar: false,
      },
      rightPriceScale: {
        borderColor: 'transparent',
        scaleMargins: {
          top: 0.1,
          bottom: 0.4,
        },
        minimumWidth: 80,
      },
    });

    // v5.0 API: Use addSeries with series type parameter
    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: 'rgb(134, 217, 159)',
      downColor: 'rgb(242, 102, 130)',
      borderDownColor: 'rgb(242, 102, 130)',
      borderUpColor: 'rgb(134, 217, 159)',
      wickDownColor: 'rgb(242, 102, 130)',
      wickUpColor: 'rgb(134, 217, 159)',
      priceFormat: {
        type: 'price',
        precision: 9, // SOL precision (9 decimal places)
        minMove: 0.000000001, // 1 lamport = 0.000000001 SOL
      },
    });

    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: 'rgb(75, 118, 90)',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: 'volume',
    });

    // MA Series creation with v5.0 API
    const ma5Series = chart.addSeries(LineSeries, {
      color: '#FF6B6B',
      lineWidth: 2,
      title: 'MA5',
      visible: false,
      priceLineVisible: false,
      lastValueVisible: false,
    });

    const ma20Series = chart.addSeries(LineSeries, {
      color: '#4ECDC4',
      lineWidth: 2,
      title: 'MA20',
      visible: false,
      priceLineVisible: false,
      lastValueVisible: false,
    });

    const ma50Series = chart.addSeries(LineSeries, {
      color: '#45B7D1',
      lineWidth: 2,
      title: 'MA50',
      visible: false,
      priceLineVisible: false,
      lastValueVisible: false,
    });

    const ema5Series = chart.addSeries(LineSeries, {
      color: '#FF9F43',
      lineWidth: 2,
      lineStyle: 2,
      title: 'EMA5',
      visible: false,
      priceLineVisible: false,
      lastValueVisible: false,
    });

    const ema20Series = chart.addSeries(LineSeries, {
      color: '#26de81',
      lineWidth: 2,
      lineStyle: 2,
      title: 'EMA20',
      visible: false,
      priceLineVisible: false,
      lastValueVisible: false,
    });

    const ema50Series = chart.addSeries(LineSeries, {
      color: '#a55eea',
      lineWidth: 2,
      lineStyle: 2,
      title: 'EMA50',
      visible: false,
      priceLineVisible: false,
      lastValueVisible: false,
    });

    const atr14Series = chart.addSeries(LineSeries, {
      color: '#FFA726',
      lineWidth: 2,
      title: 'ATR14',
      visible: false,
      priceLineVisible: false,
      lastValueVisible: true,
      priceScaleId: 'atr',
    });

    const atr21Series = chart.addSeries(LineSeries, {
      color: '#AB47BC',
      lineWidth: 2,
      title: 'ATR21',
      visible: false,
      priceLineVisible: false,
      lastValueVisible: true,
      priceScaleId: 'atr',
    });

    // Bollinger Bands Series (main chart overlay)
    const bollingerUpper = chart.addSeries(LineSeries, {
      color: 'rgba(255, 0, 0, 0.6)',
      lineWidth: 1,
      title: 'BB Upper',
      visible: false,
      priceLineVisible: false,
      lastValueVisible: false,
    });

    const bollingerMiddle = chart.addSeries(LineSeries, {
      color: '#FFD700',
      lineWidth: 1,
      title: 'BB Middle',
      visible: false,
      priceLineVisible: false,
      lastValueVisible: false,
    });

    const bollingerLower = chart.addSeries(LineSeries, {
      color: 'rgba(0, 255, 0, 0.6)',
      lineWidth: 1,
      title: 'BB Lower',
      visible: false,
      priceLineVisible: false,
      lastValueVisible: false,
    });

    // MACD Series
    const macdLine = chart.addSeries(LineSeries, {
      color: '#00BFFF',
      lineWidth: 2,
      title: 'MACD',
      visible: false,
      priceLineVisible: false,
      lastValueVisible: true,
      priceScaleId: 'macd',
    });

    const macdSignal = chart.addSeries(LineSeries, {
      color: '#FF6347',
      lineWidth: 2,
      title: 'Signal',
      visible: false,
      priceLineVisible: false,
      lastValueVisible: true,
      priceScaleId: 'macd',
    });

    const macdHistogram = chart.addSeries(HistogramSeries, {
      color: '#32CD32',
      title: 'Histogram',
      visible: false,
      priceScaleId: 'macd',
    });

    // RSI Series
    const rsiLine = chart.addSeries(LineSeries, {
      color: '#9370DB',
      lineWidth: 2,
      title: 'RSI',
      visible: false,
      priceLineVisible: false,
      lastValueVisible: true,
      priceScaleId: 'rsi',
    });

    // RSI horizontal lines (30, 70)
    const rsiUpperLine = chart.addSeries(LineSeries, {
      color: 'rgba(255, 0, 0, 0.3)',
      lineWidth: 1,
      title: 'RSI 70',
      visible: false,
      priceLineVisible: false,
      lastValueVisible: false,
      priceScaleId: 'rsi',
    });

    const rsiLowerLine = chart.addSeries(LineSeries, {
      color: 'rgba(0, 255, 0, 0.3)',
      lineWidth: 1,
      title: 'RSI 30',
      visible: false,
      priceLineVisible: false,
      lastValueVisible: false,
      priceScaleId: 'rsi',
    });

    // Stochastic RSI Series
    const stochRsiK = chart.addSeries(LineSeries, {
      color: '#FF1493',
      lineWidth: 2,
      title: '%K',
      visible: false,
      priceLineVisible: false,
      lastValueVisible: true,
      priceScaleId: 'stochRsi',
    });

    const stochRsiD = chart.addSeries(LineSeries, {
      color: '#00CED1',
      lineWidth: 2,
      title: '%D',
      visible: false,
      priceLineVisible: false,
      lastValueVisible: true,
      priceScaleId: 'stochRsi',
    });

    // Initial layout: main chart + volume only (no indicators)
    chart.priceScale('right').applyOptions({
      borderColor: 'transparent',
      scaleMargins: {
        top: 0.05,
        bottom: 0.25, // Space for volume
      },
      minimumWidth: 80,
    });

    // Volume price scale
    chart.priceScale('volume').applyOptions({
      borderColor: 'transparent',
      scaleMargins: {
        top: 0.75, // Main chart 75%
        bottom: 0, // Volume 25%
      },
    });

    // Indicator price scales (initially hidden)
    chart.priceScale('atr').applyOptions({
      borderColor: 'transparent',
      scaleMargins: {
        top: 0.9,
        bottom: 0.05,
      },
      visible: false,
    });

    chart.priceScale('macd').applyOptions({
      borderColor: 'transparent',
      scaleMargins: {
        top: 0.9,
        bottom: 0.05,
      },
      visible: false,
    });

    chart.priceScale('rsi').applyOptions({
      borderColor: 'transparent',
      scaleMargins: {
        top: 0.9,
        bottom: 0.05,
      },
      visible: false,
    });

    chart.priceScale('stochRsi').applyOptions({
      borderColor: 'transparent',
      scaleMargins: {
        top: 0.9,
        bottom: 0.05,
      },
      visible: false,
    });

    // Store references
    chartRef.current = chart;
    candlestickSeriesRef.current = candlestickSeries;
    volumeSeriesRef.current = volumeSeries;
    ma5SeriesRef.current = ma5Series;
    ma20SeriesRef.current = ma20Series;
    ma50SeriesRef.current = ma50Series;
    ema5SeriesRef.current = ema5Series;
    ema20SeriesRef.current = ema20Series;
    ema50SeriesRef.current = ema50Series;
    atr14SeriesRef.current = atr14Series;
    atr21SeriesRef.current = atr21Series;
    bollingerUpperRef.current = bollingerUpper;
    bollingerMiddleRef.current = bollingerMiddle;
    bollingerLowerRef.current = bollingerLower;
    macdLineRef.current = macdLine;
    macdSignalRef.current = macdSignal;
    macdHistogramRef.current = macdHistogram;
    rsiLineRef.current = rsiLine;
    rsiUpperLineRef.current = rsiUpperLine;
    rsiLowerLineRef.current = rsiLowerLine;
    stochRsiKRef.current = stochRsiK;
    stochRsiDRef.current = stochRsiD;

    const chartContainer = chartContainerRef.current;
    
    const handleMouseDown = () => {
      setUserInteracted(true);
    };

    const handleWheel = () => {
      setUserInteracted(true);
    };

    const handleTouchStart = () => {
      setUserInteracted(true);
    };

    if (chartContainer) {
      chartContainer.addEventListener('mousedown', handleMouseDown);
      chartContainer.addEventListener('wheel', handleWheel);
      chartContainer.addEventListener('touchstart', handleTouchStart);
    }

    chart.timeScale().subscribeVisibleTimeRangeChange(() => {
      setUserInteracted(true);
    });

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        const newWidth = chartContainerRef.current.clientWidth;
        const newHeight = chartContainerRef.current.clientHeight;
        
        console.log('Manual resize triggered:', { newWidth, newHeight });
        
        chartRef.current.applyOptions({
          width: newWidth,
          height: newHeight,
        });
      }
    };

    // ResizeObserver for more accurate resize detection
    let resizeObserver: ResizeObserver | null = null;
    
    if (chartContainerRef.current) {
      resizeObserver = new ResizeObserver((entries) => {
        console.log('ResizeObserver triggered, entries:', entries.length);
        
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          console.log('ResizeObserver size change:', { width, height });
          
          if (chartRef.current && width > 0 && height > 0) {
            console.log('Applying chart resize:', { width: Math.floor(width), height: Math.floor(height) });
            
            chartRef.current.applyOptions({
              width: Math.floor(width),
              height: Math.floor(height),
            });
          }
        }
      });
      
      resizeObserver.observe(chartContainerRef.current);
      console.log('ResizeObserver attached to chart container');
    }

    // Fallback window resize listener
    window.addEventListener('resize', handleResize);

    // Listen for custom panel resize events
    const handlePanelResize = (event: CustomEvent) => {
      console.log('Custom panel resize event received:', event.detail);
      // Small delay to ensure DOM has updated
      setTimeout(() => {
        handleResize();
      }, 10);
    };

    window.addEventListener('chartPanelResize', handlePanelResize as EventListener);

    // Additional mutation observer to catch dynamic changes
    let mutationObserver: MutationObserver | null = null;
    
    if (chartContainerRef.current) {
      mutationObserver = new MutationObserver(() => {
        console.log('MutationObserver triggered - checking size');
        handleResize();
      });
      
      mutationObserver.observe(chartContainerRef.current.parentElement || document.body, {
        attributes: true,
        attributeFilter: ['style', 'class'],
        subtree: true
      });
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('chartPanelResize', handlePanelResize as EventListener);
      
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      
      if (mutationObserver) {
        mutationObserver.disconnect();
      }
      
      if (chartContainer) {
        chartContainer.removeEventListener('mousedown', handleMouseDown);
        chartContainer.removeEventListener('wheel', handleWheel);
        chartContainer.removeEventListener('touchstart', handleTouchStart);
      }
      
      chart.remove();
    };
  }, [isClient, tokenAddress]);

  // Convert KlineData to format expected by indicators
  const chartData = useMemo(() => {
    // Ensure data is sorted by timestamp
    const sortedKlines = [...klines].sort((a, b) => Number(a.open_time) - Number(b.open_time));
    
    return sortedKlines.map(kline => ({
      timestamp: Number(kline.open_time) * 1000, // Convert to milliseconds and ensure number
      open: Number(kline.open), // Already converted from lamports in WebSocket
      high: Number(kline.high), // Already converted from lamports in WebSocket
      low: Number(kline.low),   // Already converted from lamports in WebSocket
      close: Number(kline.close), // Already converted from lamports in WebSocket
      volume: Number(kline.volume) // Already converted from lamports in WebSocket
    }));
  }, [klines]);

  const memoizedIndicatorData = useMemo(() => {
    if (chartData.length === 0) return { 
      ma: {}, 
      ema: {}, 
      atr: {},
      bollinger: [],
      macd: [],
      rsi: [],
      stochRsi: []
    };
    return calculateAllIndicators(chartData, [5, 20, 50, 14, 21]);
  }, [chartData]);

  // Update chart data when klines change
  useEffect(() => {
    if (!candlestickSeriesRef.current || !volumeSeriesRef.current || klines.length === 0) return;

    // Ensure data is sorted by timestamp (ascending)
    const sortedKlines = [...klines].sort((a, b) => Number(a.open_time) - Number(b.open_time));

    // Convert KlineData to Lightweight Charts format
    const candleChartData: CandlestickData[] = sortedKlines.map(kline => ({
      time: Number(kline.open_time) as any, // Ensure number conversion
      open: Number(kline.open), // Already converted from lamports in WebSocket
      high: Number(kline.high), // Already converted from lamports in WebSocket
      low: Number(kline.low),   // Already converted from lamports in WebSocket
      close: Number(kline.close), // Already converted from lamports in WebSocket
    }));

    const volumeChartData: HistogramData[] = sortedKlines.map(kline => {
      const volume = Number(kline.volume);
      // Ensure volume is within Lightweight Charts limits and handle very small values
      const clampedVolume = Math.max(-90071992547409.91, Math.min(90071992547409.91, volume));
      
      return {
        time: Number(kline.open_time) as any, // Ensure number conversion
        value: clampedVolume,
        color: Number(kline.close) > Number(kline.open) ? 'rgb(75, 118, 90)' : 'rgb(129, 60, 75)',
      };
    });

    // Use setData to avoid position changes
    candlestickSeriesRef.current.setData(candleChartData);
    volumeSeriesRef.current.setData(volumeChartData);

    // Update MA data
    if (ma5SeriesRef.current && memoizedIndicatorData.ma.MA5) {
      ma5SeriesRef.current.setData(memoizedIndicatorData.ma.MA5 as LineData[]);
    }
    if (ma20SeriesRef.current && memoizedIndicatorData.ma.MA20) {
      ma20SeriesRef.current.setData(memoizedIndicatorData.ma.MA20 as LineData[]);
    }
    if (ma50SeriesRef.current && memoizedIndicatorData.ma.MA50) {
      ma50SeriesRef.current.setData(memoizedIndicatorData.ma.MA50 as LineData[]);
    }

    // Update EMA data
    if (ema5SeriesRef.current && memoizedIndicatorData.ema.EMA5) {
      ema5SeriesRef.current.setData(memoizedIndicatorData.ema.EMA5 as LineData[]);
    }
    if (ema20SeriesRef.current && memoizedIndicatorData.ema.EMA20) {
      ema20SeriesRef.current.setData(memoizedIndicatorData.ema.EMA20 as LineData[]);
    }
    if (ema50SeriesRef.current && memoizedIndicatorData.ema.EMA50) {
      ema50SeriesRef.current.setData(memoizedIndicatorData.ema.EMA50 as LineData[]);
    }

    // Update ATR data
    if (atr14SeriesRef.current && memoizedIndicatorData.atr.ATR14) {
      atr14SeriesRef.current.setData(memoizedIndicatorData.atr.ATR14 as LineData[]);
    }
    if (atr21SeriesRef.current && memoizedIndicatorData.atr.ATR21) {
      atr21SeriesRef.current.setData(memoizedIndicatorData.atr.ATR21 as LineData[]);
    }

    // Update Bollinger Bands data
    if (bollingerUpperRef.current && memoizedIndicatorData.bollinger) {
      const upperData = memoizedIndicatorData.bollinger.map(item => ({
        time: item.time,
        value: item.upper
      }));
      bollingerUpperRef.current.setData(upperData as LineData[]);
    }
    if (bollingerMiddleRef.current && memoizedIndicatorData.bollinger) {
      const middleData = memoizedIndicatorData.bollinger.map(item => ({
        time: item.time,
        value: item.middle
      }));
      bollingerMiddleRef.current.setData(middleData as LineData[]);
    }
    if (bollingerLowerRef.current && memoizedIndicatorData.bollinger) {
      const lowerData = memoizedIndicatorData.bollinger.map(item => ({
        time: item.time,
        value: item.lower
      }));
      bollingerLowerRef.current.setData(lowerData as LineData[]);
    }

    // Update MACD data
    if (macdLineRef.current && memoizedIndicatorData.macd) {
      const macdData = memoizedIndicatorData.macd.map(item => ({
        time: item.time,
        value: item.macd
      }));
      macdLineRef.current.setData(macdData as LineData[]);
    }
    if (macdSignalRef.current && memoizedIndicatorData.macd) {
      const signalData = memoizedIndicatorData.macd.map(item => ({
        time: item.time,
        value: item.signal
      }));
      macdSignalRef.current.setData(signalData as LineData[]);
    }
    if (macdHistogramRef.current && memoizedIndicatorData.macd) {
      const histogramData = memoizedIndicatorData.macd.map(item => ({
        time: item.time,
        value: item.histogram,
        color: item.histogram >= 0 ? '#32CD32' : '#FF4444'
      }));
      macdHistogramRef.current.setData(histogramData as HistogramData[]);
    }

    // Update RSI data
    if (rsiLineRef.current && memoizedIndicatorData.rsi) {
      rsiLineRef.current.setData(memoizedIndicatorData.rsi as LineData[]);
      
      // RSI horizontal line data (30, 70)
      if (rsiUpperLineRef.current && memoizedIndicatorData.rsi.length > 0) {
        const upperLineData = memoizedIndicatorData.rsi.map(item => ({
          time: item.time,
          value: 70
        }));
        rsiUpperLineRef.current.setData(upperLineData as LineData[]);
      }
      
      if (rsiLowerLineRef.current && memoizedIndicatorData.rsi.length > 0) {
        const lowerLineData = memoizedIndicatorData.rsi.map(item => ({
          time: item.time,
          value: 30
        }));
        rsiLowerLineRef.current.setData(lowerLineData as LineData[]);
      }
    }

    // Update Stochastic RSI data
    if (stochRsiKRef.current && memoizedIndicatorData.stochRsi) {
      const kData = memoizedIndicatorData.stochRsi.map(item => ({
        time: item.time,
        value: item.k
      }));
      stochRsiKRef.current.setData(kData as LineData[]);
    }
    if (stochRsiDRef.current && memoizedIndicatorData.stochRsi) {
      const dData = memoizedIndicatorData.stochRsi.map(item => ({
        time: item.time,
        value: item.d
      }));
      stochRsiDRef.current.setData(dData as LineData[]);
    }

  }, [klines, memoizedIndicatorData]);

  useEffect(() => {
    // MA visibility
    if (ma5SeriesRef.current) {
      ma5SeriesRef.current.applyOptions({ visible: showIndicators.MA5 });
    }
    if (ma20SeriesRef.current) {
      ma20SeriesRef.current.applyOptions({ visible: showIndicators.MA20 });
    }
    if (ma50SeriesRef.current) {
      ma50SeriesRef.current.applyOptions({ visible: showIndicators.MA50 });
    }

    // EMA visibility
    if (ema5SeriesRef.current) {
      ema5SeriesRef.current.applyOptions({ visible: showIndicators.EMA5 });
    }
    if (ema20SeriesRef.current) {
      ema20SeriesRef.current.applyOptions({ visible: showIndicators.EMA20 });
    }
    if (ema50SeriesRef.current) {
      ema50SeriesRef.current.applyOptions({ visible: showIndicators.EMA50 });
    }

    // ATR visibility and price scale
    if (atr14SeriesRef.current) {
      atr14SeriesRef.current.applyOptions({ visible: showIndicators.ATR14 });
    }
    if (atr21SeriesRef.current) {
      atr21SeriesRef.current.applyOptions({ visible: showIndicators.ATR21 });
    }

    // Bollinger Bands visibility
    if (bollingerUpperRef.current) {
      bollingerUpperRef.current.applyOptions({ visible: showIndicators.bollinger });
    }
    if (bollingerMiddleRef.current) {
      bollingerMiddleRef.current.applyOptions({ visible: showIndicators.bollinger });
    }
    if (bollingerLowerRef.current) {
      bollingerLowerRef.current.applyOptions({ visible: showIndicators.bollinger });
    }

    // MACD visibility
    if (macdLineRef.current) {
      macdLineRef.current.applyOptions({ visible: showIndicators.macd });
    }
    if (macdSignalRef.current) {
      macdSignalRef.current.applyOptions({ visible: showIndicators.macd });
    }
    if (macdHistogramRef.current) {
      macdHistogramRef.current.applyOptions({ visible: showIndicators.macd });
    }

    // RSI visibility
    if (rsiLineRef.current) {
      rsiLineRef.current.applyOptions({ visible: showIndicators.rsi });
    }
    if (rsiUpperLineRef.current) {
      rsiUpperLineRef.current.applyOptions({ visible: showIndicators.rsi });
    }
    if (rsiLowerLineRef.current) {
      rsiLowerLineRef.current.applyOptions({ visible: showIndicators.rsi });
    }

    // Stochastic RSI visibility
    if (stochRsiKRef.current) {
      stochRsiKRef.current.applyOptions({ visible: showIndicators.stochRsi });
    }
    if (stochRsiDRef.current) {
      stochRsiDRef.current.applyOptions({ visible: showIndicators.stochRsi });
    }

    // Update panel layout
    updatePanelLayout();
  }, [showIndicators]);

  const toggleIndicator = (indicatorType: keyof typeof showIndicators) => {
    setShowIndicators(prev => ({
      ...prev,
      [indicatorType]: !prev[indicatorType]
    }));
  };

  const handleIndicatorToggle = (indicator: string) => {
    if (indicator === 'atr') {
      // Toggle ATR14 and disable ATR21
      setShowIndicators(prev => ({
        ...prev,
        ATR14: !prev.ATR14,
        ATR21: false
      }));
    } else {
      toggleIndicator(indicator as keyof typeof showIndicators);
    }
  };

  const selectedIndicatorsList = Object.entries(showIndicators)
    .filter(([key, value]) => value)
    .map(([key]) => key)
    .concat(showIndicators.ATR14 ? ['atr'] : []);

  const handleTimeframeChange = (timeframe: string) => {
    onTimeframeChange(timeframe);
  };

  if (!isClient) {
    return (
      <div className="h-full flex flex-col" style={{ backgroundColor: 'rgb(17, 18, 20)', borderColor: 'rgb(39, 40, 46)' }}>
        <div className="flex items-center justify-between p-3 border-b flex-shrink-0" style={{ borderColor: 'rgb(39, 40, 46)' }}>
          <div className="flex items-center gap-2">
            {timeframes.map((tf) => (
              <div
                key={tf.value}
                className="px-3 py-1 text-xs rounded bg-gray-800 text-gray-400"
              >
                {tf.label}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-xs text-gray-400">{connectionStatus}</span>
          </div>
        </div>
        <div className="flex-1 relative min-h-0">
          <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: 'rgb(17, 18, 20)' }}>
            {error ? (
              <div className="text-center">
                <div className="text-red-400 text-sm mb-2">Failed to load chart data</div>
                <div className="text-gray-400 text-xs">{error}</div>
              </div>
            ) : (
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                <div className="text-gray-400 text-sm">
                  {isLoading ? 'Loading chart data...' : 'Initializing chart...'}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: 'rgb(17, 18, 20)', borderColor: 'rgb(39, 40, 46)' }}>
      {/* Chart Controls */}
      <div className="flex items-center justify-between p-3 border-b flex-shrink-0" style={{ borderColor: 'rgb(39, 40, 46)' }}>
        <div className="flex items-center gap-4">
          {/* Timeframe buttons */}
          <div className="flex items-center gap-1">
            {timeframes.map((tf) => (
              <button
                key={tf.value}
                onClick={() => handleTimeframeChange(tf.value)}
                className={`px-3 py-1 text-xs transition-colors ${
                  selectedTimeframe === tf.value
                    ? 'text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {tf.label}
              </button>
            ))}
            
            {/* fx button */}
            <button
              onClick={() => setShowIndicatorModal(true)}
              className="ml-2 px-2 py-1 text-xs text-gray-400 hover:text-white transition-colors"
              title="Indicators"
            >
              <span className="font-mono">fx</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[rgb(134,217,159)]' : 'bg-red-500'}`}></div>
            <span className="text-xs text-gray-400">{connectionStatus}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              className="p-1 text-gray-400 hover:text-white"
              onClick={() => {
                if (chartRef.current) {
                  chartRef.current.timeScale().fitContent();
                }
              }}
              title="Fit content"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 0C3.6 0 0 3.6 0 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zm0 14c-3.3 0-6-2.7-6-6s2.7-6 6-6 6 2.7 6 6-2.7 6-6 6z"/>
                <path d="M8 4c-.6 0-1 .4-1 1v3c0 .6.4 1 1 1s1-.4 1-1V5c0-.6-.4-1-1-1z"/>
                <circle cx="8" cy="11" r="1"/>
              </svg>
            </button>

            <button 
              className={`p-1 transition-colors ${userInteracted ? 'text-gray-400 hover:text-white' : 'text-blue-400'}`}
              onClick={() => {
                if (chartRef.current) {
                  chartRef.current.timeScale().scrollToRealTime();
                  setUserInteracted(false);
                }
              }}
              title="Real Time View"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 2l4 4-4 4V7H2V5h6V2z"/>
                <path d="M14 8c0 3.3-2.7 6-6 6s-6-2.7-6-6"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Chart Container */}
      <div className="flex-1 relative min-h-0">
        <div 
          ref={chartContainerRef} 
          className="w-full h-full"
        />
        
        {/* Price Info Overlay */}
        {tokenData && klines.length > 0 && (
          <div className="absolute top-4 left-4 p-3 rounded border" style={{ backgroundColor: 'rgba(17, 18, 20, 0.9)', borderColor: 'rgb(39, 40, 46)' }}>
            
            {/* Indicator Values Display */}
            {(Object.values(showIndicators).some(Boolean)) && (
              <div className="mt-2 pt-2 border-t border-gray-600">
                {/* MA Values */}
                {showIndicators.MA5 && memoizedIndicatorData.ma.MA5 && memoizedIndicatorData.ma.MA5.length > 0 && (
                  <div className="text-xs text-red-400">
                    MA5: ${memoizedIndicatorData.ma.MA5[memoizedIndicatorData.ma.MA5.length - 1]?.value.toFixed(8)}
                  </div>
                )}
                {showIndicators.MA20 && memoizedIndicatorData.ma.MA20 && memoizedIndicatorData.ma.MA20.length > 0 && (
                  <div className="text-xs text-teal-400">
                    MA20: ${memoizedIndicatorData.ma.MA20[memoizedIndicatorData.ma.MA20.length - 1]?.value.toFixed(8)}
                  </div>
                )}
                {showIndicators.MA50 && memoizedIndicatorData.ma.MA50 && memoizedIndicatorData.ma.MA50.length > 0 && (
                  <div className="text-xs text-blue-400">
                    MA50: ${memoizedIndicatorData.ma.MA50[memoizedIndicatorData.ma.MA50.length - 1]?.value.toFixed(8)}
                  </div>
                )}
                
                {/* EMA Values */}
                {showIndicators.EMA5 && memoizedIndicatorData.ema.EMA5 && memoizedIndicatorData.ema.EMA5.length > 0 && (
                  <div className="text-xs text-orange-400">
                    EMA5: ${memoizedIndicatorData.ema.EMA5[memoizedIndicatorData.ema.EMA5.length - 1]?.value.toFixed(8)}
                  </div>
                )}
                {showIndicators.EMA20 && memoizedIndicatorData.ema.EMA20 && memoizedIndicatorData.ema.EMA20.length > 0 && (
                  <div className="text-xs text-green-400">
                    EMA20: ${memoizedIndicatorData.ema.EMA20[memoizedIndicatorData.ema.EMA20.length - 1]?.value.toFixed(8)}
                  </div>
                )}
                {showIndicators.EMA50 && memoizedIndicatorData.ema.EMA50 && memoizedIndicatorData.ema.EMA50.length > 0 && (
                  <div className="text-xs text-purple-400">
                    EMA50: ${memoizedIndicatorData.ema.EMA50[memoizedIndicatorData.ema.EMA50.length - 1]?.value.toFixed(8)}
                  </div>
                )}
                
                {/* ATR Values */}
                {showIndicators.ATR14 && memoizedIndicatorData.atr.ATR14 && memoizedIndicatorData.atr.ATR14.length > 0 && (
                  <div className="text-xs text-orange-400">
                    ATR14: {memoizedIndicatorData.atr.ATR14[memoizedIndicatorData.atr.ATR14.length - 1]?.value.toFixed(8)}
                  </div>
                )}
                {showIndicators.ATR21 && memoizedIndicatorData.atr.ATR21 && memoizedIndicatorData.atr.ATR21.length > 0 && (
                  <div className="text-xs text-purple-400">
                    ATR21: {memoizedIndicatorData.atr.ATR21[memoizedIndicatorData.atr.ATR21.length - 1]?.value.toFixed(8)}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Indicator Modal */}
      <IndicatorModal
        isOpen={showIndicatorModal}
        onClose={() => setShowIndicatorModal(false)}
        selectedIndicators={selectedIndicatorsList}
        onIndicatorToggle={handleIndicatorToggle}
      />
    </div>
  );
});

export default TokenChart;