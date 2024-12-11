const pdf = require("pdf-parse");

module.exports = async function parseChubutPDF(pdfBuffer) {
    try {
        const pdfData = await pdf(pdfBuffer);
        // Obtener el texto en una sola línea
        let text = pdfData.text;

        text = text.replace(/\s{2,}/g, ' ') //replace 2 or more space for 1 space
            .replace(/FRANQUEO A PAGAR\n(.*?)[Ss]ecci[óo]n [Oo]ficial/s, '') //eliminates this section
            .replace(/([a-zA-ZáéíóúÁÉÍÓÚüÜñÑ])-\n([a-zA-ZáéíóúÁÉÍÓÚüÜñÑ])/g, "$1$2") //joins hyphenated words
            .replace(/BOLET[IÍ]N OFICIAL\n/g, '') //eliminates
            .replace(/P[AÁ]GINA (\d+)\n(Lunes|Martes|Mi[eé]rcoles|Jueves|Viernes|S[aá]bado|Domingo)\s\d{1,2}\sde\s(Enero|Febrero|Marzo|Abril|Mayo|Junio|Julio|Agosto|Septiembre|Octubre|Noviembre|Diciembre)\sde\s\d{4}\n/gs, '') //eliminates page number and date
            .replace(
                /([^\n])\s*(LEY PROVINCIAL|LEYES PROVINCIALES|DECRETO PROVINCIAL|DECRETOS PROVINCIALES|DECRETO SINTETIZADO|DECRETOS SINTETIZADOS|RESOLUCIONES|RESOLUCI[ÓO]N|RESOLUCI[ÓO]NES SINTETIZADAS|RESOLUCI[ÓO]N SINTETIZADA|DISPOSICI[ÓO]N|DISPOSICIONES|ACUERDO|ACUERDOS|DICT[ÁA]MEN|DICT[ÁA]MENES|DISPOSICI[ÓO]N SINTETIZADA|DISPOSICIONES SINTETIZADAS|REGISTRO DE\nPUBLICIDAD OFICIAL|DECLARACIONES|DECLARACI[ÓO]N|Secci[óo]n General)/g,
                (match, precedingText, sectionTitle) => `${precedingText}\n${sectionTitle}`)
            .replace(/RESOLUCIÓN N[º°] 171- EC- AÑO 2024([\s\S]*?)2.580,00\n?/gm, '')//eliminates last section of the pdf
            .replace(/((I: \d+-\d+-\d+ V: \d+-\d+-\d+)|P: \d+-\d+-\d+ y \d+-\d+-\d+|P: \d+-\d+-\d+) ([^\n]+)\n/gm, '$1\n$3\n'); //formats;

        const sectionsRegex = /^(LEY PROVINCIAL\n|LEYES PROVINCIALES\n|DECRETO PROVINCIAL\n|DECRETOS PROVINCIALES\n|DECRETO SINTETIZADO\n|DECRETOS SINTETIZADOS\n|RESOLUCIONES\n|RESOLUCI[ÓO]N\n|RESOLUCI[ÓO]NES SINTETIZADAS\n|RESOLUCI[ÓO]N SINTETIZADA\n|DISPOSICI[ÓO]N\n|DISPOSICIONES\n|ACUERDO\n|ACUERDOS\n|DICT[ÁA]MEN\n|DICT[ÁA]MENES\n|DISPOSICI[ÓO]N SINTETIZADA\n|DISPOSICIONES SINTETIZADAS\n|REGISTRO DE\nPUBLICIDAD OFICIAL\n|DECLARACIONES\n|DECLARACI[ÓO]N\n)([\s\S]*?)(?=^(?!\1)^(LEY PROVINCIAL\n|LEYES PROVINCIALES\n|DECRETO PROVINCIAL\n|DECRETOS PROVINCIALES\n|DECRETO SINTETIZADO\n|DECRETOS SINTETIZADOS\n|RESOLUCIONES\n|RESOLUCI[ÓO]N\n|RESOLUCI[ÓO]NES SINTETIZADAS\n|RESOLUCI[ÓO]N SINTETIZADA\n|DISPOSICI[ÓO]N\n|DISPOSICIONES\n|ACUERDO\n|ACUERDOS\n|DICT[ÁA]MEN\n|DICT[ÁA]MENES\n|DISPOSICI[ÓO]N SINTETIZADA\n|DISPOSICIONES SINTETIZADAS\n|REGISTRO DE\nPUBLICIDAD OFICIAL\n|DECLARACIONES\n|DECLARACI[ÓO]N\n|Secci[óo]n General|$))|(Sección General\n)([\s\S]*)$/gm;
        const sections = [];
        let match;

        const sectionNameMap = {
            'RESOLUCION': 'RESOLUCIÓN',
            'RESOLUCION SINTETIZADA': 'RESOLUCIÓN SINTETIZADA',
            'RESOLUCIÓNES SINTETIZADAS': 'RESOLUCIONES SINTETIZADAS',
            'DISPOSICION SINTETIZADA': 'DISPOSICIÓN',
            'DICTAMENES': 'DICTÁMENES',
            'DISPOSICION': 'DISPOSICIÓN',
            'REGISTRO DE\nPUBLICIDAD OFICIAL': 'REGISTRO DE PUBLICIDAD OFICIAL',
            'Sección General': 'SECCIÓN GENERAL',
        };

        while ((match = sectionsRegex.exec(text)) !== null) {
            const sectionName = match[1]?.trim() || match[4]?.trim();
            const sectionContent = match[2]?.trim() || match[5]?.trim();

            const normalizedSectionName = sectionNameMap[sectionName] || sectionName;

            sections.push({
                sectionName: normalizedSectionName,
                sectionContent
            });
        }

        const sectionProcessors = {
            /*'LEY PROVINCIAL': processProvincialLaws,
            'LEYES PROVINCIALES': processProvincialLaws,
            'DECRETO PROVINCIAL': processProvincialDecrees,
            'DECRETOS PROVINCIALES': processProvincialDecrees,
            'DECRETO SINTETIZADO': processSynthesizedDecrees,
            'DECRETOS SINTETIZADOS': processSynthesizedDecrees,
            'RESOLUCIÓN': processResolutions,
            'RESOLUCIONES': processResolutions,
            'RESOLUCIÓN SINTETIZADA': processSynthesizedResolutions,
            'RESOLUCIONES SINTETIZADAS': processSynthesizedResolutions,
            'DISPOSICIÓN SINTETIZADA': processSynthesizedDisposition,
            'ACUERDOS': processAgreements,
            'DICTÁMENES': processDictamenes,
            'DECLARACIONES': processDeclarations,
            'DISPOSICIÓN': processDispositions,
            'DISPOSICIONES': processDispositions,
            'REGISTRO DE PUBLICIDAD OFICIAL': processOfficialAdvertising,*/
            'SECCIÓN GENERAL': processGeneralSection,
        };

        let content = [];

        sections.forEach(({sectionName, sectionContent}) => {
            const processor = sectionProcessors[sectionName];
            if (processor) {
                content.push(...processor(sectionContent));
            }
        });

        return content;
    } catch (error) {
        console.error("Error al procesar el PDF:", error);
        return [];
    }
}

