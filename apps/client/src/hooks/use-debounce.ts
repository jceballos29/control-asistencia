// src/hooks/use-debounce.ts
import { useState, useEffect } from 'react';

/**
 * Hook personalizado para "debouncing" de un valor.
 * Retrasa la actualización del valor devuelto hasta que
 * haya pasado un tiempo específico sin que el valor original cambie.
 *
 * @template T El tipo del valor a "debouncar".
 * @param {T} value El valor que se quiere "debouncar".
 * @param {number} delay El tiempo de espera en milisegundos.
 * @returns {T} El valor "debounced".
 */
export function useDebounce<T>(value: T, delay: number): T {
  // Estado para almacenar el valor "debounced"
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(
    () => {
      // Configura un temporizador para actualizar el valor "debounced"
      // después de que haya pasado el 'delay' especificado.
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);

      // Función de limpieza:
      // Se ejecuta si 'value' o 'delay' cambian ANTES de que el temporizador termine,
      // o cuando el componente se desmonta.
      // Cancela el temporizador pendiente para evitar actualizar el estado con un valor obsoleto.
      return () => {
        clearTimeout(handler);
      };
    },
    [value, delay] // Solo re-ejecuta el efecto si 'value' o 'delay' cambian
  );

  // Devuelve el valor "debounced" más reciente
  return debouncedValue;
}

// Exportación por defecto opcional
// export default useDebounce;