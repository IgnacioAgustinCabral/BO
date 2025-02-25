const fs = require("node:fs");
const extractTextPromise = require('../utils/extractTextPromise');
module.exports = async function parseNeuquenCapitalPDF(pdfBuffer) {
    try {
        const pdfPath = "tempNeuquenCapital.pdf";
        fs.writeFileSync(pdfPath, pdfBuffer);
        let text = await extractTextPromise(pdfPath);
        let content = [];

        const specialBO = /EDICI[OÓ]N Nº \d+ \(ESPECIAL\)/;
        if (specialBO.test(text)) {
            text = text.replace(/$/, '\n')
                .replace(/\s*\d+\n\s*BOLET[IÍ]N OFICIAL MUNICIPAL\s*EDICI[OÓ]N N[°º] \d+ \(ESPECIAL\)\s*BOLET[IÍ]N(?:OFIC(?:IAL)?)?\s*NEUQU[EÉ]N, \d+ DE \w+ DE \d+[\s\S]*?\n\n/g, '\n')
                .replace(/BOLET[IÍ]N\nOFICIAL[\s\S]*?P[aá]ginas? \d+ a \d+\n\n?/gm, '');
            const regex = /(ORDENANZA N[°º] (\d+)\.-\n|D E C R E T O N[°º] *(\d+)\n|EDICTO\n)/gm;
            let match;

            while ((match = regex.exec(text)) !== null) {
                if (match[1].includes('D E C R E T O')) {
                    const decretoNumber = match[3];
                    text = text.replace(/Que[\s\S]*?;\n/gm, match => {
                        return match.replace(/(?<!;)\n/g, ' ');
                    })
                        .replace(/Art[ií]culo \d+[°º][\s\S]*?\.\n/gm, match => {
                            return match.replace(/(?<!\.)\n/g, ' ');
                        })
                        .trim();
                    content.push({
                        title: `Auditoría Legislativa - DECRETOS - DECRETO N° ${decretoNumber}`,
                        content: text
                    });
                } else if (match[1].includes('ORDENANZA')) {
                    const ordenanzaNumber = match[2];
                    text = text.replace(/Que[\s\S]*?\.\n/gm, match => {
                        return match.replace(/(?<!\.)\n/g, ' ');
                    })
                        .replace(/ART[IÍ]CULO \d+[°º][\s\S]*?\.-\n/gm, match => {
                            return match.replace(/(?<!\.)\n/g, ' ');
                        })
                        .trim();
                    content.push({
                        title: `Auditoría Legislativa - ORDENANZAS - ORDENANZA N° ${ordenanzaNumber}`,
                        content: text
                    });
                } else if (match[1].includes('EDICTO')) {
                    text = text.replace(/\n/g, ' ').trim();
                    content.push({
                        title: `Auditoría Legislativa - EDICTOS - EDICTO`,
                        content: text
                    });
                } else if (match[1].includes('R.O.')) {
                    text = text.replace(/\n/g, ' ').trim();
                    content.push({
                        title: `Auditoría Legislativa - RESOLUCIONES - REGISTRO PÚBLICO DE OPOSICIÓN`,
                        content: text
                    });
                }
            }
        } else {

            text = text.replace(/$/, '\n')// add \n at the end of the text
                .replace(/\s*\d+\nBOLET[IÍ]N OFICIAL MUNICIPAL\s*EDICI[OÓ]N N[°º] \d+\s*NEUQU[EÉ]N[\s\S]*?\n\n/gm, '\n')// eliminates header
                .replace(/SUMARIO[\s\S]*?(?=DECRETOS SINTETIZADOS)/gm, '');// eliminates SUMARIO SECTION

            const sectionsRegex = /(DECRETOS SINTETIZADOS|RESOLUCIONES SINTETIZADAS|DISPOSICIONES SINTET?IZADAS|NORMAS COMPLETAS)([\s\S]*?)(?=(DECRETOS SINTETIZADOS|RESOLUCIONES SINTETIZADAS|DISPOSICIONES SINTET?IZADAS|NORMAS COMPLETAS|$))/g;
            const sections = [];
            let match;

            while ((match = sectionsRegex.exec(text)) !== null) {
                const sectionName = match[1].trim();
                const sectionContent = match[2];
                sections.push({
                    sectionName: sectionName,
                    sectionContent: sectionContent
                });
            }

            const sectionProcessors = {
                'DECRETOS SINTETIZADOS': processSynthesizedDecrees,
                'RESOLUCIONES SINTETIZADAS': processResolucionesSintetizadas,
                'DISPOSICIONES SINTETIZADAS': processDisposicionesSintetizadas,
                'NORMAS COMPLETAS': processNormasCompletas,
            };

            sections.forEach(({sectionName, sectionContent}) => {
                if (/DISPOSICIONES SINTEIZADAS/.test(sectionName)) {
                    sectionName = 'DISPOSICIONES SINTETIZADAS';
                }
                const processor = sectionProcessors[sectionName];

                if (processor) {
                    content.push(...processor(sectionName, sectionContent));
                }
            });
        }

        return content;
    } catch (error) {
        console.error("Error extrayendo el texto:", error);
    }
};

