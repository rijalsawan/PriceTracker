import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { MagnifyingGlassIcon, PlusIcon, StarIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { HeartIcon } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';
import { searchAPI, productsAPI } from '../services/api';

interface AmazonProduct {
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

interface SearchResult {
  products: AmazonProduct[];
  totalResults: number;
  searchTerm: string;
}

const ProductSearch: React.FC = () => {
  // Search state persistence keys
  const SEARCH_STATE_KEY = 'productSearch_state';
  const SEARCH_RESULTS_KEY = 'productSearch_results';

  // Initialize state with persisted values
  const [query, setQuery] = useState(() => {
    try {
      const saved = sessionStorage.getItem(SEARCH_STATE_KEY);
      const state = saved ? JSON.parse(saved) : null;
      if (state?.query) {
        console.log('🔄 Restored search query:', state.query);
        return state.query;
      }
      return '';
    } catch {
      return '';
    }
  });

  const [searchResults, setSearchResults] = useState<SearchResult | null>(() => {
    try {
      const saved = sessionStorage.getItem(SEARCH_RESULTS_KEY);
      const results = saved ? JSON.parse(saved) : null;
      if (results) {
        console.log('🔄 Restored search results:', results.products.length, 'products');
      }
      return results;
    } catch {
      return null;
    }
  });

  const [currentPage, setCurrentPage] = useState(() => {
    try {
      const saved = sessionStorage.getItem(SEARCH_STATE_KEY);
      const state = saved ? JSON.parse(saved) : null;
      if (state?.currentPage) {
        console.log('🔄 Restored current page:', state.currentPage);
        return state.currentPage;
      }
      return 1;
    } catch {
      return 1;
    }
  });

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [addingProducts, setAddingProducts] = useState<Set<string>>(new Set());
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const [isStateRestored, setIsStateRestored] = useState(false);

  // Utility functions for state persistence
  const saveSearchState = (searchQuery: string, page: number) => {
    try {
      const state = {
        query: searchQuery,
        currentPage: page,
        timestamp: Date.now()
      };
      sessionStorage.setItem(SEARCH_STATE_KEY, JSON.stringify(state));
      console.log('💾 Saved search state:', state);
    } catch (error) {
      console.warn('Failed to save search state:', error);
    }
  };

  const saveSearchResults = (results: SearchResult) => {
    try {
      sessionStorage.setItem(SEARCH_RESULTS_KEY, JSON.stringify(results));
      console.log('💾 Saved search results:', results.products.length, 'products');
    } catch (error) {
      console.warn('Failed to save search results:', error);
    }
  };

  const clearSearchState = () => {
    try {
      sessionStorage.removeItem(SEARCH_STATE_KEY);
      sessionStorage.removeItem(SEARCH_RESULTS_KEY);
      console.log('🗑️ Cleared search state from sessionStorage');
    } catch (error) {
      console.warn('Failed to clear search state:', error);
    }
  };

  // Debug function to log current sessionStorage state (for development)
  // const debugSearchState = () => {
  //   try {
  //     const state = sessionStorage.getItem(SEARCH_STATE_KEY);
  //     const results = sessionStorage.getItem(SEARCH_RESULTS_KEY);
  //     console.log('🔍 Current search state:', state ? JSON.parse(state) : null);
  //     console.log('📦 Current search results:', results ? 'Available' : 'None');
  //   } catch (error) {
  //     console.warn('Failed to debug search state:', error);
  //   }
  // };

  // Clear search and reset state
  const handleClearSearch = () => {
    setQuery('');
    setSearchResults(null);
    setCurrentPage(1);
    setSelectedProducts(new Set());
    setSuggestions([]);
    setShowSuggestions(false);
    clearSearchState();
    
    // Focus back to search input
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  // Fetch search suggestions
  const fetchSuggestions = async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      console.log('🔍 Fetching suggestions for:', searchQuery);
      const response = await searchAPI.getSuggestions(searchQuery);
      console.log('📝 Suggestions response:', response.data);
      
      if (response.data.success) {
        setSuggestions(response.data.data.suggestions);
        console.log('✅ Suggestions loaded:', response.data.data.suggestions);
      } else {
        console.log('❌ Suggestions failed:', response.data.error);
      }
    } catch (error) {
      console.error('❌ Error fetching suggestions:', error);
      // Provide fallback suggestions
      const fallbackSuggestions = [
        `${searchQuery} case`,
        `${searchQuery} accessories`,
        `best ${searchQuery}`,
        `wireless ${searchQuery}`
      ].filter(s => s.length > searchQuery.length + 2);
      setSuggestions(fallbackSuggestions.slice(0, 3));
    }
  };

  // Handle input change with debounced suggestions
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setShowSuggestions(true);

    // Clear previous timeout
    if (suggestionsTimeoutRef.current) {
      clearTimeout(suggestionsTimeoutRef.current);
    }

    // Set new timeout for suggestions
    suggestionsTimeoutRef.current = setTimeout(() => {
      fetchSuggestions(value);
    }, 300);
  };

  // Perform search
  const handleSearch = async (searchQuery: string = query, page: number = 1) => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a search term');
      return;
    }

    setIsLoading(true);
    setShowSuggestions(false);
    setCurrentPage(page);

    // Scroll to results section when changing pages (but not on initial search)
    if (page > 1 && searchResults) {
      setTimeout(() => {
        const resultsElement = document.getElementById('search-results');
        if (resultsElement) {
          resultsElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          });
        }
      }, 100);
    }

    try {
      console.log('🔍 Searching for:', searchQuery, 'Page:', page);
      const response = await searchAPI.searchProducts(searchQuery, page);
      console.log('📦 Search response:', response.data);
      
      if (response.data.success) {
        const newResults = response.data.data;
        setSearchResults(newResults);
        
        // Save search state and results
        saveSearchState(searchQuery, page);
        saveSearchResults(newResults);
        
        console.log('✅ Search successful:', newResults.products.length, 'products found');
        console.log('📊 Total results:', newResults.totalResults);
        
        if (newResults.products.length === 0) {
          toast.error('No products found. Try a different search term.');
        }
      } else {
        console.log('❌ Search failed:', response.data.error);
        toast.error('Search failed. Please try again.');
      }
    } catch (error: any) {
      console.error('❌ Search error:', error);
      
      if (error.response) {
        console.log('Error response status:', error.response.status);
        console.log('Error response data:', error.response.data);
        
        if (error.response.status === 401) {
          toast.error('Please log in to search for products');
        } else {
          toast.error(`Search failed: ${error.response.data?.error || 'Unknown error'}`);
        }
      } else if (error.request) {
        console.log('No response received:', error.request);
        toast.error('Network error: Cannot connect to search service');
      } else {
        console.log('Request setup error:', error.message);
        toast.error('Search service is temporarily unavailable');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Add product to tracking list
  const handleAddProduct = async (product: AmazonProduct) => {
    setAddingProducts(prev => new Set(Array.from(prev).concat(product.asin)));

    try {
      const response = await productsAPI.add({ asin: product.asin });
      if (response.data) {
        setSelectedProducts(prev => new Set(Array.from(prev).concat(product.asin)));
        toast.success(`Added "${product.title.substring(0, 30)}..." to tracking list`);
      }
    } catch (error: any) {
      console.error('Error adding product:', error);
      if (error.response?.data?.error === 'Product already being tracked') {
        toast.error('Product is already in your tracking list');
        setSelectedProducts(prev => new Set(Array.from(prev).concat(product.asin)));
      } else {
        toast.error('Failed to add product to tracking list');
      }
    } finally {
      setAddingProducts(prev => {
        const newSet = new Set(prev);
        newSet.delete(product.asin);
        return newSet;
      });
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    setShowSuggestions(false);
    handleSearch(suggestion, 1); // Reset to page 1 for new search
  };

  // Handle form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query, 1); // Reset to page 1 for new search
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchInputRef.current && !searchInputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (showSuggestions) {
          setShowSuggestions(false);
        } else if (query) {
          handleClearSearch();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showSuggestions, query]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (suggestionsTimeoutRef.current) {
        clearTimeout(suggestionsTimeoutRef.current);
      }
    };
  }, []);

  // State persistence and cleanup
  useEffect(() => {
    // Clean up old search states (older than 1 hour)
    try {
      const saved = sessionStorage.getItem(SEARCH_STATE_KEY);
      if (saved) {
        const state = JSON.parse(saved);
        const hourAgo = Date.now() - (60 * 60 * 1000);
        if (state.timestamp && state.timestamp < hourAgo) {
          console.log('🗑️ Clearing expired search state');
          clearSearchState();
          setSearchResults(null);
          setQuery('');
          setCurrentPage(1);
        } else if (query || searchResults) {
          // State was restored successfully
          setIsStateRestored(true);
          setTimeout(() => setIsStateRestored(false), 3000); // Hide after 3 seconds
        }
      }
    } catch (error) {
      console.warn('Failed to check search state expiration:', error);
      clearSearchState();
    }
  }, []);

  // Save query changes to session storage
  useEffect(() => {
    if (query) {
      saveSearchState(query, currentPage);
    }
  }, [query, currentPage]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const formatRating = (rating: number) => {
    return rating.toFixed(1);
  };

  const formatReviewCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8 lg:py-12">
          {/* Header */}
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 bg-clip-text text-transparent mb-3 sm:mb-4">
              Discover Products
            </h1>
            <p className="text-slate-600 text-base sm:text-lg max-w-xl lg:max-w-2xl mx-auto leading-relaxed px-4">
              Find and track Amazon products with intelligent price monitoring
            </p>
            
            {/* State Restored Indicator */}
            {isStateRestored && (
              <div className={`mt-3 sm:mt-4 inline-flex items-center px-3 sm:px-4 py-2 bg-green-50 border border-green-200 rounded-full text-green-700 text-xs sm:text-sm font-medium transition-all duration-300 ${
                isStateRestored ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
              }`}>
                <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Search state restored
              </div>
            )}
          </div>

          {/* Search Form */}
          <div className="relative mb-12 sm:mb-16">
            <form onSubmit={handleSubmit} className="max-w-2xl lg:max-w-4xl mx-auto">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-slate-200 to-slate-300 rounded-xl sm:rounded-2xl blur opacity-25 group-hover:opacity-40 transition-opacity"></div>
                <div className="relative bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-slate-200/50 shadow-xl shadow-slate-900/5">
                  <div className="flex">
                    <div className="flex-1 relative">
                      <div className="relative">
                        <MagnifyingGlassIcon className="absolute left-4 sm:left-6 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-slate-400" />
                        <input
                          ref={searchInputRef}
                          type="text"
                          value={query}
                          onChange={handleInputChange}
                          onFocus={() => setShowSuggestions(suggestions.length > 0)}
                          placeholder="Search products..."
                          className="w-full pl-10 sm:pl-14 pr-10 sm:pr-14 py-4 sm:py-6 bg-transparent border-0 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-0 text-base sm:text-lg rounded-l-xl sm:rounded-l-2xl"
                          disabled={isLoading}
                        />
                        {query && (
                          <button
                            type="button"
                            onClick={handleClearSearch}
                            className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors"
                            title="Clear search"
                          >
                            <XMarkIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                          </button>
                        )}
                      </div>

                      {/* Search Suggestions */}
                      {showSuggestions && suggestions.length > 0 && (
                        <div className="absolute z-50 w-full mt-2 bg-white/95 backdrop-blur-md border border-slate-200/50 rounded-lg sm:rounded-xl shadow-2xl shadow-slate-900/10 overflow-hidden">
                          {suggestions.map((suggestion, index) => (
                            <button
                              key={index}
                              type="button"
                              onClick={() => handleSuggestionClick(suggestion)}
                              className="w-full px-4 sm:px-6 py-3 sm:py-4 text-left hover:bg-slate-50 focus:bg-slate-50 focus:outline-none transition-colors border-b border-slate-100 last:border-0"
                            >
                              <div className="flex items-center">
                                <MagnifyingGlassIcon className="h-3 w-3 sm:h-4 sm:w-4 text-slate-400 mr-3 sm:mr-4" />
                                <span className="text-slate-700 font-medium text-sm sm:text-base">{suggestion}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading || !query.trim()}
                      className="px-4 sm:px-8 lg:px-12 py-4 sm:py-6 bg-gradient-to-r from-slate-900 to-slate-700 text-white rounded-r-xl sm:rounded-r-2xl hover:from-slate-800 hover:to-slate-600 focus:outline-none focus:ring-4 focus:ring-slate-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center min-w-[100px] sm:min-w-[120px] lg:min-w-[140px]"
                    >
                      {isLoading ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-2 border-white border-t-transparent mr-2 sm:mr-3"></div>
                          <span className="hidden sm:inline text-sm sm:text-base">Searching</span>
                          <span className="sm:hidden text-sm">...</span>
                        </div>
                      ) : (
                        <span className="font-semibold text-sm sm:text-base">Search</span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* Search Results */}
          {searchResults && (
            <div id="search-results" className="space-y-8 relative">
              {/* Loading Overlay for Pagination */}
              {isLoading && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex items-center justify-center rounded-3xl">
                  <div className="flex items-center gap-3 px-6 py-4 bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/50 shadow-xl">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-slate-900 border-t-transparent"></div>
                    <span className="text-slate-700 font-medium">Loading products...</span>
                  </div>
                </div>
              )}
              {/* Results Header */}
              <div className="text-center">
                <div className="inline-flex items-center px-6 py-3 bg-white/60 backdrop-blur-sm rounded-full border border-slate-200/50 shadow-lg shadow-slate-900/5">
                  <span className="text-slate-600 font-medium">
                    Found <span className="text-slate-900 font-bold">{searchResults.products.length}</span> products for
                  </span>
                  <span className="ml-2 px-3 py-1 bg-slate-900 text-white text-sm font-semibold rounded-full">
                    "{searchResults.searchTerm}"
                  </span>
                </div>
              </div>

              {/* Products Grid */}
              <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 transition-all duration-300 ${
                isLoading ? 'opacity-50 pointer-events-none' : 'opacity-100'
              }`}>
                {searchResults.products.map((product, index) => (
                  <div 
                    key={product.asin} 
                    className="group"
                    style={{
                      animationDelay: `${index * 50}ms`,
                      animation: !isLoading ? 'fadeInUp 0.4s ease-out forwards' : 'none'
                    }}
                  >
                    <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl border border-slate-200/50 shadow-lg shadow-slate-900/5 hover:shadow-xl hover:shadow-slate-900/10 transition-all duration-300 overflow-hidden">
                      {/* Product Image */}
                      <Link to={`/product/${product.asin}`} className="block">
                        <div className="relative aspect-square bg-gradient-to-br from-slate-50 to-white p-6">
                          {product.imageUrl ? (
                            <img
                              src={product.imageUrl}
                              alt={product.title}
                              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                                <MagnifyingGlassIcon className="h-8 w-8 text-slate-400" />
                              </div>
                            </div>
                          )}
                          
                          {/* Badges */}
                          <div className="absolute top-4 left-4 flex flex-col gap-2">
                            {product.discount && (
                              <div className="px-3 py-1 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold rounded-full shadow-lg">
                                -{product.discount}%
                              </div>
                            )}
                            {product.isPrime && (
                              <div className="px-3 py-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-bold rounded-full shadow-lg">
                                Prime
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Product Info */}
                        <div className="p-6 space-y-4">
                          <h3 className="text-slate-900 font-semibold leading-tight line-clamp-2 group-hover:text-slate-700 transition-colors" title={product.title}>
                            {product.title}
                          </h3>

                          {/* Rating */}
                          {product.rating && (
                            <div className="flex items-center gap-2">
                              <div className="flex items-center">
                                {[...Array(5)].map((_, i) => (
                                  <StarIcon
                                    key={i}
                                    className={`h-4 w-4 ${
                                      i < Math.floor(product.rating!)
                                        ? 'text-yellow-400 fill-current'
                                        : 'text-slate-200'
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-sm font-medium text-slate-700">
                                {formatRating(product.rating)}
                              </span>
                              {product.reviewCount && (
                                <span className="text-sm text-slate-500">
                                  ({formatReviewCount(product.reviewCount)})
                                </span>
                              )}
                            </div>
                          )}

                          {/* Price */}
                          <div className="space-y-1">
                            <div className="flex items-baseline gap-2">
                              <span className="text-2xl font-bold text-slate-900">
                                {formatPrice(product.price)}
                              </span>
                              {product.originalPrice && product.originalPrice > product.price && (
                                <span className="text-sm text-slate-500 line-through">
                                  {formatPrice(product.originalPrice)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </Link>

                      {/* Action Buttons */}
                      <div className="p-6 pt-0">
                        <div className="flex gap-3">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              handleAddProduct(product);
                            }}
                            disabled={addingProducts.has(product.asin) || selectedProducts.has(product.asin)}
                            className={`flex-1 inline-flex items-center justify-center px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
                              selectedProducts.has(product.asin)
                                ? 'bg-green-100 text-green-700 border border-green-200'
                                : addingProducts.has(product.asin)
                                ? 'bg-slate-100 text-slate-400 cursor-wait'
                                : 'bg-slate-900 text-white hover:bg-slate-800 hover:shadow-lg transform hover:scale-[0.98] active:scale-95'
                            }`}
                          >
                            {addingProducts.has(product.asin) ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-slate-400 border-t-transparent mr-2"></div>
                                Adding
                              </>
                            ) : selectedProducts.has(product.asin) ? (
                              <>
                                <HeartIcon className="h-4 w-4 mr-2" />
                                Tracking
                              </>
                            ) : (
                              <>
                                <PlusIcon className="h-4 w-4 mr-2" />
                                Track Price
                              </>
                            )}
                          </button>

                          <a
                            href={product.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-3 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 rounded-xl font-semibold text-sm transition-all duration-200 hover:shadow-lg transform hover:scale-[0.98] active:scale-95"
                            title="View on Amazon"
                          >
                            View in Amazon
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {searchResults.totalResults > 20 && (
                <div className="flex flex-col items-center gap-6 pt-12">
                  {/* Results Info */}
                  <div className="text-center">
                    <p className="text-slate-600 font-medium">
                      Showing {((currentPage - 1) * 20) + 1} - {Math.min(currentPage * 20, searchResults.totalResults)} of {searchResults.totalResults} products
                    </p>
                  </div>

                  {/* Pagination Controls */}
                  <div className="flex items-center gap-2">
                    {/* Previous Button */}
                    <button
                      onClick={() => handleSearch(searchResults.searchTerm, currentPage - 1)}
                      disabled={currentPage === 1 || isLoading}
                      className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition-all duration-200 hover:shadow-lg hover:border-slate-300"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      <span className="hidden sm:inline">Previous</span>
                    </button>

                    {/* Page Numbers */}
                    <div className="flex items-center gap-1">
                      {(() => {
                        const totalPages = Math.ceil(searchResults.totalResults / 20);
                        const pages = [];
                        
                        // Always show first page
                        if (currentPage > 3) {
                          pages.push(
                            <button
                              key={1}
                              onClick={() => handleSearch(searchResults.searchTerm, 1)}
                              disabled={isLoading}
                              className="w-10 h-10 rounded-lg text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 font-medium transition-all duration-200 hover:shadow-md disabled:opacity-50"
                            >
                              1
                            </button>
                          );
                          
                          if (currentPage > 4) {
                            pages.push(
                              <span key="ellipsis1" className="px-2 text-slate-400 font-medium">
                                ...
                              </span>
                            );
                          }
                        }

                        // Show pages around current page
                        const start = Math.max(1, currentPage - 2);
                        const end = Math.min(totalPages, currentPage + 2);
                        
                        for (let page = start; page <= end; page++) {
                          pages.push(
                            <button
                              key={page}
                              onClick={() => handleSearch(searchResults.searchTerm, page)}
                              disabled={isLoading}
                              className={`w-10 h-10 rounded-lg font-medium transition-all duration-200 hover:shadow-md disabled:opacity-50 ${
                                page === currentPage
                                  ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/25'
                                  : 'text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                              }`}
                            >
                              {page}
                            </button>
                          );
                        }

                        // Always show last page
                        if (currentPage < totalPages - 2) {
                          if (currentPage < totalPages - 3) {
                            pages.push(
                              <span key="ellipsis2" className="px-2 text-slate-400 font-medium">
                                ...
                              </span>
                            );
                          }
                          
                          pages.push(
                            <button
                              key={totalPages}
                              onClick={() => handleSearch(searchResults.searchTerm, totalPages)}
                              disabled={isLoading}
                              className="w-10 h-10 rounded-lg text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 font-medium transition-all duration-200 hover:shadow-md disabled:opacity-50"
                            >
                              {totalPages}
                            </button>
                          );
                        }

                        return pages;
                      })()}
                    </div>

                    {/* Next Button */}
                    <button
                      onClick={() => handleSearch(searchResults.searchTerm, currentPage + 1)}
                      disabled={currentPage >= Math.ceil(searchResults.totalResults / 20) || isLoading}
                      className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition-all duration-200 hover:shadow-lg hover:border-slate-300"
                    >
                      <span className="hidden sm:inline">Next</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>

                  {/* Quick Jump (for large result sets) */}
                  {searchResults.totalResults > 100 && (
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-slate-600 font-medium">Jump to page:</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          max={Math.ceil(searchResults.totalResults / 20)}
                          value=""
                          placeholder={currentPage.toString()}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const page = parseInt((e.target as HTMLInputElement).value);
                              const maxPage = Math.ceil(searchResults.totalResults / 20);
                              if (page >= 1 && page <= maxPage && page !== currentPage) {
                                handleSearch(searchResults.searchTerm, page);
                                (e.target as HTMLInputElement).value = '';
                              }
                            }
                          }}
                          className="w-16 px-2 py-1.5 border border-slate-200 rounded-lg text-center text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-400"
                        />
                        <span className="text-slate-400">
                          of {Math.ceil(searchResults.totalResults / 20)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Empty State */}
          {!searchResults && !isLoading && (
            <div className="text-center py-16">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-slate-100 to-slate-200 rounded-full blur-3xl opacity-40"></div>
                <div className="relative w-32 h-32 mx-auto mb-8 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center">
                  <MagnifyingGlassIcon className="h-16 w-16 text-slate-400" />
                </div>
              </div>
              
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ProductSearch;
