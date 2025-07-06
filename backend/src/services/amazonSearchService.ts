import axios from 'axios';
import * as cheerio from 'cheerio';

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

export class AmazonSearchService {
  private baseUrl = 'https://www.amazon.com';

  // Debug function to analyze HTML structure
  private debugProductElement($: cheerio.CheerioAPI, element: any, index: number): void {
    const $product = $(element);
    console.log(`\n🔧 DEBUG Element ${index + 1}:`);
    console.log(`- ASIN: ${$product.attr('data-asin') || 'NOT FOUND'}`);
    console.log(`- Classes: ${$product.attr('class') || 'NO CLASSES'}`);
    
    // Check what text content exists
    const allText = $product.text().trim().substring(0, 100);
    console.log(`- Text preview: ${allText}...`);
    
    // Check for common selectors
    const testSelectors = [
      'h2', 'h3', 'a', 'span', '.a-price', '.a-price-whole', 
      '.a-price-fraction', '.a-offscreen', 'img'
    ];
    
    testSelectors.forEach(selector => {
      const found = $product.find(selector).length;
      if (found > 0) {
        console.log(`- Found ${found} elements with selector: ${selector}`);
      }
    });
  }
  
  // Extract product details from search result elements
  private extractProductFromElement($: cheerio.CheerioAPI, element: any): AmazonProduct | null {
    try {
      const $product = $(element);
      
      // Extract ASIN
      const asin = $product.attr('data-asin') || '';
      if (!asin) {
        console.log('❌ No ASIN found for product element');
        return null;
      }
      console.log(`🔍 Processing product with ASIN: ${asin}`);

      // Extract title with multiple selectors
      const titleSelectors = [
        'h2 a span',
        'h2 span',
        '.s-size-mini span',
        '.s-size-base-plus',
        '[data-cy="title-recipe-title"]',
        '.a-size-base-plus',
        '.a-size-medium',
        'a span'
      ];
      
      let title = '';
      for (const selector of titleSelectors) {
        const titleElement = $product.find(selector);
        if (titleElement.length > 0) {
          title = titleElement.first().text().trim();
          if (title) {
            console.log(`✅ Found title with selector "${selector}": ${title.substring(0, 50)}...`);
            break;
          }
        }
      }
      
      if (!title) {
        console.log('❌ No title found for ASIN:', asin);
        return null;
      }

      // Extract price with multiple selectors
      let price = 0;
      let originalPrice: number | undefined;
      
      const priceSelectors = [
        '.a-price-whole',
        '.a-price .a-offscreen',
        '.a-price-range .a-price .a-offscreen',
        '.a-price-fraction',
        '.a-price-symbol',
        '.a-color-price',
        '.a-text-price',
        '[data-a-color="price"]'
      ];
      
      for (const selector of priceSelectors) {
        const priceElement = $product.find(selector);
        if (priceElement.length > 0) {
          const priceText = priceElement.first().text().replace(/[^0-9.]/g, '');
          const parsedPrice = parseFloat(priceText) || 0;
          if (parsedPrice > 0) {
            price = parsedPrice;
            console.log(`✅ Found price with selector "${selector}": $${price}`);
            break;
          }
        }
      }

      // If still no price, try alternative extraction
      if (price === 0) {
        const priceContainer = $product.find('.a-price');
        if (priceContainer.length > 0) {
          const wholePrice = priceContainer.find('.a-price-whole').text();
          const fractionPrice = priceContainer.find('.a-price-fraction').text();
          if (wholePrice) {
            const wholePart = wholePrice.replace(/[^0-9]/g, '');
            const fractionPart = fractionPrice ? fractionPrice.replace(/[^0-9]/g, '') : '00';
            price = parseFloat(`${wholePart}.${fractionPart}`) || 0;
            console.log(`✅ Found combined price: $${price}`);
          }
        }
      }

      if (price === 0) {
        console.log('❌ No valid price found for ASIN:', asin, '- Excluding product');
        return null; // Don't include products without real prices
      }

      // Filter out products with minimal placeholder prices (likely no real price shown by Amazon)
      if (price <= 0.01) {
        console.log('❌ Product has placeholder price, excluding from results for ASIN:', asin, `- Price: $${price}`);
        return null;
      }

      // Extract original price (if on sale)
      const originalPriceSelectors = [
        '.a-text-price .a-offscreen',
        '.a-text-strike',
        '.a-price.a-text-price .a-offscreen'
      ];
      
      for (const selector of originalPriceSelectors) {
        const originalPriceElement = $product.find(selector);
        if (originalPriceElement.length > 0) {
          const originalPriceText = originalPriceElement.text().replace(/[^0-9.]/g, '');
          originalPrice = parseFloat(originalPriceText) || undefined;
          if (originalPrice && originalPrice > price) {
            console.log(`✅ Found original price: $${originalPrice}`);
            break;
          }
        }
      }

      // Extract rating
      let rating: number | undefined;
      const ratingSelectors = [
        '.a-icon-alt',
        '[aria-label*="stars"]',
        '[aria-label*="out of"]'
      ];
      
      for (const selector of ratingSelectors) {
        const ratingElement = $product.find(selector);
        if (ratingElement.length > 0) {
          const ratingText = ratingElement.attr('aria-label') || ratingElement.text();
          const ratingMatch = ratingText.match(/(\d+\.?\d*)/);
          if (ratingMatch) {
            rating = parseFloat(ratingMatch[1]);
            if (rating > 0 && rating <= 5) {
              console.log(`✅ Found rating: ${rating}`);
              break;
            }
          }
        }
      }

      // Extract review count
      let reviewCount: number | undefined;
      const reviewSelectors = [
        'a .a-size-base',
        '.a-link-normal',
        '[aria-label*="ratings"]'
      ];
      
      for (const selector of reviewSelectors) {
        const reviewElement = $product.find(selector);
        if (reviewElement.length > 0) {
          const reviewText = reviewElement.text().replace(/[^0-9]/g, '');
          if (reviewText) {
            reviewCount = parseInt(reviewText) || undefined;
            if (reviewCount && reviewCount > 0) {
              console.log(`✅ Found review count: ${reviewCount}`);
              break;
            }
          }
        }
      }

      // Extract image URL
      let imageUrl: string | undefined;
      const imgSelectors = [
        'img',
        '.s-image',
        '.a-dynamic-image'
      ];
      
      for (const selector of imgSelectors) {
        const imgElement = $product.find(selector);
        if (imgElement.length > 0) {
          imageUrl = imgElement.attr('src') || imgElement.attr('data-src') || imgElement.attr('data-a-dynamic-image');
          if (imageUrl) {
            console.log(`✅ Found image URL`);
            break;
          }
        }
      }

      // Build product URL
      const url = `${this.baseUrl}/dp/${asin}`;

      // Check if Prime eligible
      const primeSelectors = [
        '[aria-label*="Prime"]',
        '.a-icon-prime',
        '[data-a-badge-type="prime"]'
      ];
      
      let isPrime = false;
      for (const selector of primeSelectors) {
        if ($product.find(selector).length > 0) {
          isPrime = true;
          console.log(`✅ Product is Prime eligible`);
          break;
        }
      }

      // Calculate discount
      let discount: number | undefined;
      if (originalPrice && price && originalPrice > price) {
        discount = Math.round(((originalPrice - price) / originalPrice) * 100);
        console.log(`✅ Calculated discount: ${discount}%`);
      }

      const product = {
        asin,
        title,
        price,
        originalPrice,
        rating,
        reviewCount,
        imageUrl,
        url,
        isPrime,
        discount
      };

      console.log(`✅ Successfully extracted product: ${title.substring(0, 30)}... - $${price}`);
      return product;

    } catch (error) {
      console.error('❌ Error extracting product:', error);
      return null;
    }
  }

