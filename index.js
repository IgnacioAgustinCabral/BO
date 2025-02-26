const axios = require('axios');
const express = require('express');
const parseChubutPDF = require('./Chubut/index.js');
const parseSantaCruzPDF = require('./SantaCruz/index.js');
const parseCaletaOliviaPDF = require('./CaletaOlivia/index.js');
const parseComodoroRivadaviaPDF = require('./ComodoroRivadavia/index.js');
const parseRioNegroPDF = require('./RioNegro/index.js');
const parseNeuquenProvinciaPDF = require('./NeuquenProvincia/index.js');
const parseNeuquenCapitalPDF = require('./NeuquenCapital/index.js');
const port = 4000;
const app = express();

const parsers = {
    '620': parseSantaCruzPDF,
    '621': parseChubutPDF,
    '622': parseNeuquenProvinciaPDF,
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