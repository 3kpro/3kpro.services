const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.send(`
    <h1>Example Express App</h1>
    <p>This small app is mounted at <code>/app/example-express</code>.</p>
    <p>Try <a href="/app/example-express/hello">/hello</a></p>
  `);
});

router.get('/hello', (req, res) => {
  res.json({ message: 'Hello from example-express app', time: new Date().toISOString() });
});

module.exports = router;
