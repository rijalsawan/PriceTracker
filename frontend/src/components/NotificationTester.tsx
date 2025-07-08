import React, { useState } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import { 
  BellIcon, 
  ArrowTrendingDownIcon, 
  ArrowTrendingUpIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

const NotificationTester: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { 
    addNotification, 
    showPriceChangeNotification, 
    requestBrowserPermission, 
    hasBrowserPermission,
    removeProductNotifications,
    notifications
  } = useNotifications();

  const mockProduct = {
    id: 'test-product-123',
    title: 'Test Product - Apple iPhone 15 Pro Max',
    imageUrl: 'https://images-na.ssl-images-amazon.com/images/I/71xb2xkN5qL._AC_SL1500_.jpg',
    url: 'https://amazon.com/dp/test123',
    currentPrice: 899.99,
    targetPrice: 850.00,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const testNotifications = [
    {
      type: 'PRICE_DROP' as const,
      title: '🎉 Price Drop Test',
      message: 'Test price drop notification - iPhone dropped from $999.99 to $899.99',
      oldPrice: 999.99,
      newPrice: 899.99,
      icon: <ArrowTrendingDownIcon className="h-5 w-5 text-green-500" />
    },
    {
      type: 'PRICE_INCREASE' as const,
      title: '📈 Price Increase Test',
      message: 'Test price increase notification - iPhone increased from $899.99 to $999.99',
      oldPrice: 899.99,
      newPrice: 999.99,
      icon: <ArrowTrendingUpIcon className="h-5 w-5 text-red-500" />
    },
    {
      type: 'TARGET_REACHED' as const,
      title: '🎯 Target Reached Test',
      message: 'Test target price reached - iPhone is now at your target price of $850.00',
      oldPrice: 899.99,
      newPrice: 850.00,
      icon: <BellIcon className="h-5 w-5 text-blue-500" />
    },
    {
      type: 'SUCCESS' as const,
      title: '✅ Success Test',
      message: 'Test success notification - Product added successfully',
      icon: <CheckCircleIcon className="h-5 w-5 text-green-500" />
    },
    {
      type: 'WARNING' as const,
      title: '⚠️ Warning Test',
      message: 'Test warning notification - Product availability changed',
      icon: <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
    },
    {
      type: 'ERROR' as const,
      title: '❌ Error Test',
      message: 'Test error notification - Failed to update product',
      icon: <XCircleIcon className="h-5 w-5 text-red-500" />
    },
    {
      type: 'INFO' as const,
      title: 'ℹ️ Info Test',
      message: 'Test info notification - System maintenance scheduled',
      icon: <InformationCircleIcon className="h-5 w-5 text-blue-500" />
    }
  ];

  const handleTestNotification = (test: typeof testNotifications[0]) => {
    addNotification({
      type: test.type,
      title: test.title,
      message: test.message,
      product: {
        id: mockProduct.id,
        title: mockProduct.title,
        imageUrl: mockProduct.imageUrl,
        oldPrice: test.oldPrice,
        newPrice: test.newPrice
      }
    });
  };

  const handlePriceChangeTest = (type: 'drop' | 'increase' | 'target') => {
    switch (type) {
      case 'drop':
        showPriceChangeNotification(mockProduct, 999.99, 899.99);
        break;
      case 'increase':
        showPriceChangeNotification(mockProduct, 899.99, 999.99);
        break;
      case 'target':
        showPriceChangeNotification(
          { ...mockProduct, targetPrice: 850.00 }, 
          899.99, 
          850.00
        );
        break;
    }
  };

  const handleProductRemovalTest = () => {
    // First add some notifications for the test product
    addNotification({
      type: 'PRICE_DROP',
      title: '🎉 Price Drop for Test Product',
      message: 'Test product price dropped - this notification should be removed',
      product: {
        id: mockProduct.id,
        title: mockProduct.title,
        imageUrl: mockProduct.imageUrl,
        oldPrice: 999.99,
        newPrice: 899.99
      },
      autoHide: false
    });

    addNotification({
      type: 'TARGET_REACHED',
      title: '🎯 Target Reached for Test Product',
      message: 'Test product target reached - this notification should be removed',
      product: {
        id: mockProduct.id,
        title: mockProduct.title,
        imageUrl: mockProduct.imageUrl,
        oldPrice: 899.99,
        newPrice: 850.00
      },
      autoHide: false
    });

    // Show confirmation that notifications were added
    setTimeout(() => {
      addNotification({
        type: 'INFO',
        title: 'ℹ️ Test Notifications Added',
        message: 'Added 2 notifications for test product. Click "Remove Test Product Notifications" to test removal.',
        autoHide: true,
        duration: 5000
      });
    }, 500);
  };

  const handleRemoveProductNotifications = () => {
    const testProductNotifications = notifications.filter(n => n.product?.id === mockProduct.id);
    
    if (testProductNotifications.length === 0) {
      addNotification({
        type: 'WARNING',
        title: '⚠️ No Test Product Notifications',
        message: 'No notifications found for test product. Add some first using the test above.',
        autoHide: true
      });
      return;
    }

    removeProductNotifications(mockProduct.id);
    
    addNotification({
      type: 'SUCCESS',
      title: '✅ Notifications Removed',
      message: `Removed ${testProductNotifications.length} notification(s) for test product`,
      autoHide: true
    });
  };

  const handleBrowserPermissionTest = async () => {
    const granted = await requestBrowserPermission();
    if (granted) {
      addNotification({
        type: 'SUCCESS',
        title: '✅ Browser Notifications Enabled',
        message: 'You will now receive browser notifications for price changes',
        autoHide: true
      });
    } else {
      addNotification({
        type: 'ERROR',
        title: '❌ Browser Notifications Denied',
        message: 'Please enable notifications in your browser settings',
        autoHide: true
      });
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-40">
        <button
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
          title="Test Notifications"
        >
          <BellIcon className="h-6 w-6" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-40">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 w-80 max-h-96 overflow-y-auto">
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            🧪 Notification Tester
          </h3>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-gray-600 p-1 rounded"
          >
            ✕
          </button>
        </div>

        {/* Browser Permission */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Browser Notifications
            </span>
            <span className={`text-xs px-2 py-1 rounded-full ${
              hasBrowserPermission 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              {hasBrowserPermission ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          {!hasBrowserPermission && (
            <button
              onClick={handleBrowserPermissionTest}
              className="w-full text-left text-sm text-blue-600 hover:text-blue-700 py-1"
            >
              → Enable Browser Notifications
            </button>
          )}
        </div>

        {/* Price Change Tests */}
        <div className="p-4 border-b border-gray-100">
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Price Change Tests
          </h4>
          <div className="space-y-2">
            <button
              onClick={() => handlePriceChangeTest('drop')}
              className="w-full text-left text-sm text-green-600 hover:text-green-700 hover:bg-green-50 py-2 px-3 rounded transition-colors"
            >
              🎉 Test Price Drop ($999 → $899)
            </button>
            <button
              onClick={() => handlePriceChangeTest('increase')}
              className="w-full text-left text-sm text-red-600 hover:text-red-700 hover:bg-red-50 py-2 px-3 rounded transition-colors"
            >
              📈 Test Price Increase ($899 → $999)
            </button>
            <button
              onClick={() => handlePriceChangeTest('target')}
              className="w-full text-left text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 py-2 px-3 rounded transition-colors"
            >
              🎯 Test Target Reached ($899 → $850)
            </button>
          </div>
        </div>

        {/* Product Removal Tests */}
        <div className="p-4 border-b border-gray-100">
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Product Removal Tests
          </h4>
          <div className="space-y-2">
            <button
              onClick={handleProductRemovalTest}
              className="w-full text-left text-sm text-purple-600 hover:text-purple-700 hover:bg-purple-50 py-2 px-3 rounded transition-colors"
            >
              🧪 Add Test Product Notifications
            </button>
            <button
              onClick={handleRemoveProductNotifications}
              className="w-full text-left text-sm text-orange-600 hover:text-orange-700 hover:bg-orange-50 py-2 px-3 rounded transition-colors"
            >
              🗑️ Remove Test Product Notifications
            </button>
          </div>
        </div>

        {/* Individual Notification Tests */}
        <div className="p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Individual Notification Tests
          </h4>
          <div className="space-y-1">
            {testNotifications.map((test, index) => (
              <button
                key={index}
                onClick={() => handleTestNotification(test)}
                className="w-full text-left text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 py-2 px-3 rounded transition-colors flex items-center"
              >
                {test.icon}
                <span className="ml-2">
                  Test {test.type.toLowerCase().replace('_', ' ')}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50">
          <p className="text-xs text-gray-500">
            Use these tests to verify that both in-app and browser notifications are working correctly.
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotificationTester;
