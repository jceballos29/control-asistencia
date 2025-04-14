import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formatea una hora en formato "HH:MM:SS" o "HH:MM" a formato 12h am/pm.
 * @param timeString La hora en formato "HH:MM:SS" o "HH:MM".
 * @param locale La configuración regional a usar (ej: 'es-CO', 'en-US').
 * @returns La hora formateada (ej: "2:30 p.m.") o "N/A" si la entrada es inválida.
 */
export function formatTimeAmPm(timeString: string | null | undefined, locale: string = 'es-CO'): string {
  if (!timeString) {
    return "N/A";
  }

  try {
    // Parseamos la hora como UTC usando 'Z'
    const date = new Date(`1970-01-01T${timeString}Z`);

    if (isNaN(date.getTime())) {
        console.warn(`Invalid time string provided to formatTimeAmPm: ${timeString}`);
        return "Inválido";
    }

    // Usar Intl.DateTimeFormat para formatear
    const formatter = new Intl.DateTimeFormat(locale, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'UTC' // <-- ¡AÑADIR ESTO! Le dice que formatee la hora en UTC
    });

    // Formatea y luego aplica el reemplazo para estandarizar a.m./p.m.
    return formatter.format(date).replace(/\s?([ap])\.?\s?m\.?/i, '$1.m.');

  } catch (error) {
    console.error(`Error formatting time string ${timeString}:`, error);
    return "Error";
  }
}

/**
 * Convierte un string de hora 'HH:MM' o 'HH:MM:SS' a minutos desde medianoche.
 * Devuelve NaN si el formato es inválido o la entrada es null/undefined.
 */
export function parseTimeToMinutes(timeString: string | null | undefined): number {
  if (!timeString) return NaN; // Devuelve NaN para inválidos/nulos
  const parts = timeString.split(':');
  if (parts.length < 2) return NaN;
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  // Ignoramos segundos para la comparación de duración total
  if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return NaN;
  }
  return hours * 60 + minutes;
}