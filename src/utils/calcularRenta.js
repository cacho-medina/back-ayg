function calcularRenta(gananciaGenerada, capitalInicial) {
    if (gananciaGenerada < 1 || capitalInicial < 1) {
        return 0;
    }
    return (gananciaGenerada / capitalInicial) * 100;
}

export default calcularRenta;
