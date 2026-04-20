# RabbitMQ Integration Setup Guide

This guide explains how to set up RabbitMQ for your microservices application running locally via Docker.

## Prerequisites

- Docker and Docker Compose installed
- Node.js and npm installed (for local development)

## Step 1: Start RabbitMQ Container

Run the following command from the `microservices` directory:

```bash
docker-compose up -d rabbitmq
```

This starts the RabbitMQ container with:
- **AMQP port:** `5672`
- **Management UI:** `http://localhost:15672`
- **Default credentials:** `guest` / `guest`

## Step 2: Verify RabbitMQ is Running

Check the container status:

```bash
docker ps | grep shophub_rabbitmq
```

Access the management UI at: `http://localhost:15672` (login: `guest` / `guest`)

## Step 3: Install amqplib in Each Service

### Catalog Service

```bash
cd microservices/catalog-service
npm install amqplib
```

### Cart Service

```bash
cd microservices/cart-service
npm install amqplib
```

### Checkout Service

```bash
cd microservices/checkout-service
npm install amqplib
```

## Step 4: Configure Services to Use RabbitMQ

Each service now has a `src/config/rabbitmq.js` helper file that:
- Connects to RabbitMQ using the `RABBIT_URL` environment variable
- Provides `publishMessage()`, `assertQueue()`, and `consumeMessage()` utilities
- Handles reconnection automatically

The `RABBIT_URL=amqp://rabbitmq` environment variable is already configured in `docker-compose.yml` for all services.

## Step 5: Test the Connection

### Option A: Using Docker Compose

Start all services together:

```bash
docker-compose up -d
```

Check the logs for RabbitMQ connection confirmation:

```bash
docker logs shophub_catalog | grep "RabbitMQ connected"
docker logs shophub_cart | grep "RabbitMQ connected"
docker logs shophub_checkout | grep "RabbitMQ connected"
```

### Option B: Running Services Locally

If running services locally (not in Docker), ensure your `.env` file contains:

```
RABBIT_URL=amqp://localhost
```

## Step 6: Publish and Consume Messages

### Publishing Messages

```javascript
const { publishMessage } = require('./config/rabbitmq');

// Example: Publish a product event
await publishMessage('product.events', 'product.created', {
  id: '1',
  name: 'New Product',
  price: 99.99
});
```

### Consuming Messages

```javascript
const { assertQueue, consumeMessage } = require('./config/rabbitmq');

// Example: Consume product events
await assertQueue('product-queue', 'product.created', 'product.events');
await consumeMessage('product-queue', async (message) => {
  console.log('Received product event:', message);
  // Process the message
});
```

## Step 7: Verify in RabbitMQ Management UI

1. Open `http://localhost:15672`
2. Login with `guest` / `guest`
3. Navigate to the **Exchanges** tab
4. Look for `product.events`, `cart.events`, and `order.events`
5. Check the **Queues** tab for your consumer queues

## Troubleshooting

### Connection Refused

If you see "Connection refused" errors:
1. Ensure RabbitMQ container is running: `docker ps | grep rabbitmq`
2. Check container logs: `docker logs shophub_rabbitmq`
3. Verify the `RABBIT_URL` environment variable is set correctly

### Authentication Errors

If you see authentication errors:
1. Verify the RabbitMQ credentials in `docker-compose.yml`
2. Check that the `RABBIT_URL` matches the expected format: `amqp://guest:guest@rabbitmq:5672`

### Messages Not Being Consumed

If messages are published but not consumed:
1. Verify the queue name matches in both publisher and consumer
2. Check the routing key matches the binding
3. Review the consumer logs for errors

## Next Steps

- Implement event publishing in your service routes
- Create consumer services for order processing, email notifications, etc.
- Add message acknowledgment and error handling
- Consider adding dead letter queues for failed messages

## Resources

- [RabbitMQ Documentation](https://www.rabbitmq.com/documentation.html)
- [amqplib Documentation](https://github.com/amqp-node/amqplib)
- [RabbitMQ Management UI](http://localhost:15672)
