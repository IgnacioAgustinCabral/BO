const pdf2json = require("pdf2json");

module.exports = async function getBoldWords(pdfBuffer) {
    const buffer = Buffer.from(pdfBuffer);
    const pdfParser = new pdf2json();

    return new Promise((resolve, reject) => {
        pdfParser.parseBuffer(buffer);

        pdfParser.on('pdfParser_dataReady', (pdfData) => {
            const pages = pdfData.Pages;
            let bold = [];

            pages.forEach(page => {
                page.Texts.forEach(textObj => {
                    const text = decodeURIComponent(textObj.R[0].T); // Texto decodificado
                    const fontIndex = textObj.R[0].S; // Índice de la fuente
                    const fontStyle = kFontStyles[fontIndex]; // Obtener estilo: negrita y cursiva
                    const isBold = fontStyle && fontStyle[2] === 1; // Negrita

                    const unwantedWords = [
                        "LEYES",
                        "LEY",
                        "DECRETOS SINTETIZADOS",
                        "DECRETO",
                        "RESOLUCIONES",
                        "RESOLUCION",
                        "RESOLUCIÓN",
                        "DECLARACIONES",
                        "DECLARACION",
                        "DECLARACIÓN",
                        "DISPOSICIONES",
                        "DISPOSICIÓN",
                        "DISPOSICION",
                        "EDICTOS",
                        "EDICTO",
                        "E D I C T O",
                        "AVISOS",
                        "AVISO",
                        "CONVOCATORIAS",
                        "CONVOCATORIA",
                        "CÉDULA DE NOTIFICACIÓN",
                        "CEDULA DE NOTIFICACION",
                        "CÉDULAS DE NOTIFICACIONES",
                        "CEDULAS DE NOTIFICACIONES",
                        "LICITACIONES"
                    ];

                    if (isBold && !unwantedWords.some(word => text.includes(word))) {
                        bold.push(text);
                    }
                });
            });
            resolve(bold);
        });

        pdfParser.on('pdfParser_dataError', (err) => {
            reject(err);
        });
    });
}

const kFontStyles = [
    // Face  Size Bold Italic  StyleID(Comment)
    // ----- ---- ---- -----  -----------------
    [0, 6, 0, 0], //00
    [0, 8, 0, 0], //01
    [0, 10, 0, 0], //02
    [0, 12, 0, 0], //03
    [0, 14, 0, 0], //04
    [0, 18, 0, 0], //05
    [0, 6, 1, 0], //06
    [0, 8, 1, 0], //07
    [0, 10, 1, 0], //08
    [0, 12, 1, 0], //09
    [0, 14, 1, 0], //10
    [0, 18, 1, 0], //11
    [0, 6, 0, 1], //12
    [0, 8, 0, 1], //13
    [0, 10, 0, 1], //14
    [0, 12, 0, 1], //15
    [0, 14, 0, 1], //16
    [0, 18, 0, 1], //17
    [0, 6, 1, 1], //18
    [0, 8, 1, 1], //19
    [0, 10, 1, 1], //20
    [0, 12, 1, 1], //21
    [0, 14, 1, 1], //22
    [0, 18, 1, 1], //23
    [1, 6, 0, 0], //24
    [1, 8, 0, 0], //25
    [1, 10, 0, 0], //26
    [1, 12, 0, 0], //27
    [1, 14, 0, 0], //28
    [1, 18, 0, 0], //29
    [1, 6, 1, 0], //30
    [1, 8, 1, 0], //31
    [1, 10, 1, 0], //32
    [1, 12, 1, 0], //33
    [1, 14, 1, 0], //34
    [1, 18, 1, 0], //35
    [1, 6, 0, 1], //36
    [1, 8, 0, 1], //37
    [1, 10, 0, 1], //38
    [1, 12, 0, 1], //39
    [1, 14, 0, 1], //40
    [1, 18, 0, 1], //41
    [2, 8, 0, 0], //42
    [2, 10, 0, 0], //43
    [2, 12, 0, 0], //44
    [2, 14, 0, 0], //45
    [2, 12, 0, 0], //46
    [3, 8, 0, 0], //47
    [3, 10, 0, 0], //48
    [3, 12, 0, 0], //49
    [4, 12, 0, 0], //50
    [0, 9, 0, 0], //51
    [0, 9, 1, 0], //52
    [0, 9, 0, 1], //53
    [0, 9, 1, 1], //54
    [1, 9, 0, 0], //55
    [1, 9, 1, 0], //56
    [1, 9, 1, 1], //57
    [4, 10, 0, 0], //58
    [5, 10, 0, 0], //59
    [5, 12, 0, 0], //60
];