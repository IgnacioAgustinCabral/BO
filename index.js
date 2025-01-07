const axios = require('axios');
const express = require('express');
const parseChubutPDF = require('./Chubut/index.js');
const parseSantaCruzPDF = require('./SantaCruz/index.js');
const parseCaletaOliviaPDF = require('./CaletaOlivia/index.js');
const port = 4000;
const app = express();

app.get('/process-bulletin', async (req, res) => {
    const {url, sources_id} = req.query;

    try {
        const pdfBuffer = await downloadPDF(url);
        let data;
        if (sources_id === '621') {
            data = await parseChubutPDF(pdfBuffer);
        } else if (sources_id === '620') {
            data = await parseSantaCruzPDF(pdfBuffer);
        } else if (sources_id === '624') {
            data = await parseCaletaOliviaPDF(pdfBuffer);
        } else {
            data = {error: 'No parser for this source'};
        }

        res.json(data);
    } catch (error) {
        res.json(null);
        console.log(error);
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