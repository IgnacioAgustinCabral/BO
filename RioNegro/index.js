const pdf = require("pdf-parse");
module.exports = async function parseRioNegroPDF(pdfBuffer) {
    const pdfData = await pdf(pdfBuffer);
    let text = pdfData.text;

    text = text.replace(/Firmado Digitalmente por [\s\S]*?$/gm, '') //eliminates page header
        .replace(/BOLET[IÍ]N OFICIAL N[º°][\s\S]*?de \w+ de \d+\n/gm, '') //eliminates page footer
        .replace(/- Rep[uú]blica Argentina -[\s\S]*?CONTACTOS BOLET[IÍ]N OFICIAL\n/gm, '') //eliminates first two pages
        .replace(/ {2,}/gm, ' ')
        .replace(/\n{2,}/gm, '\n')

    let sections = [];
    const sectionsRegex = /(SECCI[OÓ]N ADMINISTRATIVA|SECCI[OÓ]N JUDICIAL|SECCI[OÓ]N COMERCIO, INDUSTRIA\nY ENTIDADES CIVILES)([\s\S]*?)(?=(SECCI[OÓ]N ADMINISTRATIVA|SECCI[OÓ]N JUDICIAL|SECCI[OÓ]N COMERCIO, INDUSTRIA\nY ENTIDADES CIVILES|$))/g;

    let match;
    while (match = sectionsRegex.exec(text)) {
        sections.push({
            sectionTitle: match[1].replace(/SECCION/g, 'SECCIÓN'),
            sectionText: match[2]
        });
    }

    for (let section of sections) {
        if (section.sectionTitle === 'SECCIÓN ADMINISTRATIsVA') {
            break;
        } if (section.sectionTitle === 'SECCIÓN JUDICIAL') {
            break;
        } else {
            break;
        }
    }

    return 'asd';
}