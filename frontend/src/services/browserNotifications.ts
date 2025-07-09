// Browser Notification Service
class BrowserNotificationService {
  private static instance: BrowserNotificationService;
  private permission: NotificationPermission = 'default';

  private constructor() {
    this.checkPermission();
  }

  public static getInstance(): BrowserNotificationService {
    if (!BrowserNotificationService.instance) {
      BrowserNotificationService.instance = new BrowserNotificationService();
    }
    return BrowserNotificationService.instance;
  }

  private checkPermission(): void {
    if ('Notification' in window) {
      this.permission = Notification.permission;
    }
  }

  public async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    if (this.permission === 'granted') {
      return true;
    }

    if (this.permission === 'denied') {
      return false;
    }

    const permission = await Notification.requestPermission();
    this.permission = permission;
    return permission === 'granted';
  }

  public isSupported(): boolean {
    return 'Notification' in window;
  }

  public hasPermission(): boolean {
    return this.permission === 'granted';
  }

  public showNotification(title: string, options: NotificationOptions = {}): void {
    if (!this.hasPermission()) {
      console.warn('Notification permission not granted');
      return;
    }

    const defaultOptions: NotificationOptions = {
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      requireInteraction: false,
      ...options
    };

    try {
      const notification = new Notification(title, defaultOptions);
      
      // Auto close after 8 seconds
      setTimeout(() => {
        notification.close();
      }, 8000);

      // Handle notification click
      notification.onclick = () => {
        window.focus();
        notification.close();
        if (options.data?.url) {
          window.location.href = options.data.url;
        }
      };

    } catch (error) {
      console.error('Failed to show notification:', error);
    }
  }

  public showPriceDropNotification(product: {
    title: string;
    oldPrice: number;
    newPrice: number;
    image?: string;
    url?: string;
  }): void {
    const savings = product.oldPrice - product.newPrice;
    const percentage = ((savings / product.oldPrice) * 100).toFixed(1);
    
    this.showNotification(`🎉 Price Drop Alert!`, {
      body: `${product.title}\nWas $${product.oldPrice.toFixed(2)} → Now $${product.newPrice.toFixed(2)}\nSave $${savings.toFixed(2)} (${percentage}% off)`,
      icon: product.image || '/favicon.svg',
      tag: `price-drop-${product.title}`,
      data: { url: product.url || '/dashboard' },
      requireInteraction: true
    });
  }

  public showPriceIncreaseNotification(product: {
    title: string;
    oldPrice: number;
    newPrice: number;
    image?: string;
    url?: string;
  }): void {
    const increase = product.newPrice - product.oldPrice;
    const percentage = ((increase / product.oldPrice) * 100).toFixed(1);
    
    this.showNotification(`📈 Price Increase Alert`, {
      body: `${product.title}\nWas $${product.oldPrice.toFixed(2)} → Now $${product.newPrice.toFixed(2)}\nIncreased by $${increase.toFixed(2)} (${percentage}%)`,
      icon: product.image || '/favicon.svg',
      tag: `price-increase-${product.title}`,
      data: { url: product.url || '/dashboard' }
    });
  }
}

export default BrowserNotificationService;
