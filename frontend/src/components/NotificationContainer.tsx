import React, { useEffect, useState } from 'react';
import { useNotifications } from '../contexts/NotificationContext';

const NotificationContainer: React.FC = () => {
  const { notifications } = useNotifications();
  const [recentNotification, setRecentNotification] = useState<any>(null);

  useEffect(() => {
    // Show a small toast for the most recent notification
    const latest = notifications[0];
    if (latest && !latest.isRead) {
      setRecentNotification(latest);
      
      // Auto-hide the mini toast after 3 seconds
      const timer = setTimeout(() => {
        setRecentNotification(null);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [notifications]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'PRICE_DROP':
        return '🎉';
      case 'PRICE_INCREASE':
        return '📈';
      case 'TARGET_REACHED':
        return '🎯';
      case 'SUCCESS':
        return '✅';
      case 'WARNING':
        return '⚠️';
      case 'ERROR':
        return '❌';
      case 'INFO':
        return 'ℹ️';
      default:
        return '📝';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'PRICE_DROP':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'PRICE_INCREASE':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'TARGET_REACHED':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'SUCCESS':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'WARNING':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'ERROR':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'INFO':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  if (!recentNotification) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 pointer-events-none">
      <div 
        className={`
          ${getNotificationColor(recentNotification.type)}
          border rounded-xl shadow-lg backdrop-blur-sm
          px-4 py-3 max-w-sm
          animate-slide-in-right
        `}
      >
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0 text-lg">
            {getNotificationIcon(recentNotification.type)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {recentNotification.title}
            </p>
            <p className="text-xs opacity-75 mt-1">
              Check notification panel for details
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationContainer;
