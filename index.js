const axios = require('axios');
const pdf = require('pdf-parse');
const express = require('express');
const port = 4000;
const app = express();

app.get('/process-bulletin', async (req, res) => {
    const {url} = req.query;

    const pdfBuffer = await downloadPDF(url);
    const data = await parsePDF(pdfBuffer);

    res.json(data);
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

async function downloadPDF(url) {
    const response = await axios({
        method: 'get',
        url: url,
        responseType: 'arraybuffer'
    });
    return response.data;
}

async function parsePDF(pdfBuffer) {
    try {
        const pdfData = await pdf(pdfBuffer);
        // Obtener el texto en una sola línea
        let text = pdfData.text;

        text = text.replace(/\s{2,}/g, ' ') //replace 2 or more space for 1 space
            .replace(/FRANQUEO A PAGAR\n(.*?)[Ss]ecci[óo]n [Oo]ficial/s, '') //eliminates this section
            .replace(/FRANQUEO A PAGAR\n(.*?)[Ss]ecci[óo]n [Oo]ficial/s, '') //eliminates this section
            .replace(/([a-zA-ZáéíóúÁÉÍÓÚüÜñÑ])-\n([a-zA-ZáéíóúÁÉÍÓÚüÜñÑ])/g, "$1$2") //joins hyphenated words
            .replace(/BOLET[IÍ]N OFICIAL\n/g, '') //eliminates
            .replace(/P[AÁ]GINA (\d+)\n(Lunes|Martes|Mi[eé]rcoles|Jueves|Viernes|S[aá]bado|Domingo)\s\d{1,2}\sde\s(Enero|Febrero|Marzo|Abril|Mayo|Junio|Julio|Agosto|Septiembre|Octubre|Noviembre|Diciembre)\sde\s\d{4}\n/gs, '') //eliminates page number and date
            .replace(
                /([^\n])\s*(LEY PROVINCIAL|LEYES PROVINCIALES|DECRETO PROVINCIAL|DECRETOS PROVINCIALES|DECRETO SINTETIZADO|DECRETOS SINTETIZADOS|RESOLUCIONES|RESOLUCI[ÓO]N|RESOLUCI[ÓO]NES SINTETIZADAS|RESOLUCI[ÓO]N SINTETIZADA|DISPOSICI[ÓO]N|DISPOSICIONES|ACUERDO|ACUERDOS|DICT[ÁA]MEN|DICT[ÁA]MENES|DISPOSICI[ÓO]N SINTETIZADA|DISPOSICIONES SINTETIZADAS|REGISTRO DE\nPUBLICIDAD OFICIAL|DECLARACIONES|DECLARACI[ÓO]N|Secci[óo]n General)/g,
                (match, precedingText, sectionTitle) => `${precedingText}\n${sectionTitle}`);

        const sectionsRegex = /^(LEY PROVINCIAL\n|LEYES PROVINCIALES\n|DECRETO PROVINCIAL\n|DECRETOS PROVINCIALES\n|DECRETO SINTETIZADO\n|DECRETOS SINTETIZADOS\n|RESOLUCIONES\n|RESOLUCI[ÓO]N\n|RESOLUCI[ÓO]NES SINTETIZADAS\n|RESOLUCI[ÓO]N SINTETIZADA\n|DISPOSICI[ÓO]N\n|DISPOSICIONES\n|ACUERDO\n|ACUERDOS\n|DICT[ÁA]MEN\n|DICT[ÁA]MENES\n|DISPOSICI[ÓO]N SINTETIZADA\n|DISPOSICIONES SINTETIZADAS\n|REGISTRO DE\nPUBLICIDAD OFICIAL\n|DECLARACIONES\n|DECLARACI[ÓO]N\n)([\s\S]*?)(?=^(?!\1)^(LEY PROVINCIAL\n|LEYES PROVINCIALES\n|DECRETO PROVINCIAL\n|DECRETOS PROVINCIALES\n|DECRETO SINTETIZADO\n|DECRETOS SINTETIZADOS\n|RESOLUCIONES\n|RESOLUCI[ÓO]N\n|RESOLUCI[ÓO]NES SINTETIZADAS\n|RESOLUCI[ÓO]N SINTETIZADA\n|DISPOSICI[ÓO]N\n|DISPOSICIONES\n|ACUERDO\n|ACUERDOS\n|DICT[ÁA]MEN\n|DICT[ÁA]MENES\n|DISPOSICI[ÓO]N SINTETIZADA\n|DISPOSICIONES SINTETIZADAS\n|REGISTRO DE\nPUBLICIDAD OFICIAL\n|DECLARACIONES\n|DECLARACI[ÓO]N\n|Secci[óo]n General|$))/gm;
        const sections = [];
        let match;

        while ((match = sectionsRegex.exec(text)) !== null) {
            let sectionName = match[1].trim();
            let sectionContent = match[2].trim();

            if (sectionName === 'RESOLUCION') {
                sectionName = 'RESOLUCIÓN';
            } else if (sectionName === 'RESOLUCION SINTETIZADA') {
                sectionName = 'RESOLUCIÓN SINTETIZADA';
            } else if (sectionName === 'RESOLUCIÓNES SINTETIZADAS') {
                sectionName = 'RESOLUCIONES SINTETIZADAS';
            }

            sections.push({
                sectionName,
                sectionContent
            });
        }

        let content = [];

        sections.forEach(section => {
            const {sectionName, sectionContent} = section;
            switch (sectionName) {
                case 'LEY PROVINCIAL':
                    const provincialLaw = processProvincialLaws(sectionContent);
                    content.push(...provincialLaw);
                    break;

                case 'LEYES PROVINCIALES':
                    const provincialLaws = processProvincialLaws(sectionContent);
                    content.push(...provincialLaws);
                    break;

                case 'DECRETO PROVINCIAL':
                    const decree = processProvincialDecrees(sectionContent);
                    content.push(...decree);
                    break;

                case 'DECRETOS PROVINCIALES':
                    const decrees = processProvincialDecrees(sectionContent);
                    content.push(...decrees);
                    break;

                case 'DECRETO SINTETIZADO':
                    const synthesizedDecree = processSynthesizedDecrees(sectionContent);
                    content.push(...synthesizedDecree);
                    break;

                case 'DECRETOS SINTETIZADOS':
                    const synthesizedDecrees = processSynthesizedDecrees(sectionContent);
                    content.push(...synthesizedDecrees);
                    break;

                case 'RESOLUCIÓN':
                    const resolution = processResolutions(sectionContent);
                    content.push(...resolution);
                    break;

                case 'RESOLUCIONES':
                    const resolutions = processResolutions(sectionContent);
                    content.push(...resolutions);
                    break;

                case 'RESOLUCIÓN SINTETIZADA':
                    const synthesizedResolution = processSynthesizedResolutions(sectionContent);
                    content.push(...synthesizedResolution);
                    break;

                case 'RESOLUCIONES SINTETIZADAS':
                    const synthesizedResolutions = processSynthesizedResolutions(sectionContent);
                    content.push(...synthesizedResolutions);
                    break;
            }
        })
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
    const subsectionRegex = /(INSTITUTO PROVINCIAL DE LA VIVIENDA Y DESARROLLO URBANO\n|CONSEJO PROVINCIAL DE RESPONSABILIDAD FISCAL\n|HONORABLE LEGISLATURA DE LA PROVINCIA DEL CHUBUT\n|PODER JUDICIAL\n|TRIBUNAL DE CUENTAS\n|INSTITUTO PROVINCIAL DEL AGUA\n|DIRECCI[ÓO]N GENERAL DE RENTAS\n)([\s\S]*?)(?=(?!\1)(INSTITUTO PROVINCIAL DE LA VIVIENDA Y DESARROLLO URBANO\n|CONSEJO PROVINCIAL DE RESPONSABILIDAD FISCAL\n|HONORABLE LEGISLATURA DE LA PROVINCIA DEL CHUBUT\n|PODER JUDICIAL\n|TRIBUNAL DE CUENTAS\n|INSTITUTO PROVINCIAL DEL AGUA\n|DIRECCI[ÓO]N GENERAL DE RENTAS\n|$))/gs;
    const subsections = getSubsections(normalizedContent, subsectionRegex);

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