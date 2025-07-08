import React, { useEffect } from 'react';
import { 
  BellIcon, 
  EllipsisVerticalIcon,
  TrashIcon,
  CheckIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { useNotifications } from '../contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';

const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { 
    notifications, 
    unreadCount,
    isLoading,
    markAsRead, 
    markAllAsRead, 
    clearAll, 
    removeNotification,
    requestBrowserPermission,
    hasBrowserPermission
  } = useNotifications();

  useEffect(() => {
    // Mark all notifications as read when the page is viewed
    if (unreadCount > 0) {
      markAllAsRead();
    }
  }, [unreadCount, markAllAsRead]);

  const handleNotificationClick = async (notificationId: string, productId?: string) => {
    await markAsRead(notificationId);
    if (productId) {
      navigate(`/product/${productId}`);
    }
  };

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'PRICE_DROP':
        return '🎉';
      case 'PRICE_INCREASE':
        return '📈';
      case 'TARGET_REACHED':
        return '🎯';
      default:
        return '📝';
    }
  };

  const getNotificationBgColor = (type: string) => {
    switch (type) {
      case 'PRICE_DROP':
        return 'bg-green-50 border-green-200';
      case 'PRICE_INCREASE':
        return 'bg-orange-50 border-orange-200';
      case 'TARGET_REACHED':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Notifications</h1>
                {unreadCount > 0 && (
                  <p className="text-sm text-gray-500">{unreadCount} unread</p>
                )}
              </div>
            </div>
            
            {/* Action Menu */}
            <div className="flex items-center space-x-2">
              {!hasBrowserPermission && (
                <button
                  onClick={requestBrowserPermission}
                  className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Enable browser notifications"
                >
                  <BellIcon className="h-5 w-5" />
                </button>
              )}
              
              {notifications.length > 0 && (
                <button
                  onClick={clearAll}
                  className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                  title="Clear all notifications"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600 mb-4"></div>
            <p className="text-gray-500">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="bg-gray-100 rounded-full p-6 mb-4">
              <BellIcon className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications yet</h3>
            <p className="text-gray-500 text-center max-w-sm">
              We'll notify you when prices change on your tracked products!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`bg-white rounded-lg border shadow-sm p-4 transition-all duration-200 ${
                  !notification.isRead ? getNotificationBgColor(notification.type) : ''
                }`}
                onClick={() => handleNotificationClick(notification.id, notification.product?.id)}
              >
                <div className="flex items-start space-x-3">
                  {/* Icon */}
                  <div className="flex-shrink-0">
                    <div className="bg-white rounded-full p-2 shadow-sm">
                      <span className="text-2xl">
                        {getNotificationIcon(notification.type)}
                      </span>
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-gray-900 mb-1">
                          {notification.title}
                        </h4>
                        <p className="text-sm text-gray-700 leading-relaxed mb-3">
                          {notification.message}
                        </p>
                        
                        {/* Product Info */}
                        {notification.product && (
                          <div className="flex items-center space-x-2 mb-3">
                            {notification.product.imageUrl && (
                              <img
                                src={notification.product.imageUrl}
                                alt={notification.product.title}
                                className="h-8 w-8 rounded object-cover"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-gray-600 truncate">
                                {notification.product.title}
                              </p>
                              {notification.product.oldPrice && notification.product.newPrice && (
                                <div className="flex items-center space-x-2 text-xs">
                                  <span className="text-gray-500 line-through">
                                    ${notification.product.oldPrice.toFixed(2)}
                                  </span>
                                  <span className="text-gray-900 font-medium">
                                    ${notification.product.newPrice.toFixed(2)}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* Timestamp */}
                        <p className="text-xs text-gray-500">
                          {formatTimeAgo(notification.timestamp)}
                        </p>
                      </div>
                      
                      {/* Delete Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeNotification(notification.id);
                        }}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-2"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
