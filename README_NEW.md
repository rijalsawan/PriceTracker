# 🛒 Amazon Price Tracker

A full-stack application for tracking Amazon product prices with intelligent monitoring and notifications.

![Price Tracker](https://img.shields.io/badge/Price-Tracker-blue)
![React](https://img.shields.io/badge/React-19.1.0-blue)
![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3.3-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue)

## ✨ Features

### 🔍 **Product Search & Discovery**
- **In-app Amazon search** with real-time suggestions
- **Add products by URL** - supports all Amazon URL formats
- **Beautiful product cards** with images, ratings, and prices
- **Responsive design** optimized for all devices

### 📊 **Price Tracking & History**
- **Real-time price monitoring** with automated checks
- **Interactive price charts** using Chart.js
- **Price change notifications** via email
- **Historical data visualization** for informed decisions

### 🎯 **Smart Features**
- **Search state persistence** - maintain search context across navigation
- **Target price alerts** - get notified when prices drop below your threshold
- **User authentication** with JWT tokens
- **Modern UI/UX** with Tailwind CSS and smooth animations

### 🚀 **Technical Highlights**
- **Cheerio-based scraping** for reliable Amazon data extraction
- **PostgreSQL database** with Prisma ORM
- **RESTful API** with comprehensive error handling
- **Responsive design** with mobile-first approach

## 🏗️ Tech Stack

### **Frontend**
- **React 19.1** with TypeScript
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Chart.js** for data visualization
- **Axios** for API communication
- **React Hot Toast** for notifications

### **Backend**
- **Node.js** with Express
- **TypeScript** for type safety
- **Prisma ORM** with PostgreSQL
- **JWT** for authentication
- **Cheerio** for web scraping
- **Nodemailer** for email notifications
- **Rate limiting** and security middleware

### **Deployment**
- **Frontend**: Vercel
- **Backend**: Railway
- **Database**: Railway PostgreSQL

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Git

### 1. Clone the Repository
```bash
git clone <repository-url>
cd PriceTracker
```

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with your backend URL
npm start
```

### 4. Database Setup
```bash
cd backend
npx prisma migrate dev
npx prisma generate
```

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```bash
NODE_ENV=production
PORT=8000
DATABASE_URL=postgresql://username:password@host:port/database
JWT_SECRET=your-super-secret-jwt-key
FRONTEND_URL=https://your-frontend.vercel.app
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

#### Frontend (.env)
```bash
REACT_APP_API_URL=https://your-backend.railway.app/api
```

## 🚀 Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions for Railway and Vercel.

### Quick Deploy

1. **Backend to Railway**:
   - Connect GitHub repository
   - Add PostgreSQL database
   - Configure environment variables
   - Deploy automatically

2. **Frontend to Vercel**:
   - Import from GitHub
   - Set build command: `npm run build`
   - Add environment variables
   - Deploy automatically

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Products
- `GET /api/products` - Get user's tracked products
- `POST /api/products` - Add product to tracking
- `PUT /api/products/:id` - Update product settings
- `DELETE /api/products/:id` - Remove product

### Search
- `GET /api/search/products` - Search Amazon products
- `GET /api/search/suggestions` - Get search suggestions
- `GET /api/search/product/:asin` - Get product details

## 🛡️ Security Features

- **JWT Authentication** with secure token handling
- **Rate Limiting** to prevent abuse
- **Input Validation** with Zod schemas
- **CORS Configuration** for cross-origin requests
- **Helmet.js** for security headers
- **Password Hashing** with bcryptjs

## 🎨 UI/UX Features

- **Modern Design** with glassmorphism effects
- **Smooth Animations** and transitions
- **Responsive Layout** for all screen sizes
- **Dark Mode Support** (coming soon)
- **Accessibility** compliant design
- **Loading States** and error handling

## 🔄 Development

### Available Scripts

#### Backend
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run prisma:studio # Open Prisma Studio
```

#### Frontend
```bash
npm start            # Start development server
npm run build        # Build for production
npm test             # Run tests
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Amazon** for product data
- **Railway** for backend hosting
- **Vercel** for frontend hosting
- **Heroicons** for beautiful icons
- **Tailwind CSS** for styling system

## 📞 Support

If you encounter any issues or have questions:

1. Check the [DEPLOYMENT.md](DEPLOYMENT.md) guide
2. Review the troubleshooting section
3. Open an issue on GitHub
4. Check logs in Railway/Vercel dashboards

---

**Built with ❤️ for smart shoppers everywhere!**
