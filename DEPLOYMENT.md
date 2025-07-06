# 🚀 Deployment Guide

This guide will help you deploy the Price Tracker application to Railway (backend) and Vercel (frontend).

## 📋 Prerequisites

- GitHub account
- Railway account (https://railway.app)
- Vercel account (https://vercel.com)
- Node.js 18+ installed locally

## 🛤️ Backend Deployment (Railway)

### 1. Push to GitHub
```bash
git add .
git commit -m "Prepare for deployment"
git push origin main
```

### 2. Deploy to Railway

1. **Go to Railway Dashboard**: https://railway.app
2. **Create New Project**: Click "New Project"
3. **Deploy from GitHub**: Select your repository
4. **Select Backend Folder**: Choose the `backend` directory
5. **Add PostgreSQL Database**: 
   - Click "New" → "Database" → "PostgreSQL"
   - Railway will automatically create a database and provide DATABASE_URL

### 3. Configure Environment Variables

In Railway dashboard, go to your backend service and add these environment variables:

```bash
NODE_ENV=production
PORT=8000
DATABASE_URL=(automatically provided by Railway PostgreSQL)
JWT_SECRET=your-super-secret-jwt-key-make-it-very-long-and-secure-123456789
JWT_EXPIRE=7d
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
FRONTEND_URL=https://your-vercel-app.vercel.app
SCRAPING_INTERVAL_HOURS=24
```

### 4. Deploy
Railway will automatically build and deploy your backend. Get your backend URL from the Railway dashboard.

## ▲ Frontend Deployment (Vercel)

### 1. Update Environment Variables

Update `frontend/.env` with your Railway backend URL:

```bash
REACT_APP_API_URL=https://your-railway-backend.railway.app/api
```

### 2. Deploy to Vercel

1. **Go to Vercel Dashboard**: https://vercel.com
2. **Import Project**: Click "New Project"
3. **Import from GitHub**: Select your repository
4. **Configure Project**:
   - Framework Preset: Create React App
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `build`

### 3. Environment Variables in Vercel

In Vercel project settings, add:

```bash
REACT_APP_API_URL=https://your-railway-backend.railway.app/api
```

### 4. Deploy
Vercel will automatically build and deploy your frontend.

## 🔧 Post-Deployment Steps

### 1. Update CORS Settings
Make sure your Railway backend allows requests from your Vercel domain. The backend should already be configured to use `FRONTEND_URL` environment variable.

### 2. Update Frontend URL in Railway
Update the `FRONTEND_URL` environment variable in Railway with your actual Vercel deployment URL.

### 3. Test the Application
- Visit your Vercel URL
- Test user registration/login
- Test product search and tracking
- Verify all features work correctly

## 🔍 Troubleshooting

### Backend Issues
- Check Railway logs for errors
- Verify all environment variables are set
- Ensure PostgreSQL database is connected

### Frontend Issues
- Check Vercel function logs
- Verify REACT_APP_API_URL is correct
- Check browser console for errors

### Database Issues
- Verify DATABASE_URL is correct
- Check if Prisma schema is applied correctly
- Railway PostgreSQL should auto-apply migrations

## 📞 Support

If you encounter issues:
1. Check Railway/Vercel logs
2. Verify environment variables
3. Test API endpoints directly
4. Check CORS configuration

## 🎉 You're Live!

Once deployed successfully:
- Backend: `https://your-railway-backend.railway.app`
- Frontend: `https://your-vercel-app.vercel.app`

Your Price Tracker application is now live and ready to track Amazon prices!
