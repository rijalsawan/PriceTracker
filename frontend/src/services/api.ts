import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Debug: Log the API URL being used
console.log('🔗 API Base URL:', API_BASE_URL);
console.log('🔗 Environment:', process.env.NODE_ENV);
console.log('🔗 REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
console.log('🔗 Current Origin:', window.location.origin);

// Validate the API URL format
if (API_BASE_URL && !API_BASE_URL.startsWith('http')) {
  console.error('❌ INVALID API URL: Must start with http:// or https://', API_BASE_URL);
}

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Debug: Log the full request URL
    const fullUrl = (config.baseURL || '') + (config.url || '');
    console.log('🚀 API Request:', {
      method: config.method?.toUpperCase(),
      endpoint: config.url,
      baseURL: config.baseURL,
      fullURL: fullUrl
    });
    
    // Validate URL format
    if (!fullUrl.startsWith('https://pricetracker-production-f9e3.up.railway.app')) {
      console.error('❌ WRONG API URL! Expected Railway URL, got:', fullUrl);
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Types
export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  createdAt: string;
}

export interface Product {
  id: string | null;
  asin?: string;
  url: string;
  title: string;
  description?: string;
  imageUrl?: string;
  currentPrice: number;
  targetPrice?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  priceHistory?: PriceHistory[];
  isTracked?: boolean;
}

export interface PriceHistory {
  id: string;
  price: number;
  timestamp: string;
}

export interface PriceAnalysis {
  current: number;
  changes: {
    week: { change: number; percentChange: number };
    month: { change: number; percentChange: number };
    threeMonths: { change: number; percentChange: number };
    sixMonths: { change: number; percentChange: number };
    year: { change: number; percentChange: number };
  };
  stats: {
    lowest: number;
    highest: number;
    average: number;
  };
  historicalData: Array<{
    timestamp: Date;
    price: number;
    source: 'internal';
  }>;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'PRICE_DROP' | 'PRICE_INCREASE' | 'TARGET_REACHED' | 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  isRead: boolean;
  createdAt: string;
  updatedAt?: string;
  product?: {
    id: string;
    title: string;
    imageUrl?: string;
    oldPrice?: number;
    newPrice?: number;
  };
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface AddProductData {
  asin: string;
  targetPrice?: number;
}

export interface UpdateProductData {
  targetPrice?: number;
  isActive?: boolean;
}

// Amazon Search Types
export interface AmazonProduct {
  asin: string;
  title: string;
  price: number;
  originalPrice?: number;
  rating?: number;
  reviewCount?: number;
  imageUrl?: string;
  url: string;
  isPrime?: boolean;
  discount?: number;
}

export interface SearchResult {
  products: AmazonProduct[];
  totalResults: number;
  searchTerm: string;
}

export interface ProductDetails extends AmazonProduct {
  description?: string;
  specifications?: { [key: string]: string };
  features?: string[];
  category?: string;
}

// Auth API
export const authAPI = {
  login: (data: LoginData) => api.post('/auth/login', data),
  register: (data: RegisterData) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
};

// Products API
export const productsAPI = {
  getAll: () => api.get('/products'),
  getById: (id: string) => api.get(`/products/${id}`),
  add: (data: AddProductData) => api.post('/products', data),
  update: (id: string, data: UpdateProductData) => api.put(`/products/${id}`, data),
  delete: (id: string) => api.delete(`/products/${id}`),
  getPriceHistory: (id: string, limit?: number) => 
    api.get(`/products/${id}/history${limit ? `?limit=${limit}` : ''}`),
  getHistoricalPrices: (id: string) => api.get(`/products/${id}/historical-prices`),
  checkPrice: (id: string) => api.post(`/products/${id}/check-price`),
  addTestPriceHistory: (id: string) => api.post(`/products/${id}/add-test-price-history`),
};

// Notifications API
export const notificationsAPI = {
  getAll: () => api.get('/notifications'),
  create: (notification: Omit<Notification, 'id' | 'createdAt' | 'updatedAt'>) => api.post('/notifications', notification),
  markAsRead: (id: string) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  delete: (id: string) => api.delete(`/notifications/${id}`),
  deleteByProduct: (productId: string) => api.delete(`/notifications/product/${productId}`),
  getUnreadCount: () => api.get('/notifications/unread-count'),
};

// Search API
export const searchAPI = {
  searchProducts: (query: string, page: number = 1) => 
    api.get(`/search/products?q=${encodeURIComponent(query)}&page=${page}`),
  getProductDetails: (asin: string) => 
    api.get(`/search/products/${asin}`),
  getSuggestions: (query: string) => 
    api.get(`/search/suggestions?q=${encodeURIComponent(query)}`),
};

export default api;
