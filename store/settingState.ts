import {makeAutoObservable} from "mobx";
import canvasState from "@/store/canvasState";
class SettingState {
    fillColor: string = '#000000';
    strokeColor: string = '#000000';
    strokeWidth: number = 10;
    textSize: number = 40;
    textFont: string = 'Arial';
    fontWeight: string = 'normal';
    fillingTolerance: number = 5;
    lineCap: CanvasLineCap = 'butt';
    lineJoin: CanvasLineJoin = 'miter'
    globalAlpha: number = 1;
    constructor() {
        makeAutoObservable(this)
    }

    get font(){
        return `${this.fontWeight} ${this.textSize}px ${this.textFont}`
    }
    setGlobalAlpha(alpha: number){
        this.globalAlpha = alpha;
    }
    setFillingTolerance(tolerance: number) {
        this.fillingTolerance = tolerance;
    }
    setFillColor(color: string){
        this.fillColor = color;
    }
    setStrokeColor(color: string){
        this.strokeColor = color;
    }
    setWidth(width: number){
        this.strokeWidth = width;
    }
    setLineCap(lineCap: CanvasLineCap){
        this.lineCap = lineCap;
    }
    setLineJoin(lineJoin: CanvasLineJoin){
        this.lineJoin = lineJoin;
    }
    setTextSize(size: number){
        this.textSize = size;
    }
    setTextFont(font: string){
        this.textFont = font;
    }
    setFontWeight(weight: string){
        this.fontWeight = weight;
    }
}

export default new SettingState();