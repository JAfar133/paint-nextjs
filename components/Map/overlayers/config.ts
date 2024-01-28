export type LayersName = "wind" | "tmp" | "apcp" | "rh" | "pres";
export const defaultLayer: LayersName = 'wind'
export const MAX_FORECAST_HOURS = 72
export const FORECAST_STEP = 6
export const WEATHER_CYCLE_STEP = 6
export const tiles_ecmwf_url = `/tiles/ecmwf`
