import L, {bind} from "leaflet"
import enableWebGLCanvas from "./Canvas2DtoWebGL"
import {gradient} from "./gradient"
import {requestAnimFrame} from "leaflet/src/core/Util";
import {setPosition} from "leaflet/src/dom/DomUtil";

let MAX_ZOOM = 3;
L.TileLayer.Canvas = L.TileLayer.extend({
  setData(data) {
    this.options.data = data
  },
  frozen_percent: 0,
  rain_mm: 0.1,
  getTileByCoords: function (coords) {
    return this._tiles[this._tileCoordsToKey(coords)]
  },
  setUrl: function (newUrl) {
    this._url = newUrl;
    for (const key in this._tiles) {
      const tile = this._tiles[key];
      const coords = this._keyToTileCoords(key);
      this.updateTile(tile.el, this._wrapCoords(coords), L.Util.falseFn, coords);
    }
    return this;
  },
  updateTile: function (tile, coords, done, unwrapCoords) {
    const src = this.getTileUrl(coords);

    const img = new Image();
    img.setAttribute('crossOrigin', 'anonymous')
    img.onload = () => {
      tile.width = img.width;
      tile.height = img.height;
      const imageCanvas = this.createImageTile(img);
      this.drawTile(imageCanvas, coords, tile, done, unwrapCoords);
    };
    img.src = isNaN(this._getZoomForUrl()) ? '' : src;
    img.crossOrigin = "Anonymous";
    img.setAttribute('crossOrigin', 'anonymous')
    
    img.role = "presentation";
    
  },
  _delays: {},
  _delaysForZoom: null,
  createCanvas: function (tile, coords, done, unwrapCoords) {
    const {doubleSize} = this.options;
    const {x: width, y: height} = this.getTileSize();
    tile.width = doubleSize ? width * 2 : width;
    tile.height = doubleSize ? height * 2 : height;
    
    const img = new Image();
    const tileZoom = this._getZoomForUrl();
    if (tileZoom < 2) MAX_ZOOM = 0
    else if (tileZoom < 4) MAX_ZOOM = 1
    else if (tileZoom < 8) MAX_ZOOM = 2
    else MAX_ZOOM = 3
    img.onload = () => {
      tile.width = img.width;
      tile.height = img.height;
      const imageCanvas = this.createImageTile(img)
      this.drawTile(imageCanvas, coords, tile, done,unwrapCoords)
      
    };
    const src = this.getTileUrl(coords);
    
    img.src = isNaN(tileZoom) ? '' : src;
    img.crossOrigin = "Anonymous";
    img.setAttribute('crossOrigin', 'anonymous')
    img.role = "presentation"
    
  },
  getTileUrl: function (coords) {
    const {x, y} = coords;
    const {subdomains} = this.options;
    const tileZoom = this._getZoomForUrl();
    if (tileZoom > MAX_ZOOM) {
      let scaledCoords = {
        x: x >> (tileZoom - MAX_ZOOM),
        y: y >> (tileZoom - MAX_ZOOM),
        z: MAX_ZOOM,
      };
      return L.Util.template(this._url, L.extend({
        s: this._getSubdomain(scaledCoords, subdomains),
        z: scaledCoords.z,
        x: scaledCoords.x,
        y: this.getYForZoom(scaledCoords),
      }));
    } else {
      return L.TileLayer.prototype.getTileUrl.call(this, coords);
    }
  },
  getYForZoom(coords) {
    const maxTiles = Math.pow(2, coords.z);
    return (maxTiles - coords.y - 1) % maxTiles;
  },
  getGradient: function () {
    return gradient[this.options.data] || gradient["wind"]
  },
  createImageTile(img) {

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0)
    return canvas
  },
  fillTile: function name(imgData) {
    const data = imgData.data
    let k = 0;
    for (let i = 0; i < data.length; i += 4) {
      const red = data[i];
      const green = data[i + 1];
      const blue = data[i + 2];
      const value = this.getValueFromPixel([red, green, blue])
      let frozen = null;
      if(this.options.data === 'apcp') {
        frozen = this.getFrozenPrecipitation([red, green, blue])
      }
      if (value !== null) {
        const color = this.interpolateColor(value, this.getGradient())
        if(frozen && frozen > this.frozen_percent) {
          k++;
        }
        if (frozen && frozen > this.frozen_percent && k === 0) {
          data[i] = 89
          data[i + 1] = 89
          data[i + 2] = 89
        }
        else {
          data[i] = color[0]
          data[i + 1] = color[1]
          data[i + 2] = color[2]
        }
        if (frozen && frozen > this.frozen_percent && k===5) {
          k = 0;
        }
        
      }
      
    }
  },
  fillAndReverseTile: function (imgData) {
    const data = imgData.data;
    const width = imgData.width;
    const height = imgData.height;
    const squareSize = 2;
    const reversedData = new Uint8ClampedArray(data.length);
    let k = 0;
    
    for (let y = 0; y < height; y++) {
      const rowIndex = height - y - 1;
      const random = Math.floor(Math.random() * 32 + 48)
      for (let x = 0; x < width; x++) {
        
        const originalIndex = (y * width + x) * 4;
        const reversedIndex = (rowIndex * width + x) * 4;
        
        const red = data[originalIndex];
        const green = data[originalIndex + 1];
        const blue = data[originalIndex + 2];
        
        const value = this.getValueFromPixel([red, green, blue]);
        
        if (value !== null) {
          let frozen = null;
          if(this.options.data === 'apcp') {
            frozen = this.getFrozenPrecipitation([red, green, blue])
          }
          if (frozen && frozen > this.frozen_percent && k > random) {
            k = 0;
          }
          if (frozen && frozen > this.frozen_percent && k === 0) {
            for (let i = 0; i < squareSize; i++) {
              for (let j = -squareSize + 1; j < 1; j++) {
                const squarePixelIndex = ((rowIndex + i) * width + x + j) * 4;
                reversedData[squarePixelIndex] = 255;
                reversedData[squarePixelIndex + 1] = 255;
                reversedData[squarePixelIndex + 2] = 255;
              }
            }
          }
          else {
            const color = this.interpolateColor(value, this.getGradient());
            reversedData[reversedIndex] = color[0];
            reversedData[reversedIndex + 1] = color[1];
            reversedData[reversedIndex + 2] = color[2];
            reversedData[reversedIndex + 3] = color[3] || 255;
          }
          if(frozen && frozen > this.frozen_percent) {
            k++;
          }
        } else {
          reversedData[reversedIndex] = data[originalIndex];
          reversedData[reversedIndex + 1] = data[originalIndex + 1];
          reversedData[reversedIndex + 2] = data[originalIndex + 2];
          reversedData[reversedIndex + 3] = data[originalIndex + 3] || 255;
        }
      }
    }
    return new ImageData(reversedData, width, height);
  },
  drawTile(imageCanvas, coords, tile, done, unwrapCoords) {
    const canvas = document.createElement('canvas')
    canvas.width = tile.width;
    canvas.height = tile.height;
    const ctx = this.getWebGLContext(canvas);
    ctx.imageSmoothingEnabled = 'false'
    const zoom = this._getZoomForUrl();
    if (zoom <= MAX_ZOOM) {
      ctx.drawImage(imageCanvas, 0, 0);
    } else {
      const {x, y, z} = coords;
      const scaledCoords = {
        x: x >> (zoom - MAX_ZOOM),
        y: y >> (zoom - MAX_ZOOM),
        z: MAX_ZOOM,
      };
      const imageWidth = tile.width / 2 ** (zoom - scaledCoords.z);
      const imageHeight = tile.height / 2 ** (zoom - scaledCoords.z);
      const imageX = (coords.x - scaledCoords.x * 2 ** (zoom - scaledCoords.z)) * imageWidth
      const imageY = (coords.y - scaledCoords.y * 2 ** (zoom - scaledCoords.z)) * imageHeight
      ctx.drawImage(
        imageCanvas,
        imageX,
        imageY,
        imageWidth,
        imageHeight,
        0,
        0,
        tile.width,
        tile.height);
    }
    
    
    const imgData = ctx.getImageData(0, 0, tile.width, tile.height)
    
    const tileEl = this._tiles[this._tileCoordsToKey(unwrapCoords)]
    
    if (tileEl) {
      tileEl.imgData = imgData;
    }
    const reversedImgData = this.fillAndReverseTile(imgData);
    const tileCtx = tile.getContext('2d')
    tileCtx.imageSmoothingEnabled = 'false'
    tileCtx.putImageData(reversedImgData, 0, 0)
    
    tile.complete = true;
    done(null, tile);
  },
  getWebGLContext: function (tile) {
    if (!this.webGLContext) {
      this.webGLContext = enableWebGLCanvas(tile);
    }
    return this.webGLContext;
  },
  interpolateColor: function (value, gradient) {
    let lowerIndex = 0;
    let upperIndex = gradient.length - 1;
    if (value === gradient[0].value || (this.options.data === 'apcp' && value < this.rain_mm)) {
      return gradient[0].data
    }
    for (let i = 0; i < gradient.length; i++) {
      if (value === gradient[i].value) {
        lowerIndex = i;
        upperIndex = i;
        break;
      } else if (value < gradient[i].value) {
        upperIndex = i;
        break;
      } else {
        lowerIndex = i;
      }
    }
    
    if (lowerIndex === upperIndex) {
      if (upperIndex !== gradient.length - 1)
        upperIndex++;
      else lowerIndex--;
    }
    const lowerValue = gradient[lowerIndex].value;
    const upperValue = gradient[upperIndex].value;
    
    const fraction = (value - lowerValue) / (upperValue - lowerValue);
    
    return [
      Math.max(0, Math.round(gradient[lowerIndex].data[0] + fraction * (gradient[upperIndex].data[0] - gradient[lowerIndex].data[0]))),
      Math.max(0, Math.round(gradient[lowerIndex].data[1] + fraction * (gradient[upperIndex].data[1] - gradient[lowerIndex].data[1]))),
      Math.max(0, Math.round(gradient[lowerIndex].data[2] + fraction * (gradient[upperIndex].data[2] - gradient[lowerIndex].data[2]))),
    ];
  },
  
  getValueFromPixel: function (pixel) {
    const [r, g, b] = pixel;
    let data = null;
    if (this.options.data === "wind") {
      data = b * 40 / 255
    } else if (this.options.data === "tmp") {
      data = r * 120 / 255 + 200
    } else if (this.options.data === "apcp") {
      data = r * 35 / 255
    } else if (this.options.data === "rh") {
      data = r * 100 / 255
    } else if (this.options.data === "pres") {
      data = r * 150 / 255 + 900
    } else if (this.options.data === "tcdc") {
      data = r * 100 / 255;
    }
    return data
  },
  getFrozenPrecipitation: function (pixel) {
    const [r, g, b] = pixel;
    return g > 127 ? 1 : 0;
  },
  getSnowDepth: function (pixel) {
    const [r, g, b] = pixel;
    return b * 200 / 255;
  },
  getWindyDirection: function (pixel) {
    const [r, g, b] = pixel;
    let wind_direction = g / 255 * Math.PI
    if (r < 65) {
      wind_direction *= -1
    }
    return wind_direction
  },
  createTile: function (coords, done, unwrapCoords) {
    const {timeout} = this.options;
    const {z: zoom} = coords;
    const tile = document.createElement("canvas");
    
    if (timeout) {
      if (zoom !== this._delaysForZoom) {
        this._clearDelaysForZoom();
        this._delaysForZoom = zoom;
      }
      
      if (!this._delays[zoom]) this._delays[zoom] = [];
      
      this._delays[zoom].push(setTimeout(() => {
        this.createCanvas(tile, coords, done, unwrapCoords);
      }, timeout));
    } else {
      this.createCanvas(tile, coords, done, unwrapCoords);
    }
    
    return tile;
  },
  _addTile: function (coords, container) {
    const tilePos = this._getTilePos(coords),
      key = this._tileCoordsToKey(coords);
    
    const tile = this.createTile(this._wrapCoords(coords), bind(this._tileReady, this, coords), coords);
    this._initTile(tile);
    
    if (this.createTile.length < 2) {
      requestAnimFrame(bind(this._tileReady, this, coords, null, tile));
    }
    
    setPosition(tile, tilePos);
    
    // save tile in cache
    this._tiles[key] = {
      el: tile,
      coords: coords,
      current: true
    };
    
    container.appendChild(tile);
    this.fire('tileloadstart', {
      tile: tile,
      coords: coords
    });
  },
  _clearDelaysForZoom: function () {
    const prevZoom = this._delaysForZoom;
    const delays = this._delays[prevZoom];
    
    if (!delays) return;
    
    delays.forEach((delay, index) => {
      clearTimeout(delay);
      delete delays[index];
    });
    
    delete this._delays[prevZoom];
  },
  
});

L.tileLayer.canvas = function tileLayerCanvas(url, options) {
  return new L.TileLayer.Canvas(url, options);
};