// src/common/validators/is-end-time-after-start-time.validator.ts
import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  registerDecorator,
  ValidationOptions,
} from 'class-validator';

/**
 * Función auxiliar para convertir 'HH:MM' o 'HH:MM:SS' a minutos desde medianoche.
 * Devuelve NaN si el formato es inválido.
 */
function parseTimeToMinutes(time: any): number {
  if (!time || typeof time !== 'string') return NaN;
  const parts = time.split(':');
  if (parts.length < 2) return NaN;
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  if (
    isNaN(hours) ||
    isNaN(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return NaN;
  }
  return hours * 60 + minutes;
}

@ValidatorConstraint({ name: 'isEndTimeAfterStartTime', async: false })
export class IsEndTimeAfterStartTimeConstraint
  implements ValidatorConstraintInterface
{
  validate(endTime: any, args: ValidationArguments) {
    const startTime = (args.object as any)[args.constraints[0]];

    // Si alguno no está presente (en UpdateDTO), la validación pasa
    // ya que no se puede comparar la relación.
    if (
      startTime === undefined ||
      endTime === undefined ||
      startTime === null ||
      endTime === null
    ) {
      return true;
    }

    // Si ambos están presentes, pero no son strings, falla (o maneja como prefieras)
    if (typeof startTime !== 'string' || typeof endTime !== 'string') {
      return false; // O true si quieres permitir tipos no string aquí
    }

    const startMinutes = parseTimeToMinutes(startTime);
    const endMinutes = parseTimeToMinutes(endTime);

    // Si alguno no es parseable, pasa la validación (otros validadores se encargarán del formato)
    if (isNaN(startMinutes) || isNaN(endMinutes)) {
      return true;
    }

    // La validación real: endTime debe ser > startTime
    return endMinutes > startMinutes;
  }

  defaultMessage(args: ValidationArguments) {
    const [relatedPropertyName] = args.constraints;
    return `La hora de fin (${args.property}) debe ser posterior a la hora de inicio (${relatedPropertyName}) si ambas son proporcionadas.`;
  }
}

export function IsEndTimeAfterStartTime(
  property: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [property],
      validator: IsEndTimeAfterStartTimeConstraint,
    });
  };
}
