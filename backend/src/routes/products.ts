import { Router } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { scrapeAmazonProduct } from '../services/amazonScraperSimple';
import { priceHistoryService } from '../services/priceHistoryService';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const addProductSchema = z.object({
  asin: z.string().regex(/^[A-Z0-9]{10}$/i, 'Invalid ASIN format'),
  targetPrice: z.number().optional(),
});

const updateProductSchema = z.object({
  targetPrice: z.number().optional(),
  isActive: z.boolean().optional(),
});

// Get all products for user
router.get('/', async (req: AuthRequest, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { userId: req.user!.id },
      include: {
        priceHistory: {
          orderBy: { timestamp: 'desc' },
          take: 10
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ products });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single product
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Check if the id is an ASIN format (10 characters, alphanumeric)
    const isASIN = /^[A-Z0-9]{10}$/i.test(id);
    
    let product;
    
    if (isASIN) {
      // Look for product by ASIN (URL contains the ASIN)
      product = await prisma.product.findFirst({
        where: { 
          url: `https://www.amazon.com/dp/${id}`,
          userId: req.user!.id 
        },
        include: {
          priceHistory: {
            orderBy: { timestamp: 'desc' }
          }
        }
      });
      
      // If not found in tracked products, fetch from Amazon
      if (!product) {
        console.log(`📦 Fetching untracked product details for ASIN: ${id}`);
        const productInfo = await scrapeAmazonProduct(`https://www.amazon.com/dp/${id}`);
        
        if (!productInfo) {
          return res.status(404).json({ error: 'Product not found or unavailable' });
        }
        
        // Return product info without saving to DB
        return res.json({ 
          product: {
            id: null, // No DB ID since it's not tracked
            url: `https://www.amazon.com/dp/${id}`,
            title: productInfo.title,
            description: productInfo.description,
            imageUrl: productInfo.imageUrl,
            currentPrice: productInfo.price,
            targetPrice: null,
            isActive: false,
            userId: req.user!.id,
            createdAt: new Date(),
            updatedAt: new Date(),
            priceHistory: [], // No history for untracked products
            isTracked: false // Flag to indicate this product is not being tracked
          }
        });
      }
    } else {
      // Look for product by database ID
      product = await prisma.product.findFirst({
        where: { 
          id,
          userId: req.user!.id 
        },
        include: {
          priceHistory: {
            orderBy: { timestamp: 'desc' }
          }
        }
      });
    }

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Add isTracked flag for tracked products
    res.json({ 
      product: {
        ...product,
        isTracked: true
      }
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add new product
router.post('/', async (req: AuthRequest, res) => {
  try {
    const { asin, targetPrice } = addProductSchema.parse(req.body);

    // Check if product already exists for this user
    const existingProduct = await prisma.product.findFirst({
      where: {
        url: `https://www.amazon.com/dp/${asin}`,
        userId: req.user!.id
      }
    });

    if (existingProduct) {
      return res.status(400).json({ error: 'Product already being tracked' });
    }

    console.log(`📦 Adding product with ASIN: ${asin}`);

    // Scrape product information
    const productInfo = await scrapeAmazonProduct(`https://www.amazon.com/dp/${asin}`);
    
    if (!productInfo) {
      return res.status(400).json({ error: 'Unable to scrape product information' });
    }

    // Create product
    const product = await prisma.product.create({
      data: {
        url: `https://www.amazon.com/dp/${asin}`,
        title: productInfo.title,
        description: productInfo.description,
        imageUrl: productInfo.imageUrl,
        currentPrice: productInfo.price,
        targetPrice,
        isActive: true,
        userId: req.user!.id
      },
      include: {
        priceHistory: {
          orderBy: { timestamp: 'desc' },
          take: 10
        }
      }
    });

    // Create initial price history entry
    await prisma.priceHistory.create({
      data: {
        price: productInfo.price,
        productId: product.id,
        timestamp: new Date()
      }
    });

    res.status(201).json({
      message: 'Product added successfully',
      product
    });
  } catch (error) {
    console.error('Add product error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input data', details: error.errors });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update product
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const updateData = updateProductSchema.parse(req.body);

    const product = await prisma.product.findFirst({
      where: { 
        id,
        userId: req.user!.id 
      }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: updateData
    });

    res.json({
      message: 'Product updated successfully',
      product: updatedProduct
    });
  } catch (error) {
    console.error('Update product error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input data', details: error.errors });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete product
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findFirst({
      where: { 
        id,
        userId: req.user!.id 
      }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    await prisma.product.delete({
      where: { id }
    });

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get price history for product
router.get('/:id/history', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { limit = '30' } = req.query;

    const product = await prisma.product.findFirst({
      where: { 
        id,
        userId: req.user!.id 
      }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const priceHistory = await prisma.priceHistory.findMany({
      where: { productId: id },
      orderBy: { timestamp: 'desc' },
      take: parseInt(limit as string)
    });

    res.json({ priceHistory });
  } catch (error) {
    console.error('Get price history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get historical price analysis
router.get('/:id/historical-prices', async (req: AuthRequest, res) => {
  try {
    const productId = req.params.id;

    // Verify product belongs to user
    const product = await prisma.product.findFirst({
      where: { 
        id: productId,
        userId: req.user!.id 
      }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Get historical price analysis using internal data
    const priceAnalysis = await priceHistoryService.getPriceAnalysis(productId);
    
    if (!priceAnalysis) {
      return res.status(404).json({ error: 'No historical data available' });
    }

    res.json(priceAnalysis);
  } catch (error) {
    console.error('Get historical prices error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Manual price check for a specific product
router.post('/:id/check-price', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Verify product belongs to user
    const product = await prisma.product.findFirst({
      where: { 
        id,
        userId: req.user!.id 
      }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Import and use the price tracker
    const { checkProductPrice } = await import('../services/priceTracker');
    await checkProductPrice(product);

    // Get updated product and latest price history
    const updatedProduct = await prisma.product.findUnique({
      where: { id },
      include: {
        priceHistory: {
          orderBy: { timestamp: 'desc' },
          take: 1
        }
      }
    });

    res.json({ 
      message: 'Price check completed',
      product: updatedProduct
    });
  } catch (error) {
    console.error('Manual price check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Test endpoint to add sample price history (for testing purposes)
router.post('/:id/add-test-price-history', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Verify product belongs to user
    const product = await prisma.product.findFirst({
      where: { 
        id,
        userId: req.user!.id 
      }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Add some test price history data with more variation
    const basePrice = product.currentPrice;
    const testPrices = [
      { price: basePrice + (Math.random() * 10 - 5), hoursAgo: 48 }, // 2 days ago - random variation
      { price: basePrice + (Math.random() * 8 - 4), hoursAgo: 36 },  // 1.5 days ago
      { price: basePrice + (Math.random() * 6 - 3), hoursAgo: 24 },  // 1 day ago
      { price: basePrice + (Math.random() * 4 - 2), hoursAgo: 18 },  // 18 hours ago
      { price: basePrice + (Math.random() * 4 - 2), hoursAgo: 12 },  // 12 hours ago
      { price: basePrice + (Math.random() * 3 - 1.5), hoursAgo: 6 }, // 6 hours ago
      { price: basePrice + (Math.random() * 2 - 1), hoursAgo: 3 },   // 3 hours ago
      { price: basePrice + (Math.random() * 1 - 0.5), hoursAgo: 1 }, // 1 hour ago
    ];

    // Clear existing test data first
    await prisma.priceHistory.deleteMany({
      where: { productId: id }
    });

    // Add the original price as the starting point
    await prisma.priceHistory.create({
      data: {
        price: basePrice,
        productId: id,
        timestamp: new Date(Date.now() - 72 * 60 * 60 * 1000) // 3 days ago as start
      }
    });

    for (const testPrice of testPrices) {
      const timestamp = new Date(Date.now() - testPrice.hoursAgo * 60 * 60 * 1000);
      
      await prisma.priceHistory.create({
        data: {
          price: Math.max(testPrice.price, 0.01), // Ensure price is never negative
          productId: id,
          timestamp
        }
      });
    }

    // Update the product's current price to the latest test price
    await prisma.product.update({
      where: { id },
      data: { currentPrice: Math.max(testPrices[testPrices.length - 1].price, 0.01) }
    });

    res.json({ 
      message: 'Test price history added successfully',
      addedEntries: testPrices.length + 1, // +1 for the original starting price
      priceRange: {
        min: Math.min(...testPrices.map(p => p.price), basePrice),
        max: Math.max(...testPrices.map(p => p.price), basePrice)
      }
    });
  } catch (error) {
    console.error('Add test price history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
