const fs = require("node:fs");
const extractTextPromise = require('../utils/extractTextPromise');
module.exports = async function parseNeuquenProvinciaPDF(pdfBuffer) {
    try {
        const pdfPath = "temp.pdf";
        fs.writeFileSync(pdfPath, pdfBuffer);
        let text = await extractTextPromise(pdfPath);

        text = text.replace(/(INFORMACI[OÓ]N IMPORTANTE\n[\s\S]*?)?Direcci[oó]n General del Bolet[ií]n Oficial y Archivo\./gm, '')
            .replace(/SUMARIO[\s\S]*?Direcci[oó]n General del Bolet[ií]n Oficial y Archivo\./gm, '')
            .replace(/Neuqu[eé]n, \d+ de \w+ de \d+ *BOLET[IÍ]N OFICIAL *PÁGINA \d+/gm, '')
            .replace(/\n\n\n\n/gm, '\n')
            .replace(/([a-záéíóú])-\n([a-záéíóú]+)/gm, '$1$2\n');

        const sectionsRegex = /(DIRECCI[OÓ]N PROVINCIAL DE MINER[ÍI]A|CONTRATOS|LICITACIONES|CONVOCATORIAS|CONVOCATORIA|EDICTOS|AVISOS|NORMAS LEGALES|LEYES DE LA PROVINCIA|DECRETOS SINTETIZADOS|DECRETOS DE LA PROVINCIA|ACUERDOS DEL TRIBUNAL DE CUENTAS)([\s\S]*?)(?=(DIRECCI[OÓ]N PROVINCIAL DE MINER[ÍI]A|CONTRATOS|LICITACIONES|CONVOCATORIAS|CONVOCATORIA|EDICTOS|AVISOS|NORMAS LEGALES|LEYES DE LA PROVINCIA|DECRETOS SINTETIZADOS|DECRETOS DE LA PROVINCIA|ACUERDOS DEL TRIBUNAL DE CUENTAS)|$)/g;
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
            'CONVOCATORIAS': processConvocatorias,
            'CONVOCATORIA': processConvocatorias,
            'EDICTOS': processEdicts,
            'AVISOS': processAvisos,
            // 'NORMAS LEGALES': processNormasLegales,
            'LEYES DE LA PROVINCIA': processLaws,
            'DECRETOS SINTETIZADOS': processSynthesizedDecrees,
            'DECRETOS DE LA PROVINCIA': processDecrees,
            'ACUERDOS DEL TRIBUNAL DE CUENTAS': processAcuerdos,
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
        const decreeContent = match[0]
            .replace(/\n/gm, ' ')
            .trim();

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
        const contratoContent = match[0].replace(/__________/g, '')
            .replace(/\n/gm, ' ')
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
        const licitacionContent = match[0].replace(/__________/g, '')
            .replace(/\n/gm, ' ')
            .trim();

        const licitacionMatch = licitacionContent.match(/Licitaci[oó]n P[uú]blica N[°º] (\d+)\/\d+/);
        const licitacionNumber = licitacionMatch ? licitacionMatch[1] : null;

        const title = licitacionNumber
            ? `Auditoría Legislativa - ${sectionName} - LICITACIÓN N° ${licitacionNumber}`
            : `Auditoría Legislativa - ${sectionName} - LICITACIÓN`;

        licitaciones.push({
            title: title,
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
        const edictContent = match[0].replace(/__________/g, '')
            .replace(/\n/gm, ' ')
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
        const avisoContent = match[0].replace(/__________/g, '')
            .replace(/\n/gm, ' ')
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
        const direccionMineriaContent = match[0].replace(/__________/g, '')
            .replace(/\n/gm, ' ')
            .trim();
        direccionesMineria.push({
            title: `Auditoría Legislativa - ${sectionName} - DIRECCIÓN PROVINCIAL DE MINERÍA`,
            content: direccionMineriaContent
        });
    }

    return direccionesMineria;
}

function processAcuerdos(sectionName, content) {
    content = content.replace(/\s*_{5,15}\s*/g, '\n__________\n');// clean up the section separator

    const acuerdoRegex = /ACUERDO \w+-(\d+)[\s\S]*?(?=(ACUERDO \w+-\d+|$))/g;
    let match;
    const acuerdos = [];

    while ((match = acuerdoRegex.exec(content)) !== null) {
        const acuerdoContent = match[0].replace(/__________/g, '')
            .replace(/\n/gm, ' ')
            .trim();
        const acuerdoNumber = match[1];
        acuerdos.push({
            title: `Auditoría Legislativa - ${sectionName} - ACUERDO N° ${acuerdoNumber}`,
            content: acuerdoContent
        });
    }

    return acuerdos;
}

function processConvocatorias(sectionName, content) {
    content = content.replace(/\s*_{5,15}\s*/g, '\n__________\n');// clean up the section separator

    const convocatoriaRegex = /([\s\S]+?)(?=__________|$)/g;
    let match;
    const convocatorias = [];

    while ((match = convocatoriaRegex.exec(content)) !== null) {
        const convocatoriaContent = match[0].replace(/__________/g, '')
            .replace(/\n/gm, ' ')
            .replace(/([0-9]+\)[\s\S]*?\.)/gm, '\n$1')
            .trim();
        convocatorias.push({
            title: `Auditoría Legislativa - ${sectionName} - CONVOCATORIA`,
            content: convocatoriaContent
        });
    }

    return convocatorias;
}

function processDecrees(sectionName, content) {
    content = content.replace(/\s*_{5,15}\s*/g, '\n');// clean up the section separator

    const decreeRegex = /DECRETO N[°º] (\d+)\n[\s\S]*?(?=(DECRETO N[°º] \d+\n|$))/g;
    let match;
    const decrees = [];

    while ((match = decreeRegex.exec(content)) !== null) {
        const decreeContent = match[0].replace(/VISTO:[\s\S]*?; y\n/gm, match => {
            return match.replace(/(?<!y)\n/g, ' ');
        })
            .replace(/Que[\s\S]*?;\n/gm, match => {
                return match.replace(/(?<!;)\n/g, ' ');
            })
            .trim();
        const decreeNumber = match[1];
        decrees.push({
            title: `Auditoría Legislativa - ${sectionName} - DECRETO N° ${decreeNumber}`,
            content: decreeContent
        });
    }

    return decrees;
}

function processLaws(sectionName, content) {
    content = content.replace(/\s*_{5,15}\s*/g, '\n');// clean up the section separator

    const lawRegex = /LEY N[°º] (\d+)[\s\S]*?(?=LEY N[°º] \d+|$)/g;
    let match;
    const laws = [];

    while ((match = lawRegex.exec(content)) !== null) {
        const lawContent = match[0].trim();
        const lawNumber = match[1];
        laws.push({
            title: `Auditoría Legislativa - ${sectionName} - LEY N° ${lawNumber}`,
            content: lawContent
        });
    }

    return laws;
}