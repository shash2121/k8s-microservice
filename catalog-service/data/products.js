const Product = require('../src/models/Product');

const products = [
  // Electronics
  new Product(
    'Wireless Bluetooth Headphones',
    'Premium noise-cancelling wireless headphones with 30-hour battery life',
    79.99,
    'Electronics',
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
    150,
    4.5,
    328
  ),
  new Product(
    'Smart Watch Pro',
    'Advanced fitness tracking smartwatch with heart rate monitor and GPS',
    199.99,
    'Electronics',
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500',
    75,
    4.7,
    512
  ),
  new Product(
    'Portable Power Bank 20000mAh',
    'High-capacity portable charger with fast charging support',
    45.99,
    'Electronics',
    'https://images.unsplash.com/photo-1609599006353-e629aaabfeae?w=500',
    200,
    4.3,
    189
  ),
  new Product(
    '4K Ultra HD Webcam',
    'Professional webcam with auto-focus and built-in microphone',
    89.99,
    'Electronics',
    'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=500',
    60,
    4.4,
    156
  ),

  // Clothing
  new Product(
    'Classic Cotton T-Shirt',
    'Comfortable 100% cotton t-shirt available in multiple colors',
    24.99,
    'Clothing',
    'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500',
    500,
    4.2,
    892
  ),
  new Product(
    'Slim Fit Jeans',
    'Modern slim fit denim jeans with stretch comfort',
    59.99,
    'Clothing',
    'https://images.unsplash.com/photo-1542272454315-4c01d7abdf4a?w=500',
    250,
    4.6,
    445
  ),
  new Product(
    'Winter Jacket',
    'Warm insulated winter jacket with water-resistant outer shell',
    129.99,
    'Clothing',
    'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500',
    100,
    4.8,
    267
  ),
  new Product(
    'Running Sneakers',
    'Lightweight athletic shoes with cushioned sole',
    84.99,
    'Clothing',
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500',
    180,
    4.5,
    378
  ),

  // Home & Kitchen
  new Product(
    'Stainless Steel Cookware Set',
    '10-piece professional cookware set with non-stick coating',
    149.99,
    'Home & Kitchen',
    'https://images.unsplash.com/photo-1584992236310-6eddd7e4a5e7?w=500',
    85,
    4.7,
    234
  ),
  new Product(
    'Smart LED Desk Lamp',
    'Adjustable LED lamp with multiple brightness levels and USB charging port',
    39.99,
    'Home & Kitchen',
    'https://images.unsplash.com/photo-1534073828943-f801091a7d58?w=500',
    120,
    4.4,
    167
  ),
  new Product(
    'Coffee Maker Machine',
    'Programmable coffee maker with thermal carafe',
    79.99,
    'Home & Kitchen',
    'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=500',
    95,
    4.6,
    412
  ),
  new Product(
    'Vacuum Cleaner Robot',
    'Smart robotic vacuum with app control and auto-charging',
    249.99,
    'Home & Kitchen',
    'https://images.unsplash.com/photo-1518640467707-6811f4a6ab73?w=500',
    50,
    4.3,
    289
  ),

  // Books
  new Product(
    'The Art of Programming',
    'Comprehensive guide to software development best practices',
    49.99,
    'Books',
    'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=500',
    300,
    4.9,
    1245
  ),
  new Product(
    'Modern Cooking Recipes',
    'Collection of 500+ delicious recipes from around the world',
    34.99,
    'Books',
    'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500',
    220,
    4.5,
    567
  ),
  new Product(
    'Digital Marketing Mastery',
    'Complete guide to digital marketing strategies and tactics',
    39.99,
    'Books',
    'https://images.unsplash.com/photo-1461749280684-dcc64fa648e3?w=500',
    180,
    4.6,
    423
  ),

  // Sports & Outdoors
  new Product(
    'Yoga Mat Premium',
    'Extra thick non-slip yoga mat with carrying strap',
    29.99,
    'Sports & Outdoors',
    'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=500',
    350,
    4.7,
    678
  ),
  new Product(
    'Camping Tent 4-Person',
    'Waterproof family camping tent with easy setup',
    159.99,
    'Sports & Outdoors',
    'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=500',
    45,
    4.5,
    234
  ),
  new Product(
    'Mountain Bike',
    '21-speed mountain bike with aluminum frame and front suspension',
    399.99,
    'Sports & Outdoors',
    'https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?w=500',
    30,
    4.8,
    156
  ),
  new Product(
    'Fitness Resistance Bands Set',
    '5-piece resistance band set with different strength levels',
    19.99,
    'Sports & Outdoors',
    'https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=500',
    400,
    4.4,
    512
  )
];

module.exports = products;
