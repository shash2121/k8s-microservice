CREATE DATABASE IF NOT EXISTS analytics;
USE analytics;

CREATE TABLE IF NOT EXISTS events (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  event_name VARCHAR(50) NOT NULL,
  exchange_name VARCHAR(100) NOT NULL,
  routing_key VARCHAR(100) NOT NULL,
  payload JSON NOT NULL,
  received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  order_id VARCHAR(36) NULL,
  user_id  VARCHAR(36) NULL,
  total_amount DECIMAL(12,2) NULL,
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMP NULL,
  processing_error TEXT NULL,
  CONSTRAINT uq_event_unique UNIQUE (event_name, exchange_name, routing_key, order_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
