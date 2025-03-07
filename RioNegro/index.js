const pdf = require("pdf-parse");
const {
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
} = require('./utils/processSeccionAdministrativa.js');
module.exports = async function parseRioNegroPDF(pdfBuffer) {
    const pdfData = await pdf(pdfBuffer);
    let text = pdfData.text;
    const administrativeSectionsNames = {
        'LEY': processLaws,
        'LEYES': processLaws,
        'DECRETOS': processDecrees,
        'DECRETOS SINTETIZADOS': processSynthesizedDecrees,
        'RESOLUCIONES': processResolutions,
        'FALLOS': processFallos,
        'DISPOSICIONES': processDisposiciones,
        // 'DISPOSICIÓN': 'Disposición',
        'LICITACIONES': processLicitaciones,
        'CONCURSOS': processConcursos,
        'COMUNICADOS': processComunicados,
        'EDICTOS LEY PIERRI': processEdictosLeyPierri,
        'EDICTOS NOTIFICATORIOS': processEdictosNotificatorios,
        // 'REGISTRO REDAM': 'Registro Redam',
        'EDICTOS DE MINERÍA': processEdictosMineria,
        'EDICTOS DE MENSURA': processEdictosMensura,
        'EDICTO DPA': processEdictosDPA,
        'EDICTOS D.P.A.': processEdictosDPA,
        'EDICTO D.P.A.': processEdictosDPA,
        'EDICTOS I.P.P.V.': processEdictosIPPV,
        'EDICTO I.P.P.V.': processEdictosIPPV,
        'NÓMINA PREADJUDICATARIOS DE VIVIENDAS': processNomina
    };

    text = text.replace(/Firmado Digitalmente por [\s\S]*?$/gm, '') //eliminates page header
        .replace(/BOLET[IÍ]N OFICIAL N[º°][\s\S]*?de \w+ de \d+\n/gm, '') //eliminates page footer
        .replace(/- Rep[uú]blica Argentina -[\s\S]*?CONTACTOS BOLET[IÍ]N OFICIAL\n/gm, '') //eliminates first two pages
        .replace(/ {2,}/gm, ' ')
        .replace(/\n{2,}/gm, '\n')
        .replace(/Secretar[ií]a Legal y T[eé]cnica - Direcci[oó]n de Despacho y Bolet[ií]n Oficial[\s\S]*?BOLET[IÍ]N OFICIAL/gm, '') //eliminates last page final text
        .replace(/ \n/g, '\n')
        .replace(/Sanciona con Fuerza de\nLEY/g, 'Sanciona con Fuerza de Ley');

    let sections = [];
    const sectionsRegex = /(SECCI[OÓ]N ADMINISTRATIVA|SECCI[OÓ]N JUDICIAL|SECCI[OÓ]N COMERCIO, INDUSTRIA\nY ENTIDADES CIVILES)([\s\S]*?)(?=(SECCI[OÓ]N ADMINISTRATIVA|SECCI[OÓ]N JUDICIAL|SECCI[OÓ]N COMERCIO, INDUSTRIA\nY ENTIDADES CIVILES|$))/g;

    let match;
    while (match = sectionsRegex.exec(text)) {
        sections.push({
            sectionTitle: match[1].replace(/SECCION/g, 'SECCIÓN'),
            sectionText: match[2]
        });
    }

    let content = [];

    for (let section of sections) {
        if (section.sectionTitle === 'SECCIÓN ADMINISTRATIVA') {
            const administrativeSections = getSections(section.sectionText);

            administrativeSections.forEach(section => {
                const processSection = administrativeSectionsNames[section.administrativeSectionTitle];

                if (processSection) {
                    const data = processSection(section.administrativeSectionText.trim());
                    content = content.concat(data);
                }
            });
        }
        if (section.sectionTitle === 'SECCIÓN JUDICIAL') {
            break;
        } else {
            break;
        }
    }

    return content;
};