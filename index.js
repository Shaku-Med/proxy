const http = require('http');
const httpProxy = require('http-proxy');

// Create a proxy server
const proxy = httpProxy.createProxyServer({});

// Create an HTTP server that listens for incoming requests and forwards them to the target
const server = http.createServer((req, res) => {
  // Define the target you want to proxy to
  const target = 'http://example.com';

  // Forward the request to the target
  proxy.web(req, res, { target: target }, (err) => {
    // Handle errors here
    console.error('Proxy error:', err);
    res.writeHead(500, {
      'Content-Type': 'text/plain'
    });
    res.end('Something went wrong.');
  });
});

// Start the server on port 3000
server.listen(3000, () => {
  console.log('Proxy server is running on http://localhost:3000');
});
