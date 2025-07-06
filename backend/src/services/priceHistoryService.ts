import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface PriceAnalysisResult {
  current: number;
  changes: {
    week: { change: number; percentChange: number };
    month: { change: number; percentChange: number };
    threeMonths: { change: number; percentChange: number };
    sixMonths: { change: number; percentChange: number };
    year: { change: number; percentChange: number };
  };
  stats: {
    lowest: number;
    highest: number;
    average: number;
  };
  historicalData: Array<{
    timestamp: Date;
    price: number;
    source: 'internal';
  }>;
}

export class PriceHistoryService {
  // Get price analysis based on internal tracking data
  async getPriceAnalysis(productId: string): Promise<PriceAnalysisResult | null> {
    try {
      // Get product with price history from database
      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: {
          priceHistory: {
            orderBy: { timestamp: 'desc' },
            take: 365 // Get up to 1 year of data
          }
        }
      });

      if (!product || product.priceHistory.length === 0) {
        return null;
      }

      const currentPrice = product.currentPrice;
      const priceHistory = product.priceHistory.map(item => ({
        timestamp: item.timestamp,
        price: item.price,
        source: 'internal' as const
      }));

      // Calculate price changes for different periods
      const now = new Date();
      const periods = {
        week: 7,
        month: 30,
        threeMonths: 90,
        sixMonths: 180,
        year: 365
      };

      const getClosestPrice = (daysAgo: number) => {
        const targetDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
        
        // Find the price entry closest to the target date
        const closestEntry = priceHistory
          .filter(entry => entry.timestamp <= targetDate)
          .sort((a, b) => Math.abs(a.timestamp.getTime() - targetDate.getTime()) - Math.abs(b.timestamp.getTime() - targetDate.getTime()))[0];
        
        return closestEntry?.price || currentPrice;
      };

      const calculateChange = (oldPrice: number) => {
        const change = currentPrice - oldPrice;
        const percentChange = oldPrice > 0 ? (change / oldPrice) * 100 : 0;
        return { change, percentChange };
      };

      // Calculate statistics
      const prices = priceHistory.map(item => item.price);
      const stats = {
        lowest: Math.min(...prices, currentPrice),
        highest: Math.max(...prices, currentPrice),
        average: prices.length > 0 ? (prices.reduce((sum, price) => sum + price, 0) / prices.length) : currentPrice,
      };

      return {
        current: currentPrice,
        changes: {
          week: calculateChange(getClosestPrice(periods.week)),
          month: calculateChange(getClosestPrice(periods.month)),
          threeMonths: calculateChange(getClosestPrice(periods.threeMonths)),
          sixMonths: calculateChange(getClosestPrice(periods.sixMonths)),
          year: calculateChange(getClosestPrice(periods.year)),
        },
        stats,
        historicalData: priceHistory.slice(0, 100) // Limit to last 100 points for performance
      };

    } catch (error) {
      console.error('Error getting price analysis:', error);
      return null;
    }
  }

  // Get price history for a specific time period
  async getPriceHistoryForPeriod(productId: string, days: number): Promise<Array<{ timestamp: Date; price: number }>> {
    try {
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      
      const priceHistory = await prisma.priceHistory.findMany({
        where: {
          productId,
          timestamp: {
            gte: cutoffDate
          }
        },
        orderBy: { timestamp: 'desc' },
        select: {
          timestamp: true,
          price: true
        }
      });

      return priceHistory;
    } catch (error) {
      console.error('Error getting price history for period:', error);
      return [];
    }
  }

  // Get price trend summary (for dashboard)
  async getPriceTrendSummary(productId: string): Promise<{ trend: 'up' | 'down' | 'stable'; changePercent: number } | null> {
    try {
      const recentPrices = await prisma.priceHistory.findMany({
        where: { productId },
        orderBy: { timestamp: 'desc' },
        take: 7, // Last week
        select: { price: true, timestamp: true }
      });

      if (recentPrices.length < 2) {
        return null;
      }

      const latestPrice = recentPrices[0].price;
      const weekOldPrice = recentPrices[recentPrices.length - 1].price;
      
      const changePercent = ((latestPrice - weekOldPrice) / weekOldPrice) * 100;
      
      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (Math.abs(changePercent) > 2) { // More than 2% change
        trend = changePercent > 0 ? 'up' : 'down';
      }

      return { trend, changePercent };
    } catch (error) {
      console.error('Error getting price trend summary:', error);
      return null;
    }
  }
}

export const priceHistoryService = new PriceHistoryService();