function processProvincialLaws(sectionContent) {
    const lawRegex = /(?:(?!Lic\. IGNACIO AGUSTÍN TORRES\nDr\. VICTORIANO ERASO PARODI).)+Lic\. IGNACIO AGUSTÍN TORRES\nDr\. VICTORIANO ERASO PARODI/gs;
    const lawTitleRegex = /^LEY [IVXLCDM]+ N[º°] \d+\n/gm;
    const lawDecreeNumberRegex = /Decreto N[º°] \d+\n/gm;
    const laws = [];

    let match;
    while ((match = lawRegex.exec(sectionContent)) !== null) {
        let lawContent = match[0].trim();
        let titleMatch;

        while ((titleMatch = lawTitleRegex.exec(lawContent)) !== null) {
            let lawDecreeNumberMatch;

            while ((lawDecreeNumberMatch = lawDecreeNumberRegex.exec(lawContent)) !== null) {
                laws.push({
                    title: 'Auditoría Legislativa - ' + 'Ley Provincial - ' + titleMatch[0].trim() + ' ' + lawDecreeNumberMatch[0].trim(),
                    content: lawContent
                });
            }
        }
    }

    return laws;
}


function processProvincialDecrees(sectionContent) {
    const decrees = [];
    const provincialDecreeRegex = /PODER EJECUTIVO(.*?)(?=PODER EJECUTIVO|$)/gs;
    const decreeTitleRegex = /Decreto\.? N° \d{1,4}\n/g;

    let match;
    while ((match = provincialDecreeRegex.exec(sectionContent)) !== null) {
        let decreeContent = match[0].trim();
        let titleMatch;

        while ((titleMatch = decreeTitleRegex.exec(decreeContent)) !== null) {
            decrees.push({
                title: 'Auditoría Legislativa - ' + 'Decreto Pronvincial - ' + titleMatch[0].trim(),
                content: decreeContent
            });
        }
    }

    return decrees;
}

