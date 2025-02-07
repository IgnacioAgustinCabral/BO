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
            'DIRECCIÓN PROVINCIAL DE MINERÍA': processDireccionMineria,
            'CONTRATOS': processContratos,
            'LICITACIONES': processLicitaciones,
            // 'CONVOCATORIAS': processConvocatorias,
            'EDICTOS': processEdicts,
            'AVISOS': processAvisos,
            // 'NORMAS LEGALES': processNormasLegales,
            // 'LEYES DE LA PROVINCIA': processLaws,
            'DECRETOS SINTETIZADOS': processSynthesizedDecrees,
            // 'DECRETOS DE LA PROVINCIA': processDecrees,
            // 'ACUERDOS DEL TRIBUNAL DE CUENTAS': processAcuerdos,
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

function processContratos(sectionName, content) {
    content = content.replace(/\s*_{5,15}\s*/g, '\n__________\n');// clean up the section separator

    const contratoRegex = /([\s\S]+?)(?=__________|$)/g;
    let match;
    const contratos = [];

    while ((match = contratoRegex.exec(content)) !== null) {
        const contratoContent = match[0].replace(/____________/g, '')
            .trim();

        contratos.push({
            title: `Auditoría Legislativa - CONTRATOS - ${sectionName}`,
            content: contratoContent
        });
    }

    return contratos;
}

function processLicitaciones(sectionName, content) {
    content = content.replace(/\s*_{5,15}\s*/g, '\n__________\n'); // Clean up the section separator

    const licitacionRegex = /([\s\S]+?)(?=__________|$)/g;
    let match;
    const licitaciones = [];

    while ((match = licitacionRegex.exec(content)) !== null) {
        const licitacionContent = match[0].replace(/____________/g, '').trim();

        const licitacionMatch = licitacionContent.match(/Licitaci[oó]n P[uú]blica N[°º] (\d+)\/\d+/);
        const licitacionNumber = licitacionMatch ? licitacionMatch[1] : null;

        const title = licitacionNumber
            ? `Auditoría Legislativa - ${sectionName} - LICITACIÓN N° ${licitacionNumber}`
            : `Auditoría Legislativa - ${sectionName} - LICITACIÓN`;

        licitaciones.push({
            title,
            content: licitacionContent
        });
    }

    return licitaciones;
}

function processEdicts(sectionName, content) {
    content = content.replace(/\s*_{5,15}\s*/g, '\n__________\n');// clean up the section separator

    const edictRegex = /([\s\S]+?)(?=__________|$)/g;
    let match;
    const edicts = [];

    while ((match = edictRegex.exec(content)) !== null) {
        const edictContent = match[0].replace(/____________/g, '')
            .trim();
        edicts.push({
            title: `Auditoría Legislativa - ${sectionName} - EDICTO`,
            content: edictContent
        });
    }

    return edicts;
}

function processAvisos(sectionName, content) {
    content = content.replace(/\s*_{5,15}\s*/g, '\n__________\n');// clean up the section separator

    const avisoRegex = /([\s\S]+?)(?=__________|$)/g;
    let match;
    const avisos = [];

    while ((match = avisoRegex.exec(content)) !== null) {
        const avisoContent = match[0].replace(/____________/g, '')
            .trim();
        avisos.push({
            title: `Auditoría Legislativa - ${sectionName} - AVISO`,
            content: avisoContent
        });
    }

    return avisos;
}

function processDireccionMineria(sectionName, content) {
    content = content.replace(/\s*_{5,15}\s*/g, '\n__________\n');// clean up the section separator

    const direccionMineriaRegex = /([\s\S]+?)(?=__________|$)/g;
    let match;
    const direccionesMineria = [];

    while ((match = direccionMineriaRegex.exec(content)) !== null) {
        const direccionMineriaContent = match[0].replace(/____________/g, '')
            .trim();
        direccionesMineria.push({
            title: `Auditoría Legislativa - ${sectionName} - DIRECCIÓN PROVINCIAL DE MINERÍA`,
            content: direccionMineriaContent
        });
    }

    return direccionesMineria;
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