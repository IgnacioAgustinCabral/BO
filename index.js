const fs = require('fs');
const axios = require('axios');
const pdf = require('pdf-parse');
const express = require('express');
const port = 3000;
const app = express();

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
        console.log("Texto extraído:");

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

            console.log("Decretos formateados:");
            decretosFormateados.forEach((decreto, index) => {
                console.log(`Decreto ${index + 1}:\n${decreto}\n`);
            });
        } else {
            console.log("No se encontraron decretos en el texto.");
        }
    } catch (error) {
        console.error("Error al procesar el PDF:", error);
    }
}

// URL del PDF que deseas procesar
const pdfURL = 'https://boletin.chubut.gov.ar/archivos/boletines/Mayo%2005,%202021.pdf';

// Descargar y parsear el PDF
downloadPDF(pdfURL).then(parsePDF);