function formatSection(sectionContent, regex) {
    const lines = sectionContent.split('\n'); // divide text into lines
    const formattedLines = [];

    for (const line of lines) {
        const match = line.match(regex);
        if (match) {
            if (match[1] && match[2] && match[3]) {
                formattedLines.push(`${match[1]}${match[2]}\n${match[3]}`);
            } else if (match[4] && match[5] && match[6]) {
                formattedLines.push(`${match[4]}${match[5]}\n${match[6]}`);
            }
        } else {
            formattedLines.push(line);
        }
    }

    return formattedLines.join('\n');
}

function processSynthesizedDecrees(sectionContent) {
    const regex = /(Dto\. N[º°] )(\d{1,4})(\d{2}-\d{2}-\d{2})/;
    const formattedContent = formatSection(sectionContent, regex);
    const synthesizedDecrees = [];
    const synthesizedDecreeRegex = /Dto\. N° \d{1,4}(.*?)(?=Dto\. N° \d{1,4}|$)/gs;
    const decreeRegex = /Dto\. N° \d{4}\n/gs;

    let match;
    while ((match = synthesizedDecreeRegex.exec(formattedContent)) !== null) {
        let synthesizedDecreeContent = match[0].trim();
        let titleMatch;

        while ((titleMatch = decreeRegex.exec(synthesizedDecreeContent)) !== null) {
            synthesizedDecrees.push({
                title: 'Auditoría Legislativa - ' + 'Decreto Sintetizado - ' + titleMatch[0].trim(),
                content: synthesizedDecreeContent
            });
        }
    }

    return synthesizedDecrees;
}

function replaceSubsectionTitles(content, replacements) {
    const regex = new RegExp(Object.keys(replacements).join('|'), 'gs');

    return content.replace(regex, match => replacements[match]);
}

function getSubsections(formattedContent, subsectionRegex) {
    const subsections = [];
    let match;

    while ((match = subsectionRegex.exec(formattedContent)) !== null) {
        let subsectionName = match[1].trim();
        let subsectionContent = match[2].trim();

        subsections.push({
            subsectionName,
            subsectionContent
        });
    }

    return subsections;
}


