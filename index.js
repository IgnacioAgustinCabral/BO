const axios = require('axios');
const pdf = require('pdf-parse');
const express = require('express');
const port = 4000;
const app = express();

app.get('/process-gazette', async (req, res) => {
    const {url} = req.query;

    const pdfBuffer = await downloadPDF(url);

    const data = await parsePDF(pdfBuffer);

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
        const decrees = text.match(regex);
        let formattedDecrees = [];
        if (decrees) {
            decrees.forEach(decree => {
                const titleMatch = decree.match(/Decreto N°\s*\d+/); // Captura "Decreto N° X"
                const title = titleMatch ? titleMatch[0] : "Título no encontrado";

                let content = decree.replace(/(;)/g, '$1\n')
                    .replace(/- (\w)/g, '$1')
                    .replace(/Lic\. IGNACIO AGUST[ÍI]N TORRES/g, '').trim();

                formattedDecrees.push({
                    decreto: title,
                    content: content
                });
            });

            return formattedDecrees;
        } else {
            console.log("No se encontraron decrees en el texto.");
            return [];
        }
    } catch (error) {
        console.error("Error al procesar el PDF:", error);
        return [];
    }
}
