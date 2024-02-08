"use client";

import * as React from 'react';
import {useEffect, useState} from 'react';
import {MapContainer, TileLayer, useMapEvents} from 'react-leaflet'
import {LatLngExpression} from 'leaflet';
import s from './Map.module.scss';
import OverLayers from "./overlayers/OverLayers";
import {defaultLayer, LayersName} from "./overlayers/config";

type Props = {}
const position:LatLngExpression = [45, 34];
const windy_url= "https://tiles.windy.com/tiles/v10.0/darkmap/{z}/{x}/{y}.png";
const osmURL= "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";


function Map() {

    const [zoom, setZoom]=React.useState<number|null>(null);
    const [selectedLayer, setSelectedLayer] = useState<LayersName>(defaultLayer);
    const [url, setUrl] = useState(windy_url);


    useEffect(() => {
        if(window.innerWidth<768){
            setZoom(7);
        }else {
            setZoom(9);
        }
    },[])
    const handleSelectedLayer = (newLayer: LayersName): void => {
        setSelectedLayer(newLayer);
    };

    const startPositioon:LatLngExpression=[44.8, 34];

    function ZoomChangeHandler({ setUrl }: {setUrl: React.Dispatch<React.SetStateAction<string>>}) {
        const map = useMapEvents({
            zoomend: ({ target }) => {
                const currentZoom = Math.round(target.getZoom());
                if (currentZoom >  11) {
                    setUrl(osmURL);
                } else {
                    setUrl(windy_url);
                }
            }
        });
        return null;
    }

    return (
        <div className={s.root}>
            {zoom &&
                <MapContainer
                    center={startPositioon}
                    zoom={zoom}
                    minZoom={2}
                    className={s.map}
                    maxBounds={[[-85.05112877980659, -720000.0], [85.0511287798066, 720000.0]]}
                >
                    <OverLayers
                        selectedLayer={selectedLayer}
                        setSelectedLayer={handleSelectedLayer}
                    />
                    <TileLayer url={url} zIndex={1002}/>
                    <ZoomChangeHandler setUrl={setUrl} />
                </MapContainer>
            }
        </div>
    )
}

export default React.memo<Props>(Map);
