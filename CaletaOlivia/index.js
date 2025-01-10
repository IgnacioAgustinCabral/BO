const pdf = require("pdf-parse");
module.exports = async function parseCaletaOliviaPDF(pdfBuffer) {
    const pdfData = await pdf(pdfBuffer);
    let text = pdfData.text;
    let articles = [];
    let ordenanzas = [];
    let decrees = [];
    let resolutionsRBT = [];
    let edicts = [];

    text.replace(/COPIA FIEL B\.O N[º°].*$/gm, '')
        .replace(/Edición a cargo de la Subsecretaria de Asuntos Legislativos, \d+ de \w+ de \d+ \(9011\) Caleta Olivia.*$/gm, '')
        .replace(/Los documentos que se publiquen en el Boletín Oficial de la Municipalidad de Caleta Olivia.*$/gm, '')
        .replace(/del Artículo 2° del Código Civil por el mismo efecto de su publicación.*$/gm, '')
        .replace(/DEPARTAMENTO EJECUTIVO MUNICIPAL([\s\S]*)Sra. Paola Daniela Ramos.*$/gm, '')
        .replace(/HONORABLE CONCEJO DELIBERANTE([\s\S]*)Calicate.*$/gm, '')
        .replace(/BOLETÍN OFICIAL CALETA OLIVIA, \d+ de \w+\s*\d+\s*P á g i n a.*$/gm, '')// page header
        .replace(/BOLETÍN OFICIAL([\s\S]*)MUNICIPALIDAD DE CALETA OLIVIA([\s\S]*)AÑO \d+ N[º°] \d+.*$/gm, '')// #333???
        .replace(/AUTORIDADES MUNICIPALES.*$/gm, '')
        .replace(/EDICTOS?[\s\S]*?P[aá]gs?.*$/gm, '')
        .replace(/D E C R E T O S?.*$/gm, '')
        .replace(/D E C R E T O S? S I N T E T I Z A D O S?.*$/gm, '')
        .replace(/E D I C T O S?.*$/gm, '')
        .replace(/EDICTOS?.*$/gm, '')
        .replace(/RESOLUCIONES SINTETIZADAS.*$/gm, '')
        .replace(/RESOLUCIONES BIDEPARTAMENTALES ?\nDE TIERRAS ?\nSINTETIZADAS.*$/gm, '')
        .replace(/ +\n/gm, '\n')
        .replace(/ {2,}/gm, ' ')
        .replace(/\n{2,}/gm, '\n')
        .replace(/O R D E N A N Z A S? S I N T E T I Z A D A S?.*$/gm, '')
        .replace(/(DECRETOS?|DECRETOS? SINTETIZADOS?)\n[\s\S]*?P[aá]gs?.*$/gm, '')
        .replace(/ORDENANZAS ATRASADAS\n[\s\S]*?P[aá]gs?.*$/gm,'')
        .replace(/(ORDENANZAS?|ORDENANZAS? SINTETIZADAS?)\n[\s\S]*?P[aá]gs?.*$/gm, '')
        .replace(/(RESOLUCIONES BIDEPARTAMENTALES DE TIERRAS|RESOLUCIONES BIDEPARTAMENTALES DE TIERRAS SINTETIZADAS|RESOLUCI[OÓ]N BIDEPARTAMENTAL DE TIERRAS|RESOLUCI[OÓ]N BIDEPARTAMENTAL DE TIERRAS SINTETIZADA)\n[\s\S]*?P[aá]gs?.*$/gm, '')
        //sections
        .replace(/(ORDENANZA[\s\S]*?\.[-–])([\s\S]*?)Sr. Pablo (M. )?CARRIZO/gm, (match) => {
            ordenanzas.push(match);
            return '';
        })
        .replace(/(ORDENANZA[\s\S]*?\.[-–])([\s\S]*?)Sr. Facundo BELARDE/gm, (match) => {
            ordenanzas.push(match);
            return '';
        })
        .replace(/^DECRETO N[º°] \d+.*$([\s\S]*?)Sr. Pablo (M. )?CARRIZO/gm, (match) => {
            decrees.push(match);
            return '';
        })
        .replace(/(RESOLUCI[OÓ]N N[º°] [\s\S]*?\.[-–]\n)([\s\S]*?(Sra. Eliana Y. LABADO|Sra. Eliana LABADO|Sra. Eliana LAVADO|Sra. Eliana Y. LAVADO))/gm, (match) => {
            resolutionsRBT.push(match);
            return '';
        })
        .replace(/(MUNI?CIPALIDAD DE CALETA OLIVIA\n)([\s\S]*?)(?=MUNI?CIPALIDAD DE CALETA OLIVIA\n|$)/g, (match) => {
            edicts.push(match);
            return '';
        })

    articles = articles
        .concat(extractOrdenanzas(ordenanzas))
        .concat(extractDecrees(decrees))
        .concat(extractResolutionsRBT(resolutionsRBT))
        .concat(extractEdicts(edicts));

    return articles;
}


function extractOrdenanzas(ordenanzasText) {
    let ordenanzas = [];
    const ordenanzaRegex = /ORDENANZA (MUNICIPAL )?N[º°] ?\d+/;
    ordenanzasText.forEach(ordenanza => {
        const ordenanzaTitle = ordenanza.match(ordenanzaRegex);
        console.log("#####")
        console.log(ordenanzaTitle+'ACA');
        console.log("#####")
        ordenanzas.push({
            title: `Auditoría Legislativa - ORDENANZAS MUNICIPALES - ${ordenanzaTitle[0].trim()}`,
            content: ordenanza.trim()
        })
    })

    return ordenanzas;
}

function extractDecrees(decreesText) {
    let decrees = [];
    const decreeRegex = /(DECRETO N[º°] \d+) (MCO\/24\.-)/;
    decreesText.forEach(decreto => {
        const decreeTitle = decreto.match(decreeRegex);
        decrees.push({
            title: `Auditoría Legislativa - DECRETOS - ${decreeTitle[1].trim()}`,
            content: decreto.trim()
        })
    })

    return decrees;
}

function extractEdicts(edictsText) {
    let edicts = [];
    edictsText.forEach(edict => {
        edicts.push({
            title: 'Auditoría Legislativa - EDICTOS - EDICTO',
            content: edict.trim()
        })
    })

    return edicts;
}

function extractResolutionsRBT(resolutionsRBTText) {
    let resolutionsRBT = [];
    const resolutionRBTRegex = /RESOLUCI[OÓ]N N[º°] \d+/;
    resolutionsRBTText.forEach(resolutionRBT => {
        const resolutionRBTTitle = resolutionRBT.match(resolutionRBTRegex);
        resolutionsRBT.push({
            title: `Auditoría Legislativa - RESOLUCIONES BIDEPARTAMENTALES DE TIERRAS - ${resolutionRBTTitle[0].trim()}`,
            content: resolutionRBT.trim()
        })
    })

    return resolutionsRBT;
}