export type LayersName = "wind" | "tmp" | "apcp" | "rh" | "pres" | "tcdc" ;
export const defaultLayer: LayersName = 'wind'
export const MAX_FORECAST_HOURS = 90
export const FORECAST_STEP = 6
export const WEATHER_CYCLE_STEP = 6
export const tiles_ecmwf_url = `https://paint-backend.smartyalta.ru/files/tiles/ecmwf`
