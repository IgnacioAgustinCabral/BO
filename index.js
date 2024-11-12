const axios = require('axios');
const pdf = require('pdf-parse');
const express = require('express');
const port = 4000;
const app = express();
const fs = require('fs');

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

        // Usar matchAll para capturar los grupos correctamente
        const provincialDecreeSectionRegex = /DECRETOS PROVINCIALES(.*?)(?=DECRETOS SINTETIZADOS)/g;
        const matches = [...text.matchAll(provincialDecreeSectionRegex)];

        if (matches.length > 1) {
            // Acceder al segundo match y al segundo grupo (grupo 1)
            let decreeSection = matches[1][1];  // matches[1] es el segundo match, [1] es el segundo grupo (contenido entre las frases)

            // Expresión regular para capturar cada bloque "Decreto N° ... Lic. IGNACIO AGUSTIN TORRES"
            const decreeRegex = /Decreto N°[\s\S]+?Lic\. IGNACIO AGUST[ÍI]N TORRES/g;

            // Aplicar la expresión regular para obtener los bloques de texto
            const decrees = decreeSection.match(decreeRegex);

            let formattedDecrees = [];
            if (decrees) {
                decrees.forEach(decree => {
                    const titleMatch = decree.match(/Decreto N°\s*\d+/); // Captura "Decreto N° X"
                    let title = titleMatch ? titleMatch[0] : "Título no encontrado";
                    title = title.replace("Decreto", "Decreto Provincial");
                    let content = decree.replace(/(;)/g, '$1\n')
                        .replace(/- (\w)/g, '$1')
                        .replace(/Lic\. IGNACIO AGUST[ÍI]N TORRES/g, '').trim();

                    formattedDecrees.push({
                        title,
                        content
                    });
                });

                return formattedDecrees;
            } else {
                console.log("No se encontraron decretos en el texto.");
                return [];
            }
        } else {
            console.log("No se encontró la sección 'DECRETOS PROVINCIALES'.");
            return [];
        }
    } catch (error) {
        console.error("Error al procesar el PDF:", error);
        return [];
    }
}
