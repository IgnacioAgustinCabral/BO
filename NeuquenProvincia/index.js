const extract = require('pdf-text-extract');
const fs = require("node:fs");
module.exports = async function NeuquenCapitalPDF(pdfBuffer) {
    try {
        const pdfPath = "temp.pdf";
        fs.writeFileSync(pdfPath, pdfBuffer);
        let text = await extractTextPromise(pdfPath);

        text = text.replace(/INFORMACI[OÓ]N IMPORTANTE\n[\s\S]*?Direcci[oó]n General del Bolet[ií]n Oficial y Archivo\./gm, '')
            .replace(/Neuqu[eé]n, \d+ de \w+ de \d+[\s\S]*?BOLET[IÍ]N[\s\S]*?P[AÁ]GINA \d+/gm, '');

        const sectionsRegex = /(DIRECCI[OÓ]N PROVINCIAL DE MINER[ÍI]A|CONTRATOS|LICITACIONES|CONVOCATORIAS|EDICTOS|AVISOS|NORMAS LEGALES|LEYES DE LA PROVINCIA|DECRETOS SINTETIZADOS|DECRETOS DE LA PROVINCIA|ACUERDOS DEL TRIBUNAL DE CUENTAS)([\s\S]*?)(?=(DIRECCI[OÓ]N PROVINCIAL DE MINER[ÍI]A|CONTRATOS|LICITACIONES|CONVOCATORIAS|EDICTOS|AVISOS|NORMAS LEGALES|LEYES DE LA PROVINCIA|DECRETOS SINTETIZADOS|DECRETOS DE LA PROVINCIA|ACUERDOS DEL TRIBUNAL DE CUENTAS)|$)/g;
        const sections = [];
        let match;

        while ((match = sectionsRegex.exec(text)) !== null) {
            const sectionName = match[1].trim();
            const sectionContent = match[2].trim();
            sections.push({
                sectionName: sectionName,
                sectionContent: sectionContent
            });
        }

        const sectionProcessors = {
            /*'DIRECCIÓN PROVINCIAL DE MINERÍA': processDireccionMineria,
            'CONTRATOS': processContratos,
            'LICITACIONES': processLicitaciones,
            'CONVOCATORIAS': processConvocatorias,
            'EDICTOS': processEdicts,
            'AVISOS': processAvisos,
            'NORMAS LEGALES': processNormasLegales,
            'LEYES DE LA PROVINCIA': processLaws,*/
            'DECRETOS SINTETIZADOS': processSynthesizedDecrees,
            /*'DECRETOS DE LA PROVINCIA': processDecrees,
            'ACUERDOS DEL TRIBUNAL DE CUENTAS': processAcuerdos,*/
        };
        let content = [];
        sections.forEach(({sectionName, sectionContent}) => {
            if (/DIRECCI[OÓ]N PRONINCIAL DE MINER[IÍ]A/.test(sectionName)) {
                sectionName = 'DIRECCIÓN PROVINCIAL DE MINERÍA';
            }
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
    content = content.replace(/$/g, '\n');

    const synthesizedDecreeRegex = /(\d+) - [\s\S]*?\.\n/g;
    let match;
    const synthesizedDecrees = [];

    while ((match = synthesizedDecreeRegex.exec(content)) !== null) {
        const decreeNumber = match[1];
        const decreeContent = match[0].trim();

        synthesizedDecrees.push({
            title: `Auditoría Legislativa - DECRETOS SINTETIZADOS - DECRETO N° ${decreeNumber}`,
            content: decreeContent
        });
    }

    return synthesizedDecrees;

}


function extractTextPromise(pdfPath) {
    return new Promise((resolve, reject) => {
        extract(pdfPath, {splitPages: false}, (err, text) => {
            if (err) {
                fs.unlinkSync(pdfPath);
                return reject("Error extrayendo el texto: " + err);
            }

            const extractedText = text.join("\n");
            fs.unlinkSync(pdfPath); // removes temp file

            resolve(extractedText);
        });
    });
}