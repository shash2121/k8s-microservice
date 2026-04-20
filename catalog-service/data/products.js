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
    'https://images.unsplash.com/photo-1706275399494-fb26bbc5da63?q=80&w=2656&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
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
    'https://plus.unsplash.com/premium_photo-1673356301514-2cad91907f74?q=80&w=987&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    500,
    4.2,
    892
  ),
  new Product(
    'Jeans',
    'Denim jeans with stretch comfort',
    59.99,
    'Clothing',
    'https://plus.unsplash.com/premium_photo-1674828600712-7d0caab39109?q=80&w=1008&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
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
    'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500',
    85,
    4.7,
    234
  ),
  new Product(
    'Smart LED Desk Lamp',
    'Adjustable LED lamp with multiple brightness levels and USB charging port',
    39.99,
    'Home & Kitchen',
    'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500',
    120,
    4.4,
    167
  ),
  new Product(
    'Coffee Maker Machine',
    'Programmable coffee maker with thermal carafe',
    79.99,
    'Home & Kitchen',
    'https://images.unsplash.com/photo-1608354580875-30bd4168b351?q=80&w=987&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    95,
    4.6,
    412
  ),
  new Product(
    'Vacuum Cleaner',
    'Smart robotic vacuum with app control and auto-charging',
    249.99,
    'Home & Kitchen',
    'https://images.unsplash.com/photo-1722710070534-e31f0290d8de?q=80&w=1035&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
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
    'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500',
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
    'Whey Protein',
    'Isolate Whey protein',
    30.99,
    'Sports & Outdoors',
    'https://images.unsplash.com/photo-1693996045899-7cf0ac0229c7?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    400,
    4.4,
    512
  )
];

module.exports = products;
