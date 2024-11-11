const axios = require('axios');
const pdf = require('pdf-parse');
const express = require('express');
const port = 4000;
const app = express();

app.get('/process-gazette', async (req, res) => {
    const {url} = req.query;

    const pdf = await downloadPDF(url);

    const data = await parsePDF(pdf);

    res.json(data);
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);

});

// Descargar el PDF desde la URL
async function downloadPDF(url) {
    const response = await axios({
        method: 'get',
        url: url,
        responseType: 'arraybuffer'
    });
    return response.data;
}

// Procesar el PDF
async function parsePDF(pdfBuffer) {
    try {
        const data = await pdf(pdfBuffer);

        // Obtener el texto en una sola línea
        let text = data.text.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();

        // Expresión regular para capturar cada bloque "Decreto N° ... Lic. IGNACIO AGUSTIN TORRES"
        const regex = /Decreto N°[\s\S]+?Lic\. IGNACIO AGUST[ÍI]N TORRES/g;

        // Aplicar la expresión regular para obtener los bloques de texto
        const decretos = text.match(regex);
        let decretosFormateados = [];
        if (decretos) {
            decretos.forEach((decreto, index) => {
                decreto = decreto.replace(/([;])/g, '$1\n');
                decreto = decreto.replace(/- (\w)/g, '$1');
                decretosFormateados.push(decreto)
            });

            return decretosFormateados;
        } else {
            console.log("No se encontraron decretos en el texto.");
        }
    } catch (error) {
        console.error("Error al procesar el PDF:", error);
    }
}

// URL del PDF que deseas procesar
// const pdfURL = 'https://boletin.chubut.gov.ar/archivos/boletines/Noviembre%205,%202024.pdf';

// Descargar y parsear el PDF
// downloadPDF(pdfURL).then(parsePDF);
