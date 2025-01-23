const pdf = require("pdf-parse");

module.exports = async function parseComodoroRivadaviaPDF(pdfBuffer) {
    const pdfData = await pdf(pdfBuffer);
    let text = pdfData.text;
    let content = [];

    text = text.replace(/BOLET[IÍ]N OFICIAL[\s\S]*?CUFRE, Ezequiel/g, '')
        .replace(/ {2}/g, ' ')
        .replace(/ \n/g, '\n')

    content = content.concat(getResolutions(text))
        .concat(getOrdenanzas(text))

    return content;
}

function getResolutions(text) {
    const resolutionRegex = /(RESOLUCI[OÓ]N N[º°] (\d+\.\d+))[\s\S]*?\.-\n/g;
    let resolutions = [];

    let match;

    while ((match = resolutionRegex.exec(text)) !== null) {
        let resolutionTitle = match[1].replace(/\./, '').trim()
        let resolutionContent = match[0].trim();

        resolutions.push({
            title: 'Auditoría Legislativa - RESOLUCIÓN - ' + resolutionTitle,
            content: resolutionContent.replace(/^(Art)([\s\S]*?)(?=^(Art|$))/gm, match => {
                return match.replace(/\n(?!Art)/g, ' ')
                    .replace(/$/g, '\n')
            })
                .replace(/\n/g, '\n\n')
                .trim()
        })
    }

    return resolutions;
}

function getOrdenanzas(text) {
    const ordenanzasRegex = /(ORDENANZA N[º°] \d+\.\d+)[\s\S]*?(DADA[\s\S]*?\d+\.\n|$)/g;
    let ordenanzas = [];
    let match;

    while ((match = ordenanzasRegex.exec(text)) !== null) {
        let ordenanzaTitle = match[1].replace(/\./, '').trim()
        let ordenanzaContent = match[0].trim();

        ordenanzas.push({
            title: 'Auditoría Legislativa - ORDENANZA - ' + ordenanzaTitle,
            content: ordenanzaContent.replace(/EL CONCEJO DELIBERANTE DE LA CIUDAD DE COMODORO RIVADAVIA,\nSANCIONA CON FUERZA DE\n\nORDENANZA\n/g, 'EL CONCEJO DELIBERANTE DE LA CIUDAD DE COMODORO RIVADAVIA,SANCIONA CON FUERZA DE ORDENANZA\n') //format this section
                .replace(/ARTICULO([\s\S]*?)(?=(ARTICULO|\.\n))/g, match => {
                    return match.replace(/\n(?!ARTICULO)/g, ' ')// replaces \n except those preceded by ARTICULO
                })
                .replace(/\n/g, '\n\n')
                .replace(/DADA[\s\S]*?\d+\./g, match => {
                    return match.replace(/\n\n/g, ' ') //removes \n\n from section DADA ... 202X.
                })
                .replace(/^\n{2}/gm, '') //removes two \n
                .trim()
        })
    }

    return ordenanzas;
}
