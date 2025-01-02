const pdf = require("pdf-parse");
module.exports = async function parseCaletaOliviaPDF(pdfBuffer) {
    const pdfData = await pdf(pdfBuffer);
    let decreeTitleList = [];
    let text = pdfData.text;

    text = text.replace(/COPIA FIEL B\.O N[º°].*$/gm, '')
        .replace(/Edición a cargo de la Subsecretaria de Asuntos Legislativos, \d+ de \w+ de \d+ \(9011\) Caleta Olivia.*$/gm, '')
        .replace(/Los documentos que se publiquen en el Boletín Oficial de la Municipalidad de Caleta Olivia.*$/gm, '')
        .replace(/del Artículo 2° del Código Civil por el mismo efecto de su publicación.*$/gm, '')
        .replace(/DEPARTAMENTO EJECUTIVO MUNICIPAL([\s\S]*)Sra. Paola Daniela Ramos.*$/gm, '')
        .replace(/HONORABLE CONCEJO DELIBERANTE([\s\S]*)Calicate.*$/gm, '')
        .replace(/BOLETÍN OFICIAL CALETA OLIVIA, \d+ de \w+\s*\d+\s*P á g i n a.*$/gm, '')// page header
        .replace(/BOLETÍN OFICIAL([\s\S]*)MUNICIPALIDAD DE CALETA OLIVIA([\s\S]*)AÑO \d+ N[º°] \d+.*$/gm, '')// #333???
        .replace(/AUTORIDADES MUNICIPALES.*$/gm, '')
        .replace(/EDICTO[\s\S]*?P[aá]gs?.*$/gm, '')
        .replace(/D E C R E T O S.*$/gm, '')
        .replace(/ +\n/gm, '\n')
        .replace(/ {2,}/gm, ' ')
        .replace(/\n{2,}/gm, '\n')
        .replace(/DECRETO N[º°] \d+ \w+\/\d+\.-.*$/gm, '')
        .replace(/(DECRETOS?|DECRETOS? SINTETIZADOS?)\n[\s\S]*?P[aá]gs?.*$/gm, (match) => {
            decreeTitleList.push(match) // Guarda el contenido eliminado
            return ''; // Elimina el contenido del texto original
        })

    const decreeRegex = /CALETA OLIVIA, \d+([\s\S]*?)(?=CALETA OLIVIA|$)/g;
    
    let matches = [];
    let match;

    while ((match = decreeRegex.exec(text)) !== null) {
        matches.push(match[0].trim());
    }

    let decrees = [];
    let decreesObject = {
        'DECRETOS': [],
        'DECRETOS SINTETIZADOS': []
    };

    decreeTitleList.forEach((sumario) => {
        if (sumario.includes("SINTETIZADOS")) {
            // Si es un decreto sintetizado, agregamos los decretos bajo la clave 'DECRETOS SINTETIZADOS'
            decreesObject['DECRETOS SINTETIZADOS'] = decreesObject['DECRETOS SINTETIZADOS'].concat(extractDecrees(sumario));
        } else {
            // Si no es sintetizado, agregamos los decretos bajo la clave 'DECRETOS'
            decreesObject['DECRETOS'] = decreesObject['DECRETOS'].concat(extractDecrees(sumario));
        }
    });

    Object.keys(decreesObject).forEach((key, index) => {
        const decreesList = decreesObject[key];
        const isSintetizado = /SINTETIZADOS/i.test(key);
        const titlePrefix = isSintetizado ? "Auditoría Legislativa - DECRETO SINTETIZADO - " : "Auditoría Legislativa - DECRETO - ";

        decreesList.forEach((decree, decreeIndex) => {
            let title = decree.replace(/Dto\. N° /g, 'DECRETO N° ');
            title = `${titlePrefix}${title}`
            const content = matches[decreeIndex];
            decrees.push({title, content});
        });
    });


    return decrees;
}

function extractDecrees(sumario) {
    const decreeRegex = /Dto\. N° \d+\/\d+/g;
    let decrees = sumario.match(decreeRegex) || [];
    decrees = Array.from(new Set(decrees));

    return decrees;
}