export function toDate(value: string | number | undefined): Date | null {
    return value
        ? typeof value === 'number'
            ? isTimestampInSeconds(value)
                ? new Date(value * 1000)
                : new Date(value)
            : new Date(value)
        : null;
}

export function degreeToWindDirection(value: number): string | null {
    return (value >= 0) && (value <= 360)
        ? (value >= 22) && (value <= 67)
            ? "Ю/З"
            : (value > 67) && (value <= 112)
                ? "Ю"
                : (value > 112) && (value <= 157)
                    ? "Ю/В"
                    : (value > 157) && (value <= 202)
                        ? "В"
                        : (value > 202) && (value <= 247)
                            ? "С/В"
                            : (value > 247) && (value <= 292)
                                ? "С"
                                : (value > 292) && (value <= 337)
                                    ? "С/З"
                                    : "З"
        : null;
}
export function radianToDegree(radians: number) {
    const angleInDegrees = (radians * 180) / Math.PI;
    return (angleInDegrees + 360) % 360;
}
export function hPaToMmHg(pressure: number) {
    return pressure * 0.75;
}

export function addDaysToTimestamp(timestamp: number, days: number) {
    return addHoursToTimestamp(timestamp, 24 * days);
}

export function addHoursToTimestamp(timestamp: number, hours: number) {
    return isTimestampInSeconds(timestamp)
        ? timestamp + 60 * 60 * hours
        : timestamp + 60 * 60 * 1000 * hours;
}

export function windSpeedToPower(speed: number) {
    return speed <= 0
        ? 'нет ветра'
        : speed > 4 && speed <= 10
            ? 'средний'
            : speed > 10
                ? 'сильный'
                : 'легкий';
}

export function sensorNumberToType(sensorNumber: number) {
    return sensorNumber >= 1 && sensorNumber <= 1999
        ? 'bouy'
        : sensorNumber >= 2000 && sensorNumber <= 3999
            ? 'ship'
            : 'sputnik';
}

function isTimestampInSeconds(timestamp: number) {
    return (Math.log(timestamp) * Math.LOG10E + 1 | 0) < 13; // digits count < 13 (timestamp is in seconds)
}
