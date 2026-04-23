## MySQL Database Integration

### Schema
User login info and order history stored in MySQL.

### Tables:
- **users** - User login credentials (id, name, email, password_hash)
- **orders** - Order history (order_id, user_id, status, pricing, shipping, payment info)
- **order_items** - Items in each order (product details, quantity, price)

### Services:
| Service | Port | Description |
|---------|------|-------------|
| landing-service | 3000 | User authentication |
| catalog-service | 3001 | Product catalog |
| cart-service | 3002 | Shopping cart |
| checkout-service | 3003 | Order processing |

---

## Running with Docker (Recommended)

### Start All Services
```bash
cd /Users/shashwat/project/microservices
docker-compose up -d
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f checkout-service
```

### Stop All Services
```bash
docker-compose down
```

### Access URLs
- Landing/Auth: http://localhost:3000
- Catalog: http://localhost:3001
- Cart: http://localhost:3002
- Checkout: http://localhost:3003

---

## Running Without Docker

### Step 1: Start MySQL (optional)
```bash
docker run -d --name shophub_mysql \
  -e MYSQL_ROOT_PASSWORD=password \
  -e MYSQL_DATABASE=shophub \
  -p 3306:3306 \
  mysql:8.0

# Initialize schema
docker exec -i shophub_mysql mysql -uroot -ppassword shophub < schema.sql
```
*If MySQL is not running, services use in-memory storage.*

### Step 2: Start Services
```bash
# Terminal 1 - Catalog Service
cd catalog-service && npm install && npm start

# Terminal 2 - Landing Service
cd landing-service && npm install && npm start

# Terminal 3 - Cart Service
cd cart-service && npm install && npm start

# Terminal 4 - Checkout Service
cd checkout-service && npm install && npm start
```

### Access URLs
- Landing/Auth: http://localhost:3000
- Catalog: http://localhost:3001
- Cart: http://localhost:3002
- Checkout: http://localhost:3003

---

## API Endpoints

**Authentication (port 3000):**
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

**Catalog (port 3001):**
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID

**Cart (port 3002):**
- `GET /api/cart/:userId` - Get user's cart
- `POST /api/cart/:userId/items` - Add item to cart
- `DELETE /api/cart/:userId/items/:itemId` - Remove item
- `DELETE /api/cart/:userId` - Clear cart

**Orders (port 3003):**
- `GET /api/checkout/orders/:userId` - Get user's orders
- `GET /api/checkout/order/:orderId` - Get order details
- `POST /api/checkout/session/:userId/checkout` - Place order

---

## Installing Traefik

 helm repo add traefik https://helm.traefik.io/traefik
helm repo update

  helm install traefik traefik/traefik \
    --set service.type=NodePort \
    --set service.nodePorts.http=30080 \
    --set additionalArguments={--log.level=INFO}

## Notes
- Services fallback to in-memory storage if MySQL is unavailable
- With MySQL: data persists across restarts
- Without MySQL: data is lost on service restart

