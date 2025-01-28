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
        });
    }

    return resolutions;
}

function processLicitaciones(text) {
    const licitacionRegex = /([\s\S]+?)(?=–—oOo—–|$)/g;

    let licitaciones = [];
    let match;

    while ((match = licitacionRegex.exec(text)) !== null) {
        let licitacionContent = match[0].replace(/–—oOo—–/g, '').trim();
        licitaciones.push({
            title: `Auditoría Legislativa - LICITACIONES - LICITACIÓN`,
            content: licitacionContent
        });
    }

    return licitaciones;
}

function processConcursos(text) {
    const concursosRegex = /([\s\S]+?)(?=Provincia de R[ií]o Negro\n|$)/g;

    let concursos = [];
    let match;

    while ((match = concursosRegex.exec(text)) !== null) {
        concursos.push({
            title: `Auditoría Legislativa - CONCURSOS - CONCURSO`,
            content: match[0]
        });
    }

    return concursos;
}

function processComunicados(text) {
    const comunicadosRegex = /([\s\S]+?)(?=–—oOo—–|$)/g;

    let comunicados = [];
    let match;
    while ((match = comunicadosRegex.exec(text)) !== null) {
        comunicados.push({
            title: `Auditoría Legislativa - COMUNICADOS - COMUNICADO`,
            content: match[0]
        });
    }

    return comunicados;
}

function processEdictosLeyPierri(text) {
    const edictosLeyPierriRegex = /([\s\S]+?)(?=-–—•—–-|$)/g;

    let edicts = [];
    let match;

    while ((match = edictosLeyPierriRegex.exec(text)) !== null) {
        let edictContent = match[0].replace(/-–—•—–-/g, '').trim();
        edicts.push({
            title: `Auditoría Legislativa - EDICTOS LEY PIERRI - EDICTO`,
            content: edictContent
        });
    }

    return edicts;
}

function processEdictosIPPV(text) {
    const edictosIPPVRegex = /([\s\S]+?)(?=-–—•—–-|$)/g;

    let edicts = [];
    let match;

    while ((match = edictosIPPVRegex.exec(text)) !== null) {
        let edictContent = match[0].replace(/-–—•—–-/g, '').trim();
        edicts.push({
            title: `Auditoría Legislativa - EDICTOS I.P.P.V. - EDICTO`,
            content: edictContent
        });
    }

    return edicts;
}

module.exports = {
    getSections,
    processResolutions,
    processLicitaciones,
    processConcursos,
    processComunicados,
    processEdictosLeyPierri,
    processEdictosIPPV
};