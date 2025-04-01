export const calcularCrecimiento = (capFinal, capInicial) => {
    if (capInicial < 1 || capFinal < 1) {
        return 0;
    }
    const cociente = capFinal / capInicial;

    return (cociente - 1) * 100;
};
