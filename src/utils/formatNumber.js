function formatNumber(number) {
    return number.toLocaleString("es-US", {
        style: "currency",
        currency: "USD",
    });
}

export default formatNumber;
