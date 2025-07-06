import * as cheerio from 'cheerio';
import axios from 'axios';

interface ProductInfo {
  title: string;
  description?: string;
  price: number;
  imageUrl?: string;
}

// Fallback scraper using Axios + Cheerio (more reliable than Puppeteer for basic scraping)
export const scrapeAmazonProduct = async (url: string): Promise<ProductInfo | null> => {
  try {
    console.log('🔍 Scraping Amazon product with HTTP request...');
    
    // Validate Amazon URL
    if (!url.includes('amazon.')) {
      throw new Error('Invalid Amazon URL');
    }

    // Make HTTP request with proper headers to avoid detection
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Cache-Control': 'max-age=0',
      },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);

    // Extract title with multiple selectors
    let title = '';
    const titleSelectors = [
      '#productTitle',
      '.product-title',
      'h1.a-size-large',
      '[data-automation-id="product-title"]',
      'h1'
    ];
    
    for (const selector of titleSelectors) {
      const titleText = $(selector).text().trim();
      if (titleText) {
        title = titleText;
        break;
      }
    }

    // Extract price with multiple selectors
    let price = 0;
    const priceSelectors = [
      '.a-price-whole',
      '.a-price .a-offscreen',
      '#price_inside_buybox',
      '.a-price-range',
      '.a-price.a-text-price.a-size-medium.apexPriceToPay .a-offscreen',
      '.a-price-current .a-price-whole'
    ];
    
    for (const selector of priceSelectors) {
      const priceText = $(selector).text().trim();
      if (priceText) {
        const priceMatch = priceText.match(/[\d,]+\.?\d*/);
        if (priceMatch) {
          price = parseFloat(priceMatch[0].replace(/,/g, ''));
          if (price > 0) break;
        }
      }
    }

    // If no price found, try searching all elements containing "price"
    if (price === 0) {
      $('[class*="price"], [id*="price"]').each((_, element) => {
        const text = $(element).text().trim();
        const match = text.match(/\$?[\d,]+\.?\d*/);
        if (match) {
          const foundPrice = parseFloat(match[0].replace(/[$,]/g, ''));
          if (foundPrice > 0 && foundPrice < 100000) { // Reasonable price range
            price = foundPrice;
            return false; // Break out of each loop
          }
        }
      });
    }

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
    console.error('❌ Amazon scraping error:', errorMessage);
    
    // Return fallback product info
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
};

// Export for backward compatibility
export default scrapeAmazonProduct;
