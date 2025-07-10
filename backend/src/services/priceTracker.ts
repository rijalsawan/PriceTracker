import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { scrapeAmazonProduct } from './amazonScraperSimple';
import { sendNotificationEmail } from './emailService';

// Notification types as constants (since SQLite doesn't support enums)
const NotificationType = {
  PRICE_DROP: 'PRICE_DROP',
  PRICE_INCREASE: 'PRICE_INCREASE', 
  ERROR: 'ERROR'
} as const;

type NotificationTypeValue = typeof NotificationType[keyof typeof NotificationType];

const prisma = new PrismaClient();

export const startPriceTracking = () => {
  console.log('🔍 Starting price tracking service...');
  
  // Run every hour (you can adjust this based on your needs)
  cron.schedule('0 * * * *', async () => {
    console.log('🔄 Running scheduled price check...');
    await checkAllProductPrices();
  });

  // Also run on startup
  setTimeout(() => {
    checkAllProductPrices();
  }, 5000);
};

const checkAllProductPrices = async () => {
  try {
    // Get all active products
    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true
          }
        },
        priceHistory: {
          orderBy: { timestamp: 'desc' },
          take: 1
        }
      }
    });

    console.log(`📊 Checking prices for ${products.length} products...`);

    for (const product of products) {
      await checkProductPrice(product);
      // Add delay to avoid being rate limited
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log('✅ Price check completed');
  } catch (error) {
    console.error('❌ Error in price tracking:', error);
  }
};

const checkProductPrice = async (product: any) => {
  try {
    console.log(`🔍 Checking price for: ${product.title}`);

    // Scrape current price
    const productInfo = await scrapeAmazonProduct(product.url, 3, product.id);

    if (!productInfo || !productInfo.price) {
      console.log(`⚠️ Could not get price for product: ${product.title}`);
      
      // Create error notification
      await createNotification(
        product.userId,
        product.id,
        `Failed to check price for ${product.title}`,
        NotificationType.ERROR
      );
      return;
    }

    const currentPrice = productInfo.price;
    const previousPrice = product.currentPrice;

    console.log(`💰 Price comparison: ${product.title} - Previous: $${previousPrice} → Current: $${currentPrice}`);

    // Validate price change to prevent false positives using new validation function
    if (!isPriceChangeRealistic(previousPrice, currentPrice)) {
      logPriceChange(product, previousPrice, currentPrice, 'REJECTED - Unrealistic price change');
      
      // Create error notification for unrealistic changes
      await createNotification(
        product.userId,
        product.id,
        `Unusual price detected for ${product.title}. Please verify manually. Previous: $${previousPrice}, Detected: $${currentPrice}`,
        NotificationType.ERROR
      );
      return;
    }

    const priceDifference = currentPrice - previousPrice;
    const absoluteDifference = Math.abs(priceDifference);
    const percentChange = previousPrice > 0 ? ((priceDifference / previousPrice) * 100) : 0;

    // Skip if the price didn't actually change (within 1 cent)
    if (absoluteDifference < 0.01) {
      logPriceChange(product, previousPrice, currentPrice, 'NO CHANGE - Price difference < $0.01');
      return;
    }

    // Update product with new price
    await prisma.product.update({
      where: { id: product.id },
      data: { currentPrice }
    });

    // Only add to price history if price has changed significantly (more than $0.50 or 5%)
    const significantDollarChange = absoluteDifference >= 0.50;
    const significantPercentChange = Math.abs(percentChange) >= 5;
    const significantChange = significantDollarChange && significantPercentChange;

    if (significantChange) {
      // Add to price history only for significant changes
      await prisma.priceHistory.create({
        data: {
          price: currentPrice,
          productId: product.id
        }
      });

      logPriceChange(product, previousPrice, currentPrice, 'RECORDED - Significant price change');
    } else {
      logPriceChange(product, previousPrice, currentPrice, 'IGNORED - Minor price change');
      return; // Don't send notifications for minor changes
    }

    // Check for price changes with more conservative thresholds
    console.log(`💰 Price update: ${product.title} - $${previousPrice} → $${currentPrice} (${percentChange.toFixed(2)}%)`);

    // Check for significant price drops (more than 8% and at least $2)
    if (priceDifference < 0 && Math.abs(percentChange) >= 8 && absoluteDifference >= 2) {
      const savings = absoluteDifference;
      const message = `📉 Significant price drop! ${product.title} dropped by ${Math.abs(percentChange).toFixed(2)}% (save $${savings.toFixed(2)}) - now $${currentPrice}`;
      
      logPriceChange(product, previousPrice, currentPrice, 'NOTIFICATION SENT - Price drop');
      
      await createNotification(
        product.userId,
        product.id,
        message,
        NotificationType.PRICE_DROP
      );

      // Send email notification for significant drops
      await sendNotificationEmail(
        product.user.email,
        'Price Drop Alert!',
        message,
        product
      );

      console.log(`📉 Significant price drop for: ${product.title} - $${savings.toFixed(2)} savings`);
    }
    // Check for significant price increases (more than 12% and at least $3)
    else if (priceDifference > 0 && percentChange >= 12 && absoluteDifference >= 3) {
      const message = `📈 Price increase alert! ${product.title} increased by ${percentChange.toFixed(2)}% (up $${absoluteDifference.toFixed(2)}) - now $${currentPrice}`;
      
      logPriceChange(product, previousPrice, currentPrice, 'NOTIFICATION SENT - Price increase');
      
      await createNotification(
        product.userId,
        product.id,
        message,
        NotificationType.PRICE_INCREASE
      );

      console.log(`📈 Significant price increase for: ${product.title}`);
    } else {
      logPriceChange(product, previousPrice, currentPrice, 'NO NOTIFICATION - Change not significant enough');
    }

    // Enhanced logging for price tracking
    logPriceChange(product, previousPrice, currentPrice, 'Price updated in system');

  } catch (error) {
    console.error(`❌ Error checking price for product ${product.id}:`, error);
    
    // Create error notification
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    await createNotification(
      product.userId,
      product.id,
      `Error checking price for ${product.title}: ${errorMessage}`,
      NotificationType.ERROR
    );
  }
};

