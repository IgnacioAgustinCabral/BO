const axios = require('axios');
const pdf = require('pdf-parse');
const express = require('express');
const port = 4000;
const app = express();

app.get('/process-bulletin', async (req, res) => {
    const {url} = req.query;

    const pdfBuffer = await downloadPDF(url);
    const data = await parsePDF(pdfBuffer);

    res.json(data);
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

// Procesar el PDF
async function parsePDF(pdfBuffer) {
    try {
        const pdfData = await pdf(pdfBuffer);
        // Obtener el texto en una sola línea
        let text = pdfData.text;

        text = text.replace(/\s{2,}/g, ' ') //reemplaza 2 o mas espacios por uno
            .replace(/FRANQUEO A PAGAR\n(.*?)[Ss]ecci[óo]n [Oo]ficial/s, '') //elimina esta sección
            .replace(/FRANQUEO A PAGAR\n(.*?)[Ss]ecci[óo]n [Oo]ficial/s, '') //elimina esta sección
            .replace(/([a-zA-ZáéíóúÁÉÍÓÚüÜñÑ])-\n([a-zA-ZáéíóúÁÉÍÓÚüÜñÑ])/g, "$1$2") //junta las palabras separadas por guión
            .replace(/BOLET[IÍ]N OFICIAL\n/g, '')
            .replace(/P[AÁ]GINA (\d+)\n(Lunes|Martes|Mi[eé]rcoles|Jueves|Viernes|S[aá]bado|Domingo)\s\d{1,2}\sde\s(Enero|Febrero|Marzo|Abril|Mayo|Junio|Julio|Agosto|Septiembre|Octubre|Noviembre|Diciembre)\sde\s\d{4}\n/gs, '');

        const sectionsRegex = /(DECRETO PROVINCIAL\n|DECRETOS PROVINCIALES\n|DECRETO SINTETIZADO\n|DECRETOS SINTETIZADOS\n|RESOLUCIONES\n|RESOLUCI[ÓO]N\n|RESOLUCIONES SINTETIZADAS\n|RESOLUCI[ÓO]N SINTETIZADA\n)([\s\S]*?)(?=(DECRETO PROVINCIAL\n|DECRETOS PROVINCIALES\n|DECRETO SINTETIZADO\n|DECRETOS SINTETIZADOS\n|RESOLUCIONES\n|RESOLUCI[ÓO]N\n|RESOLUCIONES SINTETIZADAS\n|RESOLUCI[ÓO]N SINTETIZADA\n|Secci[óo]n General|$))/g;
        const sections = [];
        let match;

        while ((match = sectionsRegex.exec(text)) !== null) {
            let sectionName = match[1].trim();
            let sectionContent = match[2].trim();

            if (sectionName === 'RESOLUCION') {
                sectionName = 'RESOLUCIÓN';
            } else if (sectionName === 'RESOLUCION SINTETIZADA') {
                sectionName = 'RESOLUCIÓN SINTETIZADA';
            }

            sections.push({
                sectionName,
                sectionContent
            });
        }

        let content = [];

        sections.forEach(section => {
            const {sectionName, sectionContent} = section;
            switch (sectionName) {
                case 'DECRETO PROVINCIAL':
                    break;

                case 'DECRETOS PROVINCIALES':
                    const decrees = processProvincialDecrees(sectionContent);
                    content.push(...decrees);
                    break;

                case 'DECRETO SINTETIZADO':
                    break;

                case 'DECRETOS SINTETIZADOS':
                    const synthesizedDecrees = processSynthesizedDecrees(sectionContent);
                    content.push(...synthesizedDecrees);
                    break;

                case 'RESOLUCIONES':
                    break;

                case 'RESOLUCIÓN':
                    break;

                case 'RESOLUCIÓN SINTETIZADA':
                    break;

                case 'RESOLUCIONES SINTETIZADAS':
                    break;
            }
        })
        return content;
    } catch (error) {
        console.error("Error al procesar el PDF:", error);
        return [];
    }
}


function processProvincialDecrees(sectionContent) {
    const decrees = [];
    const provincialDecreeRegex = /PODER EJECUTIVO(.*?)(?=PODER EJECUTIVO|$)/gs;
    const decreeTitleRegex = /Decreto N° \d{1,4}\n/g;

    let match;
    while ((match = provincialDecreeRegex.exec(sectionContent)) !== null) {
        let decreeContent = match[0].trim();
        let titleMatch;

        while ((titleMatch = decreeTitleRegex.exec(decreeContent)) !== null) {
            decrees.push({
                title: 'Auditoría Legislativa - ' + 'Decreto Pronvincial - ' + titleMatch[0].trim(),
                content: decreeContent
            });
        }
    }

    return decrees;
}

function formatSynthesizedDecreeSection(sectionContent) {
    const regex = /(Dto\. N° )(\d{4})(\d{2}-\d{2}-\d{2})/;
    const lines = sectionContent.split('\n'); // divide text into lines
    const formattedLines = [];

    for (const line of lines) {
        const match = line.match(regex);
        if (match) {
            formattedLines.push(`${match[1]}${match[2]}\n${match[3]}`);
        } else {
            formattedLines.push(line);
        }
    }

    return formattedLines.join('\n');
}

function processSynthesizedDecrees(sectionContent) {
    const formattedContent = formatSynthesizedDecreeSection(sectionContent);
    const synthesizedDecrees = [];
    const synthesizedDecreeRegex = /Dto\. N° \d{4}(.*?)(?=Dto\. N° \d{4}|$)/gs;
    const decreeRegex = /Dto\. N° \d{4}\n/gs;

    let match;
    while ((match = synthesizedDecreeRegex.exec(formattedContent)) !== null) {
        let synthesizedDecreeContent = match[0].trim();
        let titleMatch;

        while ((titleMatch = decreeRegex.exec(synthesizedDecreeContent)) !== null) {
            synthesizedDecrees.push({
                title: 'Auditoría Legislativa - ' + 'Decreto Sintetizado - ' + titleMatch[0].trim(),
                content: synthesizedDecreeContent
            });
        }
    }

    return synthesizedDecrees;
}

