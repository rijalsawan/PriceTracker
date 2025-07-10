import * as cheerio from 'cheerio';
import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ProductInfo {
  title: string;
  description?: string;
  price: number;
  imageUrl?: string;
}

// Clean and normalize Amazon URL
const normalizeAmazonUrl = (url: string): string => {
  try {
    const urlObj = new URL(url);
    
    // Remove unnecessary parameters while keeping essential ones
    const allowedParams = ['th', 'psc', 'ref', 'tag'];
    const searchParams = new URLSearchParams();
    
    allowedParams.forEach(param => {
      const value = urlObj.searchParams.get(param);
      if (value) {
        searchParams.set(param, value);
      }
    });
    
    // Construct clean URL
    const cleanUrl = `${urlObj.protocol}//${urlObj.hostname}${urlObj.pathname}`;
    const paramString = searchParams.toString();
    
    return paramString ? `${cleanUrl}?${paramString}` : cleanUrl;
  } catch (error) {
    console.log('⚠️ URL normalization failed, using original URL');
    return url;
  }
};

// Log scraping attempt to database
const logScrapingAttempt = async (
  url: string, 
  status: string, 
  priceFound?: number, 
  priceSource?: string, 
  errorMessage?: string, 
  responseCode?: number,
  userAgent?: string,
  productId?: string
) => {
  try {
    await prisma.scrapingLog.create({
      data: {
        url,
        status,
        priceFound,
        priceSource,
        errorMessage,
        responseCode,
        userAgent,
        productId
      }
    });
    console.log('✅ Scraping attempt logged:', { url, status, priceFound, priceSource });
  } catch (error) {
    console.error('❌ Failed to log scraping attempt:', error);
    // Continue execution even if logging fails
  }
};

