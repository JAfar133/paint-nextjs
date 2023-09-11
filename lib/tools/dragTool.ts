import Tool, {ImageForEdit} from "@/lib/tools/tool";
import toolState from "@/store/toolState";
import canvasState from "@/store/canvasState";

type dragAngle = "leftTop" | "leftBottom" | "rightTop" | "rightBottom"

export default class DragTool extends Tool {

    startX: number = 0;
    startY: number = 0;
    startWidth: number = 0;
    startHeight: number = 0;
    dragAngle: dragAngle = 'leftTop';

    constructor(canvas: HTMLCanvasElement, socket: WebSocket, id: string | string[], type: string) {
        super(canvas, socket, id, type);
        const img = new Image();
        img.src = canvas.toDataURL();
        canvasState.deleteBorder();
        const imgOnload = () => {
            img.onload = () => {
                this.ctx.clearRect(0, 0, canvas.width, canvas.height);
                canvasState.savedCanvasWithoutImage = canvas.toDataURL();
                this.ctx.drawImage(img, 0, 0)
            }
        }
        if (toolState.imageForEdit) {
            if (!toolState.imageForEdit.isUpload) {
                imgOnload();
                toolState.imageForEdit = {
                    imageX: 0,
                    imageY: 0,
                    offsetX: 0,
                    offsetY: 0,
                    img: img,
                    isDragging: false,
                    isResizing: false,
                    isUpload: false
                }
            } else {
                canvasState.savedCanvasWithoutImage = canvas.toDataURL();
                toolState.imageForEdit.isUpload = false;
            }
        } else {
            imgOnload();
            toolState.imageForEdit = {
                imageX: 0,
                imageY: 0,
                offsetX: 0,
                offsetY: 0,
                img: img,
                isDragging: false,
                isResizing: false,
                isUpload: false
            }
        }

        canvasState.drawBorder();
    }

    mouseDownHandler(e: MouseEvent): void {
        const mouseX = e.clientX - this.canvas.offsetLeft;
        const mouseY = e.clientY - this.canvas.offsetTop;
        if (toolState.imageForEdit) {
            this.startX = mouseX;
            this.startY = mouseY;
            this.startWidth = toolState.imageForEdit.img.width;
            this.startHeight = toolState.imageForEdit.img.height;
            this.saved = this.canvas.toDataURL();
            const initDrag = () => {
                if (toolState.imageForEdit) {
                    toolState.imageForEdit.isResizing = true;
                    toolState.imageForEdit.offsetX = mouseX - toolState.imageForEdit.imageX;
                    toolState.imageForEdit.offsetY = mouseY - toolState.imageForEdit.imageY;
                }
            }
            if (this.isMouseOnResizingLeftTop(mouseX, mouseY)) {
                this.dragAngle = "leftTop"
                initDrag();
            } else if (this.isMouseOnResizingLeftBottom(mouseX, mouseY)) {
                this.dragAngle = "leftBottom"
                initDrag();
            } else if (this.isMouseOnResizingRightTop(mouseX, mouseY)) {
                this.dragAngle = "rightTop"
                initDrag();
            } else if (this.isMouseOnResizingRightBottom(mouseX, mouseY)) {
                this.dragAngle = "rightBottom"
                initDrag();
            } else if (this.isMouseOnImage(mouseX, mouseY)) {
                toolState.imageForEdit.isDragging = true;
                toolState.imageForEdit.offsetX = mouseX - toolState.imageForEdit.imageX;
                toolState.imageForEdit.offsetY = mouseY - toolState.imageForEdit.imageY;
                this.canvas.classList.remove('cursor-grab');
                this.canvas.classList.remove('cursor-move');
                this.canvas.classList.add('cursor-grabbing');
            }
        }
    }

    mouseUpHandler(e: MouseEvent) {
        super.mouseUpHandler(e);
        if (toolState.imageForEdit) {
            toolState.imageForEdit.isDragging = false;
            toolState.imageForEdit.isResizing = false;
            this.canvas.classList.remove('cursor-grab');
            this.canvas.classList.remove('cursor-grabbing');
            this.canvas.classList.remove('cursor-nwse-resize');
            this.canvas.classList.add('cursor-move');
        }
        canvasState.drawBorder();
    }

    mouseMoveHandler(e: MouseEvent): void {
        const mouseX = e.clientX - this.canvas.offsetLeft;
        const mouseY = e.clientY - this.canvas.offsetTop;
        if (toolState.imageForEdit) {
            if (toolState.imageForEdit.isResizing) {
                this.drugResize(mouseX, mouseY);
            } else if (toolState.imageForEdit.isDragging) {
                this.drugImage(mouseX, mouseY)
            }

            if (this.isMouseOnResizingLeftTop(mouseX, mouseY) || this.isMouseOnResizingRightBottom(mouseX, mouseY)) {
                this.canvas.classList.remove('cursor-move')
                this.canvas.classList.remove('cursor-grab')
                this.canvas.classList.remove('cursor-grubbing')
                this.canvas.classList.add('cursor-nwse-resize')
            } else if (this.isMouseOnResizingRightTop(mouseX, mouseY) || this.isMouseOnResizingLeftBottom(mouseX, mouseY)) {
                this.canvas.classList.remove('cursor-move')
                this.canvas.classList.remove('cursor-grab')
                this.canvas.classList.remove('cursor-grubbing')
                this.canvas.classList.add('cursor-nesw-resize')
            } else if (this.isMouseOnImage(mouseX, mouseY)) {
                if (!toolState.imageForEdit.isDragging) {
                    this.canvas.classList.remove('cursor-move')
                    this.canvas.classList.remove('cursor-nwse-resize')
                    this.canvas.classList.remove('cursor-nesw-resize')
                    this.canvas.classList.add('cursor-grab');
                } else {
                    this.canvas.classList.remove('cursor-move')
                    this.canvas.classList.remove('cursor-grab')
                    this.canvas.classList.add('cursor-grabbing');
                }
            } else {
                this.canvas.classList.remove('cursor-nwse-resize')
                this.canvas.classList.remove('cursor-nesw-resize')
                this.canvas.classList.remove('cursor-grab')
                this.canvas.classList.add('cursor-move');
            }

        }

    }

