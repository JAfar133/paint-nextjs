import React, {useEffect, useState} from 'react';
import CanvasLayer from "./canvas-layer/CanvasLayer";
import WindyLayer from "./windy-layer/WindyLayer";
import LayerControls from "./LayerControls";
import {tiles_ecmwf_url} from "./config";
import {useLeafletContext} from "@react-leaflet/core";
import {formatDateTime, getForecastDate, getWeatherDate} from "../utils/dateFunctionss";
import {LayersName, WEATHER_CYCLE_STEP} from "./config";

interface LayerControlsProps {
  selectedLayer: LayersName;
  setSelectedLayer: (newLayer: LayersName) => void;
}
const currentDate = new Date()
const OverLayers: React.FC<LayerControlsProps> = ({selectedLayer, setSelectedLayer}) => {

    const map = useLeafletContext().map;

  const [layerUrl, setLayerUrl] = useState<string | null>(null);
  const [windUrl, setWindUrl] = useState<string | null>(null);
  const [weatherDate, setWeatherDate] = useState<Date>();
  const [forecastDate, setForecastDate] = useState<Date>();
  const [zoom, setZoom] = useState<number>(map.getZoom());
  const [showWindy, setShowWindy] = useState<boolean>(true)

  useEffect(() => {
    const handleZoomChange = () => {
      setZoom(map.getZoom())
    };
    map.on('zoomend', handleZoomChange);
    return () => {
      map.off('zoomend', handleZoomChange);
    };
  }, [map]);
  useEffect(()=>{
    // console.log(layerUrl)
  },[layerUrl])

  const handleLayerChange = (newLayer: LayersName) => {
    setSelectedLayer(newLayer);
    setLayerUrl((prevLayerUrl) => {
      if (prevLayerUrl !== null) {
        return prevLayerUrl.replace(selectedLayer, newLayer);
      }
      return null;
    });

  };

  const handleForecastDateChange = (date: Date) => {
    const weather_date = getWeatherDate(currentDate)
    if(date < weather_date) {
      setWeatherDate(new Date(date));
    } else {
      setWeatherDate(weather_date);
    }
    setForecastDate(date);
  };
  const checkTileUrl = async (url: string): Promise<boolean> => {
    const working_url = url
        .replace('{z}', '2')
        .replace('{x}', '2')
        .replace('{y}', '2')
        .replace(selectedLayer, 'wind');
    try {
      const response = await fetch(working_url);
      return response.ok;
    } catch (error) {
      return false;
    }
  };

  const createTilesUrls = (weather_date: Date, forecast_date: Date, layer_name: LayersName) => {
    const weather_date_format = formatDateTime(weather_date);
    const forecast_date_format = formatDateTime(forecast_date);

    const layer_url = `${tiles_ecmwf_url}/${weather_date_format}/${forecast_date_format}/${layer_name}/{z}/{x}/{y}.png`;
    const wind_url = `${tiles_ecmwf_url}/${weather_date_format}/${forecast_date_format}/wind/{z}/{x}/{y}.png`;

    return {layer_url, wind_url}
  };

  const setLayersUrls = async (weatherDate: Date, forecastDate: Date, selectedLayer: LayersName, count: number = 0) => {
    const {layer_url, wind_url} = createTilesUrls(weatherDate, forecastDate, selectedLayer);
    const isLayerUrlValid = await checkTileUrl(layer_url);
    if (count === 5 || isLayerUrlValid) {
      setLayerUrl(layer_url);
      setWindUrl(wind_url);
    } else {
      weatherDate.setHours(weatherDate.getHours() - WEATHER_CYCLE_STEP)
      await setLayersUrls(weatherDate, forecastDate, selectedLayer, ++count);
    }
  }
  useEffect(()=>{
    const weather_date = getWeatherDate(currentDate);
    const forecast_date = getForecastDate(currentDate);

    setWeatherDate(weather_date);
    setForecastDate(forecast_date);

  }, []);

  useEffect(()=>{
    if(weatherDate && forecastDate) {
      setLayersUrls(weatherDate, forecastDate, selectedLayer)
    }
  },[weatherDate, forecastDate]);

  return (
      <div>
        {weatherDate && forecastDate && <LayerControls
            layerChange={handleLayerChange}
            selectedLayer={selectedLayer}
            forecastDateChange={handleForecastDateChange}
            forecastDate={forecastDate}
            showWindy={showWindy}
            setShowWindy={setShowWindy}
        />}

        {layerUrl && zoom < 13 &&
          <CanvasLayer url={layerUrl} options={{
            opacity: 1,
            data: selectedLayer
          }} /> }
        {windUrl  && showWindy &&
          <WindyLayer url={windUrl} options={{
            url: windUrl,
            data: selectedLayer,
            opacity: 1
          }} /> }
      </div>
  );
};

export default OverLayers;
