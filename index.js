const express = require("express");
const axios = require("axios");
const { URL } = require("url");
const cors = require('cors')
const multer = require('multer');
const cheerio = require("cheerio");


const app = express();

app.use(
    cors({
        origin: '*',
    })
);

const upload = multer({
    storage: multer.memoryStorage(),
});

const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("*", async(req, res, next) => {
    try {
        let u = req.url.split("/?proxy_med=")[1];
        if (u) {
            let ul = new URL(u);
            let response = await axios.get(u, {
                headers: {
                    referer: `${ul.origin}/`,
                },
                responseType: "arraybuffer",
            });

            let contentType = response.headers["content-type"];
            if (contentType.startsWith("image/")) {
                res.setHeader("Content-Type", contentType);
            } else if (contentType.startsWith("text/html")) {
                res.setHeader("Content-Type", "text/html");
            } else if (contentType.startsWith("application/javascript")) {
                res.setHeader("Content-Type", "application/javascript");
            } else if (contentType.startsWith("text/css")) {
                res.setHeader("Content-Type", "text/css");
            } else {
                res.setHeader("Content-Type", contentType);
            }

            res.send(response.data);
        } else {
            if (req.url === '/fd') {
                next()
            } else if (req.url === `/all`) {
                next()
            } else {
                res.status(401).send(`This Enpoint has not been configured yet. Please try again later`)
            }
        }
    } catch (e) {
        res.status(404).send("Internal Server Error");
    }
});

let getTokenC = async() => {
    try {
        const response = await axios.get("https://age.toolpie.com");
        const $ = cheerio.load(response.data);
        const tokenValue = $('input[name="_token"]').val();
        const cookies = response.headers["set-cookie"];
        return { cookies, token: tokenValue }
    } catch {
        return null
    }
}

app.post(`/fd`, (req, res) => {
    try {
        upload.single(`file`)(req, null, async(err) => {
            if (err) req.destroy()
            try {
                let file = req.file
                let que = req.query
                    // 
                let iv = await getTokenC()
                if (iv) {
                    let formdata = new FormData()
                    formdata.append('picture', new Blob([file.buffer]), { filename: file.originalname });
                    formdata.append('_token', iv.token)
                        // 
                    const axiosConfig = {
                        Cookie: iv.cookies.join('; '),
                        'referer': 'https://age.toolpie.com/',
                        // 'origin': 'https://age.toolpie.com',
                    };
                    const response = await fetch(`https://age.toolpie.com`, {
                        method: `POST`,
                        body: formdata,
                        headers: axiosConfig
                    })

                    const html = await response.text();
                    const $ = cheerio.load(html);
                    const h5 = $('h5.text-center.mb-0');
                    const span = h5.find('span.text-warning.font-weight-bold');
                    const spanText = span.text().trim();
                    // 
                    let pt = parseInt(spanText)
                    let pr = Object.keys(que) ? parseInt(que.limit) : 17
                    res.send({
                        isvalid: pt >= pr,
                        age: pt,
                        limit: pr
                    });
                    // 
                } else {
                    res.destroy()
                }
            } catch (e) {
                console.log(e)
                res.send(e)
            }
        })
    } catch (e) {
        res.destroy()
        req.destroy()
    }
})

app.get(`/all`, (req, res) => {
    try {} catch {
        req.destroy()
    }
})

app.listen(PORT, () => {
    console.log(`
Proxy serveZr is running on http: //localhost:${PORT}`);
});