function processSynthesizedDecrees(sectionName, content) {
    const decreeRegex = /DECRETO N[°º] (\d+)\/\d+[\s\S]*?.-\n/g;
    const decrees = [];
    let match;

    while ((match = decreeRegex.exec(content)) !== null) {
        const decreeNumber = match[1];
        const decreeContent = match[0].replace(/\n/g, ' ')
            .trim();
        decrees.push({
            title: `Auditoría Legislativa - DECRETOS SINTETIZADOS - DECRETO N° ${decreeNumber}`,
            content: decreeContent
        });
    }

    return decrees;
}

function processResolucionesSintetizadas(sectionName, content) {
    const resolutionRegex = /RESOLUCI[ÓO]N N[°º] (\d+)\/\d+[\s\S]*?.-\n/g;
    const resolutions = [];
    let match;

    while ((match = resolutionRegex.exec(content)) !== null) {
        const resolutionNumber = match[1];
        const resolutionContent = match[0].replace(/\n/g, ' ')
            .trim();
        resolutions.push({
            title: `Auditoría Legislativa - RESOLUCIONES SINTETIZADAS - RESOLUCIÓN N° ${resolutionNumber}`,
            content: resolutionContent
        });
    }

    return resolutions;
}

function processDisposicionesSintetizadas(sectionName, content) {
    const dispositionRegex = /DISPOSICI[ÓO]N N[°º] (\d+)\/\d+[\s\S]*?.-\n/g;
    const dispositions = [];
    let match;

    while ((match = dispositionRegex.exec(content)) !== null) {
        const dispositionNumber = match[1];
        const dispositionContent = match[0].replace(/\n/g, ' ')
            .trim();
        dispositions.push({
            title: `Auditoría Legislativa - DISPOSICIONES SINTETIZADAS - DISPOSICIÓN N° ${dispositionNumber}`,
            content: dispositionContent
        });
    }

    return dispositions;
}

function processNormasCompletas(sectionName, content) {
    const regex = /(ORDENANZA N[°º] (\d+)\.-\n|D E C R E T O N[°º] *(\d+)\n)([\s\S]*?)(?=(ORDENANZA N[°º] \d+\.-\n|D E C R E T O N[°º] *\d+\n|$))/g;
    const normas = [];
    let match;

    while ((match = regex.exec(content)) !== null) {
        const content = match[0];

        if (match[1].includes('ORDENANZA')) {
            const ordenanzaNumber = match[2];
            normas.push({
                title: `Auditoría Legislativa - ORDENANZAS - ORDENANZA N° ${ordenanzaNumber}`,
                content: content.replace(/Que[\s\S]*?\.\n/gm, match => {
                    return match.replace(/(?<!\.)\n/g, ' ');
                })
                    .replace(/ART[IÍ]CULO \d+[°º][\s\S]*?\.-\n/gm, match => {
                        return match.replace(/(?<!\.)\n/g, ' ');
                    })
                    .trim()
            });
        } else if (match[1].includes('D E C R E T O')) {
            const decretoNumber = match[3];
            normas.push({
                title: `Auditoría Legislativa - DECRETOS - DECRETO N° ${decretoNumber}`,
                content: content.replace(/Que[\s\S]*?;\n/gm, match => {
                    return match.replace(/(?<!;)\n/g, ' ');
                })
                    .replace(/Art[ií]culo \d+[°º][\s\S]*?\.\n/gm, match => {
                        return match.replace(/(?<!\.)\n/g, ' ');
                    })
                    .trim()
            });
        }
    }

    return normas;
}