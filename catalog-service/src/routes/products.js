const express = require('express');
const router = express.Router();
const products = require('../../data/products');

console.log('Product routes loaded, products count:', products.length);

// GET all products
router.get('/', (req, res) => {
  res.json({
    success: true,
    count: products.length,
    data: products
  });
});

// GET products by category
router.get('/category/:category', (req, res) => {
  const category = req.params.category;
  const filteredProducts = products.filter(
    product => product.category.toLowerCase() === category.toLowerCase()
  );

  if (filteredProducts.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'No products found in this category'
    });
  }

  res.json({
    success: true,
    count: filteredProducts.length,
    category: category,
    data: filteredProducts
  });
});

// GET all categories
router.get('/categories', (req, res) => {
  const categories = [...new Set(products.map(product => product.category))];
  res.json({
    success: true,
    count: categories.length,
    data: categories
  });
});

// GET products with pagination and search (must be before /:id)
router.get('/search', (req, res) => {
  const { q, category, minPrice, maxPrice, page = 1, limit = 10 } = req.query;

  let filteredProducts = [...products];

  // Search by name or description
  if (q) {
    const query = q.toLowerCase();
    filteredProducts = filteredProducts.filter(
      product =>
        product.name.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query)
    );
  }

  // Filter by category
  if (category) {
    filteredProducts = filteredProducts.filter(
      product => product.category.toLowerCase() === category.toLowerCase()
    );
  }

  // Filter by price range
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

  // Pagination
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + parseInt(limit);
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  res.json({
    success: true,
    count: paginatedProducts.length,
    total: filteredProducts.length,
    page: parseInt(page),
    totalPages: Math.ceil(filteredProducts.length / parseInt(limit)),
    data: paginatedProducts
  });
});

// GET single product by ID
router.get('/:id', (req, res) => {
  const product = products.find(p => p.id === req.params.id);

  if (!product) {
    return res.status(404).json({
      success: false,
      error: 'Product not found'
    });
  }

  res.json({
    success: true,
    data: product
  });
});

module.exports = router;
