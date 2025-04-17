export function formatDateToHHMMSS(date: Date | null | undefined): string {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      // Devuelve un valor por defecto o lanza error si la fecha es inválida/null
      // Aquí devolvemos string vacío, ajusta según tu necesidad
      return '';
  }
  // Asegura que se usen horas/minutos/segundos UTC para consistencia con @db.Time
  const hours = date.getUTCHours().toString().padStart(2, '0');
  const minutes = date.getUTCMinutes().toString().padStart(2, '0');
  const seconds = date.getUTCSeconds().toString().padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}