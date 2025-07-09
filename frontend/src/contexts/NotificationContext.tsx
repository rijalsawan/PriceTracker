import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Notification, notificationsAPI } from '../services/api';
import BrowserNotificationService from '../services/browserNotifications';

interface InAppNotification {
  id: string;
  type: 'PRICE_DROP' | 'PRICE_INCREASE' | 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  title: string;
  message: string;
  timestamp: Date;
  product?: {
    id: string;
    title: string;
    imageUrl?: string;
    oldPrice?: number;
    newPrice?: number;
  };
  isRead: boolean;
  autoHide?: boolean;
  duration?: number;
}

interface NotificationContextType {
  notifications: InAppNotification[];
  unreadCount: number;
  isLoading: boolean;
  addNotification: (notification: Omit<InAppNotification, 'id' | 'timestamp' | 'isRead'>) => Promise<string>;
  removeNotification: (id: string) => Promise<void>;
  removeProductNotifications: (productId: string) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearAll: () => Promise<void>;
  requestBrowserPermission: () => Promise<boolean>;
  hasBrowserPermission: boolean;
  showPriceChangeNotification: (product: any, oldPrice: number, newPrice: number) => void;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [hasBrowserPermission, setHasBrowserPermission] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const browserNotifications = BrowserNotificationService.getInstance();

  useEffect(() => {
    setHasBrowserPermission(browserNotifications.hasPermission());
    loadNotifications();
  }, []);

  const loadNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await notificationsAPI.getAll();
      const apiNotifications = response.data.notifications || [];
      
      // Convert API notifications to InAppNotifications
      const convertedNotifications: InAppNotification[] = apiNotifications.map((notification: Notification) => ({
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        timestamp: new Date(notification.createdAt),
        product: notification.product,
        isRead: notification.isRead
      }));
      
      setNotifications(convertedNotifications);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const addNotification = useCallback(async (notification: Omit<InAppNotification, 'id' | 'timestamp' | 'isRead'>) => {
    const newNotification: InAppNotification = {
      ...notification,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      isRead: false
    };

    // Add to local state immediately for responsive UI
    setNotifications(prev => [newNotification, ...prev]);

    try {
      // Save to API (excluding autoHide and duration which are frontend-only)
      const { autoHide, duration, ...apiNotification } = notification;
      const response = await notificationsAPI.create({
        title: apiNotification.title,
        message: apiNotification.message,
        type: apiNotification.type,
        product: apiNotification.product,
        isRead: false
      });

      // Update local notification with API-generated ID
      if (response.data) {
        setNotifications(prev => 
          prev.map(n => 
            n.id === newNotification.id 
              ? { ...n, id: response.data.id, timestamp: new Date(response.data.createdAt) }
              : n
          )
        );
      }
    } catch (error) {
      console.error('Failed to save notification to API:', error);
      // Keep the notification in local state even if API fails
    }

    // Only auto-hide very specific notification types
    if (notification.autoHide === true && notification.duration) {
      setTimeout(() => {
        removeNotification(newNotification.id);
      }, notification.duration);
    }

    return newNotification.id;
  }, []);

  const removeNotification = useCallback(async (id: string) => {
    // Remove from local state immediately
    setNotifications(prev => prev.filter(n => n.id !== id));
    
    try {
      // Remove from API
      await notificationsAPI.delete(id);
    } catch (error) {
      console.error('Failed to delete notification from API:', error);
    }
  }, []);

  const removeProductNotifications = useCallback(async (productId: string) => {
    // Remove from local state immediately
    setNotifications(prev => prev.filter(n => n.product?.id !== productId));
    
    try {
      // Remove from API
      await notificationsAPI.deleteByProduct(productId);
    } catch (error) {
      console.error('Failed to delete product notifications from API:', error);
    }
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    // Update local state immediately
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
    
    try {
      // Update API
      await notificationsAPI.markAsRead(id);
    } catch (error) {
      console.error('Failed to mark notification as read in API:', error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    // Update local state immediately
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    
    try {
      // Update API
      await notificationsAPI.markAllAsRead();
    } catch (error) {
      console.error('Failed to mark all notifications as read in API:', error);
    }
  }, []);

  const clearAll = useCallback(async () => {
    // Get all notification IDs
    const notificationIds = notifications.map(n => n.id);
    
    // Clear local state immediately
    setNotifications([]);
    
    try {
      // Delete all from API
      await Promise.all(notificationIds.map(id => notificationsAPI.delete(id)));
    } catch (error) {
      console.error('Failed to clear all notifications from API:', error);
    }
  }, [notifications]);

  const requestBrowserPermission = useCallback(async () => {
    const granted = await browserNotifications.requestPermission();
    setHasBrowserPermission(granted);
    return granted;
  }, []);

  const showPriceChangeNotification = useCallback((product: any, oldPrice: number, newPrice: number) => {
    // Only show notifications if price actually changed
    if (oldPrice === newPrice) {
      return;
    }

    const priceChanged = newPrice !== oldPrice;
    const isPriceDrop = newPrice < oldPrice;
    const isPriceIncrease = newPrice > oldPrice;
    
    if (!priceChanged) return;

    const productData = {
      title: product.title,
      oldPrice,
      newPrice,
      image: product.imageUrl,
      url: `/products/${product.id}`
    };

    // Show in-app notification
    if (isPriceDrop) {
      const savings = oldPrice - newPrice;
      const percentage = ((savings / oldPrice) * 100).toFixed(1);
      
      addNotification({
        type: 'PRICE_DROP',
        title: '🎉 Price Drop Alert!',
        message: `${product.title} dropped from $${oldPrice.toFixed(2)} to $${newPrice.toFixed(2)}. Save $${savings.toFixed(2)} (${percentage}% off)!`,
        product: {
          id: product.id,
          title: product.title,
          imageUrl: product.imageUrl,
          oldPrice,
          newPrice
        }
      });

      // Show browser notification
      if (hasBrowserPermission) {
        browserNotifications.showPriceDropNotification(productData);
      }

      // Target price functionality removed
      
    } else if (isPriceIncrease) {
      const increase = newPrice - oldPrice;
      const percentage = ((increase / oldPrice) * 100).toFixed(1);
      
      addNotification({
        type: 'PRICE_INCREASE',
        title: '📈 Price Increase Alert',
        message: `${product.title} increased from $${oldPrice.toFixed(2)} to $${newPrice.toFixed(2)}. Price went up by $${increase.toFixed(2)} (${percentage}%).`,
        product: {
          id: product.id,
          title: product.title,
          imageUrl: product.imageUrl,
          oldPrice,
          newPrice
        }
      });

      // Show browser notification
      if (hasBrowserPermission) {
        browserNotifications.showPriceIncreaseNotification(productData);
      }
    }
  }, [addNotification, hasBrowserPermission]);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    isLoading,
    addNotification,
    removeNotification,
    removeProductNotifications,
    markAsRead,
    markAllAsRead,
    clearAll,
    requestBrowserPermission,
    hasBrowserPermission,
    showPriceChangeNotification,
    refreshNotifications: loadNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
