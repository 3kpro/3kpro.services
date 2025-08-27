const path = require('path');
const express = require('express');
const fs = require('fs');

// Create Express app
const app = express();

// Global error handlers to surface crashes during development
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception: - index.js:10', err && (err.stack || err.message || err));
});
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection: - index.js:13', reason && (reason.stack || reason.message || reason));
});

// Configuration
const PORT = process.env.PORT || 3000;
const SITES_DIR = path.join(__dirname, 'sites');

// Helper: site enabled state is controlled with a marker file `.disabled` in the site folder.
function isSiteEnabled(siteName) {
  try {
    const disabledPath = path.join(SITES_DIR, siteName, '.disabled');
    return !fs.existsSync(disabledPath);
  } catch (e) {
    return false;
  }
}

// admin UI static
app.use('/admin', express.static(path.join(__dirname, 'admin', 'public')));
app.use(express.json());

// Admin API: list sites and toggle enable state
app.get('/admin/api/sites', (req, res) => {
  try {
    const entries = fs.readdirSync(SITES_DIR, { withFileTypes: true });
    const sites = entries.filter(e => e.isDirectory()).map(dir => {
      const name = dir.name;
      const hasPublic = fs.existsSync(path.join(SITES_DIR, name, 'public'));
      const hasApp = fs.existsSync(path.join(SITES_DIR, name, 'app.js'));
      return { name, hasPublic, hasApp, enabled: isSiteEnabled(name) };
    });
    res.json(sites);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.post('/admin/api/sites/:name/enable', (req, res) => {
  const name = req.params.name;
  const enabled = !!req.body.enabled;
  const sitePath = path.join(SITES_DIR, name);
  try {
    if (!fs.existsSync(sitePath)) return res.status(404).json({ error: 'site not found' });
    const marker = path.join(sitePath, '.disabled');
    if (enabled) {
      if (fs.existsSync(marker)) fs.unlinkSync(marker);
    } else {
      fs.writeFileSync(marker, 'disabled');
    }
    return res.json({ name, enabled: isSiteEnabled(name) });
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
});

// Simple request logger
app.use((req, res, next) => {
  console.log(new Date().toISOString(), req.method, req.url);
  next();
});

// Health endpoint
app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// Serve a list of sites (index)
app.get('/', (req, res) => {
  res.send(`
    <h1>3kpro Webserver</h1>
    <p>Hosted sites/apps:</p>
    <ul>
      <li><a href="/site/example-static">Example Static Site</a></li>
      <li><a href="/app/example-express">Example Express App</a></li>
    </ul>
    <p>Health: <a href="/health">/health</a></p>
  `);
});

// Mount static sites under /site/:name -> serves from sites/:name/public
app.use('/site/:name', (req, res, next) => {
  const siteName = req.params.name;
  // check enabled
  if (!isSiteEnabled(siteName)) return res.status(404).send('<h1>Site disabled</h1>');
  const sitePath = path.join(SITES_DIR, siteName, 'public');
  express.static(sitePath)(req, res, (err) => {
    if (err) return next(err);
    // If no static file matched, fallthrough to next so we can return 404
    next();
  });
});

// Example pattern to mount small express apps located in sites/:name/app.js
app.use('/app/:name', (req, res, next) => {
  const name = req.params.name;
  const appModulePath = path.join(SITES_DIR, name, 'app.js');

  // If the file doesn't exist, just continue to 404
  if (!fs.existsSync(appModulePath)) {
    return next();
  }
  // check enabled
  if (!isSiteEnabled(name)) return res.status(404).send('<h1>Site disabled</h1>');

  try {
    // Clear from require cache so edits are picked up during development
    try {
      const resolved = require.resolve(appModulePath);
      delete require.cache[resolved];
    } catch (resolveErr) {
      // unlikely if existsSync passed, but handle defensively
      console.warn('Warning: could not resolve module - index.js:122', appModulePath, resolveErr.message);
    }

    const siteApp = require(appModulePath);
    // If the module exports an express.Router or app, delegate to it.
    if (typeof siteApp === 'function') {
      return siteApp(req, res, next);
    }
    // Not a function — continue to 404
    console.warn(`Module ${appModulePath} did not export a function/router - index.js:131`);
    return next();
  } catch (err) {
    // Log error and return 500 for visibility rather than crashing the whole process
    console.error(`Error loading site app for '${name}' from ${appModulePath}: - index.js:135`, err.stack || err.message || err);
    return res.status(500).send('Site app error');
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).send('<h1>404 Not Found</h1><p>Site or app not found.</p>');
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error: - index.js:147', err);
  res.status(500).send('Server error');
});

// Start server
app.listen(PORT, () => {
  console.log(`3kpro webserver listening on http://localhost:${PORT} - index.js:153`);
});
