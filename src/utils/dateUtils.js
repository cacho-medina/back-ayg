export const getUTCDate = () => {
    return new Date().toISOString();
};

export const getUTCStartOfYear = (year) => {
    return new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0));
};

export const getUTCEndOfMonth = (year, month) => {
    return new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999));
};

export const getUTCEndOfYear = (year) => {
    return new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));
};

export const getCurrentUTCDate = () => {
    return new Date().toISOString();
};

export const getCurrentUTCYear = () => {
    return new Date().getUTCFullYear();
};

export const getCurrentUTCMonth = () => {
    return new Date().getUTCMonth();
};

export const formatUTCToLocal = (
    utcDate,
    timezone = "America/Argentina/Buenos_Aires"
) => {
    return new Date(utcDate).toLocaleString("es-AR", { timeZone: timezone });
};

export const formatDate = (fecha) => {
    const [day, month, year] = fecha.split("-");
    return `${year}/${month}/${day}`;
};

export default function formatDateCorrect(fecha) {
    if (!fecha) return "Fecha inválida"; // Evitar valores nulos/indefinidos
    const fechaUTC = new Date(fecha).toISOString().split("T")[0]; // Obtiene YYYY-MM-DD
    const [year, month, day] = fechaUTC.split("-");
    return `${day}/${month}/${year}`;
}
