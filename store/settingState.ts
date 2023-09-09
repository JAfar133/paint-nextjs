import {makeAutoObservable} from "mobx";
import toolState from "@/store/toolState";
import {Color} from "react-input-color";

class SettingState {
    fillColor: Color | null = null;
    strokeColor: Color | null = null;
    strokeWidth: number = 1;
    textSize: number = 40;
    textFont: string = 'Arial';
    fontWeight: string = 'normal';
    fillingTolerance: number = 5;
    constructor() {
        makeAutoObservable(this)
    }

    get font(){
        return `${this.fontWeight} ${this.textSize}px ${this.textFont}`
    }
    setFillingTolerance(tolerance: number) {
        this.fillingTolerance = tolerance;
    }
    setFillColor(color: Color){
        this.fillColor = color;
    }
    setStrokeColor(color: Color){
        this.strokeColor = color;
    }
    setWidth(width: number){
        this.strokeWidth = width;
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
    fillCtx(){
        toolState.fill();
    }

}

export default new SettingState();