function processSynthesizedResolutions(sectionContent) {
    const regex = /(Res\. N[º°] ?)([IVXLCDM]+-\d+|\d+)\s?(\d{2}-\d{2}-\d{2})|(Res\. Conjs\. N[º°] )(\d+ MSyJ y \d+ MDH)\s?(\d{2}-\d{2}-\d{2})/;
    const formattedContent = formatSection(sectionContent, regex);
    const replacements = {
        'INSTITUTO PROVINCIAL DE LA VIVIENDA\nY DESARROLLO URBANO\n': 'INSTITUTO PROVINCIAL DE LA VIVIENDA Y DESARROLLO URBANO\n',
        'INSTITUTO PROVINCIAL DE LA VIVIENDA Y\nDESARROLLO URBANO\n': 'INSTITUTO PROVINCIAL DE LA VIVIENDA Y DESARROLLO URBANO\n',
        'RESOLUCIÓN CONJUNTA\nMINISTERIO DE SEGURIDAD Y JUSTICIA\nY MINISTERIO DE DESARROLLO HUMANO\n': 'RESOLUCIÓN CONJUNTA MINISTERIO DE SEGURIDAD Y JUSTICIA Y MINISTERIO DE DESARROLLO HUMANO\n',
        'SECRETARÍA DE INFRAESTRUCTURA,\nENERGÍA Y PLANIFICACIÓN\n': 'SECRETARÍA DE INFRAESTRUCTURA, ENERGÍA Y PLANIFICACIÓN\n',
        'ENTE REGULADOR DE SERVICIOS PÚBLICOS\nDE LA PROVINCIA DEL CHUBUT\n': 'ENTE REGULADOR DE SERVICIOS PÚBLICOS DE LA PROVINCIA DEL CHUBUT\n',
        'SECRETARÍA DE AMBIENTE Y CONTROL\nDEL DESARROLLO SUSTENTABLE\n': 'SECRETARÍA DE AMBIENTE Y CONTROL DEL DESARROLLO SUSTENTABLE\n',
    };
    const normalizedContent = replaceSubsectionTitles(formattedContent, replacements);
    const subsectionRegex = /(INSTITUTO PROVINCIAL DE LA VIVIENDA Y DESARROLLO URBANO\n|MINISTERIO DE DESARROLLO HUMANO\n|RESOLUCIÓN CONJUNTA MINISTERIO DE SEGURIDAD Y JUSTICIA Y MINISTERIO DE DESARROLLO HUMANO\n|SECRETARÍA DE INFRAESTRUCTURA, ENERGÍA Y PLANIFICACIÓN\n|ENTE REGULADOR DE SERVICIOS PÚBLICOS DE LA PROVINCIA DEL CHUBUT\n|SECRETARÍA DE AMBIENTE Y CONTROL DEL DESARROLLO SUSTENTABLE\n|SECRETAR[IÍ]A GENERAL DE GOBIERNO\n|MINISTERIO DE SEGURIDAD Y JUSTICIA\n|SUBSECRETAR[IÍ]A DE TRABAJO\n|SECRETAR[IÍ]A DE SALUD\n|SECRETAR[IÍ]A DE CIENCIA Y TECNOLOG[IÍ]A\n|ESCRIBAN[IÍ]A GENERAL DE GOBIERNO\n|SECRETAR[IÍ]A DE BOSQUES\n|INSTITUTO PROVINCIAL DEL AGUA\n|SECRETAR[IÍ]A DE AMBIENTE Y CONTROL DEL DESARROLLO SUSTENTABLE\n)([\s\S]*?)(?=(?!\1)(INSTITUTO PROVINCIAL DE LA VIVIENDA Y DESARROLLO URBANO\n|MINISTERIO DE DESARROLLO HUMANO\n|RESOLUCIÓN CONJUNTA MINISTERIO DE SEGURIDAD Y JUSTICIA Y MINISTERIO DE DESARROLLO HUMANO\n|SECRETARÍA DE INFRAESTRUCTURA, ENERGÍA Y PLANIFICACIÓN\n|ENTE REGULADOR DE SERVICIOS PÚBLICOS DE LA PROVINCIA DEL CHUBUT\n|SECRETARÍA DE AMBIENTE Y CONTROL DEL DESARROLLO SUSTENTABLE\n|SECRETAR[IÍ]A GENERAL DE GOBIERNO\n|MINISTERIO DE SEGURIDAD Y JUSTICIA\n|SUBSECRETAR[IÍ]A DE TRABAJO\n|SECRETAR[IÍ]A DE SALUD\n|SECRETAR[IÍ]A DE CIENCIA Y TECNOLOG[IÍ]A\n|ESCRIBAN[IÍ]A GENERAL DE GOBIERNO\n|SECRETAR[IÍ]A DE BOSQUES\n|INSTITUTO PROVINCIAL DEL AGUA\n|SECRETAR[IÍ]A DE AMBIENTE Y CONTROL DEL DESARROLLO SUSTENTABLE\n|$))/gs;
    const subsections = getSubsections(normalizedContent, subsectionRegex);

    const synthesizedResolutions = [];
    const synthesizedResolutionRegex = /((Res. N[º°] )([IVXLCDM]+-\d+|\d+\n)|(Res. N[º°] ?)([IVXLCDM]+-\d+|\d+\n)|(Res\. Conjs\. N[º°] )(\d+ MSyJ y \d+ MDH\n))([\s\S]*?)(?=(?!\1)((Res. N[º°] )([IVXLCDM]+-\d+|\d+\n)|(Res. N[º°] ?)([IVXLCDM]+-\d+|\d+\n)|(Res\. Conjs\. N[º°] )(\d+ MSyJ y \d+ MDH\n))|$)/gs;
    const resolutionRegex = /(Res. N[º°] ?)([IVXLCDM]+-\d+|\d+)|(Res\. Conjs\. N[º°] )(\d+ MSyJ y \d+ MDH\n)/gs;

    subsections.forEach(subsection => {
        const {subsectionName, subsectionContent} = subsection;
        let match;

        while ((match = synthesizedResolutionRegex.exec(subsectionContent)) !== null) {
            let synthesizedResolutionContent = match[0].trim();
            let titleMatch;

            while ((titleMatch = resolutionRegex.exec(synthesizedResolutionContent)) !== null) {
                synthesizedResolutions.push({
                    title: 'Auditoría Legislativa - ' + 'Resolución Sintetizada - ' + titleMatch[0].trim(),
                    content: subsectionName + '\n' + synthesizedResolutionContent
                });
            }
        }
    });

    return synthesizedResolutions;
}


