import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Product, PriceHistory, PriceAnalysis, productsAPI } from '../services/api';
import Layout from '../components/Layout';
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
import EditProductModal from '../components/EditProductModal';

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
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
    setIsEditModalOpen(false);
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

  // Simple price history display component
  const PriceHistoryDisplay = ({ history }: { history: PriceHistory[] }) => {
    console.log('PriceHistoryDisplay received history:', history);
    
    if (!history || history.length === 0) {
      return (
        <div className="text-center py-12">
          <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No price history yet</h3>
          <p className="text-sm text-gray-500">
            Price tracking starts when you add the product
          </p>
        </div>
      );
    }

    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    };

    const maxPrice = Math.max(...history.map(h => h.price));
    const minPrice = Math.min(...history.map(h => h.price));

    // Debug logging
    console.log('Price History Display Data:', {
      historyLength: history.length,
      maxPrice,
      minPrice,
      firstFewEntries: history.slice(0, 3).map(h => ({ price: h.price, timestamp: h.timestamp }))
    });

    return (
      <div className="space-y-6">
        {/* Simple Bar Chart */}
        <div className="relative h-32 bg-gray-50 rounded-lg p-4">
          <div className="flex items-end justify-between h-full">
            {history.slice(0, 10).reverse().map((entry, index) => {
              // More robust height calculation
              let height = 50; // Default height
              if (maxPrice > minPrice) {
                height = ((entry.price - minPrice) / (maxPrice - minPrice)) * 70 + 20;
              } else if (history.length === 1) {
                height = 60; // Single entry gets good height
              }
              
              console.log(`Bar ${index}: price=${entry.price}, calculated height=${height}%`);
              
              const isLatest = index === history.slice(0, 10).reverse().length - 1;
              const isLowest = entry.price === minPrice;
              const isHighest = entry.price === maxPrice;
              
              return (
                <div
                  key={entry.id || index}
                  className="flex-1 flex justify-center items-end relative group"
                >
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs rounded py-2 px-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 whitespace-nowrap">
                    <div className="font-semibold">${entry.price.toFixed(2)}</div>
                    <div className="text-gray-300">{formatDate(entry.timestamp)}</div>
                    {isLatest && <div className="text-blue-300">Latest Price</div>}
                    {isLowest && <div className="text-green-300">Lowest Price</div>}
                    {isHighest && <div className="text-red-300">Highest Price</div>}
                    {/* Arrow pointing down */}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-gray-900"></div>
                  </div>
                  
                  {/* Bar */}
                  <div
                    className={`w-4 rounded-t transition-all duration-300 border cursor-pointer ${
                      isLatest 
                        ? 'bg-blue-600 border-blue-700 group-hover:bg-blue-700' 
                        : isLowest
                        ? 'bg-green-500 border-green-600 group-hover:bg-green-600'
                        : isHighest
                        ? 'bg-red-500 border-red-600 group-hover:bg-red-600'
                        : 'bg-blue-400 border-blue-500 group-hover:bg-blue-500'
                    }`}
                    style={{ 
                      height: `${Math.max(height, 15)}%`, 
                      minHeight: '12px'
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Price Range Display */}
        <div className="flex justify-between text-xs text-gray-500 px-2">
          <span>Min: ${minPrice.toFixed(2)}</span>
          <span>Max: ${maxPrice.toFixed(2)}</span>
        </div>

        {/* Chart Legend */}
        <div className="flex justify-center space-x-4 text-xs text-gray-600">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-blue-600 rounded"></div>
            <span>Latest</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>Lowest</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span>Highest</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-blue-400 rounded"></div>
            <span>Other</span>
          </div>
        </div>

        {/* Current Price */}
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">
            ${history[0]?.price.toFixed(2)}
          </div>
          <div className="text-sm text-gray-500">Current Price</div>
        </div>

        {/* Recent Price History */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-900">Recent History</h4>
          {history.slice(0, 5).map((entry, index) => (
            <div key={entry.id || index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
              <div className="text-sm text-gray-900">
                ${entry.price.toFixed(2)}
              </div>
              <div className="text-xs text-gray-500">
                {formatDate(entry.timestamp)}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
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
  const isTargetReached = product.targetPrice && product.currentPrice <= product.targetPrice;

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
              <div className="bg-white/70 backdrop-blur-sm rounded-3xl border border-slate-200/50 shadow-xl shadow-slate-200/20">
                <div className="p-6 sm:p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-slate-900">Price History</h3>
                    <div className="flex items-center text-sm text-slate-500">
                      <ChartBarIcon className="h-4 w-4 mr-1" />
                      {priceHistory.length} records
                    </div>
                  </div>
                  
                  {product.isTracked ? (
                    <PriceHistoryDisplay history={priceHistory} />
                  ) : (
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
                  )}
                </div>
              </div>
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

                {product.targetPrice && (
                  <div className="mt-6 pt-6 border-t border-slate-200">
                    <div className="text-center">
                      <div className="text-2xl font-semibold text-blue-600 mb-1">
                        ${product.targetPrice.toFixed(2)}
                      </div>
                      <div className="text-slate-500 text-sm mb-3">Target Price</div>
                      {isTargetReached && (
                        <div className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-emerald-100 text-emerald-700">
                          🎯 Target Reached!
                        </div>
                      )}
                    </div>
                  </div>
                )}
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

        {/* Edit Product Modal - Only show for tracked products */}
        {product.isTracked && (
          <EditProductModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            product={product}
            onUpdate={handleProductUpdate}
          />
        )}
      </div>
    </Layout>
  );
};

export default ProductDetail;
