function getSections(text) {
    let sections = [];
    const sectionsRegex = /(LEY|DECRETOS|DECRETOS SINTETIZADOS|RESOLUCIONES|FALLOS|DISPOSICIONES|DISPOSICIÓN|LICITACIONES|CONCURSOS|COMUNICADOS|EDICTOS LEY PIERRI|EDICTOS NOTIFICATORIOS|REGISTRO REDAM|EDICTOS DE MINERÍA|EDICTOS DE MENSURA|EDICTO DPA|EDICTOS I\.P\.P\.V\.|NÓMINA PREADJUDICATARIOS DE VIVIENDAS)([\s\S]*?)(?=(LEY|DECRETOS|DECRETOS SINTETIZADOS|RESOLUCIONES|FALLOS|DISPOSICIONES|DISPOSICIÓN|LICITACIONES|CONCURSOS|COMUNICADOS|EDICTOS LEY PIERRI|EDICTOS NOTIFICATORIOS|REGISTRO REDAM|EDICTOS DE MINERÍA|EDICTOS DE MENSURA|EDICTO DPA|EDICTOS I\.P\.P\.V\.|NÓMINA PREADJUDICATARIOS DE VIVIENDAS|$))/g;

    let match;
    while (match = sectionsRegex.exec(text)) {
        sections.push({
            administrativeSectionTitle: match[1],
            administrativeSectionText: match[2]
        });
    }

    return sections;
}

function processResolutions(text) {
    const resolutionRegex = /([\s\S]+?)(?=–—oOo—–|$)/g;

    let resolutions = [];
    let match;
    while ((match = resolutionRegex.exec(text)) !== null) {
        let resolutionContent = match[0].replace(/–—oOo—–/g, '').trim();
        resolutions.push({
            title: `Auditoría Legislativa - RESOLUCIONES - RESOLUCIÓN`,
            content: resolutionContent
        })
    }

    return resolutions;
}


module.exports = {
    getSections,
    processResolutions
};