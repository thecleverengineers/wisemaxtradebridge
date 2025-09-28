
const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const axios = require('axios');
const rateLimit = require('express-rate-limit');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many login attempts, please try again later.'
});

// Database connection
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'trading_platform',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

// JWT middleware
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const [rows] = await pool.execute('SELECT * FROM users WHERE id = ? AND is_active = TRUE', [decoded.userId]);
    
    if (rows.length === 0) {
      return res.status(403).json({ error: 'User not found or inactive' });
    }

    req.user = rows[0];
    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid token' });
  }
};

// Admin middleware
const requireAdmin = (req, res, next) => {
  if (!req.user.is_admin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Utility function to generate referral code
const generateReferralCode = () => {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
};

// Email service setup (configure with your email provider)
const emailTransporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// ===== AUTH ROUTES =====

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, phone, referralCode } = req.body;

    // Check if user exists
    const [existingUsers] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate unique referral code
    let refCode;
    let isUnique = false;
    while (!isUnique) {
      refCode = generateReferralCode();
      const [existing] = await pool.execute('SELECT id FROM users WHERE ref_code = ?', [refCode]);
      if (existing.length === 0) isUnique = true;
    }

    // Find referrer if code provided
    let referrerId = null;
    if (referralCode) {
      const [referrer] = await pool.execute('SELECT id FROM users WHERE ref_code = ?', [referralCode]);
      if (referrer.length > 0) {
        referrerId = referrer[0].id;
      }
    }

    // Create user
    const [result] = await pool.execute(
      'INSERT INTO users (name, email, password, phone, ref_code, referred_by) VALUES (?, ?, ?, ?, ?, ?)',
      [name, email, hashedPassword, phone, refCode, referrerId]
    );

    const userId = result.insertId;

    // Create referral relationships if referred
    if (referrerId) {
      const referralLevels = [
        { level: 1, rate: 10 },
        { level: 2, rate: 5 },
        { level: 3, rate: 2 }
      ];

      let currentReferrer = referrerId;
      for (const { level, rate } of referralLevels) {
        if (currentReferrer) {
          await pool.execute(
            'INSERT INTO referrals (user_id, referred_id, level, commission_rate) VALUES (?, ?, ?, ?)',
            [currentReferrer, userId, level, rate]
          );

          // Get next level referrer
          const [nextLevel] = await pool.execute('SELECT referred_by FROM users WHERE id = ?', [currentReferrer]);
          currentReferrer = nextLevel[0]?.referred_by || null;
        }
      }
    }

    // Generate JWT token
    const token = jwt.sign({ userId }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '7d' });

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: userId,
        name,
        email,
        refCode,
        walletReal: 0,
        walletDemo: 10000
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
app.post('/api/auth/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    const [users] = await pool.execute(
      'SELECT * FROM users WHERE email = ? AND is_active = TRUE',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '7d' });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        refCode: user.ref_code,
        walletReal: user.wallet_real,
        walletDemo: user.wallet_demo,
        kycStatus: user.kyc_status,
        isAdmin: user.is_admin
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ===== TRADING ROUTES =====

// Get assets
app.get('/api/assets', async (req, res) => {
  try {
    const [assets] = await pool.execute('SELECT * FROM assets WHERE status = "active" ORDER BY category, name');
    res.json(assets);
  } catch (error) {
    console.error('Assets fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch assets' });
  }
});

// Place trade
app.post('/api/trades', authenticateToken, async (req, res) => {
  try {
    const { assetId, direction, stake, duration, mode, entryPrice } = req.body;
    const userId = req.user.id;

    // Validate inputs
    if (!['UP', 'DOWN'].includes(direction)) {
      return res.status(400).json({ error: 'Invalid direction' });
    }

    if (!['real', 'demo'].includes(mode)) {
      return res.status(400).json({ error: 'Invalid mode' });
    }

    // Check balance
    const walletField = mode === 'real' ? 'wallet_real' : 'wallet_demo';
    if (req.user[walletField] < stake) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Get asset details
    const [assets] = await pool.execute('SELECT * FROM assets WHERE id = ? AND status = "active"', [assetId]);
    if (assets.length === 0) {
      return res.status(400).json({ error: 'Asset not found' });
    }

    const asset = assets[0];
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + duration * 60000);

    // Create trade
    const [result] = await pool.execute(
      `INSERT INTO trades (user_id, asset_id, asset_symbol, direction, stake, duration_minutes, 
       start_time, end_time, entry_price, mode) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, assetId, asset.symbol, direction, stake, duration, startTime, endTime, entryPrice, mode]
    );

    // Deduct balance
    await pool.execute(
      `UPDATE users SET ${walletField} = ${walletField} - ? WHERE id = ?`,
      [stake, userId]
    );

    // Record transaction
    await pool.execute(
      'INSERT INTO wallet_transactions (user_id, type, amount, mode, description, reference_id) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, 'trade_stake', stake, mode, `Trade stake for ${asset.symbol}`, result.insertId]
    );

    res.json({
      message: 'Trade placed successfully',
      tradeId: result.insertId,
      endTime: endTime
    });
  } catch (error) {
    console.error('Trade placement error:', error);
    res.status(500).json({ error: 'Failed to place trade' });
  }
});

// Get user trades
app.get('/api/trades', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, mode } = req.query;
    const offset = (page - 1) * limit;
    
    let query = 'SELECT * FROM trades WHERE user_id = ?';
    let params = [req.user.id];
    
    if (mode) {
      query += ' AND mode = ?';
      params.push(mode);
    }
    
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [trades] = await pool.execute(query, params);
    res.json(trades);
  } catch (error) {
    console.error('Trades fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch trades' });
  }
});

// ===== WALLET ROUTES =====

// Get wallet balance
app.get('/api/wallet', authenticateToken, async (req, res) => {
  try {
    const [users] = await pool.execute('SELECT wallet_real, wallet_demo FROM users WHERE id = ?', [req.user.id]);
    res.json(users[0]);
  } catch (error) {
    console.error('Wallet fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch wallet' });
  }
});

// Get wallet transactions
app.get('/api/wallet/transactions', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, mode } = req.query;
    const offset = (page - 1) * limit;
    
    let query = 'SELECT * FROM wallet_transactions WHERE user_id = ?';
    let params = [req.user.id];
    
    if (mode) {
      query += ' AND mode = ?';
      params.push(mode);
    }
    
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [transactions] = await pool.execute(query, params);
    res.json(transactions);
  } catch (error) {
    console.error('Transactions fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// ===== REFERRAL ROUTES =====

// Get referral info
app.get('/api/referrals', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get referral stats
    const [stats] = await pool.execute(`
      SELECT 
        COUNT(*) as total_referrals,
        SUM(total_earned) as total_earned,
        level
      FROM referrals 
      WHERE user_id = ? 
      GROUP BY level
    `, [userId]);

    // Get recent referrals
    const [recentReferrals] = await pool.execute(`
      SELECT u.name, u.email, r.level, r.total_earned, r.created_at
      FROM referrals r
      JOIN users u ON r.referred_id = u.id
      WHERE r.user_id = ?
      ORDER BY r.created_at DESC
      LIMIT 10
    `, [userId]);

    res.json({
      stats,
      recentReferrals,
      referralCode: req.user.ref_code
    });
  } catch (error) {
    console.error('Referrals fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch referrals' });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Export for testing
module.exports = app;
