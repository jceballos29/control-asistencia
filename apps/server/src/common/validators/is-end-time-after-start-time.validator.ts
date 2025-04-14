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
  function parseTimeToMinutes(time: string): number {
    if (!time || typeof time !== 'string') return NaN;
    const parts = time.split(':');
    if (parts.length < 2) return NaN;
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    // Podríamos incluir segundos si la precisión fuera necesaria:
    // const seconds = parts.length > 2 ? parseInt(parts[2], 10) : 0;
    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      return NaN; // Hora o minutos inválidos
    }
    return hours * 60 + minutes;
  }
  
  @ValidatorConstraint({ name: 'isEndTimeAfterStartTime', async: false })
  export class IsEndTimeAfterStartTimeConstraint implements ValidatorConstraintInterface {
    validate(endTime: any, args: ValidationArguments) {
      const startTime = (args.object as any)[args.constraints[0]]; 
  
      if (typeof startTime !== 'string' || typeof endTime !== 'string') {
        return false;
      }
  
      const startMinutes = parseTimeToMinutes(startTime);
      const endMinutes = parseTimeToMinutes(endTime);

      if (isNaN(startMinutes) || isNaN(endMinutes)) {
          return true;
      }
  
      return endMinutes > startMinutes; 
    }
  
    defaultMessage(args: ValidationArguments) {
      const [relatedPropertyName] = args.constraints;
      return `La hora de fin (${args.property}) debe ser posterior a la hora de inicio (${relatedPropertyName}).`;
    }
  }

  export function IsEndTimeAfterStartTime(property: string, validationOptions?: ValidationOptions) {
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