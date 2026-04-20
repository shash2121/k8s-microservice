const logger = require('./logger');
const { assertQueue, consumeMessage } = require('./config/rabbitmq');

const EXCHANGE = 'order.exchange';
const ROUTING_KEY = 'order.created';
const QUEUE_NAME = 'analytics.order.created';

async function start() {
  // Initialise DB connection
  await require('./config/database').initDatabase();
  try {
    await assertQueue(QUEUE_NAME, ROUTING_KEY, EXCHANGE);
    await consumeMessage(QUEUE_NAME, async (msg) => {
    // Store event in DB
    await require('./config/database').insertEvent({
      event_name: 'order.created',
      exchange_name: EXCHANGE,
      routing_key: ROUTING_KEY,
      payload: msg
    });
      // Log the analytics event
      logger.info('order.created event received', {
        orderId: msg.orderId,
        userId: msg.userId,
        total: msg.total,
        transactionId: msg.transactionId,
        items: msg.items
      });
      // Here you could add further processing (store in DB, send to external service, etc.)
    });
    logger.info('Analytics service started and listening for order.created events');
  } catch (err) {
    logger.error('Failed to start analytics service', { error: err.message, stack: err.stack });
    process.exit(1);
  }
}

start();
