-- Fix MySQL root authentication
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '';
FLUSH PRIVILEGES;

-- Show current user authentication methods
SELECT user, host, plugin, authentication_string FROM mysql.user WHERE user = 'root';