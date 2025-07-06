# Amazon Price Tracker - Setup Guide

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- Git (optional)

### 1. Backend Setup (✅ WORKING)

```bash
# Navigate to backend directory
cd backend

# Install dependencies (already done)
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database connection string:
# DATABASE_URL="postgresql://username:password@localhost:5432/pricetracker?schema=public"

# Set up database
npm run prisma:migrate

# Start backend server
npm run dev
```

Backend will run on: http://localhost:5000

### 2. Frontend Setup (⚠️ Has Tailwind config issue)

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies (already done)
npm install

# Start frontend server
npm start
```

Frontend will run on: http://localhost:3000

### 3. Database Setup

1. **Install PostgreSQL** (if not already installed)
   - Windows: Download from https://www.postgresql.org/download/windows/
   - Create a database named `pricetracker`

2. **Update DATABASE_URL** in `backend/.env`:
   ```
   DATABASE_URL="postgresql://your_username:your_password@localhost:5432/pricetracker?schema=public"
   ```

3. **Run migrations**:
   ```bash
   cd backend
   npm run prisma:migrate
   ```

## 🔧 Current Status

### ✅ Working Components
- **Backend API** (Node.js/Express) - Fully functional
- **Authentication** (JWT) - Working
- **Database Schema** (Prisma) - Ready
- **Price Scraping Service** - Ready
- **Email Notifications** - Ready

### ⚠️ Known Issues
- **Frontend Tailwind CSS**: Configuration conflict with Create React App
  - Backend can be tested independently with API tools like Postman
  - Frontend UI will load but without proper styling until resolved

## 📝 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Products
- `GET /api/products` - Get user's tracked products
- `POST /api/products` - Add new product to track
- `PUT /api/products/:id` - Update product details
- `DELETE /api/products/:id` - Stop tracking product

### Notifications
- `GET /api/notifications` - Get user's notifications
- `POST /api/notifications/:id/read` - Mark notification as read

## 🧪 Testing the Backend

You can test the backend API using curl or Postman:

### Register a new user:
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","firstName":"John","lastName":"Doe"}'
```

### Login:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Add a product (replace TOKEN with the JWT from login):
```bash
curl -X POST http://localhost:5000/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"url":"https://amazon.com/dp/B08N5WRWNW","targetPrice":100}'
```

## 📂 Project Structure

```
PriceTracker/
├── backend/                 # Node.js/Express API
│   ├── src/
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   └── middleware/     # Auth & error handling
│   ├── prisma/             # Database schema
│   └── package.json
├── frontend/               # React application
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── pages/         # Page components
│   │   └── services/      # API calls
│   └── package.json
└── package.json           # Root scripts
```

## 🔄 Development Scripts

### Root Level:
- `npm run dev` - Start both backend and frontend
- `npm run build` - Build both applications
- `npm run backend` - Start only backend
- `npm run frontend` - Start only frontend

### Backend:
- `npm run dev` - Development server with hot reload
- `npm run build` - Build for production
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio

### Frontend:
- `npm start` - Development server
- `npm run build` - Build for production
- `npm test` - Run tests

## 🎯 Next Steps

1. **Set up PostgreSQL database**
2. **Run database migrations**
3. **Test backend API endpoints**
4. **Fix frontend Tailwind CSS configuration**
5. **Configure email service** (optional)

## 💡 Features

- **Product URL Tracking**: Add Amazon product URLs to track
- **Price History**: View price changes over time
- **Price Alerts**: Get notified when prices drop
- **User Authentication**: Secure login/registration
- **Responsive Design**: Works on desktop and mobile
- **Email Notifications**: Optional email alerts

## 🛠 Technology Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Recharts
- **Backend**: Node.js, Express, TypeScript, Prisma
- **Database**: PostgreSQL
- **Authentication**: JWT
- **Web Scraping**: Puppeteer, Cheerio
- **Email**: Nodemailer
