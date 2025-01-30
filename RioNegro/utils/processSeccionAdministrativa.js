function getSections(text) {
    let sections = [];
    const sectionsRegex = /(LEY\n|LEYES\n|DECRETOS\n|DECRETOS SINTETIZADOS\n|RESOLUCIONES\n|FALLOS\n|DISPOSICIONES\n|DISPOSICIÓN\n|LICITACIONES\n|CONCURSO DE PRECIOS\n|CONCURSOS\n|COMUNICADOS\n|CONTRATACI[OÓ]N DIRECTA\n|EXPURGO DOCUMENTAL|EDICTOS LEY PIERRI\n|EDICTOS NOTIFICATORIOS\n|REGISTRO REDAM\n|EDICTOS DE MINERÍA\n|EDICTOS DE MENSURA\n|EDICTO DPA\n|EDICTOS D\.P\.A\.\n|EDICTO D\.P\.A\.\n|EDICTOS I\.P\.P\.V\.\n|EDICTO I\.P\.P\.V\.\n|NÓMINA PREADJUDICATARIOS DE VIVIENDAS\n)([\s\S]+?)(?=(LEY\n|LEYES\n|DECRETOS\n|DECRETOS SINTETIZADOS\n|RESOLUCIONES\n|FALLOS\n|DISPOSICIONES\n|DISPOSICIÓN\n|LICITACIONES\n|CONCURSO DE PRECIOS\n|CONCURSOS\n|COMUNICADOS\n|CONTRATACI[OÓ]N DIRECTA\n|EXPURGO DOCUMENTAL|EDICTOS LEY PIERRI\n|EDICTOS NOTIFICATORIOS\n|REGISTRO REDAM\n|EDICTOS DE MINERÍA\n|EDICTOS DE MENSURA\n|EDICTO DPA\n|EDICTOS D\.P\.A\.\n|EDICTO D\.P\.A\.\n|EDICTOS I\.P\.P\.V\.\n|EDICTO I\.P\.P\.V\.\n|NÓMINA PREADJUDICATARIOS DE VIVIENDAS\n))/g;
    let match;
    while (match = sectionsRegex.exec(text)) {
        sections.push({
            administrativeSectionTitle: match[1].replace(/\n/g, ''),
            administrativeSectionText: match[2]
        });
    }

    return sections;
}

function processLaws(text) {
    const lawsRegex = /([\s\S]+?)(?=–—oOo—–|$)/g;

    let laws = [];
    let match;

    while ((match = lawsRegex.exec(text)) !== null) {
        let lawContent = match[0].replace(/–—oOo—–/g, '')
            .replace(/^(Art[ií]culo)([\s\S]*?)(?=^(Art[ií]culo))/gm, match => {
                return match.replace(/\n/g, ' ')
                    .replace(/$/g, '\n\n');
            })
            .replace(/([a-z]+\))/gm, '\n$1')
            .trim();
        let lawNumber = lawContent.match(/LEY N[º°] (\d+)/)[1];

        laws.push({
            title: `Auditoría Legislativa - LEYES - LEY Nº ${lawNumber}`,
            content: lawContent
        });
    }

    return laws;
}

function processResolutions(text) {
    const resolutionRegex = /([\s\S]+?)(?=–—oOo—–|––O––|$)/g;

    let resolutions = [];
    let match;
    while ((match = resolutionRegex.exec(text)) !== null) {
        let resolutionContent = match[0].replace(/–—oOo—–|––O––/g, '')
            .replace(/^[Qq]ue[\s\S]*?;\n/gm, match => {
                return match.replace(/\n/g, ' ')
                    .replace(/$/g, '\n\n');
            })
            .replace(/^(Art[ií]culo)([\s\S]*?)(?=^(Art[ií]culo))/gm, match => {
                return match.replace(/\n/g, ' ')
                    .replace(/$/g, '\n\n');
            }).trim();

        resolutions.push({
            title: `Auditoría Legislativa - RESOLUCIONES - RESOLUCIÓN`,
            content: resolutionContent
        });
    }

    return resolutions;
}

function processLicitaciones(text) {
    const licitacionRegex = /([\s\S]+?)(?=–—oOo—–|––O––|$)/g;

    let licitaciones = [];
    let match;

    while ((match = licitacionRegex.exec(text)) !== null) {
        let licitacionContent = match[0].replace(/–—oOo—–|––O––/g, '').trim();
        licitaciones.push({
            title: `Auditoría Legislativa - LICITACIONES - LICITACIÓN`,
            content: licitacionContent
        });
    }

    return licitaciones;
}

function processConcursos(text) {
    const concursosRegex = /([\s\S]+?)(?=–—oOo—–|––O––|$)/g;

    let concursos = [];
    let match;

    while ((match = concursosRegex.exec(text)) !== null) {
        let concursoContent = match[0].replace(/–—oOo—–|––O––/g, '');
        concursos.push({
            title: `Auditoría Legislativa - CONCURSOS - CONCURSO`,
            content: concursoContent
        });
    }

    return concursos;
}

