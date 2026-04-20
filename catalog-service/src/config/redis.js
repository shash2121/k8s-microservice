const Redis = require('ioredis');

const redisClient = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  maxRetriesPerRequest: 3,
  retryDelayOnFailover: 100,
  lazyConnect: true,
  enableOfflineQueue: false,
});

redisClient.on('connect', () => {
  console.log('📦 Redis connected for catalog-service');
});

redisClient.on('error', (err) => {
  console.error('Redis connection error:', err.message);
});

const cache = {
  async get(key) {
    try {
      const data = await redisClient.get(key);
      return data ? JSON.parse(data) : null;
    } catch (err) {
      console.error('Redis get error:', err.message);
      return null;
    }
  },

  async set(key, value, ttlSeconds = 300) {
    try {
      await redisClient.setex(key, ttlSeconds, JSON.stringify(value));
      return true;
    } catch (err) {
      console.error('Redis set error:', err.message);
      return false;
    }
  },

  async del(key) {
    try {
      await redisClient.del(key);
      return true;
    } catch (err) {
      console.error('Redis delete error:', err.message);
      return false;
    }
  },

  async delPattern(pattern) {
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(...keys);
      }
      return true;
    } catch (err) {
      console.error('Redis delete pattern error:', err.message);
      return false;
    }
  },

  async connect() {
    if (redisClient.status === 'wait') {
      await redisClient.connect();
    }
  },

  isReady() {
    return redisClient.status === 'ready';
  }
};

module.exports = { redisClient, cache };