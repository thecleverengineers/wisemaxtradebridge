class MarketDataService {
  constructor(io) {
    this.io = io;
    this.marketData = new Map();
    this.basePrices = {
      'EURUSD': 1.0850,
      'GBPUSD': 1.2750,
      'USDJPY': 148.50,
      'AUDUSD': 0.6720,
      'USDCAD': 1.3580,
      'EURGBP': 0.8520,
      'EURJPY': 126.30,
      'GBPJPY': 164.85,
      'BTCUSD': 42500,
      'ETHUSD': 2650,
      'ADAUSD': 0.52,
      'DOTUSD': 7.85,
      'AAPL': 185.25,
      'GOOGL': 2750.80,
      'TSLA': 248.50,
      'MSFT': 378.85,
      'GOLD': 2025.50,
      'SILVER': 24.75,
      'OIL': 82.45,
      'NGAS': 2.85
    };
  }

  async initializePriceFeeds() {
    const symbols = Object.keys(this.basePrices);
    
    symbols.forEach(symbol => {
      const basePrice = this.basePrices[symbol];
      const history = [];
      
      // Generate initial historical data
      for (let i = 0; i < 100; i++) {
        const volatility = (Math.random() - 0.5) * 0.01;
        history.push({
          price: basePrice * (1 + volatility),
          timestamp: Date.now() - (100 - i) * 60000,
          volume: Math.random() * 1000
        });
      }
      
      this.marketData.set(symbol, history);
    });
  }

  startMarketDataStream() {
    setInterval(() => {
      const symbols = Object.keys(this.basePrices);
      
      symbols.forEach(symbol => {
        const basePrice = this.basePrices[symbol];
        const volatility = (Math.random() - 0.5) * 0.01;
        const newPrice = basePrice * (1 + volatility);
        
        // Store price history
        if (!this.marketData.has(symbol)) {
          this.marketData.set(symbol, []);
        }
        
        const history = this.marketData.get(symbol);
        history.push({
          price: newPrice,
          timestamp: Date.now(),
          volume: Math.random() * 1000
        });
        
        // Keep only last 1000 data points
        if (history.length > 1000) {
          history.shift();
        }
      });

      // Broadcast real-time prices
      this.io.emit('priceUpdate', this.getCurrentPrices());
    }, 1000);
  }

  getCurrentPrices() {
    const prices = {};
    this.marketData.forEach((history, symbol) => {
      if (history.length > 0) {
        const latest = history[history.length - 1];
        const previous = history.length > 1 ? history[history.length - 2] : latest;
        
        prices[symbol] = {
          price: latest.price,
          change: latest.price - previous.price,
          changePercent: ((latest.price - previous.price) / previous.price) * 100,
          timestamp: latest.timestamp
        };
      }
    });
    return prices;
  }

  async getCurrentPrice(symbol) {
    try {
      const prices = this.marketData.get(symbol);
      if (prices && prices.length > 0) {
        return prices[prices.length - 1].price;
      }
      
      // Fallback to base price with volatility
      const basePrice = this.basePrices[symbol] || 1.0000;
      const volatility = (Math.random() - 0.5) * 0.02; // ±1% volatility
      return basePrice * (1 + volatility);
    } catch (error) {
      console.error('Error getting current price:', error);
      return null;
    }
  }

  getMarketData(symbol) {
    return this.marketData.get(symbol) || [];
  }
}

module.exports = MarketDataService;
