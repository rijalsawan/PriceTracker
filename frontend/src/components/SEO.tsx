import React, { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
}

const SEO: React.FC<SEOProps> = ({
  title = 'PriceTracker - Amazon Price Tracking & Alerts | Never Miss a Deal',
  description = 'Track Amazon prices and get instant alerts when prices drop. Never miss a deal again with PriceTracker - the ultimate Amazon price monitoring tool.',
  keywords = 'amazon price tracker, price alerts, deal finder, price monitoring, amazon deals, price drop alerts, shopping assistant',
  image = 'https://price-tracker-murex.vercel.app/logo512.png',
  url = 'https://price-tracker-murex.vercel.app/',
  type = 'website',
  author = 'PriceTracker',
  publishedTime,
  modifiedTime
}) => {
  useEffect(() => {
    const siteUrl = 'https://price-tracker-murex.vercel.app';
    const fullUrl = url.startsWith('http') ? url : `${siteUrl}${url}`;
    const fullImage = image.startsWith('http') ? image : `${siteUrl}${image}`;

    // Set document title
    document.title = title;

    // Helper function to update meta tags
    const updateMetaTag = (name: string, content: string, property?: boolean) => {
      const attribute = property ? 'property' : 'name';
      let element = document.querySelector(`meta[${attribute}="${name}"]`);
      
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, name);
        document.head.appendChild(element);
      }
      
      element.setAttribute('content', content);
    };

    // Basic Meta Tags
    updateMetaTag('description', description);
    updateMetaTag('keywords', keywords);
    updateMetaTag('author', author);
    updateMetaTag('robots', 'index, follow');
    updateMetaTag('googlebot', 'index, follow');
    updateMetaTag('format-detection', 'telephone=no');

    // Open Graph / Facebook
    updateMetaTag('og:type', type, true);
    updateMetaTag('og:url', fullUrl, true);
    updateMetaTag('og:title', title, true);
    updateMetaTag('og:description', description, true);
    updateMetaTag('og:image', fullImage, true);
    updateMetaTag('og:image:width', '512', true);
    updateMetaTag('og:image:height', '512', true);
    updateMetaTag('og:locale', 'en_US', true);
    updateMetaTag('og:site_name', 'PriceTracker', true);

    // Article specific meta tags
    if (type === 'article' && publishedTime) {
      updateMetaTag('article:published_time', publishedTime, true);
    }
    if (type === 'article' && modifiedTime) {
      updateMetaTag('article:modified_time', modifiedTime, true);
    }
    if (type === 'article' && author) {
      updateMetaTag('article:author', author, true);
    }

    // Twitter
    updateMetaTag('twitter:card', 'summary_large_image', true);
    updateMetaTag('twitter:url', fullUrl, true);
    updateMetaTag('twitter:title', title, true);
    updateMetaTag('twitter:description', description, true);
    updateMetaTag('twitter:image', fullImage, true);
    updateMetaTag('twitter:creator', '@PriceTracker', true);

    // Canonical URL
    let canonicalElement = document.querySelector('link[rel="canonical"]');
    if (!canonicalElement) {
      canonicalElement = document.createElement('link');
      canonicalElement.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalElement);
    }
    canonicalElement.setAttribute('href', fullUrl);

    // JSON-LD Structured Data
    let jsonLdElement = document.querySelector('script[type="application/ld+json"]');
    if (!jsonLdElement) {
      jsonLdElement = document.createElement('script');
      jsonLdElement.setAttribute('type', 'application/ld+json');
      document.head.appendChild(jsonLdElement);
    }
    
    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'PriceTracker',
      description: description,
      url: fullUrl,
      applicationCategory: 'ShoppingApplication',
      operatingSystem: 'All',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD'
      },
      author: {
        '@type': 'Organization',
        name: 'PriceTracker'
      },
      image: fullImage,
      screenshot: fullImage
    };
    
    jsonLdElement.textContent = JSON.stringify(structuredData);

  }, [title, description, keywords, image, url, type, author, publishedTime, modifiedTime]);

  return null;
};

export default SEO;
