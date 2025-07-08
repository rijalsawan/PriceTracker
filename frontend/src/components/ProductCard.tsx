import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Product, productsAPI } from '../services/api';
import { 
  EllipsisVerticalIcon, 
  ArrowTopRightOnSquareIcon,
  PencilIcon,
  TrashIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import EditTargetModal from './EditTargetModal';

interface ProductCardProps {
  product: Product;
  onUpdate: (product: Product) => void;
  onDelete: (productId: string) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onUpdate, onDelete }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEditTargetModalOpen, setIsEditTargetModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }

    // Only allow deleting tracked products that have an ID
    if (!product.id) {
      toast.error('Cannot delete product that is not being tracked');
      return;
    }

    setIsDeleting(true);
    try {
      await productsAPI.delete(product.id);
      onDelete(product.id); // TypeScript knows product.id is string here due to the check above
      toast.success('Product deleted successfully');
    } catch (error) {
      toast.error('Failed to delete product');
    } finally {
      setIsDeleting(false);
    }
  };

  const getPriceChangeIndicator = () => {
    if (!product.priceHistory || product.priceHistory.length < 2) {
      return null;
    }

    const currentPrice = product.currentPrice;
    const previousPrice = product.priceHistory[1]?.price;
    
    if (!previousPrice) return null;

    const change = currentPrice - previousPrice;
    const percentChange = (change / previousPrice) * 100;

    if (Math.abs(change) < 0.01) return null;

    return (
      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
        change < 0 
          ? 'bg-emerald-100 text-emerald-700' 
          : 'bg-red-100 text-red-700'
      }`}>
        {change < 0 ? (
          <ArrowTrendingDownIcon className="h-3 w-3 mr-1" />
        ) : (
          <ArrowTrendingUpIcon className="h-3 w-3 mr-1" />
        )}
        {change < 0 ? '-' : '+'}${Math.abs(change).toFixed(2)}
      </div>
    );
  };

  const isTargetReached = product.targetPrice && product.currentPrice <= product.targetPrice;

  return (
    <>
      <div className="group bg-white/70 backdrop-blur-sm rounded-3xl border border-slate-200/50 shadow-lg shadow-slate-200/20 hover:shadow-xl hover:shadow-slate-200/30 transition-all duration-300 overflow-hidden">
        {/* Product Image */}
        <div className="relative">
          <div className="aspect-square bg-white p-4 m-4 rounded-2xl">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.title}
                className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-full bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl">
                <ChartBarIcon className="h-12 w-12 text-slate-400" />
              </div>
            )}
          </div>

          {/* Actions Menu */}
          <div className="absolute top-6 right-6">
            <div className="relative">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg hover:shadow-xl border border-slate-200/50 hover:bg-white transition-all duration-200"
              >
                <EllipsisVerticalIcon className="h-4 w-4 text-slate-600" />
              </button>

              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/50 z-20">
                  <div className="py-2">
                    <button
                      onClick={() => {
                        setIsEditTargetModalOpen(true);
                        setIsMenuOpen(false);
                      }}
                      className="flex items-center px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 w-full text-left transition-colors"
                    >
                      <PencilIcon className="h-4 w-4 mr-3" />
                      Edit Target Price
                    </button>
                    <a
                      href={product.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <ArrowTopRightOnSquareIcon className="h-4 w-4 mr-3" />
                      View on Amazon
                    </a>
                    <button
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="flex items-center px-4 py-3 text-sm text-red-600 hover:bg-red-50 w-full text-left disabled:opacity-50 transition-colors"
                    >
                      <TrashIcon className="h-4 w-4 mr-3" />
                      {isDeleting ? 'Removing...' : 'Remove Product'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Target reached badge */}
          {isTargetReached && (
            <div className="absolute top-6 left-6">
              <div className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">
                🎯 Target Reached
              </div>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="p-6 pt-2">
          {/* Product Title */}
          <Link
            to={`/product/${product.id}`}
            className="block group-hover:text-slate-600 transition-colors duration-200"
          >
            <h3 className="font-semibold text-slate-900 line-clamp-2 mb-3 leading-snug">
              {product.title}
            </h3>
          </Link>

          {/* Price Section */}
          <div className="mb-4">
            <div className="flex items-baseline justify-between mb-2">
              <div className="text-2xl font-bold text-slate-900">
                ${product.currentPrice.toFixed(2)}
              </div>
              {getPriceChangeIndicator()}
            </div>
            
            {product.targetPrice && (
              <div className="text-sm text-slate-600">
                Target: <span className="font-semibold text-blue-600">${product.targetPrice.toFixed(2)}</span>
              </div>
            )}
          </div>

          {/* Status and Actions */}
          <div className="flex items-center justify-between">
            <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${
              product.isActive 
                ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                : 'bg-slate-100 text-slate-700 border border-slate-200'
            }`}>
              <div className={`w-2 h-2 rounded-full mr-2 ${
                product.isActive ? 'bg-emerald-500' : 'bg-slate-400'
              }`}></div>
              {product.isActive ? 'Tracking' : 'Paused'}
            </div>

            <Link
              to={`/product/${product.id}`}
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors group/link"
            >
              View Details
              <span className="inline-block ml-1 group-hover/link:translate-x-1 transition-transform">→</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Edit Target Modal */}
      <EditTargetModal
        isOpen={isEditTargetModalOpen}
        onClose={() => setIsEditTargetModalOpen(false)}
        product={product}
        onUpdate={onUpdate}
      />
    </>
  );
};

export default ProductCard;
