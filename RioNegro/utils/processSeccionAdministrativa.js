function getSections(text) {
    let sections = [];
    const sectionsRegex = /(LEY\n|DECRETOS\n|DECRETOS SINTETIZADOS\n|RESOLUCIONES\n|FALLOS\n|DISPOSICIONES\n|DISPOSICIÓN\n|LICITACIONES\n|CONCURSOS\n|COMUNICADOS\n|EDICTOS LEY PIERRI\n|EDICTOS NOTIFICATORIOS\n|REGISTRO REDAM\n|EDICTOS DE MINERÍA\n|EDICTOS DE MENSURA\n|EDICTO DPA\n|EDICTOS I\.P\.P\.V\.\n|NÓMINA PREADJUDICATARIOS DE VIVIENDAS\n)([\s\S]+?)(?=(LEY\n|DECRETOS\n|DECRETOS SINTETIZADOS\n|RESOLUCIONES\n|FALLOS\n|DISPOSICIONES\n|DISPOSICIÓN\n|LICITACIONES\n|CONCURSOS\n|COMUNICADOS\n|EDICTOS LEY PIERRI\n|EDICTOS NOTIFICATORIOS\n|REGISTRO REDAM\n|EDICTOS DE MINERÍA\n|EDICTOS DE MENSURA\n|EDICTO DPA\n|EDICTOS I\.P\.P\.V\.\n|NÓMINA PREADJUDICATARIOS DE VIVIENDAS\n|$))/g;
    let match;
    while (match = sectionsRegex.exec(text)) {
        sections.push({
            administrativeSectionTitle: match[1].replace(/\n/g, ''),
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

function processNomina(text) {
    const nominaRegex = /([\s\S]+?)(?=-–—•—–-|$)/g;

    let nominas = [];
    let match;

    while ((match = nominaRegex.exec(text)) !== null) {
        let edictContent = match[0].replace(/-–—•—–-/g, '').trim();
        nominas.push({
            title: `Auditoría Legislativa - NÓMINA PREADJUDICATARIOS DE VIVIENDAS - NÓMINA`,
            content: edictContent
        });
    }

    return nominas;
}

function processDecrees(text) {
    const decreesRegex = /([\s\S]+?)(?=–—oOo—–|$)/g;

    let decrees = [];
    let match;
    while ((match = decreesRegex.exec(text)) !== null) {
        let decreeContent = match[0].replace(/–—oOo—–/g, '').trim();
        let decreeNumber = decreeContent.match(/DECRETO N[º°] (\d+)/)[1];
        decrees.push({
            title: `Auditoría Legislativa - DECRETOS - DECRETO Nº ${decreeNumber}`,
            content: decreeContent
        });
    }

    return decrees;
}

function processSynthesizedDecrees(text) {
    const synthesizedDecreesRegex = /DECRETO N[º°] \d+[\s\S]*?(?=(DECRETO N[º°] \d+|$))/g;

    let synthesizedDecrees = [];
    let match;
    while ((match = synthesizedDecreesRegex.exec(text)) !== null) {
        let decreeContent = match[0].trim();
        let decreeNumber = decreeContent.match(/DECRETO N[º°] (\d+)/)[1];
        synthesizedDecrees.push({
            title: `Auditoría Legislativa - DECRETOS SINTETIZADOS - DECRETO Nº ${decreeNumber}`,
            content: decreeContent
        });
    }

    return synthesizedDecrees;
}

function processDisposiciones(text) {
    const disposicionesRegex = /([\s\S]+?)(?=–—oOo—–|$)/g;

    let disposiciones = [];
    let match;
    while ((match = disposicionesRegex.exec(text)) !== null) {
        let dispositionContent = match[0].replace(/–—oOo—–/g, '').trim();
        disposiciones.push({
            title: `Auditoría Legislativa - DISPOSICIONES - DISPOSICIÓN`,
            content: dispositionContent
        });
    }

    return disposiciones;
}

function processEdictosMineria(text) {
    const edictosMineriaRegex = /([\s\S]+?)(?=-–—•—–-|$)/g;

    let edicts = [];
    let match;

    while ((match = edictosMineriaRegex.exec(text)) !== null) {
        let edictContent = match[0].replace(/-–—•—–-/g, '').trim();
        edicts.push({
            title: `Auditoría Legislativa - EDICTOS DE MINERÍA - EDICTO`,
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
    processEdictosIPPV,
    processNomina,
    processDecrees,
    processSynthesizedDecrees,
    processDisposiciones,
    processEdictosMineria
};