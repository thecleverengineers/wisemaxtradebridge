
# Fixed-Time Trading Platform

A comprehensive full-stack trading platform similar to Olymp Trade and IQ Option, built with React, Node.js, and MySQL.

## 🚀 Features

### 🔐 Authentication & User Management
- JWT-based authentication with bcrypt password hashing
- Email + OTP verification (optional)
- Dual wallet system (Real + Demo modes)
- KYC status tracking
- Admin user management with activation/deactivation

### 💹 Trading Engine
- Fixed-time binary options trading
- Multiple asset categories (Forex, Crypto, Stocks, Commodities)
- Configurable trade durations (1m, 3m, 5m, 15m, 30m)
- Real-time price feeds via WebSocket
- Automatic trade settlement
- Profit/Loss calculation with configurable return rates

### 📈 Real-Time Price Feeds
- Integration with Binance API for crypto prices
- WebSocket-based real-time price updates
- Mock data for forex and other assets
- Price history tracking
- Live candlestick charts

### 🎮 Demo Mode & Tournaments
- Switch between real and demo trading
- Tournament system with leaderboards
- Profit percentage-based rankings
- Configurable prize pools and entry fees

### 🎁 Multi-Level Referral System
- 3-level referral commission structure
- Unique referral codes for each user
- Automated commission distribution
- Referral tree visualization for admins

### 📊 Comprehensive Admin Panel
- User management (KYC approval, account status)
- Asset management (add/edit trading instruments)
- Tournament creation and management
- Platform statistics and analytics
- Wallet balance management
- Settings configuration

### 💸 Payment Integration
- Razorpay integration for deposits
- Withdrawal request management
- Transaction history and ledger
- Admin approval workflow for withdrawals

### 🛡️ Security Features
- Rate limiting for authentication
- Secure JWT with expiration
- Password hashing with bcrypt
- IP whitelisting for admin access (optional)
- Input validation and sanitization

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Socket.io Client** for real-time updates
- **Chart.js** for price charts
- **React Router** for navigation
- **Shadcn/ui** components

### Backend
- **Node.js** with Express.js
- **MySQL** database
- **Socket.io** for WebSocket communication
- **JWT** for authentication
- **bcrypt** for password hashing
- **Nodemailer** for email services

### APIs & Integrations
- **Binance API** for crypto prices
- **Alpha Vantage** (optional) for stock data
- **Razorpay** for payment processing
- **WebSocket** for real-time communication

## 📋 Prerequisites

- Node.js (v16 or higher)
- MySQL (v8.0 or higher)
- npm or yarn package manager

## ⚡ Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/trading-platform.git
cd trading-platform
```

### 2. Database Setup
```bash
# Create MySQL database
mysql -u root -p
CREATE DATABASE trading_platform;

# Import schema
mysql -u root -p trading_platform < database/schema.sql
```

### 3. Backend Setup
```bash
cd backend
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
# DB_HOST, DB_USER, DB_PASSWORD, JWT_SECRET, etc.

# Start backend server
npm run dev
```

### 4. Frontend Setup
```bash
# In root directory
npm install

# Start development server
npm start
```

### 5. Access the Platform
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Admin Panel**: http://localhost:3000/admin

## 🐳 Docker Deployment

### Using Docker Compose
```bash
# Copy environment file
cp .env.example .env

# Edit .env with production values

# Start all services
docker-compose up -d

# Check logs
docker-compose logs -f
```

### Individual Container Build
```bash
# Backend
cd backend
docker build -t trading-backend .

# Frontend
docker build -f Dockerfile.frontend -t trading-frontend .
```

## 📁 Project Structure

```
trading-platform/
├── backend/
│   ├── server.js              # Main server file
│   ├── services/
│   │   └── priceService.js    # Price feed service
│   ├── routes/                # API routes
│   ├── middleware/            # Express middleware
│   └── utils/                 # Utility functions
├── database/
│   └── schema.sql             # Database schema
├── src/
│   ├── pages/
│   │   ├── TradingPlatform.tsx # Main trading interface
│   │   └── AdminPanel.tsx     # Admin dashboard
│   ├── components/            # Reusable components
│   └── contexts/              # React contexts
├── docker-compose.yml         # Docker configuration
└── README.md
```

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=trading_platform

# Authentication
JWT_SECRET=your_super_secret_key

# APIs
BINANCE_API_KEY=your_binance_key
ALPHA_VANTAGE_KEY=your_av_key

# Payment
RAZORPAY_KEY_ID=your_razorpay_id
RAZORPAY_KEY_SECRET=your_razorpay_secret

# Email
SMTP_HOST=smtp.gmail.com
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

#### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_WS_URL=ws://localhost:5000
```

## 📊 Database Schema

### Key Tables
- **users**: User accounts with wallet balances
- **trades**: Trading history and active positions
- **assets**: Trading instruments configuration
- **wallet_transactions**: Financial transaction ledger
- **referrals**: Multi-level referral relationships
- **tournaments**: Tournament management
- **payment_requests**: Deposit/withdrawal requests

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Trading
- `GET /api/assets` - Get available assets
- `POST /api/trades` - Place new trade
- `GET /api/trades` - Get user trades
- `GET /api/trades/:id/result` - Get trade result

### Admin
- `GET /api/admin/stats` - Platform statistics
- `GET /api/admin/users` - User management
- `POST /api/admin/assets` - Add new asset
- `PUT /api/admin/assets/:id` - Update asset

### WebSocket Events
- `priceUpdate` - Real-time price updates
- `tradeResult` - Trade settlement notifications
- `tournamentUpdate` - Tournament status updates

## 🚀 Deployment

### Production Checklist
- [ ] Set strong JWT secret
- [ ] Configure production database
- [ ] Set up SSL certificates
- [ ] Configure payment gateway
- [ ] Set up email service
- [ ] Enable rate limiting
- [ ] Configure monitoring
- [ ] Set up backups

### Scaling Considerations
- Use Redis for session storage
- Implement database read replicas
- Set up load balancer for API
- Use CDN for static assets
- Implement caching strategies

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
npm test
```

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Email: support@tradingplatform.com
- Documentation: [Wiki](https://github.com/your-username/trading-platform/wiki)

## ⚠️ Disclaimer

This software is for educational purposes only. Trading financial instruments carries risk. Users should understand the risks involved and trade responsibly.
