#!/bin/bash

# Amazon Price Tracker Setup Script

echo "🚀 Setting up Amazon Price Tracker..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ first."
    exit 1
fi

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "⚠️  PostgreSQL is not installed. Please install PostgreSQL first."
    echo "   You can download it from: https://www.postgresql.org/download/"
fi

echo "📦 Installing backend dependencies..."
cd backend
npm install

echo "🔧 Setting up environment variables..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ Created .env file. Please update it with your database and email settings."
else
    echo "✅ .env file already exists."
fi

echo "🗄️  Setting up database..."
npx prisma generate
echo "✅ Prisma client generated."

echo "📦 Installing frontend dependencies..."
cd ../frontend
npm install

echo "🔧 Setting up frontend environment..."
if [ ! -f .env ]; then
    echo "REACT_APP_API_URL=http://localhost:5000/api" > .env
    echo "✅ Created frontend .env file."
else
    echo "✅ Frontend .env file already exists."
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Set up your PostgreSQL database"
echo "2. Update backend/.env with your database URL"
echo "3. Run database migrations: cd backend && npx prisma migrate dev"
echo "4. Configure email settings in backend/.env (optional)"
echo "5. Start the backend: cd backend && npm run dev"
echo "6. Start the frontend: cd frontend && npm start"
echo ""
echo "📖 For detailed instructions, see README.md"
