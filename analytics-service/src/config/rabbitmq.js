const amqp = require('amqplib');
const RABBIT_URL = process.env.RABBIT_URL || 'amqp://localhost';
let channel = null;
let connection = null;

async function connect() {
  if (connection) return connection;
  try {
    connection = await amqp.connect(RABBIT_URL);
    console.log('🐰 RabbitMQ connected successfully (analytics)');
    connection.on('error', (err) => {
      console.error('RabbitMQ connection error (analytics):', err.message);
    });
    connection.on('close', () => {
      console.log('RabbitMQ connection closed, attempting to reconnect (analytics)...');
      connection = null;
      channel = null;
      setTimeout(connect, 5000);
    });
    return connection;
  } catch (error) {
    console.error('Failed to connect to RabbitMQ (analytics):', error.message);
    throw error;
  }
}

async function getChannel() {
  if (channel) return channel;
  const conn = await connect();
  channel = await conn.createChannel();
  channel.on('error', (err) => {
    console.error('RabbitMQ channel error (analytics):', err.message);
  });
  channel.on('close', () => {
    console.log('RabbitMQ channel closed (analytics)');
    channel = null;
  });
  return channel;
}

async function assertQueue(queueName, routingKey, exchange) {
  const ch = await getChannel();
  await ch.assertExchange(exchange, 'topic', { durable: true });
  await ch.assertQueue(queueName, { durable: true });
  await ch.bindQueue(queueName, exchange, routingKey);
  console.log(`[RabbitMQ] (analytics) Queue ${queueName} bound to ${exchange} with routing key ${routingKey}`);
  return queueName;
}

async function consumeMessage(queueName, handler) {
  const ch = await getChannel();
  await ch.consume(queueName, async (msg) => {
    if (msg) {
      try {
        const content = JSON.parse(msg.content.toString());
        await handler(content, msg);
        ch.ack(msg);
      } catch (error) {
        console.error('Error processing message (analytics):', error);
        ch.nack(msg, false, false);
      }
    }
  });
  console.log(`[RabbitMQ] (analytics) Consuming messages from queue: ${queueName}`);
}

module.exports = { connect, getChannel, assertQueue, consumeMessage };
