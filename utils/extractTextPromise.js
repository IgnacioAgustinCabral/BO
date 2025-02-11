const extract = require("pdf-text-extract");
const fs = require("node:fs");
module.exports = function extractTextPromise(pdfPath) {
    return new Promise((resolve, reject) => {
        extract(pdfPath, {splitPages: false}, (err, text) => {
            if (err) {
                fs.unlinkSync(pdfPath);
                return reject("Error extrayendo el texto: " + err);
            }

            const extractedText = text.join("\n");
            fs.unlinkSync(pdfPath); // removes temp file

            resolve(extractedText);
        });
    });
};