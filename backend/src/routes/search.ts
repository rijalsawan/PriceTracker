import { Router } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { amazonSearchService } from '../services/amazonSearchService';

const router = Router();

// Validation schemas
const searchSchema = z.object({
  query: z.string().min(1).max(200),
  page: z.number().min(1).max(10).optional().default(1),
});

const suggestionSchema = z.object({
  query: z.string().min(1).max(100),
});

// Search Amazon products
router.get('/products', async (req: AuthRequest, res) => {
  try {
    const { query, page } = searchSchema.parse({
      query: req.query.q,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
    });

    console.log(`🔍 Search request: "${query}" (page ${page})`);

    const searchResults = await amazonSearchService.searchProducts(query, page);

    res.json({
      success: true,
      data: searchResults,
      message: `Found ${searchResults.products.length} products`
    });

  } catch (error) {
    console.error('Search products error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid search parameters', 
        details: error.errors 
      });
    }
    res.status(500).json({ 
      success: false,
      error: 'Search service temporarily unavailable' 
    });
  }
});

// Get product details by ASIN
router.get('/products/:asin', async (req: AuthRequest, res) => {
  try {
    const asin = req.params.asin;
    
    if (!asin || !/^[A-Z0-9]{10}$/i.test(asin)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid ASIN format'
      });
    }

    console.log(`📦 Getting product details for ASIN: ${asin}`);

    const productDetails = await amazonSearchService.getProductDetails(asin);

    if (!productDetails) {
      return res.status(404).json({
        success: false,
        error: 'Product not found or unavailable'
      });
    }

    res.json({
      success: true,
      data: productDetails,
      message: 'Product details retrieved successfully'
    });

  } catch (error) {
    console.error('Get product details error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to retrieve product details' 
    });
  }
});

// Get search suggestions
router.get('/suggestions', async (req: AuthRequest, res) => {
  try {
    const { query } = suggestionSchema.parse({
      query: req.query.q,
    });

    const suggestions = await amazonSearchService.getSearchSuggestions(query);

    res.json({
      success: true,
      data: {
        suggestions,
        query
      },
      message: `Found ${suggestions.length} suggestions`
    });

  } catch (error) {
    console.error('Get suggestions error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid query parameter', 
        details: error.errors 
      });
    }
    res.status(500).json({ 
      success: false,
      error: 'Suggestions service temporarily unavailable' 
    });
  }
});

export default router;
