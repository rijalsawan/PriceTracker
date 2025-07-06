# Database Setup Guide for Amazon Price Tracker

## Option 1: Install PostgreSQL (Recommended for Production)

### 1. Download and Install PostgreSQL
- Go to: https://www.postgresql.org/download/windows/
- Download PostgreSQL installer for Windows
- Run installer and follow setup wizard
- **Remember the password you set for the `postgres` user**

### 2. Create Database
After installation, open Command Prompt or PowerShell as Administrator:

```bash
# Connect to PostgreSQL (will prompt for password)
psql -U postgres -h localhost

# Create the database
CREATE DATABASE pricetracker;

# Create a user (optional but recommended)
CREATE USER pricetracker_user WITH PASSWORD 'your_password_here';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE pricetracker TO pricetracker_user;

# Exit psql
\q
```

### 3. Update Environment Variables
Edit `backend/.env` file:

```env
# Replace with your actual database credentials
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/pricetracker?schema=public"

# Or if you created a specific user:
# DATABASE_URL="postgresql://pricetracker_user:your_password@localhost:5432/pricetracker?schema=public"
```

### 4. Run Database Migrations
```bash
cd backend
npm run prisma:migrate
```

## Option 2: Use SQLite (Quick Setup for Development)

If you want to get started quickly without installing PostgreSQL:

### 1. Update Prisma Schema
Edit `backend/prisma/schema.prisma` and change the database provider:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}
```

### 2. Update Environment Variables
Edit `backend/.env`:

```env
DATABASE_URL="file:./dev.db"
```

### 3. Regenerate Prisma Client and Run Migrations
```bash
cd backend
npm run prisma:generate
npm run prisma:migrate
```

## Option 3: Use Docker PostgreSQL (Advanced)

If you have Docker installed:

```bash
# Run PostgreSQL in Docker
docker run --name postgres-pricetracker -e POSTGRES_PASSWORD=password123 -e POSTGRES_DB=pricetracker -p 5432:5432 -d postgres:13

# Update backend/.env
DATABASE_URL="postgresql://postgres:password123@localhost:5432/pricetracker?schema=public"

# Run migrations
cd backend
npm run prisma:migrate
```

## Verification

After setting up the database, verify it works:

```bash
cd backend
npm run prisma:studio
```

This should open Prisma Studio in your browser if the database connection is working.