function processResolutions(sectionContent) {
    const regex = /(Res\.? N[º°]) ([IVXLCDM]+-\d+|\d+)\s?(\d{2}-\d{2}-\d{2})/;
    const formattedContent = formatSection(sectionContent, regex);
    const replacements = {
        'HONORABLE LEGISLATURA DE LA\nPROVINCIA DEL CHUBUT\n': 'HONORABLE LEGISLATURA DE LA PROVINCIA DEL CHUBUT\n',
        'INSTITUTO PROVINCIAL DE LA VIVIENDA\nY DESARROLLO URBANO\n': 'INSTITUTO PROVINCIAL DE LA VIVIENDA Y DESARROLLO URBANO\n',
        'CONSEJO PROVINCIAL\nDE RESPONSABILIDAD FISCAL\n': 'CONSEJO PROVINCIAL DE RESPONSABILIDAD FISCAL\n',
    };
    const normalizedContent = replaceSubsectionTitles(formattedContent, replacements);
    const subsectionsRegex = /(INSTITUTO PROVINCIAL DE LA VIVIENDA Y DESARROLLO URBANO\n|CONSEJO PROVINCIAL DE RESPONSABILIDAD FISCAL\n|HONORABLE LEGISLATURA DE LA PROVINCIA DEL CHUBUT\n|PODER JUDICIAL\n|TRIBUNAL DE CUENTAS\n|INSTITUTO PROVINCIAL DEL AGUA\n|DIRECCI[ÓO]N GENERAL DE RENTAS\n)([\s\S]*?)(?=(?!\1)(INSTITUTO PROVINCIAL DE LA VIVIENDA Y DESARROLLO URBANO\n|CONSEJO PROVINCIAL DE RESPONSABILIDAD FISCAL\n|HONORABLE LEGISLATURA DE LA PROVINCIA DEL CHUBUT\n|PODER JUDICIAL\n|TRIBUNAL DE CUENTAS\n|INSTITUTO PROVINCIAL DEL AGUA\n|DIRECCI[ÓO]N GENERAL DE RENTAS\n|$))/gs;
    const subsections = getSubsections(normalizedContent, subsectionsRegex);

    const poderJudicialRegex = /RESOLUCIÓN ADMINISTRATIVA GENERAL\nN[º°] \d+\/\d+\n|RESOLUCIÓN ADMINISTRATIVA\nGENERAL N[º°] \d+\/\d+\n|RESOLUCIÓN DE SUPERINTENDENCIA\nADMINISTRATIVA N[º°]\d+\/\d+-(\w+)\n/gs;
    //format this specific subsection
    subsections.forEach(subsection => {
        if (subsection.subsectionName === 'PODER JUDICIAL') {
            subsection.subsectionContent = subsection.subsectionContent.replace(
                poderJudicialRegex,
                match => match.replace('\n', ' ')
            );

        }
    });

    const resolutions = [];
    const resolutionsRegex = /(RESOLUCIÓN DE SUPERINTENDENCIA ADMINISTRATIVA N[º°]\d+\/\d+-(\w+)\n|RESOLUCI[ÓO]N ADMINISTRATIVA GENERAL N[º°] \d+\/\d+\n|RESOLUCI[ÓO]N DEL TRIBUNAL N[º°] \d+\/\d+\n|RESOLUCI[ÓO]N N[º°]\d+\/\d+-HL(,)?\n|RESOLUCI[ÓO]N N[º°]\d+\/\d+(-?\.?)?\n|Resoluci[oó]n N[º°] \d+\n|Res\.? N[º°] \d+\n|Res\.? N[º°]\d+\n)([\s\S]*?)(?=(?!\1)(RESOLUCIÓN DE SUPERINTENDENCIA ADMINISTRATIVA N[º°]\d+\/\d+-(\w+)\n|RESOLUCI[ÓO]N ADMINISTRATIVA GENERAL N[º°] \d+\/\d+\n|RESOLUCI[ÓO]N DEL TRIBUNAL N[º°] \d+\/\d+\n|RESOLUCI[ÓO]N N[º°]\d+\/\d+-HL\n|Resoluci[oó]n N[º°] \d+\n|Res\.? N[º°] \d+\n|RESOLUCI[ÓO]N N[º°]\d+\/\d+(-?\.?)?\n|Res\.? N[º°]\d+\n|$))/gs;
    const resolutionRegex = /RESOLUCIÓN DE SUPERINTENDENCIA ADMINISTRATIVA N[º°]\d+\/\d+-(\w+)\n|RESOLUCI[ÓO]N ADMINISTRATIVA GENERAL N[º°] \d+\/\d+\n|RESOLUCI[ÓO]N DEL TRIBUNAL N[º°] \d+\/\d+\n|RESOLUCI[ÓO]N N[º°]\d+\/\d+-HL\n|RESOLUCI[ÓO]N N[º°]\d+\/\d+\n|Resoluci[oó]n N[º°] \d+\n|Res\.? N[º°] \d+\n|RESOLUCI[ÓO]N N[º°]\d+\/\d+|Res\.? N[º°]\d+\n/gs;

    subsections.forEach(subsection => {
        const {subsectionName, subsectionContent} = subsection;
        let match;

        while ((match = resolutionsRegex.exec(subsectionContent)) !== null) {
            let resolutionContent = match[0].trim();
            let titleMatch;

            while ((titleMatch = resolutionRegex.exec(resolutionContent)) !== null) {
                resolutions.push({
                    title: 'Auditoría Legislativa - ' + 'Resolución - ' + titleMatch[0].trim(),
                    content: subsectionName + '\n' + resolutionContent
                });
            }
        }
    });

    return resolutions;
}

