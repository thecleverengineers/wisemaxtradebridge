
-- Fixed-Time Trading Platform Database Schema
-- Similar to Olymp Trade / IQ Option

CREATE DATABASE IF NOT EXISTS trading_platform;
USE trading_platform;

-- Users table with wallet system and referral support
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    kyc_status ENUM('pending', 'verified', 'rejected') DEFAULT 'pending',
    wallet_real DECIMAL(15,2) DEFAULT 0.00,
    wallet_demo DECIMAL(15,2) DEFAULT 10000.00,
    ref_code VARCHAR(20) UNIQUE NOT NULL,
    referred_by INT,
    is_active BOOLEAN DEFAULT TRUE,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (referred_by) REFERENCES users(id)
);

-- Assets table for trading instruments
CREATE TABLE assets (
    id INT PRIMARY KEY AUTO_INCREMENT,
    symbol VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    category ENUM('forex', 'crypto', 'stocks', 'commodities') NOT NULL,
    return_percent DECIMAL(5,2) DEFAULT 80.00,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Trades table with comprehensive tracking
CREATE TABLE trades (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    asset_id INT NOT NULL,
    asset_symbol VARCHAR(20) NOT NULL,
    direction ENUM('UP', 'DOWN') NOT NULL,
    stake DECIMAL(10,2) NOT NULL,
    duration_minutes INT NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    entry_price DECIMAL(15,8) NOT NULL,
    exit_price DECIMAL(15,8),
    result ENUM('win', 'loss', 'pending') DEFAULT 'pending',
    payout DECIMAL(10,2) DEFAULT 0.00,
    mode ENUM('real', 'demo') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (asset_id) REFERENCES assets(id),
    INDEX idx_user_trades (user_id, created_at),
    INDEX idx_pending_trades (result, end_time)
);

-- Wallet transactions ledger
CREATE TABLE wallet_transactions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    type ENUM('deposit', 'withdrawal', 'trade_stake', 'trade_payout', 'referral_bonus', 'admin_credit', 'admin_debit') NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    mode ENUM('real', 'demo') NOT NULL,
    description TEXT,
    reference_id VARCHAR(100),
    status ENUM('pending', 'completed', 'failed') DEFAULT 'completed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_user_transactions (user_id, created_at)
);

-- Referral system
CREATE TABLE referrals (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    referred_id INT NOT NULL,
    level INT NOT NULL DEFAULT 1,
    commission_rate DECIMAL(5,2) NOT NULL,
    total_earned DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (referred_id) REFERENCES users(id),
    UNIQUE KEY unique_referral (user_id, referred_id)
);

-- Tournaments
CREATE TABLE tournaments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    prize_pool DECIMAL(12,2) NOT NULL,
    entry_fee DECIMAL(10,2) DEFAULT 0.00,
    max_participants INT,
    status ENUM('upcoming', 'active', 'completed', 'cancelled') DEFAULT 'upcoming',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tournament entries and leaderboard
CREATE TABLE tournament_entries (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tournament_id INT NOT NULL,
    user_id INT NOT NULL,
    profit_percent DECIMAL(8,4) DEFAULT 0.0000,
    total_trades INT DEFAULT 0,
    winning_trades INT DEFAULT 0,
    final_rank INT,
    prize_amount DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE KEY unique_entry (tournament_id, user_id)
);

-- Deposit and withdrawal requests
CREATE TABLE payment_requests (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    type ENUM('deposit', 'withdrawal') NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    payment_method VARCHAR(50),
    payment_details JSON,
    status ENUM('pending', 'approved', 'rejected', 'completed') DEFAULT 'pending',
    admin_notes TEXT,
    transaction_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Admin settings and configurations
CREATE TABLE admin_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Price history for charts (optional, can use external API)
CREATE TABLE price_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    asset_symbol VARCHAR(20) NOT NULL,
    price DECIMAL(15,8) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_asset_time (asset_symbol, timestamp)
);

-- Insert default assets
INSERT INTO assets (symbol, name, category, return_percent) VALUES
('BTCUSD', 'Bitcoin/USD', 'crypto', 85.00),
('ETHUSD', 'Ethereum/USD', 'crypto', 85.00),
('EURUSD', 'Euro/USD', 'forex', 80.00),
('GBPUSD', 'British Pound/USD', 'forex', 80.00),
('USDJPY', 'USD/Japanese Yen', 'forex', 80.00),
('AAPL', 'Apple Inc.', 'stocks', 75.00),
('GOOGL', 'Alphabet Inc.', 'stocks', 75.00),
('GOLD', 'Gold', 'commodities', 70.00),
('OIL', 'Crude Oil', 'commodities', 70.00);

-- Insert admin settings
INSERT INTO admin_settings (setting_key, setting_value, description) VALUES
('min_deposit', '10', 'Minimum deposit amount'),
('min_withdrawal', '20', 'Minimum withdrawal amount'),
('max_trade_amount', '1000', 'Maximum trade stake amount'),
('referral_level1_percent', '10', 'Level 1 referral commission percentage'),
('referral_level2_percent', '5', 'Level 2 referral commission percentage'),
('referral_level3_percent', '2', 'Level 3 referral commission percentage'),
('demo_wallet_amount', '10000', 'Default demo wallet amount');

-- Create indexes for better performance
CREATE INDEX idx_trades_user_time ON trades(user_id, created_at DESC);
CREATE INDEX idx_trades_pending ON trades(result, end_time);
CREATE INDEX idx_wallet_transactions_user ON wallet_transactions(user_id, created_at DESC);
CREATE INDEX idx_referrals_user ON referrals(user_id);
CREATE INDEX idx_tournament_leaderboard ON tournament_entries(tournament_id, profit_percent DESC);
