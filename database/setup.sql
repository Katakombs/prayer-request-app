-- Prayer Requests Database Setup
-- Run this script in your MariaDB/MySQL database

CREATE DATABASE IF NOT EXISTS prayer_requests CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE prayer_requests;

-- Table for prayer requests
CREATE TABLE IF NOT EXISTS prayers (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL DEFAULT 'Anonymous',
    text TEXT NOT NULL,
    prayer_count INT DEFAULT 0,
    archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    archived_at TIMESTAMP NULL,
    archived_by VARCHAR(255) NULL
);

-- Index for performance
CREATE INDEX idx_prayers_created_at ON prayers(created_at);
CREATE INDEX idx_prayers_archived ON prayers(archived);
CREATE INDEX idx_prayers_prayer_count ON prayers(prayer_count);

-- Insert sample data (optional)
INSERT INTO prayers (id, name, text, prayer_count, created_at) VALUES 
    (UUID(), 'John Smith', 'Please pray for my family during this difficult time.', 0, NOW()),
    (UUID(), 'Anonymous', 'Pray for healing and strength.', 3, NOW() - INTERVAL 1 DAY),
    (UUID(), 'Mary Johnson', 'Thanksgiving for blessings received.', 1, NOW() - INTERVAL 2 DAY);