function processSynthesizedDisposition(sectionContent) {
    const regex = /(Disp\.? N[º°]\s?)(\d+)(\d{2}-\d{2}-\d{2})/;
    const formattedContent = formatSection(sectionContent, regex);
    const replacement = {
        'SUBSECRETARÍA DE AUTOTRANSPORTE\nTERRESTRE\n': 'SUBSECRETARÍA DE AUTOTRANSPORTE TERRESTRE\n',
    }
    const normalizedContent = replaceSubsectionTitles(formattedContent, replacement);

    const subsectionsRegex = /(SUBSECRETAR[ÍI]A DE MINER[ÍI]A|SUBSECRETAR[ÍI]A DE AUTOTRANSPORTE TERRESTRE\n|DIRECCI[ÓO]N GENERAL DE POL[ÍI]TICA FORESTAL\n)([\s\S]*?)(?=(?!\1)(SUBSECRETAR[ÍI]A DE MINER[ÍI]A|SUBSECRETAR[ÍI]A DE AUTOTRANSPORTE TERRESTRE\n|DIRECCI[ÓO]N GENERAL DE POL[ÍI]TICA FORESTAL\n|$))/gs;
    const subsections = getSubsections(normalizedContent, subsectionsRegex);

    const dispositions = [];
    const dispositionsGroupRegex = /(Disp\.? N[º°] \d+\n)([\s\S]*?)(?=(?!\1)(Disp\.? N[º°] \d+\n|$))/gs;
    const dispositionRegex = /Disp\.? N[º°] \d+/gs;

    subsections.forEach(subsection => {
        const {subsectionName, subsectionContent} = subsection;
        let match;

        while ((match = dispositionsGroupRegex.exec(subsectionContent)) !== null) {
            let dispositionContent = match[0].trim();
            let titleMatch;

            while ((titleMatch = dispositionRegex.exec(dispositionContent)) !== null) {
                dispositions.push({
                    title: 'Auditoría Legislativa - ' + 'Disposición Sintetizada - ' + titleMatch[0].trim(),
                    content: subsectionName + '\n' + dispositionContent
                });
            }
        }

    });

    return dispositions;
}

