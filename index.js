const http = require('http');
const httpProxy = require('http-proxy');
const url = require('url');

// Create a proxy server
const proxy = httpProxy.createProxyServer({});

// Create an HTTP server that listens for incoming requests and forwards them to the target
const server = http.createServer((req, res) => {
  // Parse the incoming request URL
  const parsedUrl = url.parse(req.url);
  const pathname = parsedUrl.pathname;

  // Check if the request URL starts with "/p/"
  if (pathname.startsWith('/p/')) {
    // Extract the target URL from the path
    const targetUrl = pathname.slice(3); // Remove the "/p/" part

    // Forward the request to the target
    proxy.web(req, res, { target: targetUrl }, (err) => {
      // Handle errors here
      console.error('Proxy error:', err);
      res.writeHead(500, {
        'Content-Type': 'text/plain'
      });
      res.end('Something went wrong.');
    });
  } else {
    // Handle invalid proxy path
    res.writeHead(400, {
      'Content-Type': 'text/plain'
    });
    res.end('Invalid proxy path. Use /p/{target-url}');
  }
});

// Start the server on port 3000
server.listen(3000, () => {
  console.log('Proxy server is running on http://localhost:3000');
});
