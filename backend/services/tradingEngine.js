
const MarketDataService = require('./marketDataService');
const SignalService = require('./signalService');

class TradingEngine {
  constructor(io, db) {
    this.io = io;
    this.db = db;
    this.activeTrades = new Map();
    
    // Initialize services
    this.marketDataService = new MarketDataService(io);
    this.signalService = new SignalService(this.marketDataService);
    
    // Start all monitoring services
    this.startTradeMonitor();
    this.signalService.generateTradingSignals();
    this.marketDataService.startMarketDataStream();
    this.marketDataService.initializePriceFeeds();
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
        const currentPrice = await this.marketDataService.getCurrentPrice(trade.asset_symbol);
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
      const currentPrice = await this.marketDataService.getCurrentPrice(trade.asset_symbol);
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
      const currentPrice = await this.marketDataService.getCurrentPrice(asset.symbol);
      
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
    const symbols = Array.from(this.marketDataService.marketData.keys());
    const analysis = {
      marketSentiment: {
        overall: Math.random() > 0.5 ? 'BULLISH' : 'BEARISH',
        strength: Math.floor(Math.random() * 100),
        volatility: Math.floor(Math.random() * 100)
      },
      topMovers: [],
      signals: Array.from(this.signalService.getSignals().values()).slice(0, 5),
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
    const currentPrices = this.marketDataService.getCurrentPrices();
    symbols.forEach(symbol => {
      if (currentPrices[symbol]) {
        analysis.topMovers.push({
          symbol,
          change: currentPrices[symbol].changePercent,
          price: currentPrices[symbol].price
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
