# 🚨 URGENT: Railway Environment Variables Setup

## Go to Railway Dashboard → Your Backend Service → Variables

Add these environment variables:

```bash
NODE_ENV=production
PORT=8080
JWT_SECRET=your-super-secret-jwt-key-make-it-very-long-and-secure-123456789
JWT_EXPIRE=7d
FRONTEND_URL=https://price-tracker-murex.vercel.app
SCRAPING_INTERVAL_HOURS=24

# Email (optional for now - you can skip these)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

## ⚠️ IMPORTANT: DATABASE_URL should already be set by Railway PostgreSQL

## After adding variables:
1. Railway will auto-redeploy
2. Check the logs for any errors
3. Test the API again

## Quick Test:
Visit this URL directly in browser:
https://pricetracker-production-f9e3.up.railway.app

Should show: {"message":"Price Tracker API is running"}
