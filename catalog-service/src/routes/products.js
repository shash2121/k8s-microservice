const express = require('express');
const router = express.Router();
const products = require('../../data/products');
const { cache } = require('../config/redis');

const CACHE_TTL = 300;

console.log('Product routes loaded, products count:', products.length);

function buildCacheKey(prefix, params = {}) {
  return `${prefix}:${JSON.stringify(params)}`;
}

router.get('/', async (req, res) => {
  const cacheKey = 'products:all';
  const cached = await cache.get(cacheKey);
  
  if (cached) {
    return res.json({ ...cached, cached: true });
  }

  const data = {
    success: true,
    count: products.length,
    data: products
  };

  console.log('[catalog] Caching key', cacheKey);
  const resultAll = await cache.set(cacheKey, data, CACHE_TTL);
  console.log('[catalog] Cache set result for all products:', resultAll);
  res.json(data);
});

router.get('/category/:category', async (req, res) => {
  const { category } = req.params;
  const cacheKey = buildCacheKey('products:category', { category: category.toLowerCase() });
  const cached = await cache.get(cacheKey);

  if (cached) {
    return res.json({ ...cached, cached: true });
  }

  const filteredProducts = products.filter(
    product => product.category.toLowerCase() === category.toLowerCase()
  );

  if (filteredProducts.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'No products found in this category'
    });
  }

  const data = {
    success: true,
    count: filteredProducts.length,
    category: category,
    data: filteredProducts
  };

  console.log('[catalog] Caching key', cacheKey);
  const resultCategory = await cache.set(cacheKey, data, CACHE_TTL);
  console.log('[catalog] Cache set result for category:', resultCategory);
  res.json(data);
});

router.get('/categories', async (req, res) => {
  const cacheKey = 'products:categories';
  const cached = await cache.get(cacheKey);

  if (cached) {
    return res.json({ ...cached, cached: true });
  }

  const categories = [...new Set(products.map(product => product.category))];
  const data = {
    success: true,
    count: categories.length,
    data: categories
  };

  console.log('[catalog] Caching key', cacheKey);
  const resultCategories = await cache.set(cacheKey, data, CACHE_TTL);
  console.log('[catalog] Cache set result for categories list:', resultCategories);
  res.json(data);
});

router.get('/search', async (req, res) => {
  const { q, category, minPrice, maxPrice, page = 1, limit = 10 } = req.query;
  const cacheKey = buildCacheKey('products:search', { q, category, minPrice, maxPrice, page, limit });
  const cached = await cache.get(cacheKey);

  if (cached) {
    return res.json({ ...cached, cached: true });
  }

  let filteredProducts = [...products];

  if (q) {
    const query = q.toLowerCase();
    filteredProducts = filteredProducts.filter(
      product =>
        product.name.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query)
    );
  }

  if (category) {
    filteredProducts = filteredProducts.filter(
      product => product.category.toLowerCase() === category.toLowerCase()
    );
  }

  if (minPrice) {
    filteredProducts = filteredProducts.filter(
      product => product.price >= parseFloat(minPrice)
    );
  }
  if (maxPrice) {
    filteredProducts = filteredProducts.filter(
      product => product.price <= parseFloat(maxPrice)
    );
  }

  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + parseInt(limit);
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  const data = {
    success: true,
    count: paginatedProducts.length,
    total: filteredProducts.length,
    page: parseInt(page),
    totalPages: Math.ceil(filteredProducts.length / parseInt(limit)),
    data: paginatedProducts
  };

  console.log('[catalog] Caching key', cacheKey);
  const resultSearch = await cache.set(cacheKey, data, CACHE_TTL);
  console.log('[catalog] Cache set result for search:', resultSearch);
  res.json(data);
});

router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const cacheKey = `product:${id}`;
  const cached = await cache.get(cacheKey);

  if (cached) {
    return res.json({ ...cached, cached: true });
  }

  const product = products.find(p => p.id === req.params.id);

  if (!product) {
    return res.status(404).json({
      success: false,
      error: 'Product not found'
    });
  }

  const data = {
    success: true,
    data: product
  };

  console.log('[catalog] Caching key', cacheKey);
  const resultProduct = await cache.set(cacheKey, data, CACHE_TTL);
  console.log('[catalog] Cache set result for product id:', resultProduct);
  res.json(data);
});

module.exports = router;
