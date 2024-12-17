const pdf = require("pdf-parse");
const fs = require("node:fs");

module.exports = async function parseSantaCruzPDF(pdfBuffer) {
    try {
        const pdfData = await pdf(pdfBuffer);
        let text = pdfData.text;

        text = text.replace(/BOLETÍN OFICIAL\nRÍO GALLEGOS, \d{1,2} de \w+ de \d{4}\.-\nAÑO \w+ N[º°] \d{4}\nBOLETÍN OFICIAL\nGOBIERNO DE LA PROVINCIA DE SANTA CRUZ\nMINISTERIO DE LA SECRETARÍA GENERAL DE LA GOBERNACIÓN/g, '\n') // eliminates the page header
            .replace(/Pág\. \d{1,3}/g, '\n') // eliminates page numbers
            .replace(/SUMARIO\n[\s\S]*/g, '').trim() // eliminates the SUMARIO section
            .replace(/([a-zA-ZáéíóúÁÉÍÓÚüÜñÑ])-\n([a-zA-ZáéíóúÁÉÍÓÚüÜñÑ])/g, '$1$2') // joins words separated by a hyphen
            .replace(/\s*\n/g, '\n'); //replaces multiple spaces and line brake for one line break

        const sectionRegex = /^(LEYES\n|DECRETOS\n|DECRETOS SINTETIZADOS\n|RESOLUCI[OÓ]N(?:ES)?(?: [A-Za-zÁÉÍÓÚ.-]+)*\n|DECLARACI[OÓ]N(?:ES)?(?: [A-Za-zÁÉÍÓÚ.-]+)*\n|DISPOSICI[OÓ]N(?:ES)?(?: [A-Za-zÁÉÍÓÚ.-]+)*\n|EDICTOS\n|AVISOS?\n|LICITACIONES\n|CONVOCATORIAS\n|DEUDORES ALIMENTARIOS\n|C[EÉ]DULAS DE NOTIFICACIONES\n)((?:(?!^(LEYES\n|DECRETOS\n|DECRETOS SINTETIZADOS\n|RESOLUCI[OÓ]N(?:ES)?(?: [A-Za-zÁÉÍÓÚ.-]+)*\n|DECLARACI[OÓ]N(?:ES)?(?: [A-Za-zÁÉÍÓÚ.-]+)*\n|DISPOSICI[OÓ]N(?:ES)?(?: [A-Za-zÁÉÍÓÚ.-]+)*\n|EDICTOS\n|AVISOS?\n|LICITACIONES\n|CONVOCATORIAS\n|DEUDORES ALIMENTARIOS\n|C[EÉ]DULAS DE NOTIFICACIONES\n)).|\n)+)/gms;

        const sections = [];

        let match;

        while ((match = sectionRegex.exec(text)) !== null) {
            const sectionName = match[1].trim();
            const sectionContent = match[2].trim();
            sections.push({
                sectionName: sectionName,
                sectionContent: sectionContent
            });
        }

        const sectionProcessors = {
            'LEYES': processLaws,
            'DECRETOS SINTETIZADOS': processSynthesizedDecrees,
            'RESOLUCIONES': processResolutions,
            'DISPOSICIONES': processDispositions,
            'EDICTOS': processEdicts,
            'AVISOS': processAvisos,
            'CONVOCATORIAS': processCalls,
        };

        let content = [];
        sections.forEach(({sectionName, sectionContent}) => {
            const originalSectionName = sectionName;
            if (/RESOLUCI[ÓO]N|RESOLUCI[ÓO]NES/.test(sectionName)) {
                sectionName = 'RESOLUCIONES';  // group all resolutions under the same section name
            } else if (/DISPOSICI[ÓO]N|DISPOSICI[ÓO]NES/.test(sectionName)) {
                sectionName = 'DISPOSICIONES';
            }
            const processor = sectionProcessors[sectionName];
            if (processor) {
                content.push(...processor(originalSectionName, sectionContent));
            }
        });

        return content;
    } catch (error) {
        console.error("Error al procesar el PDF:", error);
        return [];
    }
}

