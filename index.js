import express from 'express';
import axios from 'axios';
import { URL } from 'url';
import cors from 'cors';
import multer from 'multer';
import cheerio from 'cheerio';
import puppeteer from 'puppeteer';
import { PassThrough } from 'stream';
import https from 'https';
import http from 'http';
import dotenv from 'dotenv';
import { Fdown, Ydown, SLDown, TkDown, SPDown } from './fdown';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const upload = multer({ storage: multer.memoryStorage() });

const fetchContent = async (url, options, res) => {
  const protocolHandler = url.startsWith('https') ? https : http;

  protocolHandler.get(url, options, (response) => {
    if ([301, 302, 303, 307].includes(response.statusCode)) {
      const redirectUrl = new URL(response.headers.location, url).href;
      fetchContent(redirectUrl, options, res);
      return;
    }

    res.setHeader('Content-Type', response.headers['content-type'] || 'text/html');
    const passThrough = new PassThrough();
    response.pipe(passThrough).pipe(res);
  });
};

app.get('*', async (req, res, next) => {
  try {
    const proxyUrl = req.url.split('/?proxy_med=')[1];

    if (proxyUrl) {
      const decodedUrl = decodeURIComponent(proxyUrl).replace(/<>+/g, '');
      const options = {
        method: 'GET',
        headers: {
          referer: `${new URL(decodedUrl).origin}/`,
          origin: `${new URL(decodedUrl).origin}`,
        },
      };

      fetchContent(decodedUrl, options, res);
    } else if (req.url === '/fd' || req.url.includes('/all')) {
      next();
    } else {
      res.status(401).send('Endpoint not configured. Please try again later.');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/fd', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).send('No file uploaded.');

    const formData = new FormData();
    formData.append('picture', req.file.buffer, req.file.originalname);

    const { data } = await axios.post('https://age.toolpie.com', formData, {
      headers: formData.getHeaders(),
    });

    const $ = cheerio.load(data);
    const age = parseInt($('h5.text-center.mb-0 span.text-warning.font-weight-bold').text().trim(), 10);

    res.json({ isValid: age >= 17, age, limit: 17 });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

const scrapePage = async (url) => {
  const browser = await puppeteer.launch({
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || puppeteer.executablePath(),
  });

  try {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });
    return await page.content();
  } finally {
    await browser.close();
  }
};

app.get('/scrape', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).send('URL parameter is required.');

  try {
    const content = await scrapePage(url);
    res.send(content);
  } catch (error) {
    console.error(error);
    res.status(500).send('Scraping Failed');
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
