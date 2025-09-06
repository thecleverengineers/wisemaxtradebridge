
import { supabase } from '@/integrations/supabase/client';

export interface TechnicalIndicators {
  rsi: number;
  macd: {
    macd: number;
    signal: number;
    histogram: number;
  };
  bollinger: {
    upper: number;
    middle: number;
    lower: number;
  };
  sma: {
    sma20: number;
    sma50: number;
    sma200: number;
  };
  ema: {
    ema12: number;
    ema26: number;
  };
  stochastic: {
    k: number;
    d: number;
  };
  williamsr: number;
  atr: number;
}

export interface MarketSignal {
  symbol: string;
  signal: 'BUY' | 'SELL' | 'HOLD';
  strength: 'WEAK' | 'MODERATE' | 'STRONG';
  confidence: number;
  timeframe: string;
  price: number;
  target: number;
  stopLoss: number;
  riskReward: number;
  indicators: TechnicalIndicators;
  analysis: string;
  recommendation: string;
  timestamp: string;
}

export interface MarketOverview {
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  volatility: number;
  volume: number;
  trend: 'UPTREND' | 'DOWNTREND' | 'SIDEWAYS';
  momentum: number;
  fear_greed_index: number;
}

export interface EconomicEvent {
  id: string;
  time: string;
  country: string;
  currency: string;
  event: string;
  impact: 'LOW' | 'MEDIUM' | 'HIGH';
  forecast: string;
  previous: string;
  actual?: string;
  deviation?: number;
}

export interface MarketNews {
  id: string;
  title: string;
  summary: string;
  sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  impact: 'LOW' | 'MEDIUM' | 'HIGH';
  timestamp: string;
  source: string;
  related_assets: string[];
}

export interface AssetCorrelation {
  asset1: string;
  asset2: string;
  correlation: number;
  strength: 'WEAK' | 'MODERATE' | 'STRONG';
  period: string;
}

export interface MarketAnalysisData {
  overview: MarketOverview;
  signals: MarketSignal[];
  economicEvents: EconomicEvent[];
  news: MarketNews[];
  correlations: AssetCorrelation[];
  sectors: {
    name: string;
    performance: number;
    sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  }[];
  currencies: {
    symbol: string;
    strength: number;
    trend: 'STRENGTHENING' | 'WEAKENING' | 'STABLE';
  }[];
}

class MarketAnalysisService {
  private static instance: MarketAnalysisService;
  private cache: Map<string, any> = new Map();
  private cacheExpiry: Map<string, number> = new Map();

  public static getInstance(): MarketAnalysisService {
    if (!MarketAnalysisService.instance) {
      MarketAnalysisService.instance = new MarketAnalysisService();
    }
    return MarketAnalysisService.instance;
  }

  private isValidCache(key: string): boolean {
    const expiry = this.cacheExpiry.get(key);
    if (!expiry) return false;
    return Date.now() < expiry;
  }

  private setCache(key: string, data: any, ttlMinutes: number = 5): void {
    this.cache.set(key, data);
    this.cacheExpiry.set(key, Date.now() + (ttlMinutes * 60 * 1000));
  }

