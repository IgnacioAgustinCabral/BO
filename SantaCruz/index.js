const pdf = require("pdf-parse");
const getBoldWords = require("../utils/getBold");
const joinBoldWords = require("../utils/joinWords");

module.exports = async function parseSantaCruzPDF(pdfBuffer) {
    try {
        const bold = await getBoldWords(pdfBuffer);
        const boldWords = joinBoldWords(bold);
        const pdfData = await pdf(pdfBuffer);
        let text = pdfData.text;
        const foundHyphenatedWords = [];

        text = text.replace(/([a-zA-ZáéíóúÁÉÍÓÚüÜñÑ“]+)-\n([a-zA-ZáéíóúÁÉÍÓÚüÜñÑ”]+)/g, (match, p1, p2) => {
            foundHyphenatedWords.push(`(${p1})-(${p2})`);
            return `${p1}-${p2}\n`;
        })
            .replace(/SUMARIO\n[\s\S]*/g, '').trim() // eliminates the SUMARIO section
            .replace(/ {2,10}/g, ' ') // replaces multiple spaces for one space
            .replace(/ \n/g, '\n') // replaces space and line brake for one line break


        boldWords.forEach(word => {
            const escapedWord = word.replace(/[[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
            const regex = new RegExp(`(?<!<strong>)${escapedWord}(?!</strong>)`);
            text = text.replace(regex, `<strong>${word}</strong>`);
        });

        foundHyphenatedWords.forEach(word => {
            const regex = new RegExp(word, 'g');
            text = text.replace(regex, '$1$2');
        });

        const sectionRegex = /^(Pág\. \d+\n(?:\s*\n)?)(LEYES\s?\n|LEY\s?\n|DECRETOS COMPLETOS\s?\n|DECRETOS\n|DECRETO COMPLETO\s?\n|DECRETOS SINTETIZADOS\s?\n|RESOLUCI[OÓ]N(?:ES)?(?: [A-Za-zÁÉÍÓÚ.-]+)*\s?\n|DECLARACI[OÓ]N(?:ES)?(?: [A-Za-zÁÉÍÓÚ.-]+)*\s?\n|DISPOSICI[OÓ]N(?:ES)?(?: [A-Za-zÁÉÍÓÚ.-]+)*\s?\n|EDICTOS\s?\n|AVISO(?:S)?\s?\n|LICITACI[OÓ]N(?:ES)?\s?\n|CONVOCATORIAS\n|CONVOCATORIA\n|DEUDORES ALIMENTARIOS\s?\n|C[EÉ]DULA(?:S)? DE NOTIFICACI[OÓ]N(?:ES)?\s?\n)((?:(?!^(Pág\. \d+\n(?:\s*\n)?)(LEYES\s?\n|LEY\s?\n|DECRETOS COMPLETOS\s?\n|DECRETOS\n|DECRETO COMPLETO\s?\n|DECRETOS SINTETIZADOS\s?\n|RESOLUCI[OÓ]N(?:ES)?(?: [A-Za-zÁÉÍÓÚ.-]+)*\s?\n|DECLARACI[OÓ]N(?:ES)?(?: [A-Za-zÁÉÍÓÚ.-]+)*\s?\n|DISPOSICI[OÓ]N(?:ES)?(?: [A-Za-zÁÉÍÓÚ.-]+)*\s?\n|EDICTOS\s?\n|AVISO(?:S)?\s?\n|LICITACI[OÓ]N(?:ES)?\s?\n|CONVOCATORIAS\n|CONVOCATORIA\n|DEUDORES ALIMENTARIOS\s?\n|C[EÉ]DULA(?:S)? DE NOTIFICACI[OÓ]N(?:ES)?\s?\n)).|\n)+)/gms;
        const sections = [];

        let match;

        while ((match = sectionRegex.exec(text)) !== null) {
            const sectionName = match[2].trim();
            const sectionContent = match[3].replace(/(<strong>)?(BOLET[IÍ]N OFICIAL|EDICI[OÓ]N ESPECIAL|SUPLEMENTO BOLET[IÍ]N OFICIAL)(<\/strong>)?\n(<strong>)?R[IÍ]O GALLEGOS, \d{1,2} (<\/strong>)?(<strong>)?de \w+ de \d{4}\.-(<\/strong>)?\n(<strong>)?AÑO \w+ N[º°] \d{4}(<\/strong>)?\n(<strong>)?BOLET[IÍ]N OFICIAL(<\/strong>)?\n(<strong>)?GOBIERNO DE LA PROVINCIA DE SANTA CRUZ(<\/strong>)?\n(<strong>)?MINISTERIO DE LA SECRETAR[IÍ]A GENERAL DE LA GOBERNACI[OÓ]N(<\/strong>)?/g, '\n') // eliminates the page header
                .replace(/Pág\. \d{1,3}/g, '\n') // eliminates page numbers

            sections.push({
                sectionName: sectionName,
                sectionContent: sectionContent
            });
        }

        const sectionProcessors = {
            'LEYES': processLaws,
            'DECRETOS': processDecrees,
            'DECLARACIONES': processDeclarations,
            'RESOLUCIONES': processResolutions,
            'DISPOSICIONES': processDispositions,
            'AVISOS': processAvisos,
            'CONVOCATORIAS': processCalls,
            'EDICTOS': processEdicts,
        };

        let content = [];
        sections.forEach(({sectionName, sectionContent}) => {
            const originalSectionName = sectionName;
            if (/DECRETO ?|DECRETOS ?/.test(sectionName)) {
                sectionName = 'DECRETOS'
            } else if (/RESOLUCI[ÓO]N|RESOLUCI[ÓO]NES/.test(sectionName)) {
                sectionName = 'RESOLUCIONES';  // group all resolutions under the same section name
            } else if (/DISPOSICI[ÓO]N|DISPOSICI[ÓO]NES/.test(sectionName)) {
                sectionName = 'DISPOSICIONES';
            } else if (/DECLARACI[ÓO]N|DECLARACI[ÓO]NES/.test(sectionName)) {
                sectionName = 'DECLARACIONES';
            } else if (/CONVOCATORIAS|CONVOCATORIA/.test(sectionName)) {
                sectionName = 'CONVOCATORIAS';
            } else if (/LEYES|LEY/.test(sectionName)) {
                sectionName = 'LEYES';
            } else if (/CONVOCATORIAS|CONVOCATORIA/.test(sectionName)) {
                sectionName = 'CONVOCATORIAS';
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

function processDecrees(sectionName, content) {
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
            title: 'Auditoría Legislativa - ' + `${sectionName} - ` + lastDecree[1].trim(),
            content: lastDecree[2].trim(),
        };
        decrees.push(decree);
    }

    return decrees;
}

function processResolutions(sectionName, content) {
    content = content.replace(/__+\n/g, ''); //strip underscores
    const regex1 = /(^RESOLUCI[ÓO]N N[º°] \d+\n|^RESOLUCI[ÓO]N N[º°] \d+\/\d+\/\w+\n)([\s\S]*?)(?=(^RESOLUCI[ÓO]N N[º°] \d+\n|^RESOLUCI[ÓO]N N[º°] \d+\/\d+\/\w+\n))/gm
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

    const regex2 = /(^RESOLUCI[ÓO]N N[º°] \d+\n|^RESOLUCI[ÓO]N N[º°] \d+\/\d+\/\w+\n)([\s\S]*)/gm
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
        .replace(/E D I C T O/g, 'EDICTO') // standardize
        .replace(/A V I S O/g, 'AVISO');

    //deletes all the strong tags
    const regex = /(^(<strong>)?\s?EDICTO(?: JUDICIAL(?: N[º°] \d{1,4}\/\d{4})?| N[º°] \d{1,4}\/\d{4}| N[º°] \d+| N[º°]\/\d+| N[º°] \d+\/\d+)?(<\/strong>)?\n|^(<strong>)?EDICTO \d+\/\d+(<\/strong>)?\n|^(<strong>)?AVISO [A-ZÁÉÍÓÚ\s?]*?(<\/strong>)?\n|^(<strong>)?AVISO DE LEY -?[0-9.?]+-?(<\/strong>)?\n|^(<strong>)?AVISO LEY [0-9.?]+(<\/strong>)?\n|^(<strong>)?AVISO LEGAL(<\/strong>)?\n|^(<strong>)?AVISO DE LEY ([-–] )?[0-9.?]+(<\/strong>)?\n|^(<strong>)?AVISO DE LEY(<\/strong>)?\n|^(<strong>)?AVISO(<\/strong>)?\n^(<strong>)?“[A-ZÁÉÍÓÚ\.\s]+”(<\/strong>)?\n|^(<strong>)?AVISO(<\/strong>)?\n|^(<strong>)?AVISO LEGAL LEY [0-9.?]+(<\/strong>)?\n)/gm;

    content = content.replace(regex, match => {
        return match.replace(/<\/?strong>/g, '');
    });

    const regex1 = /(^\s?EDICTO(?: JUDICIAL(?: N[º°] \d{1,4}\/\d{4})?| N[º°] \d{1,4}\/\d{4}| N[º°] \d+| N[º°]\/\d+| N[º°] \d+\/\d+)?\n|^EDICTO \d+\/\d+\n|^AVISO [A-ZÁÉÍÓÚ\s?]*?\n|^AVISO DE LEY -?[0-9.?]+-?\n|^AVISO LEY [0-9.?]+\n|^AVISO LEGAL\n|^AVISO DE LEY ([-–] )?[0-9.?]+\n|^AVISO DE LEY\n|^AVISO\n^“[A-ZÁÉÍÓÚ\.\s]+”\n|^AVISO\n|^AVISO LEGAL LEY [0-9.?]+\n)([\s\S]*?)(?=(^\s?EDICTO(?: JUDICIAL(?: N[º°] \d{1,4}\/\d{4})?| N[º°] \d{1,4}\/\d{4}| N[º°] \d+| N[º°]\/\d+| N[º°] \d+\/\d+)?\n|^EDICTO \d+\/\d+\n|^AVISO [A-ZÁÉÍÓÚ\s?]*?\n|^AVISO DE LEY -?[0-9.?]+-?\n|^AVISO LEY [0-9.?]+\n|^AVISO LEGAL\n|^AVISO DE LEY ([-–] )?[0-9.?]+\n|^AVISO DE LEY\n|^AVISO\n^“[A-ZÁÉÍÓÚ\.\s]+”\n|^AVISO\n|^AVISO LEGAL LEY [0-9.?]+\n))/gm;
    let match;
    const edicts = [];

    while ((match = regex1.exec(content)) !== null) {
        const edict = {
            title: 'Auditoría Legislativa - ' + 'EDICTOS - ' + match[1].replace(/\n/, ' ').trim(),
            content: match[3].trim(),
        };

        edicts.push(edict);
    }

    content = content.replace(regex1, '');

    const regex2 = /(^\s?EDICTO(?: JUDICIAL(?: N[º°] \d{1,4}\/\d{4})?| N[º°] \d{1,4}\/\d{4}| N[º°] \d+| N[º°]\/\d+| N[º°] \d+\/\d+)?\n|^EDICTO \d+\/\d+\n|^AVISO [A-ZÁÉÍÓÚ\s?]*?\n|^AVISO DE LEY -?[0-9.?]+-?\n|^AVISO LEY [0-9.?]+\n|^AVISO LEGAL\n|^AVISO DE LEY ([-–] )?[0-9.?]+\n|^AVISO DE LEY\n|^AVISO\n^“[A-ZÁÉÍÓÚ\.\s]+”\n|^AVISO\n|^AVISO LEGAL LEY [0-9.?]+\n)([\s\S]*)/gm;
    const lastEdict = regex2.exec(content);

    if (lastEdict) {
        const edict = {
            title: 'Auditoría Legislativa - ' + `${sectionName} - ` + lastEdict[1].replace(/\n/, ' ').trim(),
            content: lastEdict[3].trim(),
        };
        edicts.push(edict);
    }

    return edicts;
}

function processAvisos(sectionName, content) {
    content = content.replace(/__+\n/g, '')//strip underscores
        .replace(/A V I S O/g, 'AVISO\n')
        .replace(/^(<strong>)?Provincia de Santa Cruz(<\/strong>)?\n(<strong>)?Ministerio de Salud y Ambiente(<\/strong>)?\n^(<strong>)?Secretar[ií]a de Estado de Ambiente(<\/strong>)?\n/gm, 'Provincia de Santa Cruz - Ministerio de Salud y Ambiente - Secretaría de Estado de Ambiente\n')
        .replace(/^(<strong>)?Ministerio de Energ[ií]a y Miner[ií]a(<\/strong>)?\n(<strong>)?Secretar[ií]a de Recursos H[ií]dricos(<\/strong>)?\n^(<strong>)?Provincia de Santa Cruz(<strong>)?\n/gm, 'Provincia de Santa Cruz - Ministerio de Energía y Minería - Secretaría de Recursos Hídricos\n'); // standardize

    const regex = /(^(<strong>)?AVISO LEGAL LEY [0-9.?]+(<\/strong>)?\n|^(<strong>)?AVISO(<\/strong>)?\n|^(<strong>)?AVISO DE LEY -?[0-9.?]+-?(<\/strong>)?\n|^(<strong>)?AVISO [A-ZÁÉÍÓÚ\.\s]+(<\/strong>)?\n^(<strong>)?“[A-ZÁÉÍÓÚ\.\s]+”(<\/strong>)?\n|^(<strong>)?AVISO [A-ZÁÉÍÓÚ]*?(<\/strong>)?\n|^(<strong>)?CONSTITUCI[OÓ]N DE SOCIEDAD(<\/strong>)?\n|^(<strong>)?Art\.? \d+[º°] – Ley \d+(<\/strong>)?\n|^(<strong>)?Provincia de Santa Cruz - Ministerio de Salud y Ambiente - Secretaría de Estado de Ambiente(<\/strong>)?\n|^(<strong>)?Provincia de Santa Cruz - Ministerio de Energía y Minería - Secretaría de Recursos Hídricos(<\/strong>)?\n)/gm
    content = content.replace(regex, match => {
        return match.replace(/<\/?strong>/g, '');
    });
    const regex1 = /(^AVISO LEGAL LEY [0-9.?]+\n|^AVISO\n|^AVISO DE LEY -?[0-9.?]+-?\n|^AVISO [A-ZÁÉÍÓÚ\.\s]+\n^“[A-ZÁÉÍÓÚ\.\s]+”\n|^AVISO [A-ZÁÉÍÓÚ]*?\n|^CONSTITUCI[OÓ]N DE SOCIEDAD\n|^Art\.? \d+[º°] – Ley \d+\n|^Provincia de Santa Cruz - Ministerio de Salud y Ambiente - Secretaría de Estado de Ambiente\n|^Provincia de Santa Cruz - Ministerio de Energía y Minería - Secretaría de Recursos Hídricos\n)([\s\S]*?)(?=(^AVISO LEGAL LEY [0-9.?]+\n|^AVISO\n|^AVISO DE LEY -?[0-9.?]+-?\n|^AVISO [A-ZÁÉÍÓÚ\.\s]+\n^“[A-ZÁÉÍÓÚ\.\s]+”\n|^AVISO [A-ZÁÉÍÓÚ]*?\n|^CONSTITUCI[OÓ]N DE SOCIEDAD\n|^Art\.? \d+[º°] – Ley \d+\n|^Provincia de Santa Cruz - Ministerio de Salud y Ambiente - Secretaría de Estado de Ambiente\n|^Provincia de Santa Cruz - Ministerio de Energía y Minería - Secretaría de Recursos Hídricos\n))/gm;
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

    const regex2 = /(^AVISO LEGAL LEY [0-9.?]+\n|^AVISO\n|^AVISO DE LEY -?[0-9.?]+-?\n|^AVISO [A-ZÁÉÍÓÚ\.\s]+\n^“[A-ZÁÉÍÓÚ\.\s]+”\n|^AVISO [A-ZÁÉÍÓÚ]*?\n|^CONSTITUCI[OÓ]N DE SOCIEDAD\n|^Art\.? \d+[º°] – Ley \d+\n|^Provincia de Santa Cruz - Ministerio de Salud y Ambiente - Secretaría de Estado de Ambiente\n|^Provincia de Santa Cruz - Ministerio de Energía y Minería - Secretaría de Recursos Hídricos\n)([\s\S]*)/gm;
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
    const regex = /(^(<strong>)?CONVOCATORIA(<\/strong>)?\n^(<strong>)?“?[A-ZÁÉÍÓÚÑ\.\s]+”?(<\/strong>)?\n|^(<strong>)?CONVOCATORIA [A-ZÁÉÍÓÚÑ\.\s]+(<\/strong>)?\n^(<strong>)?“?[A-ZÁÉÍÓÚÑ\.\s]+”?(<\/strong>)?\n|^(<strong>)?CONVOCATORIA(<\/strong>)?\n|^(<strong>)?ASAMBLEA EXTRAORDINARIA(<\/strong>)?\n)/gm

    //todo
    content = content.replace(/__+\n/g, '')//strip underscores
        .replace(regex, match => {
            return match.replace(/<\/?strong>/g, '');
        });

    const regex1 = /(^CONVOCATORIA\n^“?[A-ZÁÉÍÓÚÑ\.\s]+”?\n|^CONVOCATORIA [A-ZÁÉÍÓÚÑ\.\s]+\n^“?[A-ZÁÉÍÓÚÑ\.\s]+”?\n|^CONVOCATORIA\n|^ASAMBLEA EXTRAORDINARIA\n)([\s\S]*?)(?=(^CONVOCATORIA\n^“?[A-ZÁÉÍÓÚÑ\.\s]+”?\n|^CONVOCATORIA [A-ZÁÉÍÓÚÑ\.\s]+\n^“?[A-ZÁÉÍÓÚÑ\.\s]+”?\n|^CONVOCATORIA\n|^ASAMBLEA EXTRAORDINARIA\n))/gm;

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

    const regex2 = /(^CONVOCATORIA\n^“?[A-ZÁÉÍÓÚÑ\.\s]+”?\n|^CONVOCATORIA [A-ZÁÉÍÓÚÑ\.\s]+\n^“?[A-ZÁÉÍÓÚÑ\.\s]+”?\n|^CONVOCATORIA\n|^ASAMBLEA EXTRAORDINARIA\n)([\s\S]*)/gm;

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

function processDeclarations(sectionName, content) {
    content = content.replace(/__+\n/g, ''); //strip underscores
    const regex1 = /(^<strong>DECLARACI[ÓO]N N[º°] \d+<\/strong>\n)([\s\S]*?)(?=(^<strong>DECLARACI[ÓO]N N[º°] \d+<\/strong>\n))/gm;
    let match;
    const declarations = [];

    while ((match = regex1.exec(content)) !== null) {
        const declaration = {
            title: 'Auditoría Legislativa - ' + `${sectionName} - ` + match[1].trim(),
            content: match[2].trim(),
        };

        declarations.push(declaration);
    }

    content = content.replace(regex1, '');

    const regex2 = /(^<strong>DECLARACI[ÓO]N N[º°] \d+<\/strong>\n)([\s\S]*)/gm;
    const lastDeclaration = regex2.exec(content);

    if (lastDeclaration) {
        const declaration = {
            title: 'Auditoría Legislativa - ' + `${sectionName} - ` + lastDeclaration[1].trim(),
            content: lastDeclaration[2].trim(),
        };
        declarations.push(declaration);
    }

    return declarations;
}