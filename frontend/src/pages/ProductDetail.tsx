import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Product, PriceHistory, PriceAnalysis, productsAPI } from '../services/api';
import Layout from '../components/Layout';
import PriceChart from '../components/PriceChart';
import { 
  ArrowLeftIcon, 
  ArrowTopRightOnSquareIcon,
  PencilIcon,
  ChartBarIcon,
  PlusIcon,
  TrashIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CheckIcon,
  XMarkIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [isRemovingProduct, setIsRemovingProduct] = useState(false);
  const [isCheckingPrice, setIsCheckingPrice] = useState(false);
  const [isAddingTestHistory, setIsAddingTestHistory] = useState(false);

  useEffect(() => {
    const fetchProductDetails = async () => {
      if (!id) return;

      try {
        // Always try to get product details first (handles both ASIN and DB ID)
        const productResponse = await productsAPI.getById(id);
        const productData = productResponse.data.product;
        
        setProduct(productData);

        // Only fetch price history if the product is being tracked
        if (productData.isTracked && productData.id) {
          try {
            // Fetch price history from when tracking started
            const historyResponse = await productsAPI.getPriceHistory(productData.id, 100);
            setPriceHistory(historyResponse.data.priceHistory);
            console.log('Fetched price history:', historyResponse.data.priceHistory.length, 'entries');
          } catch (historyError) {
            console.log('Price history not available for this product');
            setPriceHistory([]);
          }
        } else {
          setPriceHistory([]);
        }
      } catch (error: any) {
        console.error('Failed to fetch product details:', error);
        if (error.response?.status === 404) {
          toast.error('Product not found');
        } else {
          toast.error('Failed to fetch product details');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchProductDetails();
  }, [id]);

  const handleProductUpdate = (updatedProduct: Product) => {
    setProduct(updatedProduct);
  };

  const handleAddToTracking = async () => {
    if (!product || !id) return;

    setIsAddingProduct(true);
    try {
      // Extract ASIN from URL if needed
      const asin = id.length === 10 ? id : product.url.split('/dp/')[1]?.split('/')[0];
      
      if (!asin) {
        toast.error('Unable to determine product ASIN');
        return;
      }

      const response = await productsAPI.add({ asin });
      if (response.data && response.data.product) {
        toast.success('Product added to tracking list!');

        navigate(`/product/${response.data.product.id}`);
        
        // Update the product state with the tracked version
        const trackedProduct = response.data.product;
        setProduct(trackedProduct);
        
        // Fetch the initial price history for the newly tracked product
        if (trackedProduct.id) {
          try {
            const historyResponse = await productsAPI.getPriceHistory(trackedProduct.id, 100);
            setPriceHistory(historyResponse.data.priceHistory);
          } catch (historyError) {
            console.log('Price history not yet available for newly tracked product');
            setPriceHistory([]);
          }
        }
      }
    } catch (error: any) {
      console.error('Error adding product:', error);
      if (error.response?.data?.error === 'Product already being tracked') {
        toast.error('Product is already in your tracking list');
      } else {
        toast.error('Failed to add product to tracking list');
      }
    } finally {
      setIsAddingProduct(false);
    }
  };

  const handleRemoveProduct = async () => {
    if (!product || !product.id) return;

    if (!window.confirm('Are you sure you want to stop tracking this product? This will remove it from your tracking list.')) {
      return;
    }

    setIsRemovingProduct(true);
    try {
      await productsAPI.delete(product.id);
      toast.success('Product removed from tracking list');
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Error removing product:', error);
      toast.error('Failed to remove product from tracking list');
    } finally {
      setIsRemovingProduct(false);
    }
  };

  const handleCheckPriceNow = async () => {
    if (!product || !product.id) return;

    setIsCheckingPrice(true);
    try {
      await productsAPI.checkPrice(product.id);
      toast.success('Price check completed! Refreshing data...');
      
      // Refresh the product data and price history
      const productResponse = await productsAPI.getById(product.id);
      const productData = productResponse.data.product;
      setProduct(productData);

      if (productData.isTracked && productData.id) {
        const historyResponse = await productsAPI.getPriceHistory(productData.id, 100);
        setPriceHistory(historyResponse.data.priceHistory);
      }
    } catch (error: any) {
      console.error('Error checking price:', error);
      toast.error('Failed to check price');
    } finally {
      setIsCheckingPrice(false);
    }
  };

  const handleAddTestHistory = async () => {
    if (!product || !product.id) return;

    setIsAddingTestHistory(true);
    try {
      await productsAPI.addTestPriceHistory(product.id);
      toast.success('Test price history added! Refreshing data...');
      
      // Refresh the price history
      const historyResponse = await productsAPI.getPriceHistory(product.id, 100);
      setPriceHistory(historyResponse.data.priceHistory);
    } catch (error: any) {
      console.error('Error adding test history:', error);
      toast.error('Failed to add test price history');
    } finally {
      setIsAddingTestHistory(false);
    }
  };

  const getPriceStats = () => {
    if (priceHistory.length === 0) return null;

    const prices = priceHistory.map(item => item.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;

    return { minPrice, maxPrice, avgPrice };
  };

  const getRecentPriceChange = () => {
    if (priceHistory.length < 2) return null;

    const currentPrice = priceHistory[0].price;
    const previousPrice = priceHistory[1].price;
    const change = currentPrice - previousPrice;
    const percentChange = (change / previousPrice) * 100;

    return { change, percentChange };
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Product not found</h3>
          <p className="text-gray-500 mb-4">The product you're looking for doesn't exist.</p>
          <Link
            to="/dashboard"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </div>
      </Layout>
    );
  }

  const priceStats = getPriceStats();
  const recentChange = getRecentPriceChange();

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
        {/* Minimal Header */}
        <div className="max-w-6xl mx-auto px-4 py-6">
          <Link
            to="/dashboard"
            className="inline-flex items-center text-slate-600 hover:text-slate-800 transition-colors mb-8 group"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Dashboard
          </Link>

          {/* Hero Section */}
          <div className="bg-white/70 backdrop-blur-sm rounded-3xl border border-slate-200/50 shadow-xl shadow-slate-200/20 overflow-hidden mb-8">
            <div className="p-6 sm:p-8">
              <div className="flex flex-col lg:flex-row gap-8">
                {/* Product Image */}
                <div className="flex-shrink-0 mx-auto lg:mx-0">
                  {product.imageUrl ? (
                    <div className="relative group w-full max-w-sm lg:max-w-xs">
                      <div className="aspect-square w-full max-w-64 mx-auto bg-white rounded-2xl p-4 shadow-lg group-hover:shadow-xl transition-shadow">
                        <img
                          src={product.imageUrl}
                          alt={product.title}
                          className="w-full h-full object-contain rounded-xl"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                    </div>
                  ) : (
                    <div className="aspect-square w-full max-w-64 mx-auto bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center shadow-lg">
                      <ChartBarIcon className="h-16 w-16 text-slate-400" />
                    </div>
                  )}
                </div>
                
                {/* Product Info */}
                <div className="flex-1 space-y-6">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight mb-4">
                      {product.title}
                    </h1>
                    
                    {product.description && (
                      <p className="text-slate-600 leading-relaxed line-clamp-3">
                        {product.description}
                      </p>
                    )}
                  </div>

                  {/* Status & Info Pills */}
                  <div className="flex flex-wrap gap-3">
                    <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${
                      product.isTracked 
                        ? (product.isActive 
                          ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                          : 'bg-amber-100 text-amber-700 border border-amber-200')
                        : 'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}>
                      <div className={`w-2 h-2 rounded-full mr-2 ${
                        product.isTracked 
                          ? (product.isActive ? 'bg-emerald-500' : 'bg-amber-500')
                          : 'bg-slate-400'
                      }`}></div>
                      {product.isTracked 
                        ? (product.isActive ? 'Tracking Active' : 'Tracking Paused')
                        : 'Not Tracked'}
                    </div>
                    
                    {product.isTracked && (
                      <div className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-slate-100 text-slate-700 border border-slate-200">
                        Added {new Date(product.createdAt).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          year: new Date(product.createdAt).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
                        })}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <a
                      href={product.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center px-6 py-3 bg-slate-900 text-white font-medium rounded-xl hover:bg-slate-800 transition-all hover:shadow-lg hover:shadow-slate-900/25 group"
                    >
                      <ArrowTopRightOnSquareIcon className="h-4 w-4 mr-2 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      View on Amazon
                    </a>

                    {product.isTracked ? (
                      <div className="flex flex-col sm:flex-row gap-3">

                        <button
                          onClick={handleRemoveProduct}
                          disabled={isRemovingProduct}
                          className="inline-flex items-center justify-center px-6 py-3 bg-red-500 text-white font-medium rounded-xl hover:bg-red-600 transition-all hover:shadow-lg hover:shadow-slate-900/25 group"
                        >
                          {isRemovingProduct ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-600 border-t-transparent"></div>
                          ) : (
                            <>
                            <TrashIcon className="h-4 w-4 mr-2 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                             Remove Tracking
                            </>
                          )}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={handleAddToTracking}
                        disabled={isAddingProduct}
                        className="inline-flex items-center justify-center px-6 py-3 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 transition-all hover:shadow-lg hover:shadow-emerald-600/25 disabled:opacity-50"
                      >
                        {isAddingProduct ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                        ) : (
                          <PlusIcon className="h-4 w-4 mr-2" />
                        )}
                        Start Tracking
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Price Chart */}
            <div className="xl:col-span-2">
              {product.isTracked ? (
                <PriceChart 
                  data={priceHistory} 
                  currentPrice={product.currentPrice}
                  productTitle={product.title}
                />
              ) : (
                <div className="bg-white/70 backdrop-blur-sm rounded-3xl border border-slate-200/50 shadow-xl shadow-slate-200/20 p-8">
                  <div className="text-center py-16">
                    <div className="bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl w-24 h-24 flex items-center justify-center mx-auto mb-4">
                      <ChartBarIcon className="h-12 w-12 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-900 mb-2">
                      Start tracking to see price history
                    </h3>
                    <p className="text-slate-500 max-w-sm mx-auto">
                      Add this product to your tracking list to monitor price changes over time.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Price Info Sidebar */}
            <div className="space-y-6">
              {/* Current Price Card */}
              <div className="bg-white/70 backdrop-blur-sm rounded-3xl border border-slate-200/50 shadow-xl shadow-slate-200/20 p-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-slate-900 mb-2">
                    ${product.currentPrice.toFixed(2)}
                  </div>
                  <div className="text-slate-500 text-sm mb-4">Current Price</div>
                  
                  {recentChange && (
                    <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${
                      recentChange.change < 0 
                        ? 'bg-emerald-100 text-emerald-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {recentChange.change < 0 ? (
                        <ArrowTrendingDownIcon className="h-4 w-4 mr-1" />
                      ) : (
                        <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                      )}
                      {recentChange.change < 0 ? '-' : '+'}${Math.abs(recentChange.change).toFixed(2)} 
                      ({Math.abs(recentChange.percentChange).toFixed(1)}%)
                    </div>
                  )}
                </div>

                {/* Target Price section removed */}
              </div>

              {/* Price Statistics */}
              {priceStats && (
                <div className="bg-white/70 backdrop-blur-sm rounded-3xl border border-slate-200/50 shadow-xl shadow-slate-200/20 p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Statistics</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Lowest</span>
                      <span className="font-semibold text-emerald-600">
                        ${priceStats.minPrice.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Highest</span>
                      <span className="font-semibold text-red-600">
                        ${priceStats.maxPrice.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Average</span>
                      <span className="font-semibold text-slate-900">
                        ${priceStats.avgPrice.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProductDetail;
