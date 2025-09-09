-- Add password reset tokens table for forgot password functionality
-- This table stores secure tokens for password reset requests

-- Create password reset tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    email VARCHAR(255) NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_token (token),
    INDEX idx_email (email),
    INDEX idx_expires_at (expires_at),
    INDEX idx_user_id (user_id)
);

-- Clean up expired tokens (optional - can be run periodically)
-- DELETE FROM password_reset_tokens WHERE expires_at < NOW() AND used_at IS NULL;