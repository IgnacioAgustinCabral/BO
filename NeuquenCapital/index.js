const fs = require("node:fs");
const extractTextPromise = require('../utils/extractTextPromise');
module.exports = async function parseNeuquenCapitalPDF(pdfBuffer) {
    try {
        const pdfPath = "tempNeuquenCapital.pdf";
        fs.writeFileSync(pdfPath, pdfBuffer);
        let text = await extractTextPromise(pdfPath);

        text = text.replace(/$/, '\n')// add \n at the end of the text
            .replace(/\s*\d+\nBOLET[IÍ]N OFICIAL MUNICIPAL\s*EDICI[OÓ]N N[°º] \d+\s*NEUQU[EÉ]N[\s\S]*?\n\n/gm, '\n')// eliminates header
            .replace(/SUMARIO[\s\S]*?(?=DECRETOS SINTETIZADOS)/gm, '');// eliminates SUMARIO SECTION

        const sectionsRegex = /(DECRETOS SINTETIZADOS|RESOLUCIONES SINTETIZADAS|DISPOSICIONES SINTETIZADAS|NORMAS COMPLETAS)([\s\S]*?)(?=(DECRETOS SINTETIZADOS|RESOLUCIONES SINTETIZADAS|DISPOSICIONES SINTETIZADAS|NORMAS COMPLETAS|$))/g;
        const sections = [];
        let match;

        while ((match = sectionsRegex.exec(text)) !== null) {
            const sectionName = match[1].trim();
            const sectionContent = match[2];
            sections.push({
                sectionName: sectionName,
                sectionContent: sectionContent
            });
        }

        const sectionProcessors = {
            'DECRETOS SINTETIZADOS': processSynthesizedDecrees,
            'RESOLUCIONES SINTETIZADAS': processResolucionesSintetizadas,
            // 'DISPOSICIONES SINTETIZADAS': processDisposicionesSintetizadas,
            // 'NORMAS COMPLETAS': processNormasCompletas,
        };

        let content = [];
        sections.forEach(({sectionName, sectionContent}) => {
            const processor = sectionProcessors[sectionName];
            if (processor) {
                content.push(...processor(sectionName, sectionContent));
            }
        });

        return content;
    } catch (error) {
        console.error("Error extrayendo el texto:", error);
    }
};

function processSynthesizedDecrees(sectionName, content) {
    const decreeRegex = /DECRETO N[°º] (\d+)\/\d+[\s\S]*?.-\n/g;
    const decrees = [];
    let match;

    while ((match = decreeRegex.exec(content)) !== null) {
        const decreeNumber = match[1];
        const decreeContent = match[0].replace(/\n/g, ' ')
            .trim();
        decrees.push({
            title: `Auditoría Legislativa - DECRETOS SINTETIZADOS - DECRETO N° ${decreeNumber}`,
            content: decreeContent
        });
    }

    return decrees;
}

function processResolucionesSintetizadas(sectionName, content) {
    const resolutionRegex = /RESOLUCI[ÓO]N N[°º] (\d+)\/\d+[\s\S]*?.-\n/g;
    const resolutions = [];
    let match;

    while ((match = resolutionRegex.exec(content)) !== null) {
        const resolutionNumber = match[1];
        const resolutionContent = match[0].replace(/\n/g, ' ')
            .trim();
        resolutions.push({
            title: `Auditoría Legislativa - RESOLUCIONES SINTETIZADAS - RESOLUCIÓN N° ${resolutionNumber}`,
            content: resolutionContent
        });
    }

    return resolutions;
}