import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import ProductCard from '../components/ProductCard';
import AddProductModal from '../components/AddProductModal';
import { Product, productsAPI } from '../services/api';
import { PlusIcon, MagnifyingGlassIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const Dashboard: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await productsAPI.getAll();
      setProducts(response.data.products);
    } catch (error) {
      toast.error('Failed to fetch products');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProductAdded = (newProduct: Product) => {
    setProducts(prev => [newProduct, ...prev]);
  };

  const handleProductUpdated = (updatedProduct: Product) => {
    setProducts(prev =>
      prev.map(product =>
        product.id === updatedProduct.id ? updatedProduct : product
      )
    );
  };

  const handleProductDeleted = (productId: string) => {
    setProducts(prev => prev.filter(product => product.id !== productId));
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-300 border-t-slate-600"></div>
          </div>
        </div>
      </Layout>
    );
  }

  const activeProducts = products.filter(p => p.isActive);
  const totalSavings = products.reduce((acc, product) => {
    if (product.targetPrice && product.currentPrice <= product.targetPrice) {
      return acc + (product.targetPrice - product.currentPrice);
    }
    return acc;
  }, 0);

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2">
                  Price Tracker
                </h1>
                <p className="text-slate-600 text-lg">
                  Monitor your favorite products and never miss a deal
                </p>
              </div>
              
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center max-sm:w-1/2 max-sm:mx-auto max-sm: my-4 justify-center px-6 py-3 bg-slate-900 text-white font-medium rounded-2xl hover:bg-slate-800 transition-all hover:shadow-lg hover:shadow-slate-900/25 group"
              >
                <PlusIcon className="h-5 w-5 mr-2  group-hover:scale-110 transition-transform" />
                Add Product
              </button>
            </div>

           
          </div>

          {/* Content */}
          {products.length === 0 ? (
            <div className="text-center py-16">
              <div className="bg-white/70 backdrop-blur-sm rounded-3xl border border-slate-200/50 shadow-xl shadow-slate-200/20 p-12 max-w-md mx-auto">
                <div className="bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl w-20 h-20 flex items-center justify-center mx-auto mb-6">
                  <MagnifyingGlassIcon className="h-10 w-10 text-slate-400" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">
                  Start tracking your first product
                </h3>
                <p className="text-slate-600 mb-8 leading-relaxed">
                  Add Amazon products to your watchlist and get notified when prices drop to your target.
                </p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center justify-center px-8 py-4 bg-slate-900 text-white font-medium rounded-2xl hover:bg-slate-800 transition-all hover:shadow-lg hover:shadow-slate-900/25 group"
                >
                  <PlusIcon className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
                  Add Your First Product
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-slate-900">
                  Your Products ({products.length})
                </h2>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onUpdate={handleProductUpdated}
                    onDelete={handleProductDeleted}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Product Modal */}
      <AddProductModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onProductAdded={fetchProducts}
      />
    </Layout>
  );
};

export default Dashboard;
