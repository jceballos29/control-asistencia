import { DayOfWeek } from '@/features/admin/offices/types'; // Ajusta la ruta

// Mapeo de tu enum a los números de día (Domingo=0)
const dayOfWeekMapping: Record<DayOfWeek, number> = {
    [DayOfWeek.SUNDAY]: 0,
    [DayOfWeek.MONDAY]: 1,
    [DayOfWeek.TUESDAY]: 2,
    [DayOfWeek.WEDNESDAY]: 3,
    [DayOfWeek.THURSDAY]: 4,
    [DayOfWeek.FRIDAY]: 5,
    [DayOfWeek.SATURDAY]: 6,
};

/**
 * Calcula los números de los días de la semana (0-6) que NO están
 * incluidos en el array de días laborales proporcionado.
 *
 * @param workingDays Array de días laborales (usando el enum DayOfWeek) o null/undefined.
 * @returns Un array de números (0-6) representando los días NO laborales.
 * Devuelve un array vacío si workingDays es null/undefined, vacío, o contiene todos los días.
 */
export function getNonWorkingDayNumbers(workingDays: DayOfWeek[] | null | undefined): number[] {
    // Si no hay días laborales definidos, o todos están definidos,
    // entonces no hay días *específicamente* no laborales a deshabilitar.
    if (!workingDays || workingDays.length === 0 || workingDays.length === 7) {
        return []; // No hay días a deshabilitar específicamente por esta regla
    }

    // Array con todos los números de día (0=Domingo, 6=Sábado)
    const allDayNumbers: number[] = [0, 1, 2, 3, 4, 5, 6];

    // Convierte los días laborales (strings del enum) a un Set de números
    const allowedDayNumbers = new Set(workingDays.map(day => {
        // Busca el número correspondiente en el mapeo
        const dayNum = dayOfWeekMapping[day];
        // Añade un check por si acaso el mapeo o el enum tuvieran problemas
        if (dayNum === undefined) {
            console.warn(`Valor de DayOfWeek no reconocido en mapeo: ${day}`);
        }
        return dayNum;
    // Filtra cualquier valor undefined que pudiera resultar de un enum inválido
    }).filter((num): num is number => num !== undefined));

    // Filtra el array [0, 1,..., 6] y se queda con los números
    // que NO están en el Set de días permitidos (allowedDayNumbers)
    const nonWorkingDayNumbers = allDayNumbers.filter(dayNum => !allowedDayNumbers.has(dayNum));

    return nonWorkingDayNumbers;
}