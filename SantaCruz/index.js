const pdf = require("pdf-parse");
const fs = require("node:fs");

module.exports = async function parseSantaCruzPDF(pdfBuffer) {
    try {
        const pdfData = await pdf(pdfBuffer);
        let text = pdfData.text;

        text = text.replace(/BOLETÍN OFICIAL\nRÍO GALLEGOS, \d{1,2} de \w+ de \d{4}\.-\nAÑO \w+ N[º°] \d{4}\nBOLETÍN OFICIAL\nGOBIERNO DE LA PROVINCIA DE SANTA CRUZ\nMINISTERIO DE LA SECRETARÍA GENERAL DE LA GOBERNACIÓN/g, '\n') // eliminates the page header
            .replace(/Pág\. \d{1,3}/g, '\n') // eliminates page numbers
            .replace(/SUMARIO\n[\s\S]*/g, '').trim() // eliminates the SUMARIO section
            .replace(/([a-zA-ZáéíóúÁÉÍÓÚüÜñÑ])-\n([a-zA-ZáéíóúÁÉÍÓÚüÜñÑ])/g, '$1$2') // joins words separated by a hyphen
            .replace(/\s*\n/g, '\n'); //replaces multiple spaces and line brake for one line break

        const sectionRegex = /^(LEYES\n|DECRETOS\n|DECRETOS SINTETIZADOS\n|RESOLUCI[OÓ]N(?:ES)?(?: [A-Za-zÁÉÍÓÚ.-]+)*\n|DECLARACI[OÓ]N(?:ES)?(?: [A-Za-zÁÉÍÓÚ.-]+)*\n|DISPOSICI[OÓ]N(?:ES)?(?: [A-Za-zÁÉÍÓÚ.-]+)*\n|EDICTOS\n|AVISOS?\n|LICITACIONES\n|CONVOCATORIAS\n)((?:(?!^(LEYES\n|DECRETOS\n|DECRETOS SINTETIZADOS\n|RESOLUCI[OÓ]N(?:ES)?(?: [A-Za-zÁÉÍÓÚ.-]+)*\n|DECLARACI[OÓ]N(?:ES)?(?: [A-Za-zÁÉÍÓÚ.-]+)*\n|DISPOSICI[OÓ]N(?:ES)?(?: [A-Za-zÁÉÍÓÚ.-]+)*\n|EDICTOS\n|AVISOS?\n|LICITACIONES\n|CONVOCATORIAS\n)).|\n)+)/gms;

        const sections = {};

        let match;

        while ((match = sectionRegex.exec(text)) !== null) {
            const sectionName = match[1].trim();
            const sectionContent = match[2].trim();
            sections[sectionName] = sectionContent;
        }
        return sections;
    } catch (error) {
        console.error("Error al procesar el PDF:", error);
        return [];
    }
}