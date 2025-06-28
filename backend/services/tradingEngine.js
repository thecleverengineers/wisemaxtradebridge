
const axios = require('axios');

class TradingEngine {
  constructor(io, db) {
    this.io = io;
    this.db = db;
    this.activeTrades = new Map();
    this.priceHistory = new Map();
    this.signals = new Map();
    
    // Start trade settlement monitor
    this.startTradeMonitor();
    this.generateTradingSignals();
  }

  async startTradeMonitor() {
    // Check for trades to settle every second
    setInterval(async () => {
      await this.settlePendingTrades();
    }, 1000);
  }

  async settlePendingTrades() {
    try {
      const [pendingTrades] = await this.db.execute(`
        SELECT t.*, a.return_percent, a.symbol as asset_symbol 
        FROM trades t 
        JOIN assets a ON t.asset_id = a.id 
        WHERE t.result = 'pending' AND t.end_time <= NOW()
      `);

      for (const trade of pendingTrades) {
        await this.settleTrade(trade);
      }
    } catch (error) {
      console.error('Trade settlement error:', error);
    }
  }

  async settleTrade(trade) {
    try {
      // Get current price for the asset
      const currentPrice = await this.getCurrentPrice(trade.asset_symbol);
      if (!currentPrice) return;

      const entryPrice = parseFloat(trade.entry_price);
      const exitPrice = currentPrice;
      const stake = parseFloat(trade.stake);
      const returnPercent = parseFloat(trade.return_percent);

      // Determine if trade won
      let isWin = false;
      if (trade.direction === 'UP' && exitPrice > entryPrice) {
        isWin = true;
      } else if (trade.direction === 'DOWN' && exitPrice < entryPrice) {
        isWin = true;
      }

      const result = isWin ? 'win' : 'loss';
      const payout = isWin ? stake + (stake * returnPercent / 100) : 0;

      // Update trade in database
      await this.db.execute(`
        UPDATE trades 
        SET exit_price = ?, result = ?, payout = ? 
        WHERE id = ?
      `, [exitPrice, result, payout, trade.id]);

      // Update user wallet
      if (isWin) {
        const walletField = trade.mode === 'real' ? 'wallet_real' : 'wallet_demo';
        await this.db.execute(`
          UPDATE users 
          SET ${walletField} = ${walletField} + ? 
          WHERE id = ?
        `, [payout, trade.user_id]);

        // Record transaction
        await this.db.execute(`
          INSERT INTO wallet_transactions 
          (user_id, type, amount, mode, description, reference_id) 
          VALUES (?, 'trade_payout', ?, ?, ?, ?)
        `, [
          trade.user_id, 
          payout, 
          trade.mode, 
          `Trade payout for ${trade.asset_symbol}`, 
          trade.id
        ]);
      }

      // Emit trade result to user
      this.io.to(`user_${trade.user_id}`).emit('tradeResult', {
        trade: {
          ...trade,
          exit_price: exitPrice,
          result,
          payout
        },
        isWin,
        payout
      });

      console.log(`Trade ${trade.id} settled: ${result}, payout: ${payout}`);
    } catch (error) {
      console.error('Error settling trade:', error);
    }
  }

  async getCurrentPrice(symbol) {
    try {
      // This would connect to your price service
      // For now, return a mock price with some volatility
      const basePrice = this.getBasePriceForSymbol(symbol);
      const volatility = Math.random() * 0.02 - 0.01; // ±1% volatility
      return basePrice * (1 + volatility);
    } catch (error) {
      console.error('Error getting current price:', error);
      return null;
    }
  }

  getBasePriceForSymbol(symbol) {
    const basePrices = {
      'EURUSD': 1.0850,
      'GBPUSD': 1.2750,
      'USDJPY': 148.50,
      'AUDUSD': 0.6720,
      'USDCAD': 1.3580,
      'BTCUSD': 42500,
      'ETHUSD': 2650,
      'AAPL': 185.25,
      'GOOGL': 2750.80,
      'GOLD': 2025.50,
      'OIL': 82.45
    };
    return basePrices[symbol] || 1.0000;
  }

  generateTradingSignals() {
    setInterval(() => {
      const assets = ['EURUSD', 'GBPUSD', 'USDJPY', 'BTCUSD', 'ETHUSD', 'AAPL', 'GOLD'];
      
      assets.forEach(asset => {
        const signal = this.calculateTradingSignal(asset);
        this.signals.set(asset, signal);
      });

      // Broadcast signals to all connected clients
      this.io.emit('tradingSignals', Array.from(this.signals.entries()));
    }, 5000); // Update signals every 5 seconds
  }

  calculateTradingSignal(symbol) {
    // Simulate technical analysis signals
    const signals = ['BUY', 'SELL', 'NEUTRAL'];
    const strengths = ['WEAK', 'MODERATE', 'STRONG'];
    const timeframes = ['1M', '5M', '15M', '1H', '4H', '1D'];
    
    return {
      symbol,
      signal: signals[Math.floor(Math.random() * signals.length)],
      strength: strengths[Math.floor(Math.random() * strengths.length)],
      confidence: Math.floor(Math.random() * 40) + 60, // 60-100%
      timeframe: timeframes[Math.floor(Math.random() * timeframes.length)],
      indicators: {
        rsi: Math.floor(Math.random() * 100),
        macd: (Math.random() - 0.5) * 0.1,
        sma: this.getBasePriceForSymbol(symbol) * (1 + (Math.random() - 0.5) * 0.02),
        ema: this.getBasePriceForSymbol(symbol) * (1 + (Math.random() - 0.5) * 0.015)
      },
      timestamp: new Date().toISOString()
    };
  }

  async getTradeHistory(userId, limit = 50) {
    try {
      const [trades] = await this.db.execute(`
        SELECT t.*, a.name as asset_name 
        FROM trades t 
        JOIN assets a ON t.asset_id = a.id 
        WHERE t.user_id = ? 
        ORDER BY t.created_at DESC 
        LIMIT ?
      `, [userId, limit]);
      
      return trades;
    } catch (error) {
      console.error('Error getting trade history:', error);
      return [];
    }
  }

  async getMarketAnalysis() {
    // Generate market analysis data
    return {
      marketSentiment: {
        overall: Math.random() > 0.5 ? 'BULLISH' : 'BEARISH',
        strength: Math.floor(Math.random() * 100),
        volatility: Math.floor(Math.random() * 100)
      },
      topMovers: [
        { symbol: 'BTCUSD', change: (Math.random() - 0.5) * 10 },
        { symbol: 'EURUSD', change: (Math.random() - 0.5) * 2 },
        { symbol: 'GOLD', change: (Math.random() - 0.5) * 5 }
      ],
      economicEvents: [
        {
          time: '14:30',
          country: 'USD',
          event: 'Non-Farm Payrolls',
          impact: 'HIGH',
          forecast: '200K',
          previous: '180K'
        },
        {
          time: '16:00',
          country: 'EUR',
          event: 'ECB Interest Rate Decision',
          impact: 'HIGH',
          forecast: '4.50%',
          previous: '4.50%'
        }
      ]
    };
  }
}

module.exports = TradingEngine;
