#!/bin/bash

echo "🗄️ Setting up database..."

# Push the schema to create tables
npx prisma db push --accept-data-loss

echo "✅ Database setup complete!"

# Start the application
npm start