function processLaws(sectionName, content) {
    content = content.replace(/__+\n/g, ''); //strip underscores
    const regex1 = /(^LEY N[º°] \d+\n)([\s\S]*?)(?=(^LEY N[º°] \d+\n))/gm;
    let match;
    const laws = [];

    while ((match = regex1.exec(content)) !== null) {
        const law = {
            title: 'Auditoría Legislativa - ' + 'LEYES - ' + match[1].trim(),
            content: match[2].trim(),
        };

        laws.push(law);
    }

    content = content.replace(regex1, '');

    const regex2 = /(^LEY N[º°] \d+\n)([\s\S]*)/gm;
    const lastLaw = regex2.exec(content);

    if (lastLaw) {
        const law = {
            title: 'Auditoría Legislativa - ' + `${sectionName} - ` + lastLaw[1].trim(),
            content: lastLaw[2].trim(),
        };
        laws.push(law);
    }

    return laws;
}

function processSynthesizedDecrees(sectionName, content) {
    content = content.replace(/__+\n/g, ''); //strip underscores
    const regex1 = /(^DECRETO N[º°] \d+\n)([\s\S]*?)(?=(^DECRETO N[º°] \d+\n))/gm
    let match;
    const decrees = [];

    while ((match = regex1.exec(content)) !== null) {
        const decree = {
            title: 'Auditoría Legislativa - ' + `${sectionName} - ` + match[1].trim(),
            content: match[2].trim(),
        };

        decrees.push(decree);
    }

    content = content.replace(regex1, '');

    const regex2 = /(^DECRETO N[º°] \d+\n)([\s\S]*)/gm
    const lastDecree = regex2.exec(content);

    if (lastDecree) {
        const decree = {
            title: 'Auditoría Legislativa - ' + 'DECRETOS SINTETIZADOS - ' + lastDecree[1].trim(),
            content: lastDecree[2].trim(),
        };
        decrees.push(decree);
    }

    return decrees;
}

function processResolutions(sectionName, content) {
    content = content.replace(/__+\n/g, ''); //strip underscores
    const regex1 = /(^RESOLUCI[ÓO]N N[º°] \d+\n)([\s\S]*?)(?=(^RESOLUCI[ÓO]N N[º°] \d+\n))/gm
    let match;
    const resolutions = [];

    while ((match = regex1.exec(content)) !== null) {
        const resolution = {
            title: 'Auditoría Legislativa - ' + `${sectionName} - ` + match[1].trim(),
            content: match[2].trim(),
        };

        resolutions.push(resolution);
    }

    content = content.replace(regex1, '');

    const regex2 = /(^RESOLUCI[ÓO]N N[º°] \d+\n)([\s\S]*)/gm
    const lastResolution = regex2.exec(content);

    if (lastResolution) {
        const resolution = {
            title: 'Auditoría Legislativa - ' + `${sectionName} - ` + lastResolution[1].trim(),
            content: lastResolution[2].trim(),
        };
        resolutions.push(resolution);
    }

    return resolutions;
}

function processDispositions(sectionName, content) {
    content = content.replace(/__+\n/g, ''); //strip underscores
    const regex1 = /(^DISPOSICI[ÓO]N N[º°] \d+\n)([\s\S]*?)(?=(^DISPOSICI[ÓO]N N[º°] \d+\n))/gm
    let match;
    const dispositions = [];

    while ((match = regex1.exec(content)) !== null) {
        const disposition = {
            title: 'Auditoría Legislativa - ' + `${sectionName} - ` + match[1].trim(),
            content: match[2].trim(),
        };

        dispositions.push(disposition);
    }

    content = content.replace(regex1, '');

    const regex2 = /(^DISPOSICI[ÓO]N N[º°] \d+\n)([\s\S]*)/gm
    const lastDisposition = regex2.exec(content);

    if (lastDisposition) {
        const disposition = {
            title: 'Auditoría Legislativa - ' + `${sectionName} - ` + lastDisposition[1].trim(),
            content: lastDisposition[2].trim(),
        };
        dispositions.push(disposition);
    }
    return dispositions;
}

