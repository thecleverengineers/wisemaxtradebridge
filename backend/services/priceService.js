
const axios = require('axios');
const WebSocket = require('ws');

class PriceService {
  constructor(io) {
    this.io = io;
    this.prices = new Map();
    this.subscribers = new Set();
    this.binanceWs = null;
    this.priceUpdateInterval = null;
    
    // Initialize price feeds
    this.initializePriceFeeds();
    this.startPriceUpdates();
  }

  async initializePriceFeeds() {
    try {
      // Get initial prices from Binance API
      const response = await axios.get('https://api.binance.com/api/v3/ticker/price');
      const binancePrices = response.data;
      
      // Map Binance symbols to our assets
      const symbolMap = {
        'BTCUSDT': 'BTCUSD',
        'ETHUSDT': 'ETHUSD',
        'EURUSD': 'EURUSD', // Forex pairs would need different API
        'GBPUSD': 'GBPUSD',
        'XAUUSD': 'GOLD'
      };

      binancePrices.forEach(item => {
        const ourSymbol = symbolMap[item.symbol];
        if (ourSymbol) {
          this.prices.set(ourSymbol, {
            symbol: ourSymbol,
            price: parseFloat(item.price),
            timestamp: Date.now(),
            change24h: 0, // Would need historical data for this
            changePercent24h: 0
          });
        }
      });

      // Add mock forex prices (in production, use proper forex API)
      this.addMockForexPrices();
      
      console.log('Price feeds initialized');
    } catch (error) {
      console.error('Failed to initialize price feeds:', error);
      this.addMockPrices(); // Fallback to mock prices
    }
  }

  addMockForexPrices() {
    const forexPairs = [
      { symbol: 'EURUSD', price: 1.0850 },
      { symbol: 'GBPUSD', price: 1.2750 },
      { symbol: 'USDJPY', price: 148.50 },
      { symbol: 'AAPL', price: 185.25 },
      { symbol: 'GOOGL', price: 2750.80 },
      { symbol: 'OIL', price: 82.45 }
    ];

    forexPairs.forEach(pair => {
      this.prices.set(pair.symbol, {
        symbol: pair.symbol,
        price: pair.price,
        timestamp: Date.now(),
        change24h: (Math.random() - 0.5) * 10,
        changePercent24h: (Math.random() - 0.5) * 5
      });
    });
  }

  addMockPrices() {
    // Fallback mock prices for testing
    const mockPrices = [
      { symbol: 'BTCUSD', price: 42500.00 },
      { symbol: 'ETHUSD', price: 2650.00 },
      { symbol: 'EURUSD', price: 1.0850 },
      { symbol: 'GBPUSD', price: 1.2750 },
      { symbol: 'USDJPY', price: 148.50 },
      { symbol: 'AAPL', price: 185.25 },
      { symbol: 'GOOGL', price: 2750.80 },
      { symbol: 'GOLD', price: 2025.50 },
      { symbol: 'OIL', price: 82.45 }
    ];

    mockPrices.forEach(item => {
      this.prices.set(item.symbol, {
        symbol: item.symbol,
        price: item.price,
        timestamp: Date.now(),
        change24h: (Math.random() - 0.5) * 100,
        changePercent24h: (Math.random() - 0.5) * 5
      });
    });
  }

  startPriceUpdates() {
    // Update prices every second
    this.priceUpdateInterval = setInterval(() => {
      this.updatePrices();
      this.broadcastPrices();
    }, 1000);
  }

  updatePrices() {
    // Simulate price movements for demo
    for (let [symbol, data] of this.prices) {
      const volatility = this.getVolatility(symbol);
      const change = (Math.random() - 0.5) * volatility;
      const newPrice = Math.max(0.0001, data.price + change);
      
      this.prices.set(symbol, {
        ...data,
        price: newPrice,
        timestamp: Date.now()
      });
    }
  }

  getVolatility(symbol) {
    // Different assets have different volatilities
    const volatilities = {
      'BTCUSD': 100,
      'ETHUSD': 50,
      'EURUSD': 0.001,
      'GBPUSD': 0.002,
      'USDJPY': 0.1,
      'AAPL': 2,
      'GOOGL': 10,
      'GOLD': 5,
      'OIL': 1
    };
    return volatilities[symbol] || 1;
  }

  broadcastPrices() {
    if (this.subscribers.size > 0) {
      const priceData = Array.from(this.prices.values());
      this.io.emit('priceUpdate', priceData);
    }
  }

  getPrice(symbol) {
    return this.prices.get(symbol);
  }

  getAllPrices() {
    return Array.from(this.prices.values());
  }

  subscribe(socketId) {
    this.subscribers.add(socketId);
  }

  unsubscribe(socketId) {
    this.subscribers.delete(socketId);
  }

  stop() {
    if (this.priceUpdateInterval) {
      clearInterval(this.priceUpdateInterval);
    }
    if (this.binanceWs) {
      this.binanceWs.close();
    }
  }
}

module.exports = PriceService;
