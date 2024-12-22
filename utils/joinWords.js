/*
module.exports = function joinBoldWords(array) {
    const resultado = [];

    for (let i = 0; i < array.length; i++) {
        const item = array[i];

        // Detectar el caso: "elemento", "-", "elemento"
        if (item === "-" && i > 0 && i < array.length - 1) {
            // Unir el guion con el primer elemento
            resultado[resultado.length - 1] += "-";
        } else if (item !== "-") {
            // Agregar el elemento al resultado si no es un guion
            resultado.push(item);
        }
    }

    return resultado;
};*/

module.exports = function joinBoldWords(arr) {
    let resultado = [];
    let i = 0;

    while (i < arr.length) {
        if (arr[i] === '-') {
            // Unir la palabra cortada
            let palabraCortada = arr[i - 1] + '-' + arr[i + 1];
            let match = arr[i + 1].match(/^([a-zA-ZáéíóúÁÉÍÓÚüÜñÑ”]+)(.*)$/);
            if (match) {
                let firstPart = match[1];
                let rest = match[2];
                resultado[resultado.length - 1] = arr[i - 1] + '-' + firstPart;
                resultado.push(rest);
            } else {
                resultado[resultado.length - 1] += arr[i + 1];
            }
            i += 2; // Saltar el siguiente elemento ya que fue unido
        } else {
            resultado.push(arr[i]);
            i++;
        }
    }

    // Filtrar elementos vacíos
    return resultado.filter(item => item !== '');
}