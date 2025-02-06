const axios = require('axios');
const express = require('express');
const parseChubutPDF = require('./Chubut/index.js');
const parseSantaCruzPDF = require('./SantaCruz/index.js');
const parseCaletaOliviaPDF = require('./CaletaOlivia/index.js');
const parseComodoroRivadaviaPDF = require('./ComodoroRivadavia/index.js');
const parseRioNegroPDF = require('./RioNegro/index.js');
const parseNeuquenCapitalPDF = require('./NeuquenProvincia/index.js');
const port = 4000;
const puppeteer = require('puppeteer');
const app = express();

const parsers = {
    '620': parseSantaCruzPDF,
    '621': parseChubutPDF,
    '623': parseNeuquenCapitalPDF,
    '624': parseCaletaOliviaPDF,
    '627': parseRioNegroPDF,
    '628': parseComodoroRivadaviaPDF
};

app.get('/process-bulletin', async (req, res) => {
    const {url, sources_id} = req.query;

    try {
        const parsePDF = parsers[sources_id];

        if (parsePDF) {
            const pdfBuffer = await downloadPDF(url);
            const data = await parsePDF(pdfBuffer);
            res.json(data);
        } else {
            res.json({error: 'No parser for this source'});
        }
    } catch (error) {
        res.json(null);
        console.log(error);
    }

});

app.get('/extract-links', async (req, res) => {
    const {url, sources_id} = req.query;

    try {
        const browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            headless: true,
            timeout: 0,
        });

        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36');
        await page.goto(url);

        if (sources_id === '628') {
            await page.waitForSelector('vaadin-grid-cell-content');
            await page.evaluate(() => {
                const element = document.querySelector('vaadin-grid-cell-content');
                if (element) element.click();
            });
        }
        await new Promise(resolve => setTimeout(resolve, 5000));

        const data = await page.evaluate(() => `<html>${document.documentElement.innerHTML}</html>`);
        await browser.close();
        res.send(data);

    } catch (err) {
        res.status(500).send('Error occurred while processing the request.');
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

async function downloadPDF(url) {
    const response = await axios({
        method: 'get',
        url: url,
        responseType: 'arraybuffer'
    });
    return response.data;
}