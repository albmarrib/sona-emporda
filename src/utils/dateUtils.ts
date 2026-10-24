import { format } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Convierte cualquier formato de fecha (String ISO, Firestore Timestamp, Date, milisegundos)
 * en un objeto Date nativo válido, o devuelve null si no es válida.
 * Evita excepciones fatales tipo 'RangeError: Invalid time value'.
 */
export const parseSafeDate = (input: any): Date | null => {
  if (!input) return null;

  try {
    if (typeof input?.toDate === 'function') {
      const d = input.toDate();
      return isNaN(d.getTime()) ? null : d;
    }

    if (input?.seconds !== undefined && typeof input.seconds === 'number') {
      const d = new Date(input.seconds * 1000);
      return isNaN(d.getTime()) ? null : d;
    }

    if (input instanceof Date) {
      return isNaN(input.getTime()) ? null : input;
    }

    if (typeof input === 'number') {
      const timestamp = input < 10000000000 ? input * 1000 : input;
      const d = new Date(timestamp);
      return isNaN(d.getTime()) ? null : d;
    }

    if (typeof input === 'string') {
      const d = new Date(input);
      return isNaN(d.getTime()) ? null : d;
    }

    return null;
  } catch {
    return null;
  }
};

/**
 * Formatea una fecha de forma completamente segura.
 * Si la fecha no es válida o es nula, devuelve un string vacío o el fallback indicado
 * en lugar de lanzar una excepción que desmonte el árbol de React.
 */
export const formatSafe = (
  input: any,
  formatPattern: string,
  fallback = ''
): string => {
  const date = parseSafeDate(input);
  if (!date) return fallback;

  try {
    return format(date, formatPattern, { locale: es });
  } catch (err) {
    console.warn('formatSafe encountered an invalid date format:', input, err);
    return fallback;
  }
};

/**
 * Obtiene los milisegundos seguros para ordenar arrays de fechas sin producir NaN.
 */
export const getSafeTimeMs = (input: any): number => {
  const date = parseSafeDate(input);
  return date ? date.getTime() : 0;
};
