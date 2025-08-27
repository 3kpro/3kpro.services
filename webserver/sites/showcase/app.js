const express = require('express');
const router = express.Router();

// Current time in a nice format
function getCurrentTime() {
    return new Date().toLocaleString();
}

// Root endpoint - handles the /app/showcase/ path
router.get('/', (req, res) => {
    res.redirect('/app/showcase/api/info');
});

// Simple hello endpoint
router.get('/api/hello', (req, res) => {
    res.json({
        message: 'Hello from the Showcase API!',
        time: getCurrentTime(),
        status: 'success'
    });
});

// Info endpoint with more details
router.get('/api/info', (req, res) => {
    res.send(`
        <html>
        <head>
            <title>API Information</title>
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 20px;
                }
                h1 {
                    color: #35424a;
                    border-bottom: 2px solid #e8491d;
                    padding-bottom: 10px;
                }
                .endpoint {
                    background: #f4f4f4;
                    padding: 15px;
                    margin-bottom: 15px;
                    border-left: 5px solid #e8491d;
                }
                code {
                    background: #e8e8e8;
                    padding: 2px 5px;
                    border-radius: 3px;
                }
                a {
                    display: inline-block;
                    background: #35424a;
                    color: white;
                    padding: 8px 16px;
                    text-decoration: none;
                    border-radius: 4px;
                    margin-top: 20px;
                }
                a:hover {
                    background: #e8491d;
                }
            </style>
        </head>
        <body>
            <h1>API Information</h1>
            <p>This page describes the available API endpoints for the Showcase example.</p>
            
            <div class="endpoint">
                <h2>GET /app/showcase/api/hello</h2>
                <p>Returns a simple greeting message with the current time.</p>
                <p><strong>Response Format:</strong></p>
                <pre><code>{
  "message": "Hello from the Showcase API!",
  "time": "${getCurrentTime()}",
  "status": "success"
}</code></pre>
                <p><a href="/app/showcase/api/hello" target="_blank">Try it</a></p>
            </div>
            
            <div class="endpoint">
                <h2>GET /app/showcase/api/time</h2>
                <p>Returns the current server time in different formats.</p>
                <p><strong>Response Format:</strong></p>
                <pre><code>{
  "iso": "2025-08-26T23:15:30.123Z",
  "local": "${getCurrentTime()}",
  "unix": ${Date.now()}
}</code></pre>
                <p><a href="/app/showcase/api/time" target="_blank">Try it</a></p>
            </div>
            
            <div class="endpoint">
                <h2>GET /app/showcase/api/echo</h2>
                <p>Echoes back any query parameters sent to it.</p>
                <p><strong>Example:</strong> <code>/app/showcase/api/echo?name=John&age=25</code></p>
                <p><a href="/app/showcase/api/echo?message=Hello&from=Showcase" target="_blank">Try it</a></p>
            </div>
            
            <p><a href="/site/showcase/" style="margin-right: 10px;">Back to Showcase Home</a></p>
        </body>
        </html>
    `);
});

// Time endpoint with different formats
router.get('/api/time', (req, res) => {
    const now = new Date();
    
    res.json({
        iso: now.toISOString(),
        local: now.toLocaleString(),
        unix: now.getTime()
    });
});

// Echo endpoint that returns query parameters
router.get('/api/echo', (req, res) => {
    res.json({
        params: req.query,
        method: req.method,
        path: req.path,
        received: getCurrentTime()
    });
});

module.exports = router;
