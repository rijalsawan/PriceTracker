import React, { useState, useRef, useEffect } from 'react';
import { 
  BellIcon, 
  EllipsisVerticalIcon,
  TrashIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { useNotifications } from '../contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';

const NotificationPanel: React.FC = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  
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
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = async (notificationId: string, productId?: string) => {
    await markAsRead(notificationId);
    if (productId) {
      window.location.href = `/products/${productId}`;
    }
  };

  const handleBellClick = () => {
    // On mobile, navigate to notifications page
    if (window.innerWidth < 768) {
      navigate('/notifications');
    } else {
      // On desktop, toggle dropdown
      setIsOpen(!isOpen);
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
      default:
        return '📝';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell */}
      <button
        onClick={handleBellClick}
        className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
      >
        <BellIcon className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse shadow-lg">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown - Only show on desktop */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden hidden md:block">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Notifications
              {unreadCount > 0 && (
                <span className="ml-2 bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </h3>
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
              >
                <EllipsisVerticalIcon className="h-5 w-5" />
              </button>
              
              {showMenu && (
                <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                  <div className="py-1">
                    {!hasBrowserPermission && (
                      <button
                        onClick={async () => {
                          await requestBrowserPermission();
                          setShowMenu(false);
                        }}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left"
                      >
                        <BellIcon className="h-4 w-4 mr-2" />
                        Enable Browser Notifications
                      </button>
                    )}
                    <button
                      onClick={async () => {
                        await markAllAsRead();
                        setShowMenu(false);
                      }}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left"
                    >
                      <CheckIcon className="h-4 w-4 mr-2" />
                      Mark All as Read
                    </button>
                    <button
                      onClick={async () => {
                        await clearAll();
                        setShowMenu(false);
                      }}
                      className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                    >
                      <TrashIcon className="h-4 w-4 mr-2" />
                      Clear All
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="px-4 py-8 text-center text-gray-500">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-gray-600 mx-auto mb-2"></div>
                <p>Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500">
                <BellIcon className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p>No notifications yet</p>
                <p className="text-sm">We'll notify you when prices change!</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors duration-150 ${
                      !notification.isRead ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification.id, notification.product?.id)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <span className="text-2xl">
                          {getNotificationIcon(notification.type)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={`text-sm font-medium ${
                            !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                          }`}>
                            {notification.title}
                          </p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeNotification(notification.id);
                            }}
                            className="text-gray-400 hover:text-gray-600 p-1"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                          {notification.message}
                        </p>
                        {notification.product && (
                          <div className="flex items-center mt-2">
                            {notification.product.imageUrl && (
                              <img
                                src={notification.product.imageUrl}
                                alt={notification.product.title}
                                className="h-6 w-6 rounded object-cover mr-2"
                              />
                            )}
                            <span className="text-xs text-gray-500 truncate">
                              {notification.product.title}
                            </span>
                          </div>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          {formatTimeAgo(notification.timestamp)}
                        </p>
                        {!notification.isRead && (
                          <div className="absolute left-2 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationPanel;
