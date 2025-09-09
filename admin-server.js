const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Database connection
const dbPath = path.join(__dirname, 'database', 'gkicks.db');
const db = new sqlite3.Database(dbPath);

// Serve admin interface
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>GKicks Admin - Database Manager</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                padding: 20px;
            }
            .container {
                max-width: 1200px;
                margin: 0 auto;
                background: white;
                border-radius: 15px;
                box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                overflow: hidden;
            }
            .header {
                background: linear-gradient(135deg, #2c3e50, #3498db);
                color: white;
                padding: 30px;
                text-align: center;
            }
            .header h1 {
                font-size: 2.5rem;
                margin-bottom: 10px;
            }
            .header p {
                opacity: 0.9;
                font-size: 1.1rem;
            }
            .nav {
                background: #34495e;
                padding: 0;
                display: flex;
                flex-wrap: wrap;
            }
            .nav-item {
                flex: 1;
                min-width: 150px;
            }
            .nav-item button {
                width: 100%;
                padding: 15px 20px;
                background: transparent;
                color: white;
                border: none;
                cursor: pointer;
                transition: all 0.3s ease;
                font-size: 1rem;
            }
            .nav-item button:hover {
                background: #2c3e50;
            }
            .nav-item button.active {
                background: #3498db;
            }
            .content {
                padding: 30px;
                min-height: 500px;
            }
            .table-container {
                overflow-x: auto;
                margin-top: 20px;
            }
            table {
                width: 100%;
                border-collapse: collapse;
                background: white;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            }
            th, td {
                padding: 12px 15px;
                text-align: left;
                border-bottom: 1px solid #eee;
            }
            th {
                background: #f8f9fa;
                font-weight: 600;
                color: #2c3e50;
            }
            tr:hover {
                background: #f8f9fa;
            }
            .btn {
                padding: 8px 16px;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-size: 0.9rem;
                margin: 2px;
                transition: all 0.3s ease;
            }
            .btn-primary {
                background: #3498db;
                color: white;
            }
            .btn-primary:hover {
                background: #2980b9;
            }
            .btn-danger {
                background: #e74c3c;
                color: white;
            }
            .btn-danger:hover {
                background: #c0392b;
            }
            .btn-success {
                background: #27ae60;
                color: white;
            }
            .btn-success:hover {
                background: #229954;
            }
            .form-group {
                margin-bottom: 15px;
            }
            .form-group label {
                display: block;
                margin-bottom: 5px;
                font-weight: 600;
                color: #2c3e50;
            }
            .form-group input, .form-group textarea, .form-group select {
                width: 100%;
                padding: 10px;
                border: 2px solid #ddd;
                border-radius: 5px;
                font-size: 1rem;
                transition: border-color 0.3s ease;
            }
            .form-group input:focus, .form-group textarea:focus, .form-group select:focus {
                outline: none;
                border-color: #3498db;
            }
            .loading {
                text-align: center;
                padding: 50px;
                color: #7f8c8d;
            }
            .error {
                background: #e74c3c;
                color: white;
                padding: 15px;
                border-radius: 5px;
                margin: 10px 0;
            }
            .success {
                background: #27ae60;
                color: white;
                padding: 15px;
                border-radius: 5px;
                margin: 10px 0;
            }
            .stats {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 20px;
                margin-bottom: 30px;
            }
            .stat-card {
                background: linear-gradient(135deg, #667eea, #764ba2);
                color: white;
                padding: 25px;
                border-radius: 10px;
                text-align: center;
            }
            .stat-card h3 {
                font-size: 2rem;
                margin-bottom: 10px;
            }
            .stat-card p {
                opacity: 0.9;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🛍️ GKicks Admin</h1>
                <p>Database Management System</p>
            </div>
            <div class="nav">
                <div class="nav-item">
                    <button onclick="showDashboard()" class="active" id="dashboard-btn">Dashboard</button>
                </div>
                <div class="nav-item">
                    <button onclick="showTable('products')" id="products-btn">Products</button>
                </div>
                <div class="nav-item">
                    <button onclick="showTable('users')" id="users-btn">Users</button>
                </div>
                <div class="nav-item">
                    <button onclick="showTable('orders')" id="orders-btn">Orders</button>
                </div>
                <div class="nav-item">
                    <button onclick="showTable('cart')" id="cart-btn">Cart</button>
                </div>
                <div class="nav-item">
                    <button onclick="showSQL()" id="sql-btn">SQL Query</button>
                </div>
            </div>
            <div class="content" id="content">
                <div class="loading">Loading dashboard...</div>
            </div>
        </div>

        <script>
            let currentTable = '';
            
            // Set active navigation
            function setActiveNav(activeId) {
                document.querySelectorAll('.nav-item button').forEach(btn => {
                    btn.classList.remove('active');
                });
                document.getElementById(activeId).classList.add('active');
            }

            // Show dashboard
            async function showDashboard() {
                setActiveNav('dashboard-btn');
                const content = document.getElementById('content');
                content.innerHTML = '<div class="loading">Loading dashboard...</div>';
                
                try {
                    const response = await fetch('/api/dashboard');
                    const data = await response.json();
                    
                    content.innerHTML = \`
                        <h2>📊 Dashboard Overview</h2>
                        <div class="stats">
                            <div class="stat-card">
                                <h3>\${data.products || 0}</h3>
                                <p>Total Products</p>
                            </div>
                            <div class="stat-card">
                                <h3>\${data.users || 0}</h3>
                                <p>Total Users</p>
                            </div>
                            <div class="stat-card">
                                <h3>\${data.orders || 0}</h3>
                                <p>Total Orders</p>
                            </div>
                            <div class="stat-card">
                                <h3>\${data.cart_items || 0}</h3>
                                <p>Cart Items</p>
                            </div>
                        </div>
                        <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-top: 20px;">
                            <h3>🚀 Quick Actions</h3>
                            <button class="btn btn-primary" onclick="showTable('products')">Manage Products</button>
                            <button class="btn btn-success" onclick="importSampleData()">Import Sample Data</button>
                            <button class="btn btn-primary" onclick="showSQL()">Run SQL Query</button>
                        </div>
                    \`;
                } catch (error) {
                    content.innerHTML = '<div class="error">Error loading dashboard: ' + error.message + '</div>';
                }
            }

            // Show table data
            async function showTable(tableName) {
                setActiveNav(tableName + '-btn');
                currentTable = tableName;
                const content = document.getElementById('content');
                content.innerHTML = '<div class="loading">Loading ' + tableName + '...</div>';
                
                try {
                    const response = await fetch('/api/table/' + tableName);
                    const data = await response.json();
                    
                    let html = \`<h2>📋 \${tableName.charAt(0).toUpperCase() + tableName.slice(1)} Management</h2>\`;
                    
                    if (data.length === 0) {
                        html += '<p>No data found in this table.</p>';
                    } else {
                        html += '<div class="table-container"><table><thead><tr>';
                        
                        // Table headers
                        Object.keys(data[0]).forEach(key => {
                            html += \`<th>\${key}</th>\`;
                        });
                        html += '<th>Actions</th></tr></thead><tbody>';
                        
                        // Table rows
                        data.forEach(row => {
                            html += '<tr>';
                            Object.values(row).forEach(value => {
                                html += \`<td>\${value || ''}</td>\`;
                            });
                            html += \`<td>
                                <button class="btn btn-danger" onclick="deleteRecord('\${tableName}', \${row.id})">Delete</button>
                            </td></tr>\`;
                        });
                        
                        html += '</tbody></table></div>';
                    }
                    
                    content.innerHTML = html;
                } catch (error) {
                    content.innerHTML = '<div class="error">Error loading table: ' + error.message + '</div>';
                }
            }

            // Show SQL interface
            function showSQL() {
                setActiveNav('sql-btn');
                const content = document.getElementById('content');
                content.innerHTML = \`
                    <h2>💻 SQL Query Interface</h2>
                    <div class="form-group">
                        <label for="sql-query">Enter SQL Query:</label>
                        <textarea id="sql-query" rows="6" placeholder="SELECT * FROM products LIMIT 10;"></textarea>
                    </div>
                    <button class="btn btn-primary" onclick="executeSQL()">Execute Query</button>
                    <div id="sql-result" style="margin-top: 20px;"></div>
                \`;
            }

            // Execute SQL query
            async function executeSQL() {
                const query = document.getElementById('sql-query').value;
                const resultDiv = document.getElementById('sql-result');
                
                if (!query.trim()) {
                    resultDiv.innerHTML = '<div class="error">Please enter a SQL query.</div>';
                    return;
                }
                
                resultDiv.innerHTML = '<div class="loading">Executing query...</div>';
                
                try {
                    const response = await fetch('/api/sql', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ query })
                    });
                    
                    const data = await response.json();
                    
                    if (data.error) {
                        resultDiv.innerHTML = '<div class="error">Error: ' + data.error + '</div>';
                        return;
                    }
                    
                    if (data.length === 0) {
                        resultDiv.innerHTML = '<div class="success">Query executed successfully. No results returned.</div>';
                        return;
                    }
                    
                    let html = '<div class="success">Query executed successfully!</div><div class="table-container"><table><thead><tr>';
                    
                    // Table headers
                    Object.keys(data[0]).forEach(key => {
                        html += \`<th>\${key}</th>\`;
                    });
                    html += '</tr></thead><tbody>';
                    
                    // Table rows
                    data.forEach(row => {
                        html += '<tr>';
                        Object.values(row).forEach(value => {
                            html += \`<td>\${value || ''}</td>\`;
                        });
                        html += '</tr>';
                    });
                    
                    html += '</tbody></table></div>';
                    resultDiv.innerHTML = html;
                    
                } catch (error) {
                    resultDiv.innerHTML = '<div class="error">Error executing query: ' + error.message + '</div>';
                }
            }

            // Delete record
            async function deleteRecord(tableName, id) {
                if (!confirm('Are you sure you want to delete this record?')) {
                    return;
                }
                
                try {
                    const response = await fetch(\`/api/delete/\${tableName}/\${id}\`, {
                        method: 'DELETE'
                    });
                    
                    const result = await response.json();
                    
                    if (result.success) {
                        showTable(tableName); // Refresh table
                    } else {
                        alert('Error deleting record: ' + result.error);
                    }
                } catch (error) {
                    alert('Error deleting record: ' + error.message);
                }
            }

            // Import sample data
            async function importSampleData() {
                if (!confirm('This will add sample data to your database. Continue?')) {
                    return;
                }
                
                try {
                    const response = await fetch('/api/import-sample', {
                        method: 'POST'
                    });
                    
                    const result = await response.json();
                    
                    if (result.success) {
                        alert('Sample data imported successfully!');
                        showDashboard();
                    } else {
                        alert('Error importing sample data: ' + result.error);
                    }
                } catch (error) {
                    alert('Error importing sample data: ' + error.message);
                }
            }

            // Initialize dashboard on load
            window.onload = function() {
                showDashboard();
            };
        </script>
    </body>
    </html>
  `);
});

// API Routes

// Dashboard stats
app.get('/api/dashboard', (req, res) => {
  const stats = {};
  
  const queries = [
    { key: 'products', sql: 'SELECT COUNT(*) as count FROM products' },
    { key: 'users', sql: 'SELECT COUNT(*) as count FROM users' },
    { key: 'orders', sql: 'SELECT COUNT(*) as count FROM orders' },
    { key: 'cart_items', sql: 'SELECT COUNT(*) as count FROM cart' }
  ];
  
  let completed = 0;
  
  queries.forEach(query => {
    db.get(query.sql, (err, row) => {
      if (!err && row) {
        stats[query.key] = row.count;
      } else {
        stats[query.key] = 0;
      }
      
      completed++;
      if (completed === queries.length) {
        res.json(stats);
      }
    });
  });
});

// Get table data
app.get('/api/table/:tableName', (req, res) => {
  const tableName = req.params.tableName;
  const allowedTables = ['products', 'users', 'orders', 'order_items', 'cart', 'wishlist'];
  
  if (!allowedTables.includes(tableName)) {
    return res.status(400).json({ error: 'Invalid table name' });
  }
  
  db.all(`SELECT * FROM ${tableName} LIMIT 100`, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });
});

// Execute SQL query
app.post('/api/sql', (req, res) => {
  const { query } = req.body;
  
  if (!query) {
    return res.status(400).json({ error: 'No query provided' });
  }
  
  // Basic security check - only allow SELECT, INSERT, UPDATE, DELETE
  const trimmedQuery = query.trim().toUpperCase();
  const allowedCommands = ['SELECT', 'INSERT', 'UPDATE', 'DELETE'];
  const isAllowed = allowedCommands.some(cmd => trimmedQuery.startsWith(cmd));
  
  if (!isAllowed) {
    return res.status(400).json({ error: 'Only SELECT, INSERT, UPDATE, DELETE queries are allowed' });
  }
  
  db.all(query, (err, rows) => {
    if (err) {
      res.json({ error: err.message });
    } else {
      res.json(rows || []);
    }
  });
});

// Delete record
app.delete('/api/delete/:tableName/:id', (req, res) => {
  const { tableName, id } = req.params;
  const allowedTables = ['products', 'users', 'orders', 'order_items', 'cart', 'wishlist'];
  
  if (!allowedTables.includes(tableName)) {
    return res.status(400).json({ error: 'Invalid table name' });
  }
  
  db.run(`DELETE FROM ${tableName} WHERE id = ?`, [id], function(err) {
    if (err) {
      res.json({ success: false, error: err.message });
    } else {
      res.json({ success: true, changes: this.changes });
    }
  });
});

// Import sample data
app.post('/api/import-sample', (req, res) => {
  const sampleProducts = [
    {
      name: 'Air Jordan 1 Retro High',
      brand: 'Nike',
      description: 'Classic basketball shoe with premium leather upper',
      price: 170.00,
      original_price: 170.00,
      image_url: 'https://via.placeholder.com/400x400?text=Air+Jordan+1',
      rating: 4.8,
      reviews: 1250,
      colors: JSON.stringify(['Black/Red', 'White/Black', 'Royal Blue']),
      category: 'unisex',
      stock_quantity: 50,
      sku: 'AJ1-001',
      is_featured_on_homepage: true
    },
    {
      name: 'Adidas Ultraboost 22',
      brand: 'Adidas',
      description: 'Premium running shoe with Boost technology',
      price: 190.00,
      original_price: 190.00,
      image_url: 'https://via.placeholder.com/400x400?text=Ultraboost+22',
      rating: 4.6,
      reviews: 890,
      colors: JSON.stringify(['Core Black', 'Cloud White', 'Solar Red']),
      category: 'unisex',
      stock_quantity: 75,
      sku: 'UB22-001',
      is_featured_on_homepage: true
    },
    {
      name: 'Converse Chuck Taylor All Star',
      brand: 'Converse',
      description: 'Iconic canvas sneaker, timeless design',
      price: 65.00,
      original_price: 65.00,
      image_url: 'https://via.placeholder.com/400x400?text=Chuck+Taylor',
      rating: 4.4,
      reviews: 2100,
      colors: JSON.stringify(['Black', 'White', 'Red', 'Navy']),
      category: 'unisex',
      stock_quantity: 100,
      sku: 'CT-001',
      is_featured_on_homepage: false
    }
  ];
  
  let completed = 0;
  let errors = [];
  
  sampleProducts.forEach((product, index) => {
    const sql = `INSERT INTO products (name, brand, description, price, original_price, image_url, rating, reviews, colors, category, stock_quantity, sku, is_featured_on_homepage) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    
    const values = [
      product.name, product.brand, product.description, product.price, product.original_price,
      product.image_url, product.rating, product.reviews, product.colors, product.category,
      product.stock_quantity, product.sku, product.is_featured_on_homepage
    ];
    
    db.run(sql, values, function(err) {
      if (err && !err.message.includes('UNIQUE constraint failed')) {
        errors.push(`Product ${index + 1}: ${err.message}`);
      }
      
      completed++;
      if (completed === sampleProducts.length) {
        if (errors.length > 0) {
          res.json({ success: false, error: errors.join('; ') });
        } else {
          res.json({ success: true, message: 'Sample data imported successfully' });
        }
      }
    });
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 GKicks Admin Server running at http://localhost:${PORT}`);
  console.log('📊 Database Management Interface Available');
  console.log('🛍️ Manage your GKicks store data easily!');
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down admin server...');
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err);
    } else {
      console.log('Database connection closed.');
    }
    process.exit(0);
  });
});