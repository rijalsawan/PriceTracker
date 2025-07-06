@echo off
echo 🚀 Setting up Amazon Price Tracker...

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 16+ first.
    exit /b 1
)

REM Check if PostgreSQL is installed
psql --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  PostgreSQL is not installed. Please install PostgreSQL first.
    echo    You can download it from: https://www.postgresql.org/download/
)

echo 📦 Installing backend dependencies...
cd backend
call npm install

echo 🔧 Setting up environment variables...
if not exist .env (
    copy .env.example .env
    echo ✅ Created .env file. Please update it with your database and email settings.
) else (
    echo ✅ .env file already exists.
)

echo 🗄️  Setting up database...
call npx prisma generate
echo ✅ Prisma client generated.

echo 📦 Installing frontend dependencies...
cd ../frontend
call npm install

echo 🔧 Setting up frontend environment...
if not exist .env (
    echo REACT_APP_API_URL=http://localhost:5000/api > .env
    echo ✅ Created frontend .env file.
) else (
    echo ✅ Frontend .env file already exists.
)

echo.
echo 🎉 Setup complete!
echo.
echo 📋 Next steps:
echo 1. Set up your PostgreSQL database
echo 2. Update backend/.env with your database URL
echo 3. Run database migrations: cd backend ^&^& npx prisma migrate dev
echo 4. Configure email settings in backend/.env (optional)
echo 5. Start the backend: cd backend ^&^& npm run dev
echo 6. Start the frontend: cd frontend ^&^& npm start
echo.
echo 📖 For detailed instructions, see README.md

pause
