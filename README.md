# Amazon Price Tracker

A full-stack web application that tracks Amazon product prices and notifies users when prices drop or reach target levels.

## Features

- 🔍 **Product Tracking**: Add Amazon products by URL and monitor price changes
- 🎯 **Target Prices**: Set desired price points and get notified when reached
- 📊 **Price History**: View detailed price charts and statistics with historical analysis
- 📈 **Enhanced Charts**: Interactive charts with multiple time period filters (1W, 1M, 3M, 6M, 1Y)
- � **Price Trends**: See price changes across different time periods with percentage indicators
- �🔔 **Smart Notifications**: Email alerts for price drops and target achievements
- 📱 **Responsive Design**: Modern, mobile-friendly interface
- 🔐 **User Authentication**: Secure user accounts with JWT
- ⚡ **Real-time Updates**: Automatic price checking with background jobs
- 🔄 **Robust Scraping**: Cheerio-based scraper with fallback mechanisms

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Recharts** for price visualization
- **Headless UI** for accessible components
- **React Hot Toast** for notifications

### Backend
- **Node.js** with Express.js
- **TypeScript** for type safety
- **Prisma ORM** with PostgreSQL
- **Puppeteer** for web scraping
- **Node Cron** for scheduled tasks
- **JWT** for authentication
- **Nodemailer** for email notifications

## Installation

### Prerequisites
- Node.js 16+ and npm
- PostgreSQL database
- Git

### 1. Clone the Repository
```bash
git clone <repository-url>
cd PriceTracker
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database and email settings

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Start development server
npm run dev
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Set up environment variables
# Create .env file with:
# REACT_APP_API_URL=http://localhost:5000/api

# Start development server
npm start
```

## Environment Variables

### Backend (.env)
```env
NODE_ENV=development
PORT=5000

# Database
DATABASE_URL="postgresql://username:password@localhost:5432/pricetracker?schema=public"

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d

# Email Configuration (for notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# App Configuration
FRONTEND_URL=http://localhost:3000
SCRAPING_INTERVAL_HOURS=24
```

### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:5000/api
```

## Database Setup

1. Install PostgreSQL on your system
2. Create a new database named `pricetracker`
3. Update the `DATABASE_URL` in your backend `.env` file
4. Run migrations: `npx prisma migrate dev`

## Email Configuration

To enable email notifications:

1. Use a Gmail account or other SMTP provider
2. For Gmail, enable 2-factor authentication and create an App Password
3. Update the email settings in your backend `.env` file

## Usage

### Adding Products

1. Register/Login to your account
2. Click "Add Product" on the dashboard
3. Paste an Amazon product URL
4. Optionally set a target price
5. Click "Add Product"

### Monitoring Prices

- The system automatically checks prices every hour
- View price history and charts on product detail pages
- **Enhanced Price Analysis**: See price trends for 1 week, 1 month, 3 months, 6 months, and 1 year
- **Price Change Indicators**: Percentage changes with up/down arrows for each time period
- **Interactive Charts**: Filter data by time period and view target price lines
- Receive email notifications for significant price changes
- Get alerts when target prices are reached

### Price History Feature

The app includes advanced price history analysis:
- **Multiple Time Periods**: View price trends across different timeframes
- **Historical Data**: Integration ready for Keepa API (see PRICE_HISTORY_GUIDE.md)
- **Demo Mode**: Generates realistic price variations for demonstration
- **Price Statistics**: Shows lowest, highest, and average prices
- **Smart Refresh**: Manual refresh button for updated historical data

For production use with real historical data, see `PRICE_HISTORY_GUIDE.md` for setup instructions.

### Managing Products

- Edit target prices and tracking status
- View detailed price statistics
- Delete products you no longer want to track

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Products
- `GET /api/products` - Get user's products
- `POST /api/products` - Add new product
- `GET /api/products/:id` - Get product details
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `GET /api/products/:id/history` - Get price history

### Notifications
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/:id/read` - Mark as read
- `DELETE /api/notifications/:id` - Delete notification

## Development

### Backend Commands
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start           # Start production server
npm run prisma:migrate  # Run database migrations
npm run prisma:studio   # Open Prisma Studio
```

### Frontend Commands
```bash
npm start           # Start development server
npm run build       # Build for production
npm test           # Run tests
```

## Deployment

### Backend Deployment
1. Set up a PostgreSQL database
2. Configure environment variables for production
3. Run `npm run build`
4. Start with `npm start`

### Frontend Deployment
1. Set `REACT_APP_API_URL` to your backend URL
2. Run `npm run build`
3. Serve the `build` folder with a static file server

## Security Considerations

- Change JWT secret in production
- Use environment variables for sensitive data
- Implement rate limiting for API endpoints
- Validate and sanitize all user inputs
- Use HTTPS in production

## Known Limitations

- Only supports Amazon product URLs
- Web scraping may be affected by Amazon's anti-bot measures
- Email notifications require SMTP configuration
- Price checking frequency is limited to avoid overloading Amazon

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:
- Check the GitHub Issues page
- Review the documentation
- Contact the development team

---

Happy price tracking! 🛒💰
