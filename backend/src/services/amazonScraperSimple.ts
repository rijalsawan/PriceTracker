import * as cheerio from 'cheerio';
import axios from 'axios';

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

// Fallback scraper using Axios + Cheerio with improved price extraction
export const scrapeAmazonProduct = async (url: string, retries: number = 3): Promise<ProductInfo | null> => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`🔍 Scraping Amazon product (attempt ${attempt}/${retries})...`);
      
      // Validate Amazon URL
      if (!url.includes('amazon.')) {
        throw new Error('Invalid Amazon URL');
      }

      // Normalize the URL to remove unnecessary parameters
      const normalizedUrl = normalizeAmazonUrl(url);
      console.log(`📍 Normalized URL: ${normalizedUrl}`);

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
      const response = await axios.get(normalizedUrl, {
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
          'Cache-Control': 'max-age=0',
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
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const $ = cheerio.load(response.data);

      // Check if page contains CAPTCHA or is blocked
      if ($('#captchacharacters').length > 0 || $('form[action*="validateCaptcha"]').length > 0) {
        throw new Error('CAPTCHA detected - Amazon is blocking requests');
      }

      // Check if page is not found
      if ($('title').text().includes('Page Not Found') || $('.error-page').length > 0) {
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

    // Extract price with comprehensive selectors and logic
    let price = 0;
    const priceSelectors = [
      // Main price selectors
      '.a-price.a-text-price.a-size-medium.apexPriceToPay .a-offscreen',
      '.a-price-current .a-price-whole',
      '.a-price .a-offscreen',
      '.a-price-whole',
      '#price_inside_buybox',
      '.a-price-range',
      
      // Alternative price selectors
      '.a-price.a-text-price .a-offscreen',
      '.a-price-to-pay .a-offscreen',
      '.a-price-symbol-container .a-offscreen',
      '.a-price-current .a-offscreen',
      
      // Deal and sale price selectors
      '.a-price.a-text-price.a-size-base.a-color-price .a-offscreen',
      '.a-price.a-text-price.a-size-base .a-offscreen',
      '.a-price.a-text-price.a-size-large.a-color-price .a-offscreen',
      
      // Kindle and digital content
      '.a-price.a-text-price.a-size-medium.a-color-price .a-offscreen',
      '.kindle-price .a-offscreen',
      
      // Used/refurbished prices
      '.a-price.a-text-price.a-size-base.a-color-secondary .a-offscreen',
      
      // Fallback selectors
      '[data-automation-id="product-price"]',
      '.a-price-symbol',
      '#buyNewSection .a-price .a-offscreen',
      '#newAccordionRow .a-price .a-offscreen'
    ];
    
    console.log('🔍 Searching for price...');
    
    for (const selector of priceSelectors) {
      const priceElements = $(selector);
      if (priceElements.length > 0) {
        priceElements.each((_, element) => {
          const priceText = $(element).text().trim();
          console.log(`Checking selector "${selector}": "${priceText}"`);
          
          if (priceText) {
            // Clean price text and extract number
            const cleanPrice = priceText.replace(/[^\d.,]/g, '').replace(/,/g, '');
            const priceMatch = cleanPrice.match(/^\d+\.?\d*$/);
            
            if (priceMatch) {
              const foundPrice = parseFloat(priceMatch[0]);
              if (foundPrice > 0 && foundPrice < 100000) {
                price = foundPrice;
                console.log(`✅ Found price: $${price} from selector: ${selector}`);
                return false; // Break out of each loop
              }
            }
          }
        });
        
        if (price > 0) break;
      }
    }

    // If no price found with specific selectors, try more aggressive search
    if (price === 0) {
      console.log('🔍 Fallback price search...');
      
      // Look for price in various containers
      const priceContainers = [
        '#apex_desktop',
        '#centerCol',
        '#rightCol',
        '#buybox',
        '#price',
        '.a-section.a-spacing-none.aok-align-center'
      ];
      
      for (const container of priceContainers) {
        const $container = $(container);
        if ($container.length > 0) {
          // Look for text patterns that look like prices
          const containerText = $container.text();
          const pricePatterns = [
            /\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g,
            /USD\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g,
            /(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*USD/g
          ];
          
          for (const pattern of pricePatterns) {
            const matches = Array.from(containerText.matchAll(pattern));
            if (matches.length > 0) {
              for (const match of matches) {
                const foundPrice = parseFloat(match[1].replace(/,/g, ''));
                if (foundPrice > 0 && foundPrice < 100000) {
                  price = foundPrice;
                  console.log(`✅ Found price via pattern: $${price} from container: ${container}`);
                  break;
                }
              }
              if (price > 0) break;
            }
          }
          if (price > 0) break;
        }
      }
    }

    // Last resort: search all elements for price-like text
    if (price === 0) {
      console.log('🔍 Last resort price search...');
      
      $('span, div, p').each((_, element) => {
        const text = $(element).text().trim();
        const className = $(element).attr('class') || '';
        const id = $(element).attr('id') || '';
        
        // Skip if element contains too much text (likely not a price)
        if (text.length > 20) return;
        
        // Look for price-like patterns
        if (text.match(/^\$\d+\.?\d*$/) || text.match(/^\d+\.?\d*$/) && (className.includes('price') || id.includes('price'))) {
          const cleanText = text.replace(/[^\d.]/g, '');
          const foundPrice = parseFloat(cleanText);
          
          if (foundPrice > 0 && foundPrice < 100000) {
            price = foundPrice;
            console.log(`✅ Found price via last resort: $${price} from text: "${text}"`);
            return false;
          }
        }
      });
    }

    console.log(`Final price extracted: $${price}`);

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
      price: price || 0,
      imageUrl: imageUrl || '',
      description: description || 'Product description not available'
    };

      console.log('✅ Product scraped successfully:', {
        title: productInfo.title.substring(0, 50) + '...',
        price: productInfo.price,
        hasImage: !!productInfo.imageUrl
      });

      return productInfo;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown scraping error';
      console.error(`❌ Amazon scraping error (attempt ${attempt}/${retries}):`, errorMessage);
      
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
