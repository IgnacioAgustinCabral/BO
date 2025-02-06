const pdf = require("pdf-parse");
module.exports = async function NeuquenCapitalPDF(pdfBuffer) {
    const pdfData = await pdf(pdfBuffer);
    let text = pdfData.text;

    text = text.replace(/Directora General:[\s\S]*?\(8300\) Neuquén \(Cap\.\)/gm, '')
        .replace(/\t/g, ' ')
        .replace(/ {2,}/g, ' ')
        .replace(/([A-ZÁÉÍÓÚa-záéíóú0-9])-\n/g, '$1')
        .replace(/SIN EXCEPCI[OÓ]N[\s\S]*?[AÁ]rea Corrección[\s\S]*?\./g, '')
        .replace(/SUMARIO[\s\S]*?Boletín Oficial y Archivo\.\n/g, '')
        .replace(/INFORMACI[OÓ]N IMPORTANTE[\s\S]*?edición siguiente\.\n/g, '');

    const regex = /(P[AÁ]GINA \d+[\s\S]*?BOLET[IÍ]N OFICIAL\n)([\s\S]*?)(?=(P[AÁ]GINA \d+[\s\S]*?BOLET[IÍ]N OFICIAL\n|$))/g;

    const titlesRegex = /(DIRECCI[OÓ]N PROVINCIAL DE MINER[ÍI]A|CONTRATOS|LICITACIONES|CONVOCATORIAS|EDICTOS|AVISOS|NORMAS LEGALES|LEYES DE LA PROVINCIA|DECRETOS SINTETIZADOS|DECRETOS DE LA PROVINCIA|ACUERDOS DEL TRIBUNAL DE CUENTAS)/;
    let newText = "";

    [...text.matchAll(regex)].forEach(match => {
        let header = match[1];
        let content = match[2].trim();

        // get last row
        const lineas = content.split("\n");
        const lastRow = lineas[lineas.length - 1].trim();

        // if in list put it at the start
        if (titlesRegex.test(lastRow)) {
            content = lastRow + "\n" + content.replace(lastRow, "").trim();
        }

        newText += header + content + "\n\n";
    });

    newText = newText.replace(/\n?P[AÁ]GINA \d+[\s\S]*?BOLET[IÍ]N OFICIAL\n/g, '');

    const sectionsRegex = /(DIRECCI[OÓ]N PROVINCIAL DE MINER[ÍI]A|CONTRATOS|LICITACIONES|CONVOCATORIAS|EDICTOS|AVISOS|NORMAS LEGALES|LEYES DE LA PROVINCIA|DECRETOS SINTETIZADOS|DECRETOS DE LA PROVINCIA|ACUERDOS DEL TRIBUNAL DE CUENTAS)([\s\S]*?)(?=(DIRECCI[OÓ]N PROVINCIAL DE MINER[ÍI]A|CONTRATOS|LICITACIONES|CONVOCATORIAS|EDICTOS|AVISOS|NORMAS LEGALES|LEYES DE LA PROVINCIA|DECRETOS SINTETIZADOS|DECRETOS DE LA PROVINCIA|ACUERDOS DEL TRIBUNAL DE CUENTAS)|$)/g;
    const sections = [];

    let match;

    while ((match = sectionsRegex.exec(newText)) !== null) {
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