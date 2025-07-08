import React from 'react';
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  XCircleIcon, 
  InformationCircleIcon,
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
  BellIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useNotifications } from '../contexts/NotificationContext';

interface NotificationToastProps {
  notification: {
    id: string;
    type: 'PRICE_DROP' | 'PRICE_INCREASE' | 'TARGET_REACHED' | 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
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
  };
}

const NotificationToast: React.FC<NotificationToastProps> = ({ notification }) => {
  const { removeNotification, markAsRead } = useNotifications();

  const getIcon = () => {
    switch (notification.type) {
      case 'PRICE_DROP':
        return <ArrowTrendingDownIcon className="h-6 w-6 text-green-500" />;
      case 'PRICE_INCREASE':
        return <ArrowTrendingUpIcon className="h-6 w-6 text-red-500" />;
      case 'TARGET_REACHED':
        return <BellIcon className="h-6 w-6 text-blue-500" />;
      case 'SUCCESS':
        return <CheckCircleIcon className="h-6 w-6 text-green-500" />;
      case 'WARNING':
        return <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500" />;
      case 'ERROR':
        return <XCircleIcon className="h-6 w-6 text-red-500" />;
      default:
        return <InformationCircleIcon className="h-6 w-6 text-blue-500" />;
    }
  };

  const getBgColor = () => {
    switch (notification.type) {
      case 'PRICE_DROP':
      case 'SUCCESS':
        return 'bg-green-50 border-green-200';
      case 'PRICE_INCREASE':
      case 'ERROR':
        return 'bg-red-50 border-red-200';
      case 'TARGET_REACHED':
      case 'INFO':
        return 'bg-blue-50 border-blue-200';
      case 'WARNING':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-white border-gray-200';
    }
  };

  const handleClick = () => {
    markAsRead(notification.id);
    if (notification.product) {
      window.location.href = `/products/${notification.product.id}`;
    }
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeNotification(notification.id);
  };

  return (
    <div
      className={`max-w-sm w-full ${getBgColor()} border rounded-lg shadow-lg pointer-events-auto cursor-pointer transform transition-all duration-300 hover:scale-105`}
      onClick={handleClick}
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {getIcon()}
          </div>
          <div className="ml-3 w-0 flex-1">
            <p className="text-sm font-medium text-gray-900">
              {notification.title}
            </p>
            <p className="mt-1 text-sm text-gray-500 line-clamp-3">
              {notification.message}
            </p>
            {notification.product?.imageUrl && (
              <div className="mt-2 flex items-center">
                <img
                  src={notification.product.imageUrl}
                  alt={notification.product.title}
                  className="h-8 w-8 rounded object-cover"
                />
                <span className="ml-2 text-xs text-gray-600 truncate">
                  {notification.product.title}
                </span>
              </div>
            )}
            <p className="mt-1 text-xs text-gray-400">
              {notification.timestamp.toLocaleTimeString()}
            </p>
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              onClick={handleClose}
            >
              <span className="sr-only">Close</span>
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationToast;