function processEdicts(sectionName, content) {
    content = content.replace(/__+\n/g, '')//strip underscores
        .replace(/E D I C T O\n/g, 'EDICTO\n') // standardize
        .replace(/A V I S O\n/g, 'AVISO\n');

    const regex1 = /(^\s?EDICTO(?: JUDICIAL(?: N[º°] \d{1,4}\/\d{4})?| N[º°] \d{1,4}\/\d{4}| N[º°] \d+| N[º°]\/\d+| N[º°] \d+\/\d+)?\n|^AVISO DE LEY\n|^AVISO\n^“[A-ZÁÉÍÓÚ\.\s]+”\n|^AVISO\n)([\s\S]*?)(?=(^\s?EDICTO(?: JUDICIAL(?: N[º°] \d{1,4}\/\d{4})?| N[º°] \d{1,4}\/\d{4}| N[º°] \d+| N[º°]\/\d+| N[º°] \d+\/\d+)?\n|^AVISO DE LEY\n|^AVISO\n^“[A-ZÁÉÍÓÚ\.\s]+”\n|^AVISO\n))/gm;
    let match;
    const edicts = [];

    while ((match = regex1.exec(content)) !== null) {
        const edict = {
            title: 'Auditoría Legislativa - ' + 'EDICTOS - ' + match[1].replace(/\n/,' ').trim(),
            content: match[2].trim(),
        };

        edicts.push(edict);
    }

    content = content.replace(regex1, '');

    const regex2 = /(^\s?EDICTO(?: JUDICIAL(?: N[º°] \d{1,4}\/\d{4})?| N[º°] \d{1,4}\/\d{4}| N[º°] \d+| N[º°]\/\d+| N[º°] \d+\/\d+)?\n|^AVISO DE LEY\n|^AVISO\n^“[A-ZÁÉÍÓÚ\.\s]+”\n|^AVISO\n)([\s\S]*)/gm;
    const lastEdict = regex2.exec(content);

    if (lastEdict) {
        const edict = {
            title: 'Auditoría Legislativa - ' + `${sectionName} - ` + lastEdict[1].replace(/\n/,' ').trim(),
            content: lastEdict[2].trim(),
        };
        edicts.push(edict);
    }

    return edicts;
}

