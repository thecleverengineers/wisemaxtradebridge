const axios = require('axios');

class TradingEngine {
  constructor(io, db) {
    this.io = io;
    this.db = db;
    this.activeTrades = new Map();
    this.priceHistory = new Map();
    this.signals = new Map();
    this.marketData = new Map();
    
    // Start all monitoring services
    this.startTradeMonitor();
    this.generateTradingSignals();
    this.startMarketDataStream();
    this.initializePriceFeeds();
  }

  async startTradeMonitor() {
    setInterval(async () => {
      await this.settlePendingTrades();
      await this.updateActiveTradesStatus();
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

  async updateActiveTradesStatus() {
    try {
      // Update active trades with current market prices
      const activeTrades = Array.from(this.activeTrades.values());
      for (const trade of activeTrades) {
        const currentPrice = await this.getCurrentPrice(trade.asset_symbol);
        if (currentPrice) {
          const updatedTrade = {
            ...trade,
            current_price: currentPrice,
            unrealized_pnl: this.calculateUnrealizedPnL(trade, currentPrice)
          };
          
          this.io.to(`user_${trade.user_id}`).emit('tradeUpdate', updatedTrade);
        }
      }
    } catch (error) {
      console.error('Error updating active trades:', error);
    }
  }

  calculateUnrealizedPnL(trade, currentPrice) {
    const entryPrice = parseFloat(trade.entry_price);
    const priceDiff = currentPrice - entryPrice;
    
    if (trade.direction === 'UP') {
      return priceDiff > 0 ? 'winning' : 'losing';
    } else {
      return priceDiff < 0 ? 'winning' : 'losing';
    }
  }

  async settleTrade(trade) {
    try {
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
        SET exit_price = ?, result = ?, payout = ?, settled_at = NOW() 
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
          (user_id, type, amount, mode, description, reference_id, created_at) 
          VALUES (?, 'trade_payout', ?, ?, ?, ?, NOW())
        `, [
          trade.user_id, 
          payout, 
          trade.mode, 
          `Trade payout for ${trade.asset_symbol}`, 
          trade.id
        ]);
      }

      // Remove from active trades
      this.activeTrades.delete(trade.id);

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

      // Update user statistics
      await this.updateUserStats(trade.user_id, isWin, stake, payout);

      console.log(`Trade ${trade.id} settled: ${result}, payout: ${payout}`);
    } catch (error) {
      console.error('Error settling trade:', error);
    }
  }

  async updateUserStats(userId, isWin, stake, payout) {
    try {
      const winIncrement = isWin ? 1 : 0;
      const lossIncrement = isWin ? 0 : 1;
      
      await this.db.execute(`
        UPDATE users 
        SET 
          total_trades = total_trades + 1,
          total_wins = total_wins + ?,
          total_losses = total_losses + ?,
          total_invested = total_invested + ?,
          total_earned = total_earned + ?
        WHERE id = ?
      `, [winIncrement, lossIncrement, stake, payout, userId]);
    } catch (error) {
      console.error('Error updating user stats:', error);
    }
  }

  async getCurrentPrice(symbol) {
    try {
      // Enhanced price fetching with multiple sources
      const prices = this.marketData.get(symbol);
      if (prices && prices.length > 0) {
        return prices[prices.length - 1].price;
      }
      
      // Fallback to base price with volatility
      const basePrice = this.getBasePriceForSymbol(symbol);
      const volatility = (Math.random() - 0.5) * 0.02; // ±1% volatility
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
    return basePrices[symbol] || 1.0000;
  }

  startMarketDataStream() {
    setInterval(() => {
      const symbols = Object.keys(this.getBasePriceForSymbol(''));
      
      symbols.forEach(symbol => {
        const basePrice = this.getBasePriceForSymbol(symbol);
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

  generateTradingSignals() {
    setInterval(() => {
      const assets = ['EURUSD', 'GBPUSD', 'USDJPY', 'BTCUSD', 'ETHUSD', 'AAPL', 'GOLD'];
      
      assets.forEach(asset => {
        const signal = this.calculateAdvancedSignal(asset);
        this.signals.set(asset, signal);
      });

      // Broadcast signals to all connected clients
      this.io.emit('tradingSignals', Array.from(this.signals.entries()));
    }, 5000);
  }

  calculateAdvancedSignal(symbol) {
    const history = this.marketData.get(symbol) || [];
    const currentPrice = this.getBasePriceForSymbol(symbol);
    
    // Calculate technical indicators
    const rsi = this.calculateRSI(history);
    const macd = this.calculateMACD(history);
    const bb = this.calculateBollingerBands(history);
    const sma20 = this.calculateSMA(history, 20);
    const ema12 = this.calculateEMA(history, 12);
    
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

  calculateRSI(data, period = 14) {
    if (data.length < period) return 50;
    
    let gains = 0;
    let losses = 0;
    
    for (let i = 1; i < period; i++) {
      const change = data[i].price - data[i-1].price;
      if (change > 0) gains += change;
      else losses -= change;
    }
    
    const avgGain = gains / period;
    const avgLoss = losses / period;
    const rs = avgGain / avgLoss;
    
    return 100 - (100 / (1 + rs));
  }

  calculateMACD(data) {
    const ema12 = this.calculateEMA(data, 12);
    const ema26 = this.calculateEMA(data, 26);
    const macd = ema12 - ema26;
    
    return {
      macd,
      signal: macd * 0.9, // Simplified signal line
      histogram: macd * 0.1
    };
  }

  calculateBollingerBands(data, period = 20) {
    const sma = this.calculateSMA(data, period);
    const variance = data.slice(-period).reduce((sum, item) => 
      sum + Math.pow(item.price - sma, 2), 0) / period;
    const stdDev = Math.sqrt(variance);
    
    return {
      upper: sma + (stdDev * 2),
      middle: sma,
      lower: sma - (stdDev * 2)
    };
  }

  calculateSMA(data, period) {
    if (data.length < period) return 0;
    const sum = data.slice(-period).reduce((sum, item) => sum + item.price, 0);
    return sum / period;
  }

  calculateEMA(data, period) {
    if (data.length < period) return 0;
    const multiplier = 2 / (period + 1);
    let ema = this.calculateSMA(data.slice(0, period), period);
    
    for (let i = period; i < data.length; i++) {
      ema = (data[i].price * multiplier) + (ema * (1 - multiplier));
    }
    
    return ema;
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

  async initializePriceFeeds() {
    // Initialize market data for all symbols
    const symbols = ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 'EURGBP', 'EURJPY', 'GBPJPY', 'BTCUSD', 'ETHUSD', 'ADAUSD', 'DOTUSD', 'AAPL', 'GOOGL', 'TSLA', 'MSFT', 'GOLD', 'SILVER', 'OIL', 'NGAS'];
    
    symbols.forEach(symbol => {
      const basePrice = this.getBasePriceForSymbol(symbol);
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

  async placeTrade(tradeData) {
    try {
      const { userId, assetId, direction, stake, duration, mode } = tradeData;
      
      // Validate trade parameters
      if (!userId || !assetId || !direction || !stake || !duration) {
        throw new Error('Missing required trade parameters');
      }
      
      // Get asset details
      const [assets] = await this.db.execute(`
        SELECT * FROM assets WHERE id = ? AND status = 'active'
      `, [assetId]);
      
      if (!assets.length) {
        throw new Error('Invalid or inactive asset');
      }
      
      const asset = assets[0];
      const currentPrice = await this.getCurrentPrice(asset.symbol);
      
      if (!currentPrice) {
        throw new Error('Price not available for this asset');
      }
      
      // Calculate end time
      const startTime = new Date();
      const endTime = new Date(startTime.getTime() + (duration * 60 * 1000));
      
      // Insert trade record
      const [result] = await this.db.execute(`
        INSERT INTO trades 
        (user_id, asset_id, direction, stake, duration_minutes, start_time, end_time, entry_price, mode, result)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
      `, [userId, assetId, direction, stake, duration, startTime, endTime, currentPrice, mode]);
      
      const tradeId = result.insertId;
      
      // Add to active trades
      const trade = {
        id: tradeId,
        user_id: userId,
        asset_id: assetId,
        asset_symbol: asset.symbol,
        direction,
        stake,
        duration_minutes: duration,
        start_time: startTime,
        end_time: endTime,
        entry_price: currentPrice,
        mode,
        result: 'pending',
        return_percent: asset.return_percent
      };
      
      this.activeTrades.set(tradeId, trade);
      
      // Deduct stake from user balance
      const walletField = mode === 'real' ? 'wallet_real' : 'wallet_demo';
      await this.db.execute(`
        UPDATE users 
        SET ${walletField} = ${walletField} - ? 
        WHERE id = ?
      `, [stake, userId]);
      
      // Record transaction
      await this.db.execute(`
        INSERT INTO wallet_transactions 
        (user_id, type, amount, mode, description, reference_id, created_at) 
        VALUES (?, 'trade_stake', ?, ?, ?, ?, NOW())
      `, [userId, -stake, mode, `Stake for ${asset.symbol} trade`, tradeId]);
      
      return {
        success: true,
        tradeId,
        trade,
        message: 'Trade placed successfully'
      };
      
    } catch (error) {
      console.error('Error placing trade:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getTradeHistory(userId, limit = 50) {
    try {
      const [trades] = await this.db.execute(`
        SELECT t.*, a.name as asset_name, a.symbol as asset_symbol
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
    const symbols = Array.from(this.marketData.keys());
    const analysis = {
      marketSentiment: {
        overall: Math.random() > 0.5 ? 'BULLISH' : 'BEARISH',
        strength: Math.floor(Math.random() * 100),
        volatility: Math.floor(Math.random() * 100)
      },
      topMovers: [],
      signals: Array.from(this.signals.values()).slice(0, 5),
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
        },
        {
          time: '08:30',
          country: 'GBP',
          event: 'GDP Growth Rate',
          impact: 'MEDIUM',
          forecast: '0.2%',
          previous: '0.1%'
        }
      ]
    };
    
    // Calculate top movers
    symbols.forEach(symbol => {
      const prices = this.getCurrentPrices();
      if (prices[symbol]) {
        analysis.topMovers.push({
          symbol,
          change: prices[symbol].changePercent,
          price: prices[symbol].price
        });
      }
    });
    
    // Sort by absolute change
    analysis.topMovers.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
    analysis.topMovers = analysis.topMovers.slice(0, 5);
    
    return analysis;
  }

  getActiveTradesForUser(userId) {
    return Array.from(this.activeTrades.values()).filter(trade => trade.user_id === userId);
  }

  async getUserTradingStats(userId) {
    try {
      const [stats] = await this.db.execute(`
        SELECT 
          COUNT(*) as total_trades,
          SUM(CASE WHEN result = 'win' THEN 1 ELSE 0 END) as total_wins,
          SUM(CASE WHEN result = 'loss' THEN 1 ELSE 0 END) as total_losses,
          SUM(stake) as total_invested,
          SUM(payout) as total_earned,
          AVG(stake) as avg_stake
        FROM trades 
        WHERE user_id = ?
      `, [userId]);
      
      const userStats = stats[0];
      const winRate = userStats.total_trades > 0 ? 
        (userStats.total_wins / userStats.total_trades) * 100 : 0;
      
      return {
        ...userStats,
        win_rate: winRate,
        profit_loss: userStats.total_earned - userStats.total_invested
      };
    } catch (error) {
      console.error('Error getting user trading stats:', error);
      return null;
    }
  }
}

module.exports = TradingEngine;
