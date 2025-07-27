-- Prayer Requests Database Setup
-- Run this script in your MariaDB/MySQL database

CREATE DATABASE IF NOT EXISTS prayer_requests CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE prayer_requests;

-- Table for prayer requests
CREATE TABLE IF NOT EXISTS prayers (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL DEFAULT 'Anonymous',
    text TEXT NOT NULL,
    prayed_for BOOLEAN DEFAULT FALSE,
    archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    archived_at TIMESTAMP NULL,
    archived_by VARCHAR(255) NULL
);

-- Index for performance
CREATE INDEX idx_prayers_created_at ON prayers(created_at);
CREATE INDEX idx_prayers_archived ON prayers(archived);
CREATE INDEX idx_prayers_prayed_for ON prayers(prayed_for);

-- Insert sample data (optional)
INSERT INTO prayers (id, name, text, prayed_for, created_at) VALUES 
    (UUID(), 'John Smith', 'Please pray for my family during this difficult time.', FALSE, NOW()),
    (UUID(), 'Anonymous', 'Pray for healing and strength.', TRUE, NOW() - INTERVAL 1 DAY),
    (UUID(), 'Mary Johnson', 'Thanksgiving for blessings received.', FALSE, NOW() - INTERVAL 2 DAY);
