const express = require("express");
const axios = require("axios");
const { URL } = require("url"); // Node.js URL module for parsing URLs
const cors = require('cors')

const app = express();

app.use(
    cors({
        origin: '*',
    })
);


const PORT = 3000;

// Middleware to parse JSON and urlencoded request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Define a route for proxying requests to a target URL
app.get("*", async(req, res) => {
    try {
        let u = req.url.split("/?proxy_med=")[1];
        if (u) {
            let ul = new URL(u);
            let response = await axios.get(u, {
                headers: {
                    referer: `${ul.origin}/`,
                },
                responseType: "arraybuffer", // Ensure axios treats the response as binary data
            });

            // Determine Content-Type dynamically based on response headers
            let contentType = response.headers["content-type"];
            if (contentType.startsWith("image/")) {
                res.setHeader("Content-Type", contentType); // Set Content-Type header for images
            } else if (contentType.startsWith("text/html")) {
                res.setHeader("Content-Type", "text/html"); // Set Content-Type header for HTML
            } else if (contentType.startsWith("application/javascript")) {
                res.setHeader("Content-Type", "application/javascript"); // Set Content-Type header for JavaScript
            } else if (contentType.startsWith("text/css")) {
                res.setHeader("Content-Type", "text/css"); // Set Content-Type header for CSS
            } else {
                res.setHeader("Content-Type", contentType); // Fallback to original Content-Type
            }

            res.send(response.data); // Send the data as response
        } else {
            res.status(400).send("Invalid URL");
        }
    } catch (e) {
        res.status(404).send("Internal Server Error");
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Proxy server is running on http://localhost:${PORT}`);
});