import React, {useEffect, useRef, useState} from 'react';
import * as L from 'leaflet';
import {CanvasTileLayer, CRS} from 'leaflet';
import 'leaflet';
import './canvas-layer';
import {useLeafletContext} from "@react-leaflet/core";
import {units} from "./gradient";
import {renderToString} from "react-dom/server";
import {layers} from "../LayerControls";
import {degreeToWindDirection, radianToDegree} from "../../utils/convertionFunctions";
import {Droplet, Snowflake} from 'lucide-react';
import {DirectionRightIcon} from "evergreen-ui";

export interface CustomLayerProps {
  url: string;
  options: L.TileLayerOptions;
}

declare module 'leaflet' {
  interface TileLayerOptions {
    doubleSize?: boolean;
    data?: string;
    timeout?: number;
    url?: string
  }

  class CanvasTileLayer extends L.TileLayer {
    setData(data: string): void;

    getTileByCoords(coords: L.Coords): any;

    getValueFromPixel(pixel: number[]): number;

    getFrozenPrecipitation(pixel: number[]): number;

    getSnowDepth(pixel: number[]): number;

    getWindyDirection(pixel: number[]): number;

    rain_mm: number;
    frozen_percent: number;
  }

  namespace tileLayer {
    function canvas(url: string, options?: TileLayerOptions): CanvasTileLayer;
  }
}

