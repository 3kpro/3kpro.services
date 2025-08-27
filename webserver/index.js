const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    time: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Function to load site routes dynamically
function loadSiteRoutes() {
  const sitesDir = path.join(__dirname, 'sites');
  
  if (!fs.existsSync(sitesDir)) {
    console.log('Sites directory not found');
    return;
  }

  const sites = fs.readdirSync(sitesDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  sites.forEach(siteName => {
    const siteDir = path.join(sitesDir, siteName);
    const appFilePath = path.join(siteDir, 'app.js');
    const publicDir = path.join(siteDir, 'public');

    // Serve static files if public directory exists
    if (fs.existsSync(publicDir)) {
      app.use(`/site/${siteName}`, express.static(publicDir));
      console.log(`✅ Static site loaded: /site/${siteName} → ${publicDir}`);
    }

    // Load app routes if app.js exists
    if (fs.existsSync(appFilePath)) {
      try {
        // Clear require cache to allow hot reloading in development
        delete require.cache[require.resolve(appFilePath)];
        
        const siteRouter = require(appFilePath);
        app.use(`/app/${siteName}`, siteRouter);
        console.log(`✅ App routes loaded: /app/${siteName} → ${appFilePath}`);
      } catch (error) {
        console.error(`❌ Failed to load ${siteName} app routes:`, error.message);
      }
    }
  });
}

// Load all site routes
loadSiteRoutes();

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: '3KPro Webserver',
    version: '0.1.0',
    uptime: process.uptime(),
    sites: {
      static: 'Access static sites at /site/<sitename>',
      apps: 'Access dynamic apps at /app/<sitename>'
    },
    health: '/health'
  });
});

// Catch-all for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    message: 'Check /health for server status'
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message,
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 3KPro webserver listening on http://localhost:${PORT}`);
  console.log(`📁 Serving sites from: ${path.join(__dirname, 'sites')}`);
  console.log(`💚 Health check available at: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully');
  process.exit(0);
});
