# Price History Feature

## Overview

The Amazon Price Tracker now includes historical price analysis to show how prices have changed over different time periods (1 week, 1 month, 3 months, 6 months, 1 year).

## How It Works

### Current Implementation (Demo Mode)
- **Estimated Historical Data**: For demonstration purposes, the app generates realistic price history data based on the current price
- **Local Tracking Data**: Shows actual price changes tracked by our internal system
- **Interactive Charts**: View price trends with different time period filters
- **Price Change Indicators**: See percentage changes for different time periods

### Future Implementation (Production Mode)
For production use, you can integrate with third-party price history services:

#### Option 1: Keepa API (Recommended)
[Keepa](https://keepa.com/#!api) provides comprehensive Amazon price history:
- **Cost**: Paid service (~$1-5 per 1000 requests)
- **Coverage**: Historical data for millions of Amazon products
- **Accuracy**: Very high, official Amazon data
- **Setup**: Add your Keepa API key to environment variables

```env
KEEPA_API_KEY=your_keepa_api_key_here
```

#### Option 2: CamelCamelCamel API
- Alternative price history service
- Free tier available with limitations
- Good for basic price tracking

#### Option 3: Custom Scraping (Not Recommended)
- Amazon actively blocks historical price scraping
- Very unreliable and may violate terms of service
- High maintenance overhead

## Features

### Enhanced Price Chart
- **Time Period Filters**: 1W, 1M, 3M, 6M, 1Y, ALL
- **Price Change Summary**: Shows percentage changes for each period
- **Target Price Line**: Visual indicator for your price alerts
- **Data Source Indicators**: Shows whether data is estimated, from Keepa, or internal tracking

### Price Analysis
- **Lowest/Highest Prices**: Historical price extremes
- **Average Price**: Mean price over the selected period
- **Price Trends**: Visual indicators for price direction
- **Refresh Button**: Manually refresh historical data

## Usage

1. **Add a Product**: The system will attempt to fetch historical data
2. **View Product Details**: Navigate to any tracked product
3. **Explore Price History**: Use the time period buttons to filter data
4. **Set Price Alerts**: Target prices are shown as reference lines
5. **Monitor Trends**: Check price change percentages for different periods

## Data Sources

### Demo Mode (Current)
- Generates realistic price variations
- Shows estimated seasonal trends
- Perfect for testing and demonstration

### Production Mode (Future)
```typescript
// Example: Enable Keepa integration
const priceAnalysis = await priceHistoryService.getPriceAnalysis(productUrl);
```

## Benefits

1. **Make Informed Decisions**: See if current prices are good deals
2. **Understand Price Patterns**: Identify seasonal trends
3. **Time Your Purchases**: Buy when prices are historically low
4. **Set Better Alerts**: Target prices based on historical lows
5. **Track Performance**: See how much you've saved over time

## Technical Details

### Backend
- `PriceHistoryService`: Handles historical data fetching
- `EnhancedPriceChart`: React component for visualization
- Automatic fallback to estimated data if APIs fail

### Frontend
- Uses Recharts for responsive, interactive charts
- Time-based filtering and data transformation
- Real-time price change calculations

## Future Enhancements

1. **Multiple Retailer Support**: Track prices across different stores
2. **Price Prediction**: Use ML to predict future price trends
3. **Seasonal Analysis**: Identify the best times to buy categories
4. **Inventory Alerts**: Get notified when items are back in stock
5. **Bulk Analysis**: Compare multiple products simultaneously

## Getting Started

The price history feature is enabled by default and works with your existing tracked products. Simply navigate to any product detail page to see the enhanced price chart with historical analysis.

For production deployment with real historical data, sign up for a Keepa API key and add it to your environment variables.