const CanvasLayer: React.FC<CustomLayerProps> = ({url, options}) => {
  const context = useLeafletContext();
  const container = context.map
  const [overlayLayer, setOverlayLayer] = useState<CanvasTileLayer>()
  const dataMarker = useRef<L.Marker>();
  const [clickLatLng, setClickLatLng] = useState<L.LatLng>();

  const customIcon = L.icon({
    iconUrl: '/data_marker1.png',
    iconSize: [40, 40],
    iconAnchor: [20, 33],
    popupAnchor: [0, -4]
  });

  useEffect(() => {
    if (url && overlayLayer) {
      const data = url.split('/').slice(-4, -3)[0]
      overlayLayer.setUrl(url);
      if (clickLatLng && dataMarker.current && container.hasLayer(dataMarker.current)) {
        setTimeout(() => {
          createDataMarker()
        }, 500)

      }
      overlayLayer.setData(data);
    }
  }, [url]);
  const latlngToTilePixel = (latlng: L.LatLng, crs: CRS, zoom: number, tileSize: number | L.Point, pixelOrigin: L.Point) => {
    const layerPoint = crs.latLngToPoint(latlng, zoom).floor()
    const coords = layerPoint.divideBy(tileSize instanceof L.Point ? tileSize.x : tileSize).floor()
    const tileCorner = coords.multiplyBy(tileSize instanceof L.Point ? tileSize.x : tileSize).subtract(pixelOrigin)
    const tilePixel = layerPoint.subtract(pixelOrigin).subtract(tileCorner)
    const tileCoords = coords as L.Coords
    tileCoords.z = zoom;
    return {tileCoords, tilePixel}
  }

  const getCanvasPixel = (imgData: ImageData, point: L.Point) => {
    const index = ((imgData.height - point.y - 1) * imgData.width + point.x) * 4;
    return [imgData.data[index], imgData.data[index + 1], imgData.data[index + 2]]
  }

  useEffect(() => {
    const layer = L.tileLayer.canvas(url, options)

    layer.addTo(container)
    setOverlayLayer(layer)

    container.on('click', e => {
      if (dataMarker.current) {
        container.removeLayer(dataMarker.current);
      }
      setClickLatLng(e.latlng)
      createDataMarker(e.latlng, layer)
    })
    return () => {
      layer.removeFrom(container)
      if (dataMarker.current) {
        container.removeLayer(dataMarker.current);
      }
    }
  }, []);

  interface LayerData {
    value1: number | null;
    value2: number | null;
  }

  function getDataFromLatLng(latlng: L.LatLng, layer: CanvasTileLayer): LayerData {
    const zoom = container.getZoom();
    const crs = container.options.crs;
    const data: LayerData = { value1: null, value2: null };

    if (crs) {
      const { tileCoords, tilePixel } = latlngToTilePixel(
          latlng,
          crs,
          zoom,
          layer.options.tileSize || 256,
          container.getPixelOrigin()
      );
      const tile: any = layer.getTileByCoords(tileCoords);

      if (tile && tile.el instanceof HTMLCanvasElement && tile.imgData) {
        const pixel = getCanvasPixel(tile.imgData, tilePixel);
        data.value1 = layer.getValueFromPixel(pixel);

        if (data.value1 !== null && layer.options.data) {
          if (layer.options.data === 'tmp') {
            data.value1 = Math.round(data.value1 - 273);
          } else if (layer.options.data === 'apcp') {
            data.value1 = Number(data.value1.toFixed(1));
            data.value2 = layer.getFrozenPrecipitation(pixel)
          } else if (layer.options.data === 'wind') {
            data.value1 = Math.round(data.value1);
            data.value2 = layer.getWindyDirection(pixel)
          } else {
            data.value1 = Math.round(data.value1);
          }
        }
      }
    }

    return data;
  }

  function createDataMarker(
      latlng: L.LatLng | undefined = clickLatLng,
      layer: CanvasTileLayer | undefined = overlayLayer
  ) {
    if (latlng && layer) {
      const data = getDataFromLatLng(latlng, layer);
      const value = data.value1;

      if (value !== null && layer.options.data) {
        const icon = getIcon(layer.options.data);

        if (!dataMarker.current) {
          const popup = L.popup({
            className: 'data_popup',
          })
          .setLatLng(latlng)
          .setContent(renderPopupContent(icon, layer, data.value2, value) ?? '')
          .openOn(container);

          dataMarker.current = L.marker(latlng, { icon: customIcon, draggable: true }).addTo(container);
          dataMarker.current.bindPopup(popup).openPopup();
        } else {
          updateMarker(latlng, icon, layer, data.value2, value);
        }

        dataMarker.current.on('dragend', function (event) {
          handleMarkerDragEnd(event, layer);
        });

        attachPopupCloseEvent();
      }
    }
  }

  function renderPopupContent(icon: any, layer: CanvasTileLayer, value2: number | null, value1: number) {
    if (!layer.options.data) return null;

    let secondMsg = null;
    let isSnow = false;
    if (value2 !== null){
      if (layer.options.data === 'wind') {
        const degree = radianToDegree(value2)
        secondMsg = <><DirectionRightIcon style={{rotate: `${-degree}deg`, width: 13}}/> {degreeToWindDirection(degree)}</>
      } else if (layer.options.data === 'apcp') {
        if (value2 > layer.frozen_percent) isSnow = true;
        secondMsg = value1 < layer.rain_mm ? '' : isSnow ? <Snowflake/>: <Droplet/>
      }
    }
      return renderToString(
          <div>
            {React.cloneElement(icon)}
            {`${value1.toString()} ${!isSnow ? units[layer.options.data] || '%' : 'см'}`}
            <div>{secondMsg !== null ? secondMsg : ''}</div>
          </div>
      );
  }

  function updateMarker(latlng: L.LatLng, icon: any, layer: CanvasTileLayer, value2: number | null, value1: number) {
    dataMarker.current?.setLatLng(latlng).addTo(container);
    dataMarker.current?.getPopup()?.setLatLng(latlng).setContent(renderPopupContent(icon, layer, value2, value1) ?? '').openOn(container);
  }

  function handleMarkerDragEnd(event: L.DragEndEvent, layer: CanvasTileLayer) {
    const marker = event.target;
    const position = marker.getLatLng();
    setClickLatLng(position);

    const data = getDataFromLatLng(position, layer);
    const value = data.value1;

    if (value !== null && layer.options.data) {
      const newMsg = `${value.toString()} ${units[layer.options.data] || '%'}`;
      updateMarker(position, getIcon(layer.options.data), layer, data.value2, value);
    }
  }

  function attachPopupCloseEvent() {
    document.querySelector('.data_popup .leaflet-popup-close-button')?.addEventListener('click', () => {
      dataMarker.current?.removeFrom(container);
    });
  }


  function getIcon(data: string): any {
    const layer = layers.find(layer => layer.value === data);
    return layer ? layer.icon : null;
  }

  return null;
};

export default CanvasLayer;
