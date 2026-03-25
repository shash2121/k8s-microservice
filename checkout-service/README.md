# Checkout Service

E-commerce checkout microservice for handling the complete checkout process including payment processing and order creation.

## Features

- Create checkout sessions from cart
- Add/remove/update items in checkout
- Apply discount codes (WELCOME10, SAVE20, FLAT500)
- Calculate shipping costs (FREE over ₹8300)
- Calculate tax (18% GST)
- Multiple payment methods (Card, UPI, Net Banking, COD)
- Payment processing simulation
- Order creation
- Email notifications
- Order history

## Tech Stack

- Node.js
- Express.js
- Nodemailer (for email notifications)
- In-memory storage (can be extended with database)

## Installation

```bash
cd checkout-service
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

The service will start on `http://localhost:3003`.

## API Endpoints

### Health Check
```
GET /health
```

### Checkout

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/checkout/session/:userId` | GET | Get checkout session |
| `/api/checkout/session/:userId` | POST | Create checkout session |
| `/api/checkout/session/:userId` | PUT | Update checkout session |
| `/api/checkout/session/:userId/checkout` | POST | Process payment & create order |
| `/api/checkout/order/:orderId` | GET | Get order by ID |
| `/api/checkout/orders/:userId` | GET | Get all orders for user |
| `/api/checkout/discount-codes` | GET | Get available discount codes |

## Discount Codes

| Code | Description |
|------|-------------|
| WELCOME10 | 10% off on any order |
| SAVE20 | 20% off on orders above ₹5,000 |
| FLAT500 | Flat ₹500 off on orders above ₹3,000 |

## Payment Methods

- 💳 Credit/Debit Card
- 📱 UPI
- 🏦 Net Banking
- 💵 Cash on Delivery

## Environment Variables

Create a `.env` file:

```env
PORT=3003
NODE_ENV=development
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-password
```

## Email Notifications

In development mode, emails are logged to console. In production, configure SMTP settings to send real emails.

## Project Structure

```
checkout-service/
├── public/
│   ├── checkout.html        # Checkout UI page
│   ├── css/
│   │   └── checkout.css     # Checkout styles
│   └── js/
│       └── checkout.js      # Checkout logic
├── src/
│   ├── models/
│   │   └── Checkout.js      # Checkout model
│   ├── services/
│   │   └── EmailService.js  # Email notification service
│   ├── routes/
│   │   └── checkout.js      # Checkout routes
│   └── app.js               # Main application
├── package.json
└── README.md
```

## Order Flow

1. User adds items to cart (Cart Service)
2. User clicks "Proceed to Checkout"
3. Checkout session created with cart items
4. User enters shipping address
5. User applies discount code (optional)
6. User selects payment method
7. Payment processed
8. Order created
9. Confirmation email sent
10. Cart cleared

## License

MIT
