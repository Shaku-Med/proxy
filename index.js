const express = require("express");
const axios = require("axios");
const { URL } = require("url");
const cors = require('cors')
const multer = require('multer');
const cheerio = require("cheerio");
const puppeteer = require('puppeteer');
const fs = require('fs');
const Fdown = require("./fdown");



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
            } else if (req.url.includes(`/all`)) {
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

let getFbdownload = async(tu) => {
    try {
        let formdata = new FormData()
        formdata.append(`k_exp`, `1717721560`)
        formdata.append(`k_token`, `a6dcb59799b4c58ab5a4848620cab3458a15289e997c0cfc1d083f0b1129d819`)
        formdata.append(`v`, `v2`)
        formdata.append(`w`, ``)
        formdata.append(`lang`, `en`)
        formdata.append(`web`, `fdownloader.net`)
        formdata.append(`q`, `${tu}`)
            // 
        const response = await fetch("https://v3.fdownloader.net/api/ajaxSearch?lang=en", {
            method: `POST`,
            body: formdata,
            headers: {
                'referef': 'https://fdownloader.net/'
            }
        });

        let j = await response.json()

        return j.status === 'ok' ? j.data : null

    } catch (e) {
        console.log(e)

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

let scrape = async(req, res) => {
    try {

        const targetUrl = req.query.url;
        if (!targetUrl) {
            return res.status(400).send('URL query parameter is required.');
        }

        let browser;
        try {
            browser = await puppeteer.launch();
            const page = await browser.newPage();
            await page.goto(targetUrl, { waitUntil: 'networkidle2' });
            const content = await page.content();
            res.send(content);
        } catch (error) {
            console.error('Error fetching the page:', error);
            res.status(500).send('An error occurred while fetching the page.');
        } finally {
            if (browser) {
                await browser.close();
            }
        }

    } catch {}
}


app.get('/all/*', async(req, res) => {
    try {
        let qs = req.url
        if (!qs.toLowerCase().includes('/all/?')) {
            if (qs.toLowerCase().includes('/all/play')) {
                const targetUrl = req.query.url;
                if (!targetUrl) {
                    return res.status(400).send('URL query parameter is required.');
                }

                let browser;
                try {

                    let LunchMeny = async(hasloop) => {
                        browser = await puppeteer.launch({ headless: true });
                        const page = await browser.newPage();
                        await page.goto(targetUrl, { waitUntil: 'networkidle2' });

                        await page.waitForSelector('.x1lliihq.x5yr21d.xh8yej3', { timeout: 60000 });

                        const isPlaying = await page.evaluate(() => {
                            const playButton = document.querySelector('.x1b0d499.xaj1gnb');
                            return !playButton;
                        });

                        if (!isPlaying) {
                            await page.click('.x1b0d499.xaj1gnb');
                        }

                        await page.waitForNetworkIdle()

                        // const screenshot = await page.screenshot({ path: `File/${new Date().getTime()}_video_screenshot.png` });
                        setTimeout(async() => {
                            LunchMeny(true)
                            await browser.close()
                        }, 2000)
                        if (!hasloop) {
                            res.send({ message: `Attact started`, state: `Pushing Plays, Check the post for updates.` })
                        } else {}
                    };

                    LunchMeny()

                } catch (error) {
                    req.destroy()
                } finally {
                    if (browser) {
                        await browser.close();
                    }
                }
            } else if (qs.toLowerCase().includes('/all/view')) {
                const targetUrl = req.query.url;
                if (!targetUrl) {
                    return res.status(400).send('URL query parameter is required.');
                }

                let browser;
                try {

                    let LunchMeny = async(hasloop) => {
                        browser = await puppeteer.launch({ headless: true });
                        const page = await browser.newPage();
                        await page.goto(targetUrl, { waitUntil: 'networkidle2' });

                        setTimeout(async() => {
                            LunchMeny(true)
                            await browser.close()
                        }, 2000)
                    };

                    LunchMeny()

                } catch (error) {
                    req.destroy()
                } finally {
                    if (browser) {
                        await browser.close();
                    }
                }
            } else {
                const targetUrl = req.query.url;
                if (!targetUrl) {
                    return res.status(400).send('URL query parameter is required.');
                }
                let u = new URL(targetUrl)
                if (u) {
                    if (u.hostname.toLowerCase().includes('facebook.com')) {
                        let iv = await getFbdownload(targetUrl)
                        if (iv) {
                            Fdown(req, res, iv)
                        } else {
                            req.destroy()
                        }
                    } else {
                        req.destroy()
                    }
                } else {
                    req.destroy()
                }
            }
        } else {
            scrape(req, res)
        }
    } catch {
        req.destroy()
    }
});

app.listen(PORT, () => {
    console.log(`Proxy server is running on http: //localhost:${PORT}`);
});