  public async getMarketAnalysis(): Promise<MarketAnalysisData> {
    const cacheKey = 'market_analysis';
    
    if (this.isValidCache(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const analysis = await this.generateComprehensiveAnalysis();
      this.setCache(cacheKey, analysis, 3); // Cache for 3 minutes
      return analysis;
    } catch (error) {
      console.error('Error getting market analysis:', error);
      throw error;
    }
  }

  private async generateComprehensiveAnalysis(): Promise<MarketAnalysisData> {
    const [
      overview,
      signals,
      economicEvents,
      news,
      correlations,
      sectors,
      currencies
    ] = await Promise.all([
      this.generateMarketOverview(),
      this.generateMarketSignals(),
      this.getEconomicEvents(),
      this.getMarketNews(),
      this.calculateCorrelations(),
      this.analyzeSectors(),
      this.analyzeCurrencyStrength()
    ]);

    return {
      overview,
      signals,
      economicEvents,
      news,
      correlations,
      sectors,
      currencies
    };
  }

  private async generateMarketOverview(): Promise<MarketOverview> {
    // Simulate market overview with realistic data
    const sentiments = ['BULLISH', 'BEARISH', 'NEUTRAL'] as const;
    const trends = ['UPTREND', 'DOWNTREND', 'SIDEWAYS'] as const;
    
    return {
      sentiment: sentiments[Math.floor(Math.random() * sentiments.length)],
      volatility: Math.floor(Math.random() * 100),
      volume: Math.floor(Math.random() * 1000000) + 500000,
      trend: trends[Math.floor(Math.random() * trends.length)],
      momentum: Math.floor(Math.random() * 200) - 100, // -100 to +100
      fear_greed_index: Math.floor(Math.random() * 100)
    };
  }

  private async generateMarketSignals(): Promise<MarketSignal[]> {
    const symbols = [
      'EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 'NZDUSD',
      'BTCUSD', 'ETHUSD', 'LTCUSD', 'XRPUSD',
      'AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN',
      'GOLD', 'SILVER', 'OIL', 'NGAS'
    ];

    const signals: MarketSignal[] = [];

    for (const symbol of symbols) {
      const signal = await this.generateSignalForSymbol(symbol);
      signals.push(signal);
    }

    return signals.sort((a, b) => b.confidence - a.confidence);
  }

  private async generateSignalForSymbol(symbol: string): Promise<MarketSignal> {
    const signals = ['BUY', 'SELL', 'HOLD'] as const;
    const strengths = ['WEAK', 'MODERATE', 'STRONG'] as const;
    const timeframes = ['1M', '5M', '15M', '1H', '4H', '1D'];
    
    const basePrice = this.getBasePriceForSymbol(symbol);
    const volatility = Math.random() * 0.02 - 0.01; // ±1%
    const currentPrice = basePrice * (1 + volatility);
    
    const signal = signals[Math.floor(Math.random() * signals.length)];
    const strength = strengths[Math.floor(Math.random() * strengths.length)];
    const confidence = Math.floor(Math.random() * 40) + 60; // 60-100%
    
    // Calculate target and stop loss based on signal
    let target = currentPrice;
    let stopLoss = currentPrice;
    
    if (signal === 'BUY') {
      target = currentPrice * (1 + Math.random() * 0.03 + 0.01); // 1-4% up
      stopLoss = currentPrice * (1 - Math.random() * 0.02 - 0.005); // 0.5-2.5% down
    } else if (signal === 'SELL') {
      target = currentPrice * (1 - Math.random() * 0.03 - 0.01); // 1-4% down
      stopLoss = currentPrice * (1 + Math.random() * 0.02 + 0.005); // 0.5-2.5% up
    }
    
    const riskReward = Math.abs(target - currentPrice) / Math.abs(stopLoss - currentPrice);
    
    return {
      symbol,
      signal,
      strength,
      confidence,
      timeframe: timeframes[Math.floor(Math.random() * timeframes.length)],
      price: currentPrice,
      target,
      stopLoss,
      riskReward,
      indicators: this.generateTechnicalIndicators(symbol),
      analysis: this.generateAnalysisText(symbol, signal, strength),
      recommendation: this.generateRecommendationText(signal, confidence, riskReward),
      timestamp: new Date().toISOString()
    };
  }

  private generateTechnicalIndicators(symbol: string): TechnicalIndicators {
    return {
      rsi: Math.floor(Math.random() * 100),
      macd: {
        macd: (Math.random() - 0.5) * 0.1,
        signal: (Math.random() - 0.5) * 0.1,
        histogram: (Math.random() - 0.5) * 0.05
      },
      bollinger: {
        upper: this.getBasePriceForSymbol(symbol) * 1.02,
        middle: this.getBasePriceForSymbol(symbol),
        lower: this.getBasePriceForSymbol(symbol) * 0.98
      },
      sma: {
        sma20: this.getBasePriceForSymbol(symbol) * (1 + (Math.random() - 0.5) * 0.01),
        sma50: this.getBasePriceForSymbol(symbol) * (1 + (Math.random() - 0.5) * 0.02),
        sma200: this.getBasePriceForSymbol(symbol) * (1 + (Math.random() - 0.5) * 0.05)
      },
      ema: {
        ema12: this.getBasePriceForSymbol(symbol) * (1 + (Math.random() - 0.5) * 0.01),
        ema26: this.getBasePriceForSymbol(symbol) * (1 + (Math.random() - 0.5) * 0.015)
      },
      stochastic: {
        k: Math.floor(Math.random() * 100),
        d: Math.floor(Math.random() * 100)
      },
      williamsr: Math.floor(Math.random() * 100) - 100, // -100 to 0
      atr: Math.random() * 0.01 // Average True Range
    };
  }

  private generateAnalysisText(symbol: string, signal: string, strength: string): string {
    const analysisTemplates = {
      BUY: [
        `${symbol} shows strong bullish momentum with multiple technical indicators aligning for upward movement.`,
        `Oversold conditions in ${symbol} present a favorable buying opportunity with limited downside risk.`,
        `${symbol} has broken above key resistance levels, indicating potential for continued upward trend.`
      ],
      SELL: [
        `${symbol} exhibits bearish divergence with weakening momentum suggesting downward pressure.`,
        `Overbought conditions in ${symbol} indicate a potential reversal and selling opportunity.`,
        `${symbol} has failed to maintain above critical support levels, signaling potential decline.`
      ],
      HOLD: [
        `${symbol} is consolidating within a defined range, suggesting wait-and-see approach.`,
        `Mixed signals in ${symbol} warrant caution until clearer directional bias emerges.`,
        `${symbol} is in a neutral zone with balanced buying and selling pressure.`
      ]
    };

    const templates = analysisTemplates[signal as keyof typeof analysisTemplates];
    return templates[Math.floor(Math.random() * templates.length)];
  }

  private generateRecommendationText(signal: string, confidence: number, riskReward: number): string {
    if (signal === 'BUY' && confidence > 85 && riskReward > 2) {
      return 'Strong Buy - Excellent risk/reward ratio with high probability of success';
    } else if (signal === 'SELL' && confidence > 85 && riskReward > 2) {
      return 'Strong Sell - High conviction short opportunity with favorable risk management';
    } else if (confidence > 75) {
      return `${signal} - Good probability setup with ${confidence}% confidence`;
    } else if (confidence > 60) {
      return `${signal} - Moderate conviction trade, manage risk carefully`;
    } else {
      return 'HOLD - Wait for better entry conditions with higher probability';
    }
  }

  private async getEconomicEvents(): Promise<EconomicEvent[]> {
    // Simulate economic events
    const events: EconomicEvent[] = [
      {
        id: '1',
        time: '14:30',
        country: 'United States',
        currency: 'USD',
        event: 'Non-Farm Payrolls',
        impact: 'HIGH',
        forecast: '180K',
        previous: '175K'
      },
      {
        id: '2',
        time: '12:00',
        country: 'European Union',
        currency: 'EUR',
        event: 'ECB Interest Rate Decision',
        impact: 'HIGH',
        forecast: '4.50%',
        previous: '4.50%'
      },
      {
        id: '3',
        time: '09:30',
        country: 'United Kingdom',
        currency: 'GBP',
        event: 'GDP Growth Rate',
        impact: 'MEDIUM',
        forecast: '0.3%',
        previous: '0.2%'
      },
      {
        id: '4',
        time: '21:30',
        country: 'Australia',
        currency: 'AUD',
        event: 'Employment Rate',
        impact: 'MEDIUM',
        forecast: '3.7%',
        previous: '3.8%'
      },
      {
        id: '5',
        time: '05:00',
        country: 'Japan',
        currency: 'JPY',
        event: 'Core CPI',
        impact: 'MEDIUM',
        forecast: '2.1%',
        previous: '2.0%'
      }
    ];

    return events;
  }

  private async getMarketNews(): Promise<MarketNews[]> {
    // Simulate market news
    const news: MarketNews[] = [
      {
        id: '1',
        title: 'Fed Signals Potential Rate Cuts Amid Economic Uncertainty',
        summary: 'Federal Reserve officials hint at possible interest rate reductions in response to slowing economic indicators.',
        sentiment: 'NEUTRAL',
        impact: 'HIGH',
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        source: 'Reuters',
        related_assets: ['EURUSD', 'GBPUSD', 'GOLD', 'BTCUSD']
      },
      {
        id: '2',
        title: 'ECB Maintains Hawkish Stance on Inflation',
        summary: 'European Central Bank reiterates commitment to fighting inflation despite economic headwinds.',
        sentiment: 'POSITIVE',
        impact: 'MEDIUM',
        timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
        source: 'Bloomberg',
        related_assets: ['EURUSD', 'EURGBP', 'EURJPY']
      },
      {
        id: '3',
        title: 'Bitcoin Institutional Adoption Continues to Grow',
        summary: 'Major corporations announce Bitcoin treasury allocations, boosting cryptocurrency sentiment.',
        sentiment: 'POSITIVE',
        impact: 'MEDIUM',
        timestamp: new Date(Date.now() - 1000 * 60 * 150).toISOString(),
        source: 'CoinDesk',
        related_assets: ['BTCUSD', 'ETHUSD', 'ADAUSD']
      },
      {
        id: '4',
        title: 'Oil Prices Surge on Supply Concerns',
        summary: 'Crude oil prices rally amid geopolitical tensions and supply disruption fears.',
        sentiment: 'POSITIVE',
        impact: 'HIGH',
        timestamp: new Date(Date.now() - 1000 * 60 * 200).toISOString(),
        source: 'Financial Times',
        related_assets: ['OIL', 'NGAS', 'USDCAD']
      },
      {
        id: '5',
        title: 'Tech Stocks Rally on AI Optimism',
        summary: 'Technology sector sees significant gains as AI-related companies report strong earnings.',
        sentiment: 'POSITIVE',
        impact: 'MEDIUM',
        timestamp: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
        source: 'CNBC',
        related_assets: ['AAPL', 'GOOGL', 'MSFT', 'TSLA']
      }
    ];

    return news;
  }

  private async calculateCorrelations(): Promise<AssetCorrelation[]> {
    const correlations: AssetCorrelation[] = [
      {
        asset1: 'EURUSD',
        asset2: 'GBPUSD',
        correlation: 0.78,
        strength: 'STRONG',
        period: '30D'
      },
      {
        asset1: 'GOLD',
        asset2: 'BTCUSD',
        correlation: 0.45,
        strength: 'MODERATE',
        period: '30D'
      },
      {
        asset1: 'OIL',
        asset2: 'USDCAD',
        correlation: -0.62,
        strength: 'STRONG',
        period: '30D'
      },
      {
        asset1: 'AAPL',
        asset2: 'MSFT',
        correlation: 0.65,
        strength: 'STRONG',
        period: '30D'
      },
      {
        asset1: 'USDJPY',
        asset2: 'GOLD',
        correlation: -0.38,
        strength: 'MODERATE',
        period: '30D'
      }
    ];

    return correlations;
  }

  private async analyzeSectors(): Promise<Array<{name: string; performance: number; sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL'}>> {
    return [
      {
        name: 'Technology',
        performance: 2.3,
        sentiment: 'BULLISH'
      },
      {
        name: 'Financial Services',
        performance: -0.8,
        sentiment: 'BEARISH'
      },
      {
        name: 'Energy',
        performance: 4.2,
        sentiment: 'BULLISH'
      },
      {
        name: 'Healthcare',
        performance: 0.5,
        sentiment: 'NEUTRAL'
      },
      {
        name: 'Consumer Discretionary',
        performance: -1.2,
        sentiment: 'BEARISH'
      },
      {
        name: 'Utilities',
        performance: 1.1,
        sentiment: 'NEUTRAL'
      }
    ];
  }

  private async analyzeCurrencyStrength(): Promise<Array<{symbol: string; strength: number; trend: 'STRENGTHENING' | 'WEAKENING' | 'STABLE'}>> {
    return [
      {
        symbol: 'USD',
        strength: 78,
        trend: 'STRENGTHENING'
      },
      {
        symbol: 'EUR',
        strength: 65,
        trend: 'STABLE'
      },
      {
        symbol: 'GBP',
        strength: 58,
        trend: 'WEAKENING'
      },
      {
        symbol: 'JPY',
        strength: 82,
        trend: 'STRENGTHENING'
      },
      {
        symbol: 'AUD',
        strength: 45,
        trend: 'WEAKENING'
      },
      {
        symbol: 'CAD',
        strength: 62,
        trend: 'STABLE'
      },
      {
        symbol: 'CHF',
        strength: 75,
        trend: 'STRENGTHENING'
      },
      {
        symbol: 'NZD',
        strength: 40,
        trend: 'WEAKENING'
      }
    ];
  }

  private getBasePriceForSymbol(symbol: string): number {
    const basePrices: Record<string, number> = {
      'EURUSD': 1.0850,
      'GBPUSD': 1.2750,
      'USDJPY': 148.50,
      'AUDUSD': 0.6720,
      'USDCAD': 1.3580,
      'NZDUSD': 0.6120,
      'EURGBP': 0.8520,
      'EURJPY': 126.30,
      'GBPJPY': 164.85,
      'BTCUSD': 42500,
      'ETHUSD': 2650,
      'LTCUSD': 72.50,
      'XRPUSD': 0.6280,
      'ADAUSD': 0.4850,
      'AAPL': 185.25,
      'GOOGL': 2750.80,
      'MSFT': 378.85,
      'TSLA': 248.50,
      'AMZN': 3180.25,
      'GOLD': 2025.50,
      'SILVER': 24.75,
      'OIL': 82.45,
      'NGAS': 2.85
    };
    
    return basePrices[symbol] || 1.0000;
  }

  public async getSignalsForSymbol(symbol: string): Promise<MarketSignal | null> {
    const signals = await this.generateMarketSignals();
    return signals.find(s => s.symbol === symbol) || null;
  }

  public async getTopSignals(limit: number = 10): Promise<MarketSignal[]> {
    const signals = await this.generateMarketSignals();
    return signals.slice(0, limit);
  }

  public async getEconomicCalendar(): Promise<EconomicEvent[]> {
    return this.getEconomicEvents();
  }

  public async getLatestNews(limit: number = 10): Promise<MarketNews[]> {
    const news = await this.getMarketNews();
    return news.slice(0, limit);
  }
}

export const marketAnalysisService = MarketAnalysisService.getInstance();