  // Search Amazon for products
  async searchProducts(query: string, page: number = 1): Promise<SearchResult> {
    try {
      const searchUrl = `${this.baseUrl}/s`;
      const params = {
        k: query,
        page: page.toString(),
        ref: 'sr_pg_' + page
      };

      console.log(`🔍 Searching Amazon for: "${query}" (page ${page})`);

      const response = await axios.get(searchUrl, {
        params,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Cache-Control': 'max-age=0',
        },
        timeout: 15000
      });

      const $ = cheerio.load(response.data);
      const products: AmazonProduct[] = [];

      // Find product containers
      const productSelectors = [
        '[data-component-type="s-search-result"]',
        '.s-result-item[data-asin]',
        '.s-search-result'
      ];

      let productElements: any[] = [];
      for (const selector of productSelectors) {
        productElements = $(selector).toArray();
        if (productElements.length > 0) break;
      }

      console.log(`📦 Found ${productElements.length} product elements`);

      // Extract product details
      for (let i = 0; i < productElements.length; i++) {
        const element = productElements[i];
        console.log(`🔍 Processing element ${i + 1}/${productElements.length}`);
        
        // Debug first few elements if we're having issues
        if (i < 3) {
          this.debugProductElement($, element, i);
        }
        
        const product = this.extractProductFromElement($, element);
        if (product) {
          products.push(product);
          console.log(`✅ Added product ${products.length}: ${product.title.substring(0, 30)}...`);
        } else {
          console.log(`❌ Failed to extract product from element ${i + 1}`);
        }
      }

      // Get total results count
      let totalResults = 0;
      const resultStatsElement = $('[data-component-type="s-result-info-bar"] span');
      if (resultStatsElement.length > 0) {
        const statsText = resultStatsElement.text();
        const resultsMatch = statsText.match(/[\d,]+/);
        if (resultsMatch) {
          totalResults = parseInt(resultsMatch[0].replace(/,/g, '')) || 0;
        }
      }

      console.log(`✅ Successfully extracted ${products.length} products out of ${productElements.length} elements`);

      return {
        products: products.slice(0, 20), // Limit to 20 products per page
        totalResults,
        searchTerm: query
      };

    } catch (error) {
      console.error('❌ Amazon search error:', error);
      
      // Return empty results on error
      return {
        products: [],
        totalResults: 0,
        searchTerm: query
      };
    }
  }

  // Get detailed product information by ASIN
  async getProductDetails(asin: string): Promise<AmazonProduct | null> {
    try {
      const url = `${this.baseUrl}/dp/${asin}`;
      
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);

      // Extract detailed product information
      const title = $('#productTitle').text().trim();
      
      // Extract price
      let price = 0;
      const priceSelectors = [
        '.a-price-whole',
        '.a-price .a-offscreen',
        '#price_inside_buybox'
      ];
      
      for (const selector of priceSelectors) {
        const priceElement = $(selector);
        if (priceElement.length > 0) {
          const priceText = priceElement.first().text().replace(/[^0-9.]/g, '');
          price = parseFloat(priceText) || 0;
          if (price > 0) break;
        }
      }

      // Extract rating
      let rating: number | undefined;
      const ratingElement = $('.a-icon-alt');
      if (ratingElement.length > 0) {
        const ratingText = ratingElement.first().text();
        const ratingMatch = ratingText.match(/(\d+\.?\d*)/);
        if (ratingMatch) {
          rating = parseFloat(ratingMatch[1]);
        }
      }

      // Extract review count
      let reviewCount: number | undefined;
      const reviewElement = $('#acrCustomerReviewText');
      if (reviewElement.length > 0) {
        const reviewText = reviewElement.text().replace(/[^0-9]/g, '');
        reviewCount = parseInt(reviewText) || undefined;
      }

      // Extract main image
      let imageUrl: string | undefined;
      const imgElement = $('#landingImage, #imgBlkFront');
      if (imgElement.length > 0) {
        imageUrl = imgElement.attr('src') || imgElement.attr('data-src');
      }

      if (!title || price <= 0.01) {
        console.log('❌ Product details invalid or has placeholder price:', asin, `Price: $${price}`);
        return null;
      }

      return {
        asin,
        title,
        price,
        rating,
        reviewCount,
        imageUrl,
        url,
        isPrime: $('.a-icon-prime').length > 0
      };

    } catch (error) {
      console.error('Error fetching product details:', error);
      return null;
    }
  }

  // Search suggestions (for autocomplete)
  async getSearchSuggestions(query: string): Promise<string[]> {
    try {
      // Try Amazon's suggestion API first
      const suggestUrl = 'https://completion.amazon.com/api/2017/suggestions';
      const response = await axios.get(suggestUrl, {
        params: {
          'mid': 'ATVPDKIKX0DER',
          'alias': 'aps',
          'prefix': query,
          'suggestion-type': ['KEYWORD', 'WIDGET']
        },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 3000
      });

      if (response.data && response.data.suggestions) {
        return response.data.suggestions
          .map((suggestion: any) => suggestion.value)
          .slice(0, 8); // Limit to 8 suggestions
      }
    } catch (error) {
      console.log('Amazon suggestions API failed, using fallback:', error instanceof Error ? error.message : 'Unknown error');
    }

    // Fallback to predefined suggestions based on query
    return this.getFallbackSuggestions(query);
  }

  // Fallback suggestions when Amazon API is not available
  private getFallbackSuggestions(query: string): string[] {
    const lowercaseQuery = query.toLowerCase();
    const suggestions: string[] = [];

    // Popular Amazon product categories and searches
    const popularSuggestions = [
      'wireless headphones',
      'laptop',
      'smartphone',
      'bluetooth speaker',
      'running shoes',
      'coffee maker',
      'air fryer',
      'kindle',
      'phone case',
      'gaming headset',
      'fitness tracker',
      'wireless mouse',
      'portable charger',
      'smart watch',
      'tablet',
      'kitchen appliances',
      'desk chair',
      'monitor',
      'camera',
      'power bank'
    ];

    // Find suggestions that match the query
    for (const suggestion of popularSuggestions) {
      if (suggestion.includes(lowercaseQuery) || lowercaseQuery.includes(suggestion.split(' ')[0])) {
        suggestions.push(suggestion);
      }
    }

    // Add query variations
    if (lowercaseQuery.length > 2) {
      suggestions.push(`${query} case`);
      suggestions.push(`${query} accessories`);
      suggestions.push(`${query} wireless`);
      suggestions.push(`best ${query}`);
    }

    // Remove duplicates and limit to 8
    return [...new Set(suggestions)].slice(0, 8);
  }
}

export const amazonSearchService = new AmazonSearchService();
