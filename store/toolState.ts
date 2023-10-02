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
    angle: number,
}
class ToolState {
    tool: Tool | null = null;
    imageForEdit: ImageForEdit | null = null;
    imageForEditList: ImageForEdit[] = [];
    constructor() {
        makeAutoObservable(this);
    }

    addImageForEdit(imageForEdit: ImageForEdit){
        this.imageForEditList = [...this.imageForEditList, imageForEdit];
        this.imageForEdit = this.imageForEditList[this.imageForEditList.length-1];
    }
    setImageForEdit(imageForEdit: ImageForEdit){
        this.imageForEdit = imageForEdit;
    }

    setTool(tool: Tool | null){
        this.tool = tool
        this.fill()
    }

    getImageForEdit(){
        return this.imageForEdit;
    }

    fill(){
        if(this.tool){
            this.tool.strokeColor = settingState.strokeColor || '#000';
            this.tool.fillColor = settingState.fillColor || '#000';
            this.tool.lineWidth = settingState.strokeWidth;
            this.tool.font = settingState.font
        }
    }
}

export default new ToolState();