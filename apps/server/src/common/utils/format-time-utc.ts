/**
 * Formatea la porción de HORA de un objeto Date a un string 'HH:MM:SS' usando UTC.
 * @param date El objeto Date a formatear.
 * @returns El string de hora 'HH:MM:SS' o null si la entrada es null/undefined.
 */
export function formatTimeUtc(date: Date | null | undefined): string | null {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      return null; // Devuelve null si la fecha no es válida o es null/undefined
  }
  // Obtiene horas, minutos y segundos en UTC
  const hours = date.getUTCHours().toString().padStart(2, '0');
  const minutes = date.getUTCMinutes().toString().padStart(2, '0');
  const seconds = date.getUTCSeconds().toString().padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}