
const TechnicalIndicators = require('./technicalIndicators');

class SignalService {
  constructor(marketDataService) {
    this.marketDataService = marketDataService;
    this.technicalIndicators = new TechnicalIndicators();
    this.signals = new Map();
  }

  generateTradingSignals() {
    setInterval(() => {
      const assets = ['EURUSD', 'GBPUSD', 'USDJPY', 'BTCUSD', 'ETHUSD', 'AAPL', 'GOLD'];
      
      assets.forEach(asset => {
        const signal = this.calculateAdvancedSignal(asset);
        this.signals.set(asset, signal);
      });

      // Broadcast signals to all connected clients
      this.marketDataService.io.emit('tradingSignals', Array.from(this.signals.entries()));
    }, 5000);
  }

  calculateAdvancedSignal(symbol) {
    const history = this.marketDataService.getMarketData(symbol);
    const currentPrice = this.marketDataService.basePrices[symbol] || 1.0000;
    
    // Calculate technical indicators
    const rsi = this.technicalIndicators.calculateRSI(history);
    const macd = this.technicalIndicators.calculateMACD(history);
    const bb = this.technicalIndicators.calculateBollingerBands(history);
    const sma20 = this.technicalIndicators.calculateSMA(history, 20);
    const ema12 = this.technicalIndicators.calculateEMA(history, 12);
    
    // Generate signal based on multiple indicators
    let signal = 'NEUTRAL';
    let strength = 'MODERATE';
    let confidence = 50;
    
    if (rsi < 30 && currentPrice < bb.lower) {
      signal = 'BUY';
      strength = 'STRONG';
      confidence = 85;
    } else if (rsi > 70 && currentPrice > bb.upper) {
      signal = 'SELL';
      strength = 'STRONG';
      confidence = 85;
    } else if (ema12 > sma20 && macd.signal > 0) {
      signal = 'BUY';
      confidence = 70;
    } else if (ema12 < sma20 && macd.signal < 0) {
      signal = 'SELL';
      confidence = 70;
    }

    return {
      symbol,
      signal,
      strength,
      confidence,
      timeframe: '5M',
      indicators: {
        rsi,
        macd: macd.macd,
        macdSignal: macd.signal,
        bb_upper: bb.upper,
        bb_lower: bb.lower,
        sma20,
        ema12
      },
      timestamp: new Date().toISOString(),
      recommendation: this.generateRecommendation(signal, confidence)
    };
  }

  generateRecommendation(signal, confidence) {
    if (signal === 'BUY' && confidence > 80) {
      return 'Strong Buy - High probability upward movement';
    } else if (signal === 'SELL' && confidence > 80) {
      return 'Strong Sell - High probability downward movement';
    } else if (signal === 'BUY') {
      return 'Buy - Moderate upward potential';
    } else if (signal === 'SELL') {
      return 'Sell - Moderate downward potential';
    } else {
      return 'Hold - Wait for clearer signals';
    }
  }

  getSignals() {
    return this.signals;
  }
}

module.exports = SignalService;
