# Cart Service

E-commerce shopping cart microservice for managing user carts. This service works alongside the catalog service to provide a complete shopping experience.

## Features

- Add items to cart
- Update item quantities
- Remove items from cart
- Clear entire cart
- Real-time cart total calculation
- Free shipping on orders over $100
- Persistent cart using localStorage

## Tech Stack

- Node.js
- Express.js
- In-memory cart storage (can be extended with database)

## Installation

```bash
cd cart-service
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

The service will start on `http://localhost:3002` (or the port specified in `PORT` environment variable).

## API Endpoints

### Health Check
```
GET /health
```

### Cart

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/cart/:userId` | GET | Get cart for user |
| `/api/cart/:userId/items` | POST | Add item to cart |
| `/api/cart/:userId/items/:itemId` | PUT | Update item quantity |
| `/api/cart/:userId/items/:itemId` | DELETE | Remove item from cart |
| `/api/cart/:userId` | DELETE | Clear cart |

## Request/Response Examples

### Add Item to Cart

**POST** `/api/cart/user123/items`

```json
{
  "productId": "prod-123",
  "name": "Wireless Headphones",
  "price": 79.99,
  "image": "https://...",
  "quantity": 1
}
```

**Response:**
```json
{
  "success": true,
  "message": "Item added to cart",
  "data": {
    "id": "cart-uuid",
    "userId": "user123",
    "items": [...],
    "totalItems": 1,
    "totalPrice": 79.99
  }
}
```

## Environment Variables

Create a `.env` file in the root directory:

```env
PORT=3002
NODE_ENV=development
```

## Integration with Catalog Service

The cart service is designed to work with the catalog service:
- Catalog Service runs on port 3001
- Cart Service runs on port 3002
- Cart icon in catalog header shows real-time item count
- "Add to Cart" buttons on product cards add items directly to cart

## Project Structure

```
cart-service/
├── public/
│   ├── cart.html            # Cart UI page
│   ├── css/
│   │   └── cart.css         # Cart styles
│   └── js/
│       └── cart.js          # Cart frontend logic
├── src/
│   ├── models/
│   │   └── Cart.js          # Cart model
│   ├── routes/
│   │   └── cart.js          # Cart routes
│   └── app.js               # Main application
├── package.json
└── README.md
```

## License

MIT
