# 🛒 ShopHub - Microservices E-Commerce Platform

A modern, scalable e-commerce platform built with microservices architecture.

![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)
![Express](https://img.shields.io/badge/Express-4.x-blue.svg)
![MySQL](https://img.shields.io/badge/MySQL-8.0-orange.svg)
![Docker](https://img.shields.io/badge/Docker-Compose-blue.svg)

---

## 📋 Table of Contents

- [Architecture](#architecture)
- [Services Overview](#services-overview)
- [Quick Start](#quick-start)
- [Docker Compose Setup](#docker-compose-setup)
- [API Documentation](#api-documentation)
- [Development](#development)
- [Troubleshooting](#troubleshooting)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         ShopHub Platform                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Landing    │  │   Catalog    │  │     Cart     │          │
│  │   Service    │  │   Service    │  │   Service    │          │
│  │   (3000)     │  │   (3001)     │  │   (3002)     │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                 │                 │                   │
│         └─────────────────┴─────────────────┘                   │
│                           │                                     │
│                  ┌────────▼────────┐                            │
│                  │   Checkout      │                            │
│                  │   Service       │                            │
│                  │   (3003)        │                            │
│                  └────────┬────────┘                            │
│                           │                                     │
│         ┌─────────────────┼─────────────────┐                   │
│         │                 │                 │                   │
│  ┌──────▼───────┐  ┌──────▼───────┐  ┌──────▼───────┐          │
│  │    MySQL     │  │    Redis     │  │   RabbitMQ   │          │
│  │  Database    │  │    Cache     │  │    Queue     │          │
│  │   (3306)     │  │   (6379)     │  │   (5672)     │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Services Overview

| Service | Port | Description | Technologies |
|---------|------|-------------|--------------|
| **landing-service** | 3000 | User authentication, registration, login | Express, JWT, bcrypt |
| **catalog-service** | 3001 | Product catalog, search, filtering | Express, MySQL |
| **cart-service** | 3002 | Shopping cart management | Express, In-memory/Redis |
| **checkout-service** | 3003 | Order processing, payment, email | Express, MySQL, Nodemailer |
| **mysql** | 3306 | Primary database | MySQL 8.0 |
| **redis** | 6379 | Caching layer (optional) | Redis 7 |
| **rabbitmq** | 5672 | Message queue (optional) | RabbitMQ 3 |

---

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose installed
- Node.js 18+ (for local development)
- Git

### Clone the Repository

```bash
git clone https://github.com/sha2121/shophub-microservices.git
cd shophub-microservices
```

---

## 🐳 Docker Compose Setup

### Step 1: Start All Services

```bash
# Start all services in detached mode
docker-compose up -d

# View running containers
docker-compose ps
```

### Step 2: View Logs

```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f checkout-service
docker-compose logs -f mysql
```

### Step 3: Access the Application

| Service | URL | Description |
|---------|-----|-------------|
| Landing/Auth | http://localhost:3000 | Login, Register |
| Catalog | http://localhost:3001 | Browse Products |
| Cart | http://localhost:3002 | Shopping Cart |
| Checkout | http://localhost:3003 | Place Orders |
| MySQL | localhost:3306 | Database |

### Step 4: Stop Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (resets database)
docker-compose down -v
```

### Step 5: Rebuild Services

```bash
# Rebuild and restart a specific service
docker-compose build catalog-service
docker-compose restart catalog-service

# Rebuild all services
docker-compose up -d --build
```

---

## 📡 API Documentation

### Landing Service (Port 3000)

#### User Registration
```bash
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

#### User Login
```bash
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Get Current User
```bash
GET http://localhost:3000/api/auth/me
Authorization: Bearer <token>
```

---

### Catalog Service (Port 3001)

#### Get All Products
```bash
GET http://localhost:3001/api/products
```

#### Search Products
```bash
GET http://localhost:3001/api/products/search?q=laptop&category=Electronics&page=1&limit=12
```

#### Get Product by ID
```bash
GET http://localhost:3001/api/products/:id
```

---

### Cart Service (Port 3002)

#### Get User Cart
```bash
GET http://localhost:3002/api/cart/:userId
```

#### Add Item to Cart
```bash
POST http://localhost:3002/api/cart/:userId/items
Content-Type: application/json

{
  "productId": "product-123",
  "name": "Wireless Headphones",
  "price": 79.99,
  "image": "https://example.com/image.jpg",
  "quantity": 1
}
```

#### Remove Item from Cart
```bash
DELETE http://localhost:3002/api/cart/:userId/items/:itemId
```

#### Clear Cart
```bash
DELETE http://localhost:3002/api/cart/:userId
```

---

### Checkout Service (Port 3003)

#### Create Checkout Session
```bash
POST http://localhost:3003/api/checkout/session/:userId
Content-Type: application/json

{
  "items": [...],
  "shippingAddress": {
    "name": "John Doe",
    "email": "john@example.com",
    "address": "123 Main St",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001",
    "phone": "9876543210"
  }
}
```

#### Apply Discount Code
```bash
PUT http://localhost:3003/api/checkout/session/:userId
Content-Type: application/json

{
  "action": "apply_discount",
  "discountCode": "WELCOME10"
}
```

#### Place Order
```bash
POST http://localhost:3003/api/checkout/session/:userId/checkout
Content-Type: application/json

{
  "paymentMethod": "card",
  "paymentDetails": {...},
  "customerEmail": "john@example.com"
}
```

#### Get User Orders
```bash
GET http://localhost:3003/api/checkout/orders/:userId
```

#### Get Order Details
```bash
GET http://localhost:3003/api/checkout/order/:orderId
```

---

## 🛠️ Development

### Run Services Locally (Without Docker)

```bash
# Terminal 1 - Landing Service
cd landing-service
npm install
npm start

# Terminal 2 - Catalog Service
cd catalog-service
npm install
npm start

# Terminal 3 - Cart Service
cd cart-service
npm install
npm start

# Terminal 4 - Checkout Service
cd checkout-service
npm install
npm start
```

### Environment Variables

Create `.env` file in each service directory:

#### landing-service/.env
```bash
PORT=3000
NODE_ENV=development
JWT_SECRET=shophub-jwt-secret-key-change-in-production
SESSION_SECRET=shophub-session-secret-change-in-production

# Database (optional - falls back to in-memory)
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=password
DB_NAME=shophub
```

#### checkout-service/.env
```bash
PORT=3003
NODE_ENV=development

# Gmail SMTP (for order confirmation emails)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Database (optional - falls back to in-memory)
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=password
DB_NAME=shophub
```

---

## 🔧 Troubleshooting

### Services Not Starting

```bash
# Check container status
docker-compose ps

# View error logs
docker-compose logs <service-name>

# Restart specific service
docker-compose restart <service-name>
```

### Database Connection Issues

```bash
# Check MySQL is running
docker-compose ps mysql

# View MySQL logs
docker-compose logs mysql

# Connect to MySQL directly
docker exec -it shophub_mysql mysql -uroot -ppassword
```

### Reset Database

```bash
# Stop and remove all volumes
docker-compose down -v

# Start fresh
docker-compose up -d
```

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or change port in docker-compose.yml
```

### Clear Docker Cache

```bash
# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune

# Remove unused containers
docker container prune
```

---

## 📊 Database Schema

### Users Table
```sql
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Orders Table
```sql
CREATE TABLE orders (
    order_id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    status ENUM('pending', 'processing', 'completed', 'cancelled', 'confirmed'),
    subtotal DECIMAL(10, 2),
    discount DECIMAL(10, 2),
    tax_amount DECIMAL(10, 2),
    shipping_cost DECIMAL(10, 2),
    total DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Order Items Table
```sql
CREATE TABLE order_items (
    id VARCHAR(36) PRIMARY KEY,
    order_id VARCHAR(36) NOT NULL,
    product_id VARCHAR(36) NOT NULL,
    name VARCHAR(255),
    price DECIMAL(10, 2),
    quantity INT,
    subtotal DECIMAL(10, 2),
    FOREIGN KEY (order_id) REFERENCES orders(order_id)
);
```

---

## 🧪 Testing

```bash
# Test health endpoints
curl http://localhost:3000/health
curl http://localhost:3001/health
curl http://localhost:3002/health
curl http://localhost:3003/health

# Test API endpoints
curl http://localhost:3001/api/products
curl http://localhost:3002/api/cart/test-user
```

---

## 📦 Docker Images

Official Docker Hub images:

- `sha2121/shophub-landing-page:latest`
- `sha2121/shophub-catalog:latest`
- `sha2121/shophub-cart:latest`
- `sha2121/shophub-checkout:latest`

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License.

---

## 👨‍💻 Author

**sha2121**

GitHub: [@sha2121](https://github.com/sha2121)

---

## 🙏 Acknowledgments

- Express.js
- MySQL
- Docker
- Node.js
- Nodemailer
- JWT

---

<div align="center">

**Happy Coding! 🎉**

Made with ❤️ using Microservices Architecture

</div>