// Fallback scraper using Axios + Cheerio with improved price extraction
export const scrapeAmazonProduct = async (url: string, retries: number = 3, productId?: string): Promise<ProductInfo | null> => {
  let response: any = null; // Track response for logging
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`🔍 Scraping Amazon product (attempt ${attempt}/${retries})...`);
      
      // Validate Amazon URL
      if (!url.includes('amazon.')) {
        throw new Error('Invalid Amazon URL');
      }

      // Normalize the URL to remove unnecessary parameters for consistency
      const normalizedUrl = normalizeAmazonUrl(url);
      console.log(`📍 Normalized URL: ${normalizedUrl}`);

      // Use more specific parameters to get consistent pricing
      const urlWithParams = new URL(normalizedUrl);
      urlWithParams.searchParams.set('th', '1'); // Force specific variant
      urlWithParams.searchParams.set('psc', '1'); // Force specific product configuration
      
      // Rotate user agents to avoid detection
      const userAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15'
      ];

      const randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)];

      // Make HTTP request with comprehensive headers to avoid detection
      response = await axios.get(urlWithParams.toString(), {
        headers: {
          'User-Agent': randomUserAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Sec-Fetch-User': '?1',
          'Cache-Control': 'no-cache', // Prevent cached responses
          'Pragma': 'no-cache',
          'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"',
          'Referer': 'https://www.google.com/',
          'DNT': '1'
        },
        timeout: 15000, // Increased timeout
        maxRedirects: 5
      });

      console.log(`📄 Response status: ${response.status}, Content length: ${response.data.length}`);

      // Check if we got a valid response
      if (response.status !== 200) {
        await logScrapingAttempt(url, 'FAILED', undefined, undefined, `HTTP ${response.status}: ${response.statusText}`, response.status, randomUserAgent, productId);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const $ = cheerio.load(response.data);

      // Check if page contains CAPTCHA or is blocked
      if ($('#captchacharacters').length > 0 || $('form[action*="validateCaptcha"]').length > 0) {
        await logScrapingAttempt(url, 'CAPTCHA', undefined, undefined, 'CAPTCHA detected - Amazon is blocking requests', response.status, randomUserAgent, productId);
        throw new Error('CAPTCHA detected - Amazon is blocking requests');
      }

      // Check if page is not found
      if ($('title').text().includes('Page Not Found') || $('.error-page').length > 0) {
        await logScrapingAttempt(url, 'FAILED', undefined, undefined, 'Product page not found', response.status, randomUserAgent, productId);
        throw new Error('Product page not found');
      }

    // Extract title with comprehensive selectors
    let title = '';
    const titleSelectors = [
      '#productTitle',
      '.product-title',
      'h1.a-size-large',
      '[data-automation-id="product-title"]',
      'h1.a-size-large.a-spacing-none',
      'h1.a-size-large.product-title',
      'h1[data-automation-id="product-title"]',
      'span#productTitle',
      '.a-size-large.product-title',
      'h1'
    ];
    
    console.log('🔍 Searching for title...');
    
    for (const selector of titleSelectors) {
      const titleText = $(selector).text().trim();
      if (titleText && titleText.length > 5) { // Ensure it's not just whitespace or very short
        title = titleText;
        console.log(`✅ Found title: "${title.substring(0, 50)}..." from selector: ${selector}`);
        break;
      }
    }

    // If no title found, try to extract from page title or meta tags
    if (!title) {
      const pageTitle = $('title').text().trim();
      if (pageTitle && pageTitle.includes('Amazon')) {
        // Extract product name from page title
        title = pageTitle.replace(/Amazon\.com\s*:?\s*/, '').replace(/\s*-\s*Amazon\.com.*$/, '').trim();
        console.log(`✅ Found title from page title: "${title}"`);
      }
    }

    // Meta description fallback
    if (!title) {
      const metaDescription = $('meta[name="description"]').attr('content');
      if (metaDescription && metaDescription.length > 10) {
        title = metaDescription.substring(0, 100).trim();
        console.log(`✅ Found title from meta description: "${title}"`);
      }
    }

    console.log(`Final title extracted: "${title}"`);

    // Extract price with prioritized selectors for consistency
    let price = 0;
    let priceSource = ''; // Track which selector found the price for debugging
    
    // Prioritized price selectors - most reliable first
    const priceSelectors = [
      // Primary current price selectors (highest priority) - Focus on main product price
      { selector: '.a-price.a-text-price.a-size-medium.apexPriceToPay .a-offscreen', priority: 1, name: 'ApexPriceToPay' },
      { selector: '#priceblock_dealprice', priority: 1, name: 'DealPrice' },
      { selector: '#priceblock_ourprice', priority: 1, name: 'OurPrice' },
      { selector: '#price_inside_buybox', priority: 1, name: 'BuyBoxPrice' },
      
      // Secondary reliable selectors - current price elements
      { selector: '.a-price-current .a-price-whole', priority: 2, name: 'PriceCurrent' },
      { selector: '.a-price .a-offscreen:first', priority: 2, name: 'FirstPriceOffscreen' },
      { selector: '.a-price-to-pay .a-offscreen', priority: 2, name: 'PriceToPay' },
      
      // Fallback selectors (lower priority)
      { selector: '.a-price-whole:first', priority: 3, name: 'FirstPriceWhole' },
      { selector: '[data-automation-id="product-price"]', priority: 3, name: 'ProductPriceData' },
    ];
    
    console.log('🔍 Searching for price with prioritized selectors...');
    
    // Sort by priority and try each selector
    priceSelectors.sort((a, b) => a.priority - b.priority);
    
    const foundPrices: Array<{price: number, source: string}> = [];
    
    for (const { selector, name } of priceSelectors) {
      const priceElements = $(selector);
      if (priceElements.length > 0) {
        const priceText = priceElements.first().text().trim();
        console.log(`Checking ${name} selector "${selector}": "${priceText}"`);
        
        if (priceText) {
          // Enhanced price cleaning and validation
          let cleanPrice = priceText.replace(/[^\d.,]/g, '').replace(/,/g, '');
          
          // Handle multiple decimal points (keep only the last one)
          const decimalIndex = cleanPrice.lastIndexOf('.');
          if (decimalIndex !== -1) {
            cleanPrice = cleanPrice.substring(0, decimalIndex).replace(/\./g, '') + cleanPrice.substring(decimalIndex);
          }
          
          const priceMatch = cleanPrice.match(/^\d+\.?\d*$/);
          
          if (priceMatch) {
            const foundPrice = parseFloat(priceMatch[0]);
            // Validate price range (between $0.01 and $50,000)
            if (foundPrice > 0.01 && foundPrice < 50000) {
              foundPrices.push({ price: foundPrice, source: name });
              console.log(`✅ Found valid price: $${foundPrice} from ${name} (${selector})`);
              
              // Take the first valid price from highest priority selector
              if (!price) {
                price = foundPrice;
                priceSource = name;
              }
            } else {
              console.log(`⚠️ Price $${foundPrice} out of valid range, skipping...`);
            }
          }
        }
      }
    }
    
    // Validate price consistency if multiple prices found
    if (foundPrices.length > 1) {
      const prices = foundPrices.map(p => p.price);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const priceRange = maxPrice - minPrice;
      const avgPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;
      
      // If prices vary by more than 10% or $5, use the most common price or log warning
      if (priceRange > Math.max(avgPrice * 0.1, 5)) {
        console.log(`⚠️ Price inconsistency detected: Range $${minPrice} - $${maxPrice}`);
        console.log(`Found prices:`, foundPrices);
        
        // Use the price from the highest priority selector that's within reasonable range
        const validPrices = foundPrices.filter(p => 
          Math.abs(p.price - avgPrice) <= Math.max(avgPrice * 0.15, 10)
        );
        
        if (validPrices.length > 0) {
          price = validPrices[0].price;
          priceSource = validPrices[0].source + '_Validated';
          console.log(`✅ Using validated price: $${price} from ${priceSource}`);
        }
      }
    }

    // Only use fallback if no price found with primary selectors
    if (price === 0) {
      console.log('🔍 Using conservative fallback price search...');
      
      // Try combined whole/fraction approach for consistency
      const priceContainer = $('.a-price').first();
      if (priceContainer.length > 0) {
        const wholePrice = priceContainer.find('.a-price-whole').text().replace(/[^0-9]/g, '');
        const fractionPrice = priceContainer.find('.a-price-fraction').text().replace(/[^0-9]/g, '');
        
        if (wholePrice) {
          const fraction = fractionPrice || '00';
          const combinedPrice = `${wholePrice}.${fraction}`;
          const foundPrice = parseFloat(combinedPrice) || 0;
          if (foundPrice > 0.01 && foundPrice < 50000) {
            price = foundPrice;
            priceSource = 'CombinedWholeFraction';
            console.log(`✅ Found combined price: $${price} from ${priceSource}`);
          }
        }
      }
    }

    // Final validation
    if (price === 0 || price <= 0.01) {
      console.log('❌ No valid price found or price too low:', price);
      await logScrapingAttempt(url, 'FAILED', price, priceSource, 'No valid price found or price too low', response?.status, randomUserAgent, productId);
      return null;
    }

    console.log(`Final price extracted: $${price} from source: ${priceSource}`);

    // Log successful scraping
    await logScrapingAttempt(url, 'SUCCESS', price, priceSource, undefined, response?.status, randomUserAgent, productId);

    // Extract image URL
    let imageUrl = '';
    const imageSelectors = [
      '#landingImage',
      '#imgBlkFront',
      '#ebooksImgBlkFront',
      '.a-dynamic-image'
    ];
    
    for (const selector of imageSelectors) {
      const imgSrc = $(selector).attr('src') || $(selector).attr('data-src') || '';
      if (imgSrc && imgSrc.startsWith('http')) {
        imageUrl = imgSrc;
        break;
      }
    }

    // Extract description
    let description = '';
    const descriptionSelectors = [
      '#feature-bullets ul',
      '#productDescription',
      '.a-unordered-list.a-nostyle.a-vertical.feature'
    ];
    
    for (const selector of descriptionSelectors) {
      const descText = $(selector).text().trim();
      if (descText) {
        description = descText.substring(0, 500);
        break;
      }
    }

    // Fallback title extraction from URL if no title found
    if (!title) {
      const urlParts = url.split('/');
      const dpIndex = urlParts.findIndex(part => part === 'dp');
      if (dpIndex !== -1 && urlParts[dpIndex + 1]) {
        title = `Amazon Product ${urlParts[dpIndex + 1]}`;
      } else {
        title = 'Amazon Product';
      }
    }

    const productInfo: ProductInfo = {
      title: title || 'Unknown Product',
      price: price,
      imageUrl: imageUrl || '',
      description: description || 'Product description not available'
    };

      console.log('✅ Product scraped successfully:', {
        title: productInfo.title.substring(0, 50) + '...',
        price: productInfo.price,
        priceSource: priceSource,
        hasImage: !!productInfo.imageUrl
      });

      // Log successful scraping attempt
      await logScrapingAttempt(url, 'SUCCESS', productInfo.price, priceSource, undefined, response.status, randomUserAgent, productId);

      return productInfo;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown scraping error';
      console.error(`❌ Amazon scraping error (attempt ${attempt}/${retries}):`, errorMessage);
      
      // Log failed attempt
      await logScrapingAttempt(url, 'FAILED', undefined, undefined, errorMessage, response?.status, undefined, productId);
      
      // If this is not the last attempt, wait before retrying
      if (attempt < retries) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        console.log(`⏳ Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // Return fallback product info on final failure
      const fallbackTitle = url.includes('/dp/') ? 
        `Amazon Product ${url.split('/dp/')[1]?.split('/')[0] || ''}` : 
        'Amazon Product';
        
      return {
        title: fallbackTitle,
        price: 0,
        imageUrl: '',
        description: 'Unable to scrape product details. Please check the URL and try again.'
      };
    }
  }

  // This should never be reached due to the return statements above
  return null;
};

// Export for backward compatibility
export default scrapeAmazonProduct;