function processAgreements(sectionContent) {
    const agreements = [];

    const subsectionsRegex = /(TRIBUNAL DE CUENTAS\n)([\s\S]*?)(?=(?!\1)(TRIBUNAL DE CUENTAS\n|$))/gs;
    const subsections = getSubsections(sectionContent, subsectionsRegex);

    const agreementsGroupRegex = /(ACUERDO REGISTRADO BAJO EL N[º°] \d+\/\s?\d+\n)([\s\S]*?)(?=(?!\1)(ACUERDO REGISTRADO BAJO EL N[º°] \d+\/\s?\d+\n|$))/gs;
    const agreementRegex = /ACUERDO REGISTRADO BAJO EL N[º°] \d+\/\s?\d+\n/gm;

    subsections.forEach(subsection => {
        const {subsectionName, subsectionContent} = subsection;
        let match;
        while ((match = agreementsGroupRegex.exec(subsectionContent)) !== null) {
            let agreementContent = match[0].trim();
            let titleMatch;

            while ((titleMatch = agreementRegex.exec(agreementContent)) !== null) {
                let title = titleMatch[0].trim().replace(/ REGISTRADO BAJO EL/g, '');
                agreements.push({
                    title: 'Auditoría Legislativa - ' + 'Acuerdo - ' + title,
                    content: subsectionName + '\n' + agreementContent
                });
            }
        }
    });

    return agreements;
}

function processDictamenes(sectionContent) {
    const dictamenes = [];

    const subsectionsRegex = /(TRIBUNAL DE CUENTAS\n)([\s\S]*?)(?=(?!\1)(TRIBUNAL DE CUENTAS\n|$))/gs;
    const subsections = getSubsections(sectionContent, subsectionsRegex);

    const dictamenesGroupRegex = /(DICTAMEN DELTRIBUNAL N[º°] \d+\/\d+\n|DICTAMEN DEL TRIBUNAL N[º°] \d+\/\d+\n)([\s\S]*?)(?=(?!\1)(DICTAMEN DELTRIBUNAL N[º°] \d+\/\d+\n|DICTAMEN DEL TRIBUNAL N[º°] \d+\/\d+\n|$))/gs;
    const dictamenRegex = /DICTAMEN DEL TRIBUNAL N[º°] \d+\/\d+\n|DICTAMEN DELTRIBUNAL N[º°] \d+\/\d+\n/gm;

    subsections.forEach(subsection => {
        const {subsectionName, subsectionContent} = subsection;
        let match;
        while ((match = dictamenesGroupRegex.exec(subsectionContent)) !== null) {
            let dictamenContent = match[0].trim();
            let titleMatch;

            while ((titleMatch = dictamenRegex.exec(dictamenContent)) !== null) {
                let title = titleMatch[0].trim().replace(/ DELTRIBUNAL| DEL TRIBUNAL/g, '');
                dictamenes.push({
                    title: 'Auditoría Legislativa - ' + 'Dictamen - ' + title,
                    content: subsectionName + '\n' + dictamenContent
                });
            }
        }
    });

    return dictamenes;
}

function processDeclarations(sectionContent) {
    const replacements = {
        'HONORABLE LEGISLATURA DE LA\nPROVINCIA DEL CHUBUT\n': 'HONORABLE LEGISLATURA DE LA PROVINCIA DEL CHUBUT\n',
    }
    const normalizedContent = replaceSubsectionTitles(sectionContent, replacements);

    const subsectionsRegex = /(HONORABLE LEGISLATURA DE LA PROVINCIA DEL CHUBUT\n)([\s\S]*?)(?=(?!\1)(HONORABLE LEGISLATURA DE LA PROVINCIA DEL CHUBUT\n|$))/gs;
    const subsections = getSubsections(normalizedContent, subsectionsRegex);

    const declarationsGruoupRegex = /(DECLARACI[ÓO]N N[º°]\d+\/\d+-HL\.\n)([\s\S]*?)(?=(?!\1)(DECLARACI[ÓO]N N[º°]\d+\/\d+-HL\.\n|$))/gs;
    const declarationRegex = /DECLARACI[ÓO]N N[º°]\d+\/\d+-HL\.\n/gs;

    const declarations = [];

    subsections.forEach(subsection => {
        const {subsectionName, subsectionContent} = subsection;
        let match;
        while ((match = declarationsGruoupRegex.exec(subsectionContent)) !== null) {
            let declarationContent = match[0].trim();
            let titleMatch;

            while ((titleMatch = declarationRegex.exec(declarationContent)) !== null) {
                let title = titleMatch[0].trim().replace(/\./g, '');
                declarations.push({
                    title: 'Auditoría Legislativa - ' + 'Declaración - ' + title,
                    content: subsectionName + '\n' + declarationContent
                });
            }
        }
    });

    return declarations;
}

