import { useEffect, useRef } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import { Product } from '../services/api';

interface UsePriceChangeDetectionProps {
  products: Product[];
}

export const usePriceChangeDetection = ({ products }: UsePriceChangeDetectionProps) => {
  const { showPriceChangeNotification } = useNotifications();
  const previousPricesRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    if (!products || products.length === 0) return;

    products.forEach((product) => {
      if (!product.id) return;

      const previousPrice = previousPricesRef.current.get(product.id);
      const currentPrice = product.currentPrice;

      // If we have a previous price and it's different from current price
      if (previousPrice !== undefined && previousPrice !== currentPrice) {
        // Show notification for price change
        showPriceChangeNotification(product, previousPrice, currentPrice);
      }

      // Update the stored price
      previousPricesRef.current.set(product.id, currentPrice);
    });
  }, [products, showPriceChangeNotification]);

  // Cleanup function to remove product prices when products are removed
  const removeProductFromTracking = (productId: string) => {
    previousPricesRef.current.delete(productId);
  };

  return { removeProductFromTracking };
};
