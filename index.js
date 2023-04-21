// app.js

var express = require('express')
var Unblocker = require('unblocker');

// Create Express Server
var app = express();

// Create Unblocker Instance, and Configure Our Express Server to Use It
var unblocker = new Unblocker({ prefix: '/proxy/' });
app.use(unblocker);

app.use("*", (req, res) => {
    console.log("sup")
})

// Launches Server on Port 8080
app.listen(process.env.PORT || 8080).on('upgrade', unblocker.onUpgrade);
console.log("Node Unblocker Server Running On Port:", process.env.PORT || 8080)