function processAvisos(sectionName, content) {
    content = content.replace(/__+\n/g, '')//strip underscores
        .replace(/A V I S O\n/g, 'AVISO\n')
        .replace(/^Provincia de Santa Cruz\nMinisterio de Salud y Ambiente\nSecretar[ií]a de Estado de Ambiente/gm, 'Provincia de Santa Cruz - Ministerio de Salud y Ambiente - Secretaría de Estado de Ambiente')
        .replace(/^Ministerio de Energ[ií]a y Miner[ií]a\nSecretar[ií]a de Recursos H[ií]dricos\nProvincia de Santa Cruz/gm, 'Provincia de Santa Cruz - Ministerio de Energía y Minería - Secretaría de Recursos Hídricos'); // standardize

    const regex1 = /(^AVISO\n|^AVISO [A-ZÁÉÍÓÚ\.\s]+\n^“[A-ZÁÉÍÓÚ\.\s]+”\n|^AVISO [A-ZÁÉÍÓÚ]*?\n|^CONSTITUCI[OÓ]N DE SOCIEDAD\n|^Art\.? \d+[º°] – Ley \d+\n|^Provincia de Santa Cruz - Ministerio de Salud y Ambiente - Secretaría de Estado de Ambiente\n|^Provincia de Santa Cruz - Ministerio de Energía y Minería - Secretaría de Recursos Hídricos\n)([\s\S]*?)(?=(^AVISO\n|^AVISO [A-ZÁÉÍÓÚ\.\s]+\n^“[A-ZÁÉÍÓÚ\.\s]+”\n|^AVISO [A-ZÁÉÍÓÚ]*?\n|^CONSTITUCI[OÓ]N DE SOCIEDAD\n|^Art\.? \d+[º°] – Ley \d+\n|^Provincia de Santa Cruz - Ministerio de Salud y Ambiente - Secretaría de Estado de Ambiente\n|^Provincia de Santa Cruz - Ministerio de Energía y Minería - Secretaría de Recursos Hídricos\n))/gm;
    let match;
    const avisos = [];

    while ((match = regex1.exec(content)) !== null) {
        const aviso = {
            title: 'Auditoría Legislativa - ' + `${sectionName} - ` + match[1].replace(/\n/, ' ').trim(),
            content: match[2].trim(),
        };

        avisos.push(aviso);
    }

    content = content.replace(regex1, '');

    const regex2 = /(^AVISO\n|^AVISO [A-ZÁÉÍÓÚ\.\s]+\n^“[A-ZÁÉÍÓÚ\.\s]+”\n|^AVISO [A-ZÁÉÍÓÚ]*?\n|^CONSTITUCI[OÓ]N DE SOCIEDAD\n|^Art\.? \d+[º°] – Ley \d+\n|^Provincia de Santa Cruz - Ministerio de Salud y Ambiente - Secretaría de Estado de Ambiente\n|^Provincia de Santa Cruz - Ministerio de Energía y Minería - Secretaría de Recursos Hídricos\n)([\s\S]*)/gm;
    const lastAviso = regex2.exec(content);

    if (lastAviso) {
        const aviso = {
            title: 'Auditoría Legislativa - ' + `${sectionName} - ` + lastAviso[1].replace(/\n/, ' ').trim(),
            content: lastAviso[2].trim(),
        };
        avisos.push(aviso);
    }

    return avisos;

}

function processCalls(sectionName, content) {
    content = content.replace(/__+\n/g, '');//strip underscores
    const regex1 = /(^CONVOCATORIA\n^“?[A-ZÁÉÍÓÚÑ\.\s]+”?\n|^CONVOCATORIA [A-ZÁÉÍÓÚÑ\.\s]+\n^“?[A-ZÁÉÍÓÚÑ\.\s]+”?\n|^ASAMBLEA EXTRAORDINARIA\n)([\s\S]*?)(?=(^CONVOCATORIA\n^“?[A-ZÁÉÍÓÚÑ\.\s]+”?\n|^CONVOCATORIA [A-ZÁÉÍÓÚÑ\.\s]+\n^“?[A-ZÁÉÍÓÚÑ\.\s]+”?\n|^ASAMBLEA EXTRAORDINARIA\n))/gm;
    let match;
    const calls = [];

    while ((match = regex1.exec(content)) !== null) {
        let title = match[1].replace('\n', ' ').trim();
        const call = {
            title: 'Auditoría Legislativa - ' + `${sectionName} - ` + title,
            content: match[2].trim(),
        };

        calls.push(call);
    }

    content = content.replace(regex1, '');

    const regex2 = /(^CONVOCATORIA\n^“?[A-ZÁÉÍÓÚÑ\.\s]+”?\n|^CONVOCATORIA [A-ZÁÉÍÓÚÑ\.\s]+\n^“?[A-ZÁÉÍÓÚÑ\.\s]+”?\n|^ASAMBLEA EXTRAORDINARIA\n)([\s\S]*)/gm;

    const lastCall = regex2.exec(content);

    if (lastCall) {
        let title = lastCall[1].replace('\n', ' ').trim();
        const call = {
            title: 'Auditoría Legislativa - ' + `${sectionName} - ` + title,
            content: lastCall[2].trim(),
        };
        calls.push(call);
    }

    return calls;
}