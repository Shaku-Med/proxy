const express = require('express');
const axios = require('axios');
const url = require('url');

const app = express();

app.use(express.json());

app.use('/p/*', async (req, res) => {
  try {
    // Extract the target URL from the request path
    const targetUrl = req.path.slice('/p/'.length); // Remove the "/p/" part

    // Make sure the target URL is properly formatted
    const fullUrl = `https://${targetUrl}`;

    // Determine the HTTP method and headers
    const method = req.method.toLowerCase();
    const headers = { ...req.headers };
    delete headers.host; // Remove the host header to avoid conflicts

    // Make the request using axios
    const axiosConfig = {
      method: method,
      url: fullUrl,
      headers: headers,
      data: req.body // Include the request body for POST/PUT requests
    };

    const response = await axios(axiosConfig);

    // Send back the response data
    res.status(response.status).set(response.headers).send(response.data);
  } catch (error) {
    // Handle errors here
    console.error('Proxy error:', error);
    const status = error.response ? error.response.status : 500;
    const message = error.response ? error.response.data : 'Something went wrong.';
    res.status(status).send(message);
  }
});

// Start the server on port 3000
app.listen(3000, () => {
  console.log('Proxy server is running on http://localhost:3000');
});
