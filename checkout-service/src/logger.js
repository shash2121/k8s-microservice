// Simple JSON logger for checkout-service
const { v4: uuidv4 } = require('uuid');

function log(level, message, meta = {}) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    service: 'checkout-service',
    message,
    ...meta
  };
  console.log(JSON.stringify(logEntry));
}

function info(message, meta = {}) {
  log('info', message, meta);
}

function error(message, meta = {}) {
  log('error', message, meta);
}

function warn(message, meta = {}) {
  log('warn', message, meta);
}

function debug(message, meta = {}) {
  if (process.env.NODE_ENV === 'development') {
    log('debug', message, meta);
  }
}

module.exports = {
  info,
  error,
  warn,
  debug
};