    drugResize(mouseX: number, mouseY: number) {
        const ctx = this.canvas.getContext('2d');
        if (ctx && toolState.imageForEdit && toolState.imageForEdit.isResizing) {
            let newWidth: number, newHeight: number,
                newX: number = 0, newY: number = 0, x = 0, y = 0;
            if(this.dragAngle==="leftTop"){
                newX = this.startX - mouseX + this.startWidth;
                newY = this.startY - mouseY + this.startHeight;
                x = mouseX;
                y = mouseY;
            }
            else if (this.dragAngle==="rightTop"){
                newX = this.startX - mouseX - this.startWidth;
                newY = this.startY - mouseY + this.startHeight;
                x = mouseX;
                y = mouseY;
            }

            else if (this.dragAngle==="rightBottom"){
                newX = this.startX - mouseX - this.startWidth;
                newY = this.startY - mouseY - this.startHeight;
                x = mouseX;
                y = mouseY;
            }
            else if (this.dragAngle==="leftBottom"){
                newX = this.startX - mouseX + this.startWidth;
                newY = this.startY - mouseY - this.startHeight;
                x = mouseX;
                y = mouseY;
            }
            const img = new Image()
            img.src = canvasState.savedCanvasWithoutImage;
            img.onload = () => {
                ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                ctx.drawImage(img, 0, 0)
                canvasState.savedCanvasWithoutImage = this.canvas.toDataURL();
                if (toolState.imageForEdit) {
                    ctx.drawImage(
                        toolState.imageForEdit.img,
                        x,
                        y,
                        newX,
                        newY
                    );
                }
            }

            toolState.imageForEdit.img.width = Math.abs(newX);
            toolState.imageForEdit.img.height = Math.abs(newY);
            toolState.imageForEdit.imageX = newX < 0 ? mouseX - Math.abs(newX) : mouseX;
            toolState.imageForEdit.imageY = newY < 0 ? mouseY - Math.abs(newY) : mouseY;

            canvasState.deleteBorder();
            canvasState.drawBorder();
        }
    }


    drugImage(mouseX: number, mouseY: number) {
        let ctx = this.canvas.getContext('2d')
        if (ctx && toolState.imageForEdit && toolState.imageForEdit.isDragging) {
            toolState.imageForEdit.imageX = mouseX - toolState.imageForEdit.offsetX;
            toolState.imageForEdit.imageY = mouseY - toolState.imageForEdit.offsetY;
            let img = new Image();
            img.src = canvasState.savedCanvasWithoutImage;
            img.onload = () => {
                if (ctx && toolState.imageForEdit && toolState.imageForEdit.isDragging) {
                    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                    ctx.drawImage(img, 0, 0);
                    canvasState.savedCanvasWithoutImage = this.canvas.toDataURL();
                    ctx.drawImage(toolState.imageForEdit.img,
                        toolState.imageForEdit.imageX,
                        toolState.imageForEdit.imageY,
                        toolState.imageForEdit.img.width,
                        toolState.imageForEdit.img.height);
                }
            }
            canvasState.deleteBorder();
            canvasState.drawBorder();
        }
    }

    isMouseOnImage(mouseX: number, mouseY: number) {
        return toolState.imageForEdit &&
            mouseX >= toolState.imageForEdit.imageX &&
            mouseX <= toolState.imageForEdit.imageX + toolState.imageForEdit.img.width &&
            mouseY >= toolState.imageForEdit.imageY &&
            mouseY <= toolState.imageForEdit.imageY + toolState.imageForEdit.img.height
    }

    isMouseOnResizingLeftTop(mouseX: number, mouseY: number) {
        return toolState.imageForEdit &&
            Math.abs(mouseX - toolState.imageForEdit.imageX) <= 5 &&
            Math.abs(mouseY - toolState.imageForEdit.imageY) <= 5
    }

    isMouseOnResizingRightTop(mouseX: number, mouseY: number) {
        return toolState.imageForEdit &&
            Math.abs(mouseX - toolState.imageForEdit.imageX - toolState.imageForEdit.img.width) <= 5 &&
            Math.abs(mouseY - toolState.imageForEdit.imageY) <= 5
    }

    isMouseOnResizingRightBottom(mouseX: number, mouseY: number) {
        return toolState.imageForEdit &&
            Math.abs(mouseX - toolState.imageForEdit.imageX - toolState.imageForEdit.img.width) <= 5 &&
            Math.abs(mouseY - toolState.imageForEdit.imageY - toolState.imageForEdit.img.height) <= 5
    }

    isMouseOnResizingLeftBottom(mouseX: number, mouseY: number) {
        return toolState.imageForEdit &&
            Math.abs(mouseX - toolState.imageForEdit.imageX) <= 5 &&
            Math.abs(mouseY - toolState.imageForEdit.imageY - toolState.imageForEdit.img.height) <= 5
    }

    touchEndHandler(e: TouchEvent): void {
    }

    touchMoveHandler(e: TouchEvent): void {
    }

    touchStartHandler(e: TouchEvent): void {
    }

}