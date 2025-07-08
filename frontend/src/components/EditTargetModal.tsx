import React, { useState, useRef, useEffect } from 'react';
import { XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';
import { Product, productsAPI } from '../services/api';
import toast from 'react-hot-toast';

interface EditTargetModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  onUpdate: (updatedProduct: Product) => void;
}

const EditTargetModal: React.FC<EditTargetModalProps> = ({ 
  isOpen, 
  onClose, 
  product, 
  onUpdate 
}) => {
  const [targetPrice, setTargetPrice] = useState(product.targetPrice?.toString() || '');
  const [isLoading, setIsLoading] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setTargetPrice(product.targetPrice?.toString() || '');
    }
  }, [isOpen, product.targetPrice]);

  // Handle outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!product.id) {
      toast.error('Cannot update product without ID');
      return;
    }

    setIsLoading(true);

    try {
      const targetPriceNum = targetPrice ? parseFloat(targetPrice) : undefined;
      
      // Validate target price
      if (targetPrice && (isNaN(targetPriceNum!) || targetPriceNum! <= 0)) {
        toast.error('Please enter a valid target price');
        setIsLoading(false);
        return;
      }

      const response = await productsAPI.update(product.id, { 
        targetPrice: targetPriceNum 
      });
      
      if (response.data) {
        onUpdate(response.data);
        toast.success(targetPrice ? 'Target price updated successfully!' : 'Target price removed successfully!');
        onClose();
      }
    } catch (error: any) {
      console.error('Error updating target price:', error);
      toast.error('Failed to update target price. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/30 backdrop-blur-lg transition-all duration-500 ease-out ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Modal Container */}
      <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
        <div
          ref={modalRef}
          className={`relative w-full max-w-md transform transition-all duration-500 ease-out ${
            isOpen 
              ? 'opacity-100 scale-100 translate-y-0' 
              : 'opacity-0 scale-90 translate-y-8'
          }`}
        >
          {/* Glow Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 via-blue-300/20 to-blue-400/20 rounded-3xl blur-xl opacity-60"></div>
          
          {/* Modal */}
          <div className="relative bg-white/90 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl shadow-slate-900/20 overflow-hidden">
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-slate-100/80 hover:bg-slate-200/80 flex items-center justify-center transition-all duration-300 hover:scale-110 group"
            >
              <XMarkIcon className="h-4 w-4 text-slate-600 group-hover:text-slate-800 transition-colors" />
            </button>

            {/* Content */}
            <div className="p-8 pt-16">
              {/* Header */}
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center">
                  <span className="text-2xl">🎯</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  Edit Target Price
                </h3>
                <p className="text-slate-500 text-sm">
                  {product.title?.length! > 50 
                    ? product.title?.substring(0, 50) + '...'
                    : product.title
                  }
                </p>
              </div>

              {/* Current Price Info */}
              <div className="bg-slate-50/50 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Current Price:</span>
                  <span className="font-semibold text-slate-900">
                    ${product.currentPrice.toFixed(2)}
                  </span>
                </div>
                {product.targetPrice && (
                  <div className="flex items-center justify-between text-sm mt-2">
                    <span className="text-slate-600">Current Target:</span>
                    <span className="font-semibold text-blue-600">
                      ${product.targetPrice.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="target-price" className="block text-sm font-medium text-slate-700">
                    Target Price
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500">$</span>
                    <input
                      id="target-price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={targetPrice}
                      onChange={(e) => setTargetPrice(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-8 pr-4 py-4 bg-slate-50/50 border border-slate-200/50 hover:border-slate-300/70 focus:border-blue-400 focus:bg-white/80 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-400/10 transition-all duration-300"
                      disabled={isLoading}
                      autoFocus
                    />
                  </div>
                  <p className="text-xs text-slate-400 px-1">
                    Leave empty to remove target price alerts
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isLoading}
                    className="flex-1 px-5 py-3 text-slate-600 hover:text-slate-800 hover:bg-slate-100/50 rounded-xl font-medium transition-all duration-300 disabled:opacity-50 hover:scale-[0.98]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 inline-flex items-center justify-center px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[0.98] hover:shadow-lg group"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white mr-2"></div>
                        <span>Updating...</span>
                      </>
                    ) : (
                      <>
                        <CheckIcon className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                        <span>Update Target</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditTargetModal;