function processDispositions(sectionContent) {
    const subsectionRegex = /(SUBSECRETAR[ÍI]A DE MINER[ÍI]A\n|MINISTERIO P[UÚ]BLICO FISCAL\n)([\s\S]*?)(?=(?!\1)(SUBSECRETAR[ÍI]A DE MINER[ÍI]A\n|MINISTERIO P[UÚ]BLICO FISCAL\n|$))/gs;
    const subsections = getSubsections(sectionContent, subsectionRegex);

    const dispositionGroupRegex = /(Disposici[óo]n N[º°] \d+\n)([\s\S]*?)(?=(?!\1)(Disposici[óo]n N[º°] \d+\n|$))/gs;
    const dispositionRegex = /Disposici[óo]n N[º°] \d+\n/gs;

    const dispositions = [];

    subsections.forEach(subsection => {
        const {subsectionName, subsectionContent} = subsection;
        let match;
        while ((match = dispositionGroupRegex.exec(subsectionContent)) !== null) {
            let dispositionContent = match[0].trim();
            let titleMatch;

            while ((titleMatch = dispositionRegex.exec(dispositionContent)) !== null) {
                dispositions.push({
                    title: 'Auditoría Legislativa - ' + 'Disposición - ' + titleMatch[0].trim(),
                    content: subsectionName + '\n' + dispositionContent
                });
            }
        }
    });

    return dispositions;
}

function processOfficialAdvertising(sectionContent) {

    const replacements = {
        'SUBSECRETARÍA DE INFORMACIÓN PÚBLICA\nDIRECCIÓN GENERAL DE PUBLICIDAD\n': 'SUBSECRETARÍA DE INFORMACIÓN PÚBLICA DIRECCIÓN GENERAL DE PUBLICIDAD\n',
    };
    const normalizedContent = replaceSubsectionTitles(sectionContent, replacements);

    const subsectionRegex = /(SUBSECRETAR[ÍI]A DE INFORMACI[OÓ]N P[UÚ]BLICA DIRECCI[OÓ]N GENERAL DE PUBLICIDAD\n)([\s\S]*?)(?=(?!\1)(SUBSECRETAR[ÍI]A DE INFORMACI[OÓ]N P[UÚ]BLICA DIRECCI[OÓ]N GENERAL DE PUBLICIDAD\n|$))/gs;
    const subsections = getSubsections(normalizedContent, subsectionRegex);

    const advertisingGroupRegex = /(REGISTRO N[º°] \d+\n)([\s\S]*?)(?=(?!\1)(REGISTRO N[º°] \d+\n|$))/gs;
    const advertisingRegex = /REGISTRO N[º°] \d+/gs;

    const officialAdvertising = [];

    subsections.forEach(subsection => {
        const {subsectionName, subsectionContent} = subsection;
        let match;
        while ((match = advertisingGroupRegex.exec(subsectionContent)) !== null) {
            let advertisingContent = match[0].trim();
            let titleMatch;

            while ((titleMatch = advertisingRegex.exec(advertisingContent)) !== null) {
                officialAdvertising.push({
                    title: 'Auditoría Legislativa - ' + 'Registro de Publicidad Oficial - ' + titleMatch[0].trim(),
                    content: subsectionName + '\n' + advertisingContent
                });
            }
        }
    });

    return officialAdvertising;
}

function processGeneralSection(sectionContent) {
    fs.writeFileSync('general-section.txt', sectionContent);
    const regex = /^([A-ZÁÉÍÓÚÜÑ1234567890\s?.,()<\–\-«»º°\/&]+\n|Carta de Intenci[óo]n)([\s\S]*?)(I:\s?\d{2}-\d{2}-\d{2}(?: V:\s?\d{2}-\d{2}-\d{2,4}|P: \d{2}-\d{2}-\d{2})| y \d{2}-\d{2}-\d{2}|P: \d{2}-\d{2}-\d{2})/gm;
    const sections = [];

    let match;
    while ((match = regex.exec(sectionContent)) !== null) {
        sections.push({
            title: 'Auditoría Legislativa - ' + 'Sección General - ' + match[1].replace(/\n/g, ' ').trim(),
            content: match[2].trim() + '\n' + match[3].trim()
        });
    }
    return sections;
}