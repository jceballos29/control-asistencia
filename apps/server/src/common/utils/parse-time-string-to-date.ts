export function parseTimeStringToDate(timeString: string): Date {
  // Validate time string format (HH:mm:ss or HH:mm)
  const timeFormatRegex = /^([0-1][0-9]|2[0-3]):([0-5][0-9])(:[0-5][0-9])?$/;
  if (!timeFormatRegex.test(timeString)) {
    throw new Error('Invalid time format. Expected HH:mm:ss or HH:mm');
  }
  return new Date(`1970-01-01T${timeString}Z`);
}
