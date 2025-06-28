
class TechnicalIndicators {
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
}

module.exports = TechnicalIndicators;
