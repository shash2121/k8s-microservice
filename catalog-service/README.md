# Catalog Service

E-commerce catalog microservice for managing and displaying products. This service is part of a larger e-commerce web application.

## Features

- Browse all products
- Filter products by category
- Search products by name/description
- Price range filtering
- Pagination support
- Product details by ID
- Health check endpoint

## Tech Stack

- Node.js
- Express.js
- In-memory product data (can be extended with database)

## Installation

```bash
cd catalog-service
npm install
```

## Usage

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

The service will start on `http://localhost:3001` (or the port specified in `PORT` environment variable).

## API Endpoints

### Health Check
```
GET /health
```

### Products

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/products` | GET | Get all products |
| `/api/products/:id` | GET | Get product by ID |
| `/api/products/category/:category` | GET | Get products by category |
| `/api/products/categories` | GET | Get all available categories |
| `/api/products/search` | GET | Search products with filters |

### Search Query Parameters

```
GET /api/products/search?q=laptop&category=Electronics&minPrice=50&maxPrice=500&page=1&limit=10
```

| Parameter | Description | Default |
|-----------|-------------|---------|
| `q` | Search query (name/description) | - |
| `category` | Filter by category | - |
| `minPrice` | Minimum price filter | - |
| `maxPrice` | Maximum price filter | - |
| `page` | Page number | 1 |
| `limit` | Items per page | 10 |

## Product Categories

- Electronics
- Clothing
- Home & Kitchen
- Books
- Sports & Outdoors

## Environment Variables

Create a `.env` file in the root directory:

```env
PORT=3001
NODE_ENV=development
```

## Example Response

```json
{
  "success": true,
  "count": 20,
  "data": [
    {
      "id": "uuid",
      "name": "Wireless Bluetooth Headphones",
      "description": "Premium noise-cancelling wireless headphones...",
      "price": 79.99,
      "category": "Electronics",
      "image": "https://...",
      "stock": 150,
      "rating": 4.5,
      "reviews": 328,
      "createdAt": "2026-03-16T...",
      "updatedAt": "2026-03-16T..."
    }
  ]
}
```

## Project Structure

```
catalog-service/
├── data/
│   └── products.js          # Product data
├── src/
│   ├── config/              # Configuration files
│   ├── middleware/          # Custom middleware
│   ├── models/
│   │   └── Product.js       # Product model
│   ├── routes/
│   │   └── products.js      # Product routes
│   └── app.js               # Main application
├── package.json
└── README.md
```

## License

MIT
