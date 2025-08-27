const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from MCP Server!' });
});

app.listen(port, () => {
  console.log(`MCP Server running at http://localhost:${port}`);
});
