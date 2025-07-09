import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  XMarkIcon, 
  MagnifyingGlassIcon, 
  LinkIcon,
  PlusIcon,
  ArrowRightIcon 
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { productsAPI } from '../services/api';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductAdded?: () => void;
}

const AddProductModal: React.FC<AddProductModalProps> = ({ isOpen, onClose, onProductAdded }) => {
  const [selectedMethod, setSelectedMethod] = useState<'search' | 'url' | null>(null);
  const [amazonUrl, setAmazonUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedMethod(null);
      setAmazonUrl('');
    }
  }, [isOpen]);

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

  // Extract ASIN from Amazon URL
  const extractAsinFromUrl = (url: string): string | null => {
    try {
      const patterns = [
        /\/dp\/([A-Z0-9]{10})/,
        /\/gp\/product\/([A-Z0-9]{10})/,
        /\/product\/([A-Z0-9]{10})/,
        /asin=([A-Z0-9]{10})/i,
        /\/([A-Z0-9]{10})\/?(?:\?|$)/
      ];

      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) {
          return match[1];
        }
      }
      return null;
    } catch {
      return null;
    }
  };

  // Handle URL submission
  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amazonUrl.trim()) {
      toast.error('Please enter an Amazon product URL');
      return;
    }

    const asin = extractAsinFromUrl(amazonUrl);
    if (!asin) {
      toast.error('Invalid Amazon URL. Please check the URL and try again.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await productsAPI.add({ 
        asin
      });
      if (response.data) {
        toast.success('Product added to tracking list successfully!');
        onProductAdded?.();
        onClose();
      }
    } catch (error: any) {
      console.error('Error adding product:', error);
      if (error.response?.data?.error === 'Product already being tracked') {
        toast.error('This product is already in your tracking list');
      } else {
        toast.error('Failed to add product. Please try again.');
      }
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
          <div className="absolute inset-0 bg-gradient-to-r from-slate-400/20 via-slate-300/20 to-slate-400/20 rounded-3xl blur-xl opacity-60"></div>
          
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
              {!selectedMethod ? (
                /* Method Selection */
                <div 
                  className="space-y-8"
                  style={{ animation: 'fadeSlideIn 0.6s ease-out' }}
                >
                  {/* Header */}
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center">
                      <PlusIcon className="h-8 w-8 text-slate-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">
                      Add Product
                    </h2>
                    <p className="text-slate-500 text-sm">
                      Choose how you'd like to add a product
                    </p>
                  </div>

                  {/* Options */}
                  <div className="space-y-3">
                    {/* Search Option */}
                    <button
                      onClick={() => setSelectedMethod('search')}
                      className="group w-full p-5 bg-gradient-to-r from-slate-50/50 to-slate-100/50 hover:from-slate-100/80 hover:to-slate-150/80 border border-slate-200/50 hover:border-slate-300/70 rounded-2xl text-left transition-all duration-400 hover:shadow-lg hover:shadow-slate-900/5 transform hover:scale-[1.01] hover:-translate-y-0.5"
                      style={{ 
                        animationDelay: '0.1s',
                        animation: 'slideInUp 0.6s ease-out both'
                      }}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-slate-600 to-slate-800 rounded-xl flex items-center justify-center group-hover:shadow-lg group-hover:scale-105 transition-all duration-300">
                          <MagnifyingGlassIcon className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-900 mb-1 group-hover:text-slate-700 transition-colors">
                            Search Products
                          </h3>
                          <p className="text-xs text-slate-500 group-hover:text-slate-600 transition-colors">
                            Browse and find Amazon products
                          </p>
                        </div>
                        <ArrowRightIcon className="h-4 w-4 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-1 transition-all duration-300" />
                      </div>
                    </button>

                    {/* URL Option */}
                    <button
                      onClick={() => setSelectedMethod('url')}
                      className="group w-full p-5 bg-gradient-to-r from-blue-50/50 to-blue-100/50 hover:from-blue-100/80 hover:to-blue-150/80 border border-blue-200/50 hover:border-blue-300/70 rounded-2xl text-left transition-all duration-400 hover:shadow-lg hover:shadow-blue-900/5 transform hover:scale-[1.01] hover:-translate-y-0.5"
                      style={{ 
                        animationDelay: '0.2s',
                        animation: 'slideInUp 0.6s ease-out both'
                      }}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center group-hover:shadow-lg group-hover:scale-105 transition-all duration-300">
                          <LinkIcon className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-900 mb-1 group-hover:text-blue-700 transition-colors">
                            Amazon URL
                          </h3>
                          <p className="text-xs text-slate-500 group-hover:text-blue-600 transition-colors">
                            Paste an Amazon product link
                          </p>
                        </div>
                        <ArrowRightIcon className="h-4 w-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all duration-300" />
                      </div>
                    </button>
                  </div>
                </div>
              ) : selectedMethod === 'search' ? (
                /* Search Redirect */
                <div 
                  className="text-center space-y-6"
                  style={{ animation: 'fadeSlideIn 0.6s ease-out' }}
                >
                  <div className="w-20 h-20 mx-auto bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center mb-6">
                    <MagnifyingGlassIcon className="h-10 w-10 text-slate-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3">
                      Ready to Explore
                    </h3>
                    <p className="text-slate-500 text-sm leading-relaxed">
                      You'll be redirected to our search page where you can discover and add products to your tracking list.
                    </p>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => setSelectedMethod(null)}
                      className="flex-1 px-5 py-3 text-slate-600 hover:text-slate-800 hover:bg-slate-100/50 rounded-xl font-medium transition-all duration-300 hover:scale-[0.98]"
                    >
                      Back
                    </button>
                    <Link
                      to="/search"
                      onClick={onClose}
                      className="flex-1 px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-medium transition-all duration-300 text-center hover:scale-[0.98] hover:shadow-lg"
                    >
                      Start Searching
                    </Link>
                  </div>
                </div>
              ) : (
                /* URL Input */
                <div 
                  className="space-y-6"
                  style={{ animation: 'fadeSlideIn 0.6s ease-out' }}
                >
                  {/* Header */}
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center">
                      <LinkIcon className="h-8 w-8 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">
                      Add by URL
                    </h3>
                    <p className="text-slate-500 text-sm">
                      Paste your Amazon product link below
                    </p>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleUrlSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <input
                        id="amazon-url"
                        type="url"
                        value={amazonUrl}
                        onChange={(e) => setAmazonUrl(e.target.value)}
                        placeholder="https://www.amazon.com/dp/..."
                        className="w-full px-4 py-4 bg-slate-50/50 border border-slate-200/50 hover:border-slate-300/70 focus:border-blue-400 focus:bg-white/80 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-400/10 transition-all duration-300"
                        disabled={isLoading}
                        autoFocus
                      />
                      <p className="text-xs text-slate-400 px-1">
                        We'll automatically extract the product information
                      </p>
                    </div>



                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setSelectedMethod(null)}
                        disabled={isLoading}
                        className="flex-1 px-5 py-3 text-slate-600 hover:text-slate-800 hover:bg-slate-100/50 rounded-xl font-medium transition-all duration-300 disabled:opacity-50 hover:scale-[0.98]"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={isLoading || !amazonUrl.trim()}
                        className="flex-1 inline-flex items-center justify-center px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[0.98] hover:shadow-lg group"
                      >
                        {isLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white mr-2"></div>
                            <span>Adding...</span>
                          </>
                        ) : (
                          <>
                            <PlusIcon className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                            <span>Add Product</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>

                  {/* Tip */}
                  <div className="bg-slate-50/50 border border-slate-200/50 rounded-xl p-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Copy the product URL from your browser when viewing any Amazon product page. We support all Amazon URL formats.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddProductModal;