function processComunicados(text) {
    const comunicadosRegex = /([\s\S]+?)(?=–—oOo—–|$)/g;

    let comunicados = [];
    let match;
    while ((match = comunicadosRegex.exec(text)) !== null) {
        let comunicadoContent = match[0].replace(/–—oOo—–/g, '')
            .replace(/([^\n]+(?:\n(?![A-Z\s]))*)/gm, match => {
                return match.replace(/\n/g, ' ');
            })
            .trim();
        comunicados.push({
            title: `Auditoría Legislativa - COMUNICADOS - COMUNICADO`,
            content: comunicadoContent
        });
    }

    return comunicados;
}

function processEdictosLeyPierri(text) {
    const edictosLeyPierriRegex = /([\s\S]+?)(?=-–—•—–-|$)/g;

    let edicts = [];
    let match;

    while ((match = edictosLeyPierriRegex.exec(text)) !== null) {
        let edictContent = match[0].replace(/-–—•—–-/g, '')
            .replace(/\n/g, ' ')
            .trim();
        edicts.push({
            title: `Auditoría Legislativa - EDICTOS LEY PIERRI - EDICTO`,
            content: edictContent
        });
    }

    return edicts;
}

function processEdictosIPPV(text) {
    const edictosIPPVRegex = /([\s\S]+?)(?=-–—•—–-|–—oOo—–|––O––|$)/g;

    let edicts = [];
    let match;

    while ((match = edictosIPPVRegex.exec(text)) !== null) {
        let edictContent = match[0].replace(/-–—•—–-|––O––/g, '').trim();
        edicts.push({
            title: `Auditoría Legislativa - EDICTOS I.P.P.V. - EDICTO`,
            content: edictContent
        });
    }

    return edicts;
}

function processNomina(text) {
    const nominaRegex = /([\s\S]+?)(?=-–—•—–-|––O––|$)/g;

    let nominas = [];
    let match;

    while ((match = nominaRegex.exec(text)) !== null) {
        let edictContent = match[0].replace(/-–—•—–-|––O––/g, '').trim();
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
        let decreeContent = match[0].replace(/–—oOo—–/g, '')
            .replace(/^[Qq]ue[\s\S]*?;\n/gm, match => {
                return match.replace(/\n/g, ' ')
                    .replace(/$/g, '\n\n');
            })
            .replace(/^(Art[ií]culo)([\s\S]*?)(?=^(Art[ií]culo))/gm, match => {
                return match.replace(/\n/g, ' ')
                    .replace(/$/g, '\n\n');
            })
            .trim();
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
        let decreeContent = match[0].replace(/\n/gm, ' ')
            .trim();
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
        let edictContent = match[0].replace(/-–—•—–-/g, '')
            .replace(/\n/g, ' ')
            .trim();
        edicts.push({
            title: `Auditoría Legislativa - EDICTOS DE MINERÍA - EDICTO`,
            content: edictContent
        });
    }

    return edicts;
}

function processEdictosNotificatorios(text) {
    const edictosNotificatoriosRegex = /([\s\S]+?)(?=-–—•—–-|$)/g;

    let edicts = [];
    let match;

    while ((match = edictosNotificatoriosRegex.exec(text)) !== null) {
        let edictContent = match[0].replace(/-–—•—–-/g, '')
            .replace(/\n/g, ' ')
            .trim();
        edicts.push({
            title: `Auditoría Legislativa - EDICTOS NOTIFICATORIOS - EDICTO`,
            content: edictContent
        });
    }

    return edicts;
}

function processFallos(text) {
    const fallosRegex = /([\s\S]+?)(?=-–—•—–-|––O––|$)/g;

    let fallos = [];
    let match;
    while ((match = fallosRegex.exec(text)) !== null) {
        let falloContent = match[0].replace(/-–—•—–-|––O––/g, '')
            .replace(/\n/gm, ' ')
            .trim();
        let falloNumber = falloContent.match(/Fallo “TCRN” N[º°] (\d+)\/\d+/)[1];

        fallos.push({
            title: `Auditoría Legislativa - FALLOS - FALLO N° ${falloNumber}`,
            content: falloContent
        });
    }

    return fallos;
}

function processEdictosMensura(text) {
    const edictosMensuraRegex = /([\s\S]+?)(?=-–—•—–-|$)/g;

    let edicts = [];
    let match;

    while ((match = edictosMensuraRegex.exec(text)) !== null) {
        let edictContent = match[0].replace(/-–—•—–-/g, '')
            .replace(/\n/g, ' ')
            .trim();
        edicts.push({
            title: `Auditoría Legislativa - EDICTOS DE MENSURA - EDICTO`,
            content: edictContent
        });
    }

    return edicts;
}

function processEdictosDPA(text) {
    const edictosDPARegex = /([\s\S]+?)(?=-–—•—–-|$)/g;

    let edicts = [];
    let match;

    while ((match = edictosDPARegex.exec(text)) !== null) {
        let edictContent = match[0].replace(/-–—•—–-/g, '')
            .replace(/\n/g, ' ')
            .trim();
        edicts.push({
            title: `Auditoría Legislativa - EDICTOS D.P.A. - EDICTO`,
            content: edictContent
        });
    }

    return edicts;
}

module.exports = {
    getSections,
    processLaws,
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
    processEdictosMineria,
    processEdictosNotificatorios,
    processFallos,
    processEdictosMensura,
    processEdictosDPA
};