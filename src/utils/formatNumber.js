function formatNumber(number) {
    if (number === null || number === undefined || isNaN(number)) {
        return "0";
    }
    return number
        .toLocaleString("es-ES", {
            style: "currency",
            currency: "EUR",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })
        .replace("€", "");
}

export default formatNumber;
