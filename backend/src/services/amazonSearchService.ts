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
  
  // Extract product details from search result elements with enhanced selectors
  private extractProductFromElement($: cheerio.CheerioAPI, element: any): AmazonProduct | null {
    try {
      const $product = $(element);
      
      // Extract ASIN with multiple approaches
      let asin = $product.attr('data-asin') || '';
      
      // If no ASIN in data attribute, try to find it in URLs
      if (!asin) {
        const links = $product.find('a[href*="/dp/"], a[href*="/gp/product/"]');
        for (let i = 0; i < links.length; i++) {
          const href = $(links[i]).attr('href') || '';
          const asinMatch = href.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})/);
          if (asinMatch) {
            asin = asinMatch[1];
            break;
          }
        }
      }
      
      if (!asin || !asin.match(/^[A-Z0-9]{10}$/i)) {
        console.log('❌ No valid ASIN found for product element');
        return null;
      }
      console.log(`🔍 Processing product with ASIN: ${asin}`);

      // Enhanced title extraction with more selectors
      const titleSelectors = [
        'h2 a span',
        'h2 span',
        'h2 a',
        'h3 a span',
        'h3 span',
        'h3 a',
        '.s-size-mini span',
        '.s-size-base-plus',
        '[data-cy="title-recipe-title"]',
        '.a-size-base-plus',
        '.a-size-medium',
        '.a-size-base',
        'a span[aria-label]',
        '.a-link-normal span',
        '[data-automation-id="product-title"]',
        '.s-title-instructions-style span',
        'span[data-component-type="s-product-image"] + * span'
      ];
      
      let title = '';
      for (const selector of titleSelectors) {
        const titleElements = $product.find(selector);
        if (titleElements.length > 0) {
          for (let i = 0; i < titleElements.length; i++) {
            const titleText = $(titleElements[i]).text().trim();
            // Ensure we get a meaningful title (not just numbers or short text)
            if (titleText && titleText.length > 10 && !titleText.match(/^\d+$/)) {
              title = titleText;
              console.log(`✅ Found title with selector "${selector}": ${title.substring(0, 50)}...`);
              break;
            }
          }
          if (title) break;
        }
      }
      
      if (!title) {
        console.log('❌ No title found for ASIN:', asin);
        return null;
      }

      // Enhanced price extraction with comprehensive selectors
      let price = 0;
      let originalPrice: number | undefined;
      
      const priceSelectors = [
        // Primary price selectors
        '.a-price-whole',
        '.a-price .a-offscreen',
        '.a-price-range .a-price .a-offscreen',
        '.a-price-current .a-offscreen',
        '.a-price-to-pay .a-offscreen',
        
        // Alternative selectors
        '.a-price-fraction',
        '.a-price-symbol',
        '.a-color-price',
        '.a-text-price .a-offscreen',
        '[data-a-color="price"]',
        '.a-price-symbol-container .a-offscreen',
        
        // Deal and sale price selectors
        '.a-price.a-text-price.a-size-base.a-color-price .a-offscreen',
        '.a-price.a-text-price.a-size-base .a-offscreen',
        '.a-price.a-text-price.a-size-large.a-color-price .a-offscreen',
        '.a-price.a-text-price.a-size-medium.a-color-price .a-offscreen',
        
        // Specific component selectors
        '[data-automation-id="product-price"]',
        '.s-price-instructions-style .a-offscreen',
        
        // Fallback selectors
        'span[aria-label*="$"]',
        '*[class*="price"] .a-offscreen'
      ];
      
      console.log('🔍 Searching for price...');
      
      for (const selector of priceSelectors) {
        const priceElements = $product.find(selector);
        if (priceElements.length > 0) {
          for (let i = 0; i < priceElements.length; i++) {
            const priceText = $(priceElements[i]).text().trim();
            console.log(`Checking selector "${selector}" [${i}]: "${priceText}"`);
            
            if (priceText) {
              // Enhanced price cleaning and extraction
              let cleanPrice = priceText.replace(/[^\d.,]/g, '').replace(/,/g, '');
              
              // Handle cases where there might be multiple decimal points
              const decimalIndex = cleanPrice.lastIndexOf('.');
              if (decimalIndex !== -1) {
                cleanPrice = cleanPrice.substring(0, decimalIndex).replace(/\./g, '') + cleanPrice.substring(decimalIndex);
              }
              
              const priceMatch = cleanPrice.match(/^\d+\.?\d*$/);
              
              if (priceMatch) {
                const foundPrice = parseFloat(priceMatch[0]);
                if (foundPrice > 0 && foundPrice < 100000) {
                  price = foundPrice;
                  console.log(`✅ Found price: $${price} from selector: ${selector}`);
                  break;
                }
              }
            }
          }
          
          if (price > 0) break;
        }
      }

      // If no price found with primary methods, try combined whole/fraction approach
      if (price === 0) {
        console.log('🔍 Trying combined price extraction...');
        
        const priceContainer = $product.find('.a-price');
        if (priceContainer.length > 0) {
          const wholePrice = priceContainer.find('.a-price-whole').text().replace(/[^0-9]/g, '');
          const fractionPrice = priceContainer.find('.a-price-fraction').text().replace(/[^0-9]/g, '');
          
          if (wholePrice) {
            const fraction = fractionPrice || '00';
            const combinedPrice = `${wholePrice}.${fraction}`;
            price = parseFloat(combinedPrice) || 0;
            if (price > 0) {
              console.log(`✅ Found combined price: $${price}`);
            }
          }
        }
      }

      // Advanced fallback: search all text for price patterns
      if (price === 0) {
        console.log('🔍 Advanced price search in all text...');
        
        const allText = $product.text();
        const pricePatterns = [
          /\$(\d{1,4}(?:,\d{3})*(?:\.\d{2})?)/g,
          /USD\s*(\d{1,4}(?:,\d{3})*(?:\.\d{2})?)/g,
          /(\d{1,4}(?:,\d{3})*(?:\.\d{2})?)\s*(?:USD|\$)/g
        ];
        
        for (const pattern of pricePatterns) {
          const matches = Array.from(allText.matchAll(pattern));
          if (matches.length > 0) {
            // Take the first reasonable price found
            for (const match of matches) {
              const foundPrice = parseFloat(match[1].replace(/,/g, ''));
              if (foundPrice > 0 && foundPrice < 100000) {
                price = foundPrice;
                console.log(`✅ Found price via pattern: $${price}`);
                break;
              }
            }
            if (price > 0) break;
          }
        }
      }

      if (price === 0 || price <= 0.01) {
        console.log('❌ No valid price found for ASIN:', asin, `- Price: $${price}`);
        return null;
      }

      // Enhanced original price extraction (if on sale)
      const originalPriceSelectors = [
        '.a-text-price .a-offscreen',
        '.a-text-strike',
        '.a-price.a-text-price .a-offscreen',
        '.a-text-price',
        '[data-a-strike="true"] .a-offscreen',
        '.a-text-strike .a-offscreen'
      ];
      
      for (const selector of originalPriceSelectors) {
        const originalPriceElements = $product.find(selector);
        if (originalPriceElements.length > 0) {
          for (let i = 0; i < originalPriceElements.length; i++) {
            const originalPriceText = $(originalPriceElements[i]).text().replace(/[^0-9.]/g, '');
            const parsedOriginalPrice = parseFloat(originalPriceText) || undefined;
            if (parsedOriginalPrice && parsedOriginalPrice > price) {
              originalPrice = parsedOriginalPrice;
              console.log(`✅ Found original price: $${originalPrice}`);
              break;
            }
          }
          if (originalPrice) break;
        }
      }

      // Enhanced rating extraction
      let rating: number | undefined;
      const ratingSelectors = [
        '.a-icon-alt',
        '[aria-label*="stars"]',
        '[aria-label*="out of"]',
        '.a-star-mini .a-icon-alt',
        '.a-star .a-icon-alt',
        '[title*="out of"]',
        '.s-size-mini[aria-label*="stars"]'
      ];
      
      for (const selector of ratingSelectors) {
        const ratingElements = $product.find(selector);
        if (ratingElements.length > 0) {
          for (let i = 0; i < ratingElements.length; i++) {
            const ratingElement = $(ratingElements[i]);
            const ratingText = ratingElement.attr('aria-label') || ratingElement.attr('title') || ratingElement.text();
            
            if (ratingText) {
              const ratingMatch = ratingText.match(/(\d+\.?\d*)\s*(?:out of|stars?)/i);
              if (ratingMatch) {
                const foundRating = parseFloat(ratingMatch[1]);
                if (foundRating > 0 && foundRating <= 5) {
                  rating = foundRating;
                  console.log(`✅ Found rating: ${rating} from "${ratingText}"`);
                  break;
                }
              }
            }
          }
          if (rating) break;
        }
      }

      // Enhanced review count extraction
      let reviewCount: number | undefined;
      const reviewSelectors = [
        'a .a-size-base',
        '.a-link-normal',
        '[aria-label*="ratings"]',
        'a[href*="#customerReviews"]',
        '.a-size-base + .a-link-normal',
        '.s-underline-text',
        '.s-link-style',
        'span[aria-label*="ratings"]'
      ];
      
      for (const selector of reviewSelectors) {
        const reviewElements = $product.find(selector);
        if (reviewElements.length > 0) {
          for (let i = 0; i < reviewElements.length; i++) {
            const reviewElement = $(reviewElements[i]);
            const reviewText = reviewElement.text().replace(/[^0-9,]/g, '');
            if (reviewText) {
              const cleanReviewText = reviewText.replace(/,/g, '');
              const foundReviewCount = parseInt(cleanReviewText) || undefined;
              if (foundReviewCount && foundReviewCount > 0) {
                reviewCount = foundReviewCount;
                console.log(`✅ Found review count: ${reviewCount}`);
                break;
              }
            }
          }
          if (reviewCount) break;
        }
      }

      // Enhanced image URL extraction
      let imageUrl: string | undefined;
      const imgSelectors = [
        'img[src]',
        '.s-image',
        '.a-dynamic-image',
        'img[data-src]',
        'img[data-a-dynamic-image]',
        '.s-product-image img'
      ];
      
      for (const selector of imgSelectors) {
        const imgElements = $product.find(selector);
        if (imgElements.length > 0) {
          for (let i = 0; i < imgElements.length; i++) {
            const imgElement = $(imgElements[i]);
            let imgSrc = imgElement.attr('src') || imgElement.attr('data-src') || imgElement.attr('data-a-dynamic-image');
            
            // Parse dynamic image JSON if present
            if (imgSrc && imgSrc.startsWith('{')) {
              try {
                const imageData = JSON.parse(imgSrc);
                const imageUrls = Object.keys(imageData);
                if (imageUrls.length > 0) {
                  imgSrc = imageUrls[0]; // Take the first image URL
                }
              } catch (e) {
                // If JSON parsing fails, continue with original src
              }
            }
            
            if (imgSrc && imgSrc.startsWith('http') && !imgSrc.includes('data:image')) {
              imageUrl = imgSrc;
              console.log(`✅ Found image URL from selector: ${selector}`);
              break;
            }
          }
          if (imageUrl) break;
        }
      }

      // Build product URL
      const url = `${this.baseUrl}/dp/${asin}`;

      // Enhanced Prime eligibility check
      const primeSelectors = [
        '[aria-label*="Prime"]',
        '.a-icon-prime',
        '[data-a-badge-type="prime"]',
        '.s-prime',
        '.a-color-link[aria-label*="Prime"]',
        'i[aria-label*="Prime"]'
      ];
      
      let isPrime = false;
      for (const selector of primeSelectors) {
        if ($product.find(selector).length > 0) {
          isPrime = true;
          console.log(`✅ Product is Prime eligible`);
          break;
        }
      }

      // Calculate discount percentage
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

      console.log(`✅ Successfully extracted product: ${title.substring(0, 40)}... - $${price}${originalPrice ? ` (was $${originalPrice})` : ''}`);
      return product;

    } catch (error) {
      console.error('❌ Error extracting product:', error);
      return null;
    }
  }

  // Search Amazon for products with enhanced extraction
  async searchProducts(query: string, page: number = 1): Promise<SearchResult> {
    const maxRetries = 3;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const searchUrl = `${this.baseUrl}/s`;
        const params = {
          k: query,
          page: page.toString(),
          ref: 'sr_pg_' + page,
          rh: 'p_n_availability:2661601011', // In stock filter
          s: 'relevancerank' // Sort by relevance
        };

        console.log(`🔍 Searching Amazon for: "${query}" (page ${page}, attempt ${attempt})`);

        // Rotate user agents for better scraping success
        const userAgents = [
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15'
        ];

        const randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)];

        const response = await axios.get(searchUrl, {
          params,
          headers: {
            'User-Agent': randomUserAgent,
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'Cache-Control': 'max-age=0',
            'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"',
            'Referer': 'https://www.google.com/',
            'DNT': '1'
          },
          timeout: 20000 // Increased timeout
        });

        console.log(`📄 Response status: ${response.status}, Content length: ${response.data.length}`);

        // Check if we got a valid response
        if (response.status !== 200) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const $ = cheerio.load(response.data);
        const products: AmazonProduct[] = [];

        // Check for CAPTCHA or blocking
        if ($('#captchacharacters').length > 0 || $('form[action*="validateCaptcha"]').length > 0) {
          throw new Error('CAPTCHA detected - Amazon is blocking requests');
        }

        // Enhanced product selectors to catch more products
        const productSelectors = [
          '[data-component-type="s-search-result"]',
          '.s-result-item[data-asin]',
          '[data-asin]:not([data-asin=""])',
          '.s-search-result',
          '.s-result-item',
          '.s-card-container',
          '.s-widget-container [data-asin]',
          '.s-result-list [data-asin]',
          '.s-search-results [data-asin]',
          '.s-main-slot [data-asin]'
        ];

        let productElements: any[] = [];
        for (const selector of productSelectors) {
          productElements = $(selector).toArray();
          if (productElements.length > 0) {
            console.log(`✅ Found ${productElements.length} product elements with selector: ${selector}`);
            break;
          }
        }

        // If no products found with primary selectors, try fallback
        if (productElements.length === 0) {
          console.log('⚠️ No products found with primary selectors, trying fallback...');
          
          // Look for any element with data-asin attribute
          productElements = $('[data-asin]').toArray().filter(el => {
            const asin = $(el).attr('data-asin');
            return asin && asin.length === 10 && /^[A-Z0-9]{10}$/i.test(asin);
          });
          
          console.log(`📦 Found ${productElements.length} products with fallback method`);
        }

        // Additional fallback: look for products in specific containers
        if (productElements.length === 0) {
          console.log('⚠️ Trying advanced fallback with container-based search...');
          
          const containers = [
            '.s-main-slot',
            '.s-result-list',
            '.s-search-results',
            '#search'
          ];
          
          for (const container of containers) {
            const containerElement = $(container);
            if (containerElement.length > 0) {
              const foundProducts = containerElement.find('[data-asin]').toArray().filter(el => {
                const asin = $(el).attr('data-asin');
                return asin && asin.length === 10 && /^[A-Z0-9]{10}$/i.test(asin);
              });
              
              if (foundProducts.length > 0) {
                productElements = foundProducts;
                console.log(`📦 Found ${productElements.length} products in container: ${container}`);
                break;
              }
            }
          }
        }

        console.log(`📦 Processing ${productElements.length} product elements`);

        // Extract product details with better error handling
        const extractionPromises = productElements.map(async (element, index) => {
          try {
            console.log(`🔍 Processing element ${index + 1}/${productElements.length}`);
            
            // Debug first few elements for troubleshooting
            if (index < 2) {
              this.debugProductElement($, element, index);
            }
            
            const product = this.extractProductFromElement($, element);
            if (product) {
              console.log(`✅ Extracted product ${index + 1}: ${product.title.substring(0, 40)}... - $${product.price}`);
              return product;
            } else {
              console.log(`❌ Failed to extract product from element ${index + 1}`);
              return null;
            }
          } catch (error) {
            console.error(`❌ Error processing element ${index + 1}:`, error);
            return null;
          }
        });

        // Wait for all extractions to complete
        const extractedProducts = await Promise.all(extractionPromises);
        
        // Filter out null results
        const validProducts = extractedProducts.filter(product => product !== null) as AmazonProduct[];
        
        console.log(`✅ Successfully extracted ${validProducts.length} valid products`);

        // Enhanced total results extraction
        let totalResults = 0;
        const resultCountSelectors = [
          '[data-component-type="s-result-info-bar"] span',
          '.s-result-info-bar span',
          '.a-section .a-size-base',
          '.s-breadcrumb .a-size-base',
          '[data-component-type="s-result-info-bar"] .a-size-base',
          '.s-result-info-bar .a-size-base',
          '.s-result-info-bar .a-size-medium',
          '.s-result-info-bar .a-size-small'
        ];

        for (const selector of resultCountSelectors) {
          const resultElements = $(selector);
          if (resultElements.length > 0) {
            for (let i = 0; i < resultElements.length; i++) {
              const text = $(resultElements[i]).text();
              console.log(`Checking result count text: "${text}"`);
              
              // Look for patterns like "1-16 of 1,000 results"
              const patterns = [
                /(\d{1,3}(?:,\d{3})*)\s+results/i,
                /of\s+(\d{1,3}(?:,\d{3})*)/i,
                /(\d{1,3}(?:,\d{3})*)\s+of/i
              ];
              
              for (const pattern of patterns) {
                const match = text.match(pattern);
                if (match) {
                  const found = parseInt(match[1].replace(/,/g, ''));
                  if (found > totalResults) {
                    totalResults = found;
                    console.log(`📊 Found total results: ${totalResults} from text: "${text}"`);
                  }
                }
              }
            }
            
            if (totalResults > 0) break;
          }
        }

        // Additional total results extraction from pagination
        if (totalResults === 0) {
          console.log('🔍 Trying pagination-based total results extraction...');
          
          const paginationSelectors = [
            '.s-pagination-item',
            '.s-pagination .s-pagination-item',
            '.a-pagination .a-last',
            '.s-pagination-strip .s-pagination-item'
          ];
          
          for (const selector of paginationSelectors) {
            const paginationElements = $(selector);
            if (paginationElements.length > 0) {
              let lastPageNumber = 0;
              
              paginationElements.each((_, element) => {
                const pageText = $(element).text().trim();
                const pageNumber = parseInt(pageText);
                if (!isNaN(pageNumber) && pageNumber > lastPageNumber) {
                  lastPageNumber = pageNumber;
                }
              });
              
              if (lastPageNumber > 0) {
                // Estimate total results based on last page number
                // Amazon typically shows 16-20 products per page
                totalResults = lastPageNumber * 18; // Conservative estimate
                console.log(`📊 Estimated total results from pagination: ${totalResults} (last page: ${lastPageNumber})`);
                break;
              }
            }
          }
        }

        // Improved total results estimation
        if (totalResults === 0 && validProducts.length > 0) {
          // More sophisticated estimation based on pagination
          const hasNextPage = $('.s-pagination-next').length > 0 || 
                            $('a[aria-label="Go to next page"]').length > 0 ||
                            $('.a-pagination .a-last').length > 0;
          const currentPageProducts = validProducts.length;
          
          // Check if we can find any indication of how many pages there are
          const paginationText = $('.s-pagination').text() || $('.a-pagination').text();
          const pageNumbers = paginationText.match(/\d+/g);
          const maxPageFromPagination = pageNumbers ? Math.max(...pageNumbers.map(Number)) : 0;
          
          if (maxPageFromPagination > 0) {
            totalResults = maxPageFromPagination * 18; // 18 products per page average
            console.log(`📊 Estimated total results from pagination numbers: ${totalResults}`);
          } else if (hasNextPage) {
            // If there's a next page, estimate conservatively
            if (page === 1) {
              totalResults = Math.max(currentPageProducts * 15, 400); // Conservative estimate for first page
            } else {
              totalResults = Math.max(currentPageProducts * 10, page * 18 + 100);
            }
            console.log(`📊 Estimated total results with next page: ${totalResults}`);
          } else {
            // If no next page, this might be the last page
            totalResults = ((page - 1) * 18) + currentPageProducts;
            console.log(`📊 Estimated total results (final page): ${totalResults}`);
          }
          
          console.log(`📊 Final estimation: ${totalResults} (hasNextPage: ${hasNextPage}, page: ${page})`);
        }

        // Ensure we have a reasonable minimum if products were found
        if (totalResults === 0 && validProducts.length > 0) {
          totalResults = validProducts.length * 5; // Conservative fallback
        }

        const result = {
          products: validProducts,
          totalResults,
          searchTerm: query
        };

        console.log(`✅ Search successful: ${result.products.length} products, ${result.totalResults} total results`);
        return result;

      } catch (error) {
        console.error(`❌ Amazon search error (attempt ${attempt}/${maxRetries}):`, error);
        
        // If this is not the last attempt, wait before retrying
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          console.log(`⏳ Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        // Return empty results on final failure
        return {
          products: [],
          totalResults: 0,
          searchTerm: query
        };
      }
    }

    // This should never be reached due to the return statements above
    return {
      products: [],
      totalResults: 0,
      searchTerm: query
    };
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
