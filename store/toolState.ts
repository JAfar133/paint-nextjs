import {makeAutoObservable} from "mobx";
import Tool from "@/lib/tools/tool";
import settingState from "@/store/settingState";
export interface ImageForEdit {
    imageX: number,
    imageY: number,
    offsetX: number,
    offsetY: number,
    img: HTMLImageElement,
    isDragging: boolean,
    isResizing: boolean,
    isRotating: boolean,
    isUpload: boolean,
    angle: number
}
class ToolState {
    // @ts-ignore
    tool: Tool;
    imageForEdit: ImageForEdit | null = null;
    constructor() {
        makeAutoObservable(this)
    }

    setTool(tool: Tool){
        this.tool = tool
        this.fill()
    }

    fill(){
        this.tool.strokeColor = settingState.strokeColor || '#000';
        this.tool.fillColor = settingState.fillColor || '#000';
        this.tool.lineWidth = settingState.strokeWidth;
        this.tool.font = settingState.font
    }
}

export default new ToolState();