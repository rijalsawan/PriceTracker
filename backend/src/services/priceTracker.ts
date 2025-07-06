import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { scrapeAmazonProduct } from './amazonScraperSimple';
import { sendNotificationEmail } from './emailService';

// Notification types as constants (since SQLite doesn't support enums)
const NotificationType = {
  PRICE_DROP: 'PRICE_DROP',
  PRICE_INCREASE: 'PRICE_INCREASE', 
  TARGET_REACHED: 'TARGET_REACHED',
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
    const productInfo = await scrapeAmazonProduct(product.url);

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

    // Update product with new price
    await prisma.product.update({
      where: { id: product.id },
      data: { currentPrice }
    });

    // Add to price history
    await prisma.priceHistory.create({
      data: {
        price: currentPrice,
        productId: product.id
      }
    });

    // Check for price changes
    const priceDifference = currentPrice - previousPrice;
    const percentChange = ((priceDifference / previousPrice) * 100);

    console.log(`💰 Price update: ${product.title} - $${previousPrice} → $${currentPrice} (${percentChange.toFixed(2)}%)`);

    // Check if target price is reached
    if (product.targetPrice && currentPrice <= product.targetPrice) {
      const message = `🎯 Target price reached! ${product.title} is now $${currentPrice} (target: $${product.targetPrice})`;
      
      await createNotification(
        product.userId,
        product.id,
        message,
        NotificationType.TARGET_REACHED
      );

      // Send email notification
      await sendNotificationEmail(
        product.user.email,
        'Target Price Reached!',
        message,
        product
      );

      console.log(`🎯 Target price reached for: ${product.title}`);
    }
    // Check for significant price drops (more than 5%)
    else if (priceDifference < 0 && Math.abs(percentChange) > 5) {
      const message = `📉 Price drop alert! ${product.title} dropped by ${Math.abs(percentChange).toFixed(2)}% to $${currentPrice}`;
      
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

      console.log(`📉 Significant price drop for: ${product.title}`);
    }
    // Check for significant price increases (more than 10%)
    else if (priceDifference > 0 && percentChange > 10) {
      const message = `📈 Price increase alert! ${product.title} increased by ${percentChange.toFixed(2)}% to $${currentPrice}`;
      
      await createNotification(
        product.userId,
        product.id,
        message,
        NotificationType.PRICE_INCREASE
      );

      console.log(`📈 Significant price increase for: ${product.title}`);
    }

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

// Export for manual price checking
export { checkProductPrice };
