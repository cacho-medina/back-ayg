function calcularRentaTotal(rentaRegistrada) {
    const totalRenta = rentaRegistrada.reduce(
        (acumulado, renta) => acumulado + renta,
        0
    );
    return totalRenta;
}

export default calcularRentaTotal;
