import {FORECAST_STEP, MAX_FORECAST_HOURS} from "../overlayers/config";

export const formatDateTime = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');

  return `${year}${month}${day}${hours}`;
}

export const reformatDateTime = (stringDate: string): Date => {
  const year = parseInt(stringDate.slice(0, 4), 10);
  const month = parseInt(stringDate.slice(4, 6), 10) - 1;
  const day = parseInt(stringDate.slice(6, 8), 10);
  const hour = parseInt(stringDate.slice(8, 10), 10);

  return new Date(year, month, day, hour);
}
export const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}${month}${day}`;
}

export const reformatDate = (stringDate: string): Date => {
  const year = parseInt(stringDate.slice(0, 4), 10);
  const month = parseInt(stringDate.slice(4, 6), 10) - 1;
  const day = parseInt(stringDate.slice(6, 8), 10);

  return new Date(year, month, day);
}
export const getWeatherDate = (date: Date): Date => {
  const weather_date = new Date(date)
  weather_date.setHours(weather_date.getHours() - 8);
  const hour = Math.floor(weather_date.getHours() / FORECAST_STEP) * FORECAST_STEP;
  weather_date.setHours(hour, 0, 0, 0);

  return weather_date;
};
export const getForecastDate = (date: Date): Date => {
  const forecast_date = new Date(date)
  const forecast_hour = Math.floor(forecast_date.getHours() / FORECAST_STEP) * FORECAST_STEP;
  forecast_date.setHours(forecast_hour, 0, 0, 0);
  return forecast_date
};

export const isDatesEqual = (date1: Date, date2: Date): boolean => {
  return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate() &&
      date1.getHours() === date2.getHours()
  );
}

export const getMaxForecastDate = (date: Date): Date => {
  const weatherDate = new Date(date);
  weatherDate.setHours(0, 0, 0, 0)
  weatherDate.setHours(weatherDate.getHours() + MAX_FORECAST_HOURS)
  return weatherDate
}

export const getMinForecastDate = (date: Date): Date => {
  const minDate = new Date(date)
  minDate.setHours(0, 0, 0, 0)
  return minDate
}