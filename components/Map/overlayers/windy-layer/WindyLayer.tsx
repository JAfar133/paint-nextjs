import React, {useEffect, useState} from 'react';
import L from 'leaflet';
import './wind'

import {useLeafletContext} from "@react-leaflet/core";
import {CustomLayerProps} from "../canvas-layer/CanvasLayer";
import "./WindyLayer";

declare module 'leaflet' {
  class WindyLayer extends L.Layer {
    options: L.TileLayerOptions;
    _windy: any
  }

  function windyLayer(options?: L.TileLayerOptions): WindyLayer;
}

const WindyLayer: React.FC<CustomLayerProps> = ({ url, options }) => {
  const context = useLeafletContext();
  const [windyLayer, setWindyLayer] = useState<L.WindyLayer>()
  useEffect(() => {
    if (url && windyLayer) {
      windyLayer._windy?.setUrl(url)
    }
  }, [url]);

  useEffect(() => {
    const overlayLayer = L.windyLayer(options)
    setWindyLayer(overlayLayer)
    const container = context.map
    container.addLayer(overlayLayer)
    return () => {
      container.removeLayer(overlayLayer)
    }
  }, []);

  return null;
};

export default WindyLayer;