const createNotification = async (
  userId: string,
  productId: string,
  message: string,
  type: NotificationTypeValue
) => {
  try {
    await prisma.notification.create({
      data: {
        userId,
        productId,
        message,
        type
      }
    });
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

// Enhanced logging for price tracking
const logPriceChange = (product: any, previousPrice: number, currentPrice: number, reason: string) => {
  const timestamp = new Date().toISOString();
  const priceDifference = currentPrice - previousPrice;
  const percentChange = previousPrice > 0 ? ((priceDifference / previousPrice) * 100) : 0;
  
  console.log(`
📊 PRICE TRACKING LOG - ${timestamp}
Product: ${product.title}
URL: ${product.url}
Previous Price: $${previousPrice}
Current Price: $${currentPrice}
Difference: $${priceDifference.toFixed(2)} (${percentChange.toFixed(2)}%)
Action: ${reason}
User: ${product.user.email}
=====================================
  `);
};

// Validate if a price change is realistic
const isPriceChangeRealistic = (previousPrice: number, currentPrice: number): boolean => {
  if (previousPrice <= 0 || currentPrice <= 0) return false;
  
  const absoluteDifference = Math.abs(currentPrice - previousPrice);
  const percentChange = Math.abs((currentPrice - previousPrice) / previousPrice * 100);
  
  // Reject changes > 70% or price becoming less than $0.01
  if (percentChange > 70 || currentPrice < 0.01) return false;
  
  // Reject unrealistic jumps (more than $1000 change)
  if (absoluteDifference > 1000) return false;
  
  return true;
};

// Export for manual price checking
export { checkProductPrice };
