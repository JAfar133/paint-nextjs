import Tool from "@/lib/tools/tool";
import toolState from "@/store/toolState";
import canvasState from "@/store/canvasState";

type dragPoint = "leftTop" | "leftBottom" | "rightTop" | "rightBottom" | "right" | "left" | "top" | "bottom"
type cursorClasses =
    "cursor-move" | "cursor-grab" |
    "cursor-grabbing" | "cursor-nwse-resize" | "cursor-alias" |
    "cursor-nesw-resize" | "cursor-ew-resize" | "cursor-ns-resize"
export const cursors: cursorClasses[] =
    ["cursor-move", "cursor-grab",
        "cursor-grabbing", "cursor-nwse-resize", "cursor-alias",
        "cursor-nesw-resize", "cursor-ew-resize", "cursor-ns-resize"]
export default class DragTool extends Tool {

    startX: number = 0;
    startY: number = 0;
    startImageX: number = 0;
    startImageY: number = 0;
    startWidth: number = 0;
    startHeight: number = 0;
    dragPoint: dragPoint = 'leftTop';
    startAngle: number = 0;
    angle: number = 0;

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
                    isRotating: false,
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
                isRotating: false,
                isUpload: false
            }
        }

        canvasState.drawBorder();
    }

    mouseDownHandler(e: MouseEvent): void {
        const mouseX = e.clientX - this.canvas.offsetLeft;
        const mouseY = e.clientY - this.canvas.offsetTop;
        if (toolState.imageForEdit) {
            const image = toolState.imageForEdit;
            const centerX = image.imageX + image.img.width / 2;
            const centerY = image.imageY + image.img.height / 2;
            const dx = mouseX - centerX;
            const dy = mouseY - centerY;

            this.startAngle = Math.atan2(dy, dx);

            this.startX = mouseX;
            this.startY = mouseY;
            this.startImageX = image.imageX;
            this.startImageY = image.imageY;
            this.startWidth = image.img.width;
            this.startHeight = image.img.height;
            this.saved = this.canvas.toDataURL();
            const initDrag = () => {
                if (toolState.imageForEdit) {
                    image.isResizing = true;
                    this.mouseDown = true;
                    image.offsetX = mouseX - image.imageX;
                    image.offsetY = mouseY - image.imageY;
                }
            }
            if (this.isMouseOnResizingLeftTop(mouseX, mouseY)) {
                this.dragPoint = "leftTop"
                initDrag();
            } else if (this.isMouseOnResizingLeftBottom(mouseX, mouseY)) {
                this.dragPoint = "leftBottom"
                initDrag();
            } else if (this.isMouseOnResizingRightTop(mouseX, mouseY)) {
                this.dragPoint = "rightTop"
                initDrag();
            } else if (this.isMouseOnResizingRightBottom(mouseX, mouseY)) {
                this.dragPoint = "rightBottom"
                initDrag();
            } else if (this.isMouseOnResizingTopSide(mouseX, mouseY)) {
                this.dragPoint = "top"
                initDrag();
            } else if (this.isMouseOnResizingBottomSide(mouseX, mouseY)) {
                this.dragPoint = "bottom"
                initDrag();
            } else if (this.isMouseOnResizingRightSide(mouseX, mouseY)) {
                this.dragPoint = "right"
                initDrag();
            } else if (this.isMouseOnResizingLeftSide(mouseX, mouseY)) {
                this.dragPoint = "left"
                initDrag();
            } else if (this.isMouseOnImage(mouseX, mouseY)) {
                image.isDragging = true;
                image.offsetX = mouseX - image.imageX;
                image.offsetY = mouseY - image.imageY;
                this.setCursor('cursor-grabbing');
                this.mouseDown = true;
            } else {
                image.isRotating = true;
                this.mouseDown = true;
                image.offsetX = mouseX - image.imageX;
                image.offsetY = mouseY - image.imageY;
                this.setCursor('cursor-alias');
            }
        }
    }

    mouseUpHandler(e: MouseEvent) {
        super.mouseUpHandler(e);
        if (toolState.imageForEdit) {
            toolState.imageForEdit.isDragging = false;

            if(toolState.imageForEdit.isResizing){
                this.saveResizedImage()
                toolState.imageForEdit.isResizing = false;
            }
            if(toolState.imageForEdit.isRotating){
                this.saveRotatedImage();
                this.angle = 0;
                toolState.imageForEdit.isRotating = false;
            }
            this.mouseDown = false;
        }
        canvasState.drawBorder();
    }
    setCursor(cursor: cursorClasses){
        cursors.forEach(c=>{
            if(c === cursor) this.canvas.classList.add(c)
            else this.canvas.classList.remove(c)
        })
    }
    mouseMoveHandler(e: MouseEvent): void {
        const mouseX = e.clientX - this.canvas.offsetLeft;
        const mouseY = e.clientY - this.canvas.offsetTop;
        if (toolState.imageForEdit) {
            if (toolState.imageForEdit.isResizing) {
                this.drugResize(mouseX, mouseY);
            } else if (toolState.imageForEdit.isDragging) {
                this.drugImage(mouseX, mouseY)
            } else if (toolState.imageForEdit.isRotating){
                this.drugRotate(mouseX, mouseY)
            }
            if (this.isMouseOnResizingLeftTop(mouseX, mouseY) || this.isMouseOnResizingRightBottom(mouseX, mouseY)) {
                this.setCursor('cursor-nwse-resize');
            } else if (this.isMouseOnResizingRightTop(mouseX, mouseY) || this.isMouseOnResizingLeftBottom(mouseX, mouseY)) {
                this.setCursor('cursor-nesw-resize');
            } else if (this.isMouseOnResizingLeftSide(mouseX, mouseY) || this.isMouseOnResizingRightSide(mouseX, mouseY)) {
                this.setCursor('cursor-ew-resize');
            } else if (this.isMouseOnResizingTopSide(mouseX, mouseY) || this.isMouseOnResizingBottomSide(mouseX, mouseY)) {
                this.setCursor('cursor-ns-resize');
            } else if (this.isMouseOnImage(mouseX, mouseY)) {
                if (!toolState.imageForEdit.isDragging) {
                    this.setCursor('cursor-grab');
                } else {
                    this.setCursor('cursor-grabbing');
                }
            } else {
                this.setCursor('cursor-alias');
            }
        }

    }
    drugRotate(mouseX: number, mouseY: number) {
        const ctx = this.canvas.getContext('2d');
        if (ctx && toolState.imageForEdit) {
            if (toolState.imageForEdit.isRotating) {
                const image = toolState.imageForEdit;
                const centerX = image.imageX + image.img.width / 2;
                const centerY = image.imageY + image.img.height / 2;
                const dx = mouseX - centerX;
                const dy = mouseY - centerY;

                this.angle = Math.atan2(dy, dx) - this.startAngle;

                ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

                ctx.save();
                ctx.translate(centerX, centerY);
                ctx.rotate(this.angle);

                ctx.drawImage(image.img, -image.img.width / 2, -image.img.height / 2);

                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = this.canvas.width;
                tempCanvas.height = this.canvas.height;
                const tempCtx = tempCanvas.getContext('2d');
                tempCtx && tempCtx.drawImage(this.canvas,0,0)

                ctx.restore();
                ctx.clearRect(0,0, this.canvas.width, this.canvas.height)

                const img = new Image()
                img.src = canvasState.savedCanvasWithoutImage;
                ctx.drawImage(img, 0, 0);
                ctx.drawImage(tempCanvas, 0, 0);

            }
        }
    }
    saveResizedImage(){
        const resizedCanvas = document.createElement('canvas');
        if(toolState.imageForEdit){
            const image = toolState.imageForEdit;
            resizedCanvas.width = image.img.width;
            resizedCanvas.height = image.img.height;
            const resizedCtx = resizedCanvas.getContext('2d');

            if(resizedCtx){
                resizedCtx.drawImage(image.img, 0, 0, resizedCanvas.width, resizedCanvas.height);
                const resizedImageDataURL = resizedCanvas.toDataURL();

                const newImage = new Image();
                newImage.src = resizedImageDataURL;

                toolState.imageForEdit.img = newImage;
            }
        }
    }
    saveRotatedImage() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (toolState.imageForEdit) {
            const image = toolState.imageForEdit;
            const rotatedWidth = image.img.width;
            const rotatedHeight = image.img.height;
            console.log(image.img.width)
            console.log(image.img.height)
            canvas.width = rotatedWidth;
            canvas.height = rotatedHeight;

            if (ctx && this.angle !== 0) {
                ctx.translate(rotatedWidth / 2, rotatedHeight / 2);
                ctx.rotate(this.angle);
                ctx.drawImage(image.img, -image.img.width / 2, -image.img.height / 2);

                // Сохранить повернутое изображение в toolState
                // @ts-ignore
                toolState.imageForEdit.img = canvas;
                console.log(toolState.imageForEdit.img.width)
                console.log(toolState.imageForEdit.img.height)
            }
        }
    }



    drugResize(mouseX: number, mouseY: number) {
        const ctx = this.canvas.getContext('2d');
        if (ctx && toolState.imageForEdit && toolState.imageForEdit.isResizing) {
            let newWidth: number = 0, newHeight: number = 0, x = mouseX, y = mouseY;
            if(this.dragPoint==="leftTop"){
                newWidth = this.startX - mouseX + this.startWidth;
                newHeight = this.startY - mouseY + this.startHeight;
            }
            else if (this.dragPoint==="rightTop"){
                newWidth = this.startX - mouseX - this.startWidth;
                newHeight = this.startY - mouseY + this.startHeight;
            }

            else if (this.dragPoint==="rightBottom"){
                newWidth = this.startX - mouseX - this.startWidth;
                newHeight = this.startY - mouseY - this.startHeight;
            }
            else if (this.dragPoint==="leftBottom"){
                newWidth = this.startX - mouseX + this.startWidth;
                newHeight = this.startY - mouseY - this.startHeight;
            }
            else if (this.dragPoint==="top"){
                newWidth = this.startWidth;
                newHeight = this.startHeight + this.startY - mouseY;
                x = this.startImageX;
                y = mouseY;
            }
            else if (this.dragPoint==="bottom"){
                newWidth = this.startWidth;
                newHeight = -(this.startHeight + mouseY - this.startY);
                x = this.startImageX;
                y = mouseY;
            }
            else if (this.dragPoint==="right"){
                newWidth = -(this.startWidth + mouseX - this.startX);
                newHeight = this.startHeight;
                x = mouseX;
                y = this.startImageY;
            }
            else if (this.dragPoint==="left"){
                newWidth = this.startWidth + this.startX - mouseX;
                newHeight = this.startHeight;
                x = mouseX;
                y = this.startImageY;
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
                        newWidth,
                        newHeight
                    );
                }
            }

            toolState.imageForEdit.img.width = Math.abs(newWidth);
            toolState.imageForEdit.img.height = Math.abs(newHeight);
            toolState.imageForEdit.imageX = newWidth < 0 ? x - Math.abs(newWidth) : x;
            toolState.imageForEdit.imageY = newHeight < 0 ? y - Math.abs(newHeight) : y;

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
            Math.abs(mouseX - toolState.imageForEdit.imageX) <= 10 &&
            Math.abs(mouseY - toolState.imageForEdit.imageY) <= 10
    }

    isMouseOnResizingRightTop(mouseX: number, mouseY: number) {
        return toolState.imageForEdit &&
            Math.abs(mouseX - toolState.imageForEdit.imageX - toolState.imageForEdit.img.width) <= 10 &&
            Math.abs(mouseY - toolState.imageForEdit.imageY) <= 10
    }

    isMouseOnResizingRightBottom(mouseX: number, mouseY: number) {
        return toolState.imageForEdit &&
            Math.abs(mouseX - toolState.imageForEdit.imageX - toolState.imageForEdit.img.width) <= 10 &&
            Math.abs(mouseY - toolState.imageForEdit.imageY - toolState.imageForEdit.img.height) <= 10
    }

    isMouseOnResizingLeftBottom(mouseX: number, mouseY: number) {
        return toolState.imageForEdit &&
            Math.abs(mouseX - toolState.imageForEdit.imageX) <= 10 &&
            Math.abs(mouseY - toolState.imageForEdit.imageY - toolState.imageForEdit.img.height) <= 10
    }
    isMouseOnResizingLeftSide(mouseX: number, mouseY: number) {
        return toolState.imageForEdit &&
            Math.abs(mouseX - toolState.imageForEdit.imageX) <= 10 &&
            Math.abs(mouseY - toolState.imageForEdit.imageY - toolState.imageForEdit.img.height/2) <= toolState.imageForEdit.img.height/2
    }
    isMouseOnResizingRightSide(mouseX: number, mouseY: number) {
        return toolState.imageForEdit &&
            Math.abs(mouseX - toolState.imageForEdit.imageX - toolState.imageForEdit.img.width) <= 10 &&
            Math.abs(mouseY - toolState.imageForEdit.imageY - toolState.imageForEdit.img.height/2) <= toolState.imageForEdit.img.height/2
    }
    isMouseOnResizingTopSide(mouseX: number, mouseY: number) {
        return toolState.imageForEdit &&
            Math.abs(mouseX - toolState.imageForEdit.imageX - toolState.imageForEdit.img.width/2) <= toolState.imageForEdit.img.width/2 &&
            Math.abs(mouseY - toolState.imageForEdit.imageY) <= 10
    }
    isMouseOnResizingBottomSide(mouseX: number, mouseY: number) {
        return toolState.imageForEdit &&
            Math.abs(mouseX - toolState.imageForEdit.imageX - toolState.imageForEdit.img.width/2) <= toolState.imageForEdit.img.width/2 &&
            Math.abs(mouseY - toolState.imageForEdit.imageY - toolState.imageForEdit.img.height) <= 10
    }

    touchEndHandler(e: TouchEvent): void {
    }

    touchMoveHandler(e: TouchEvent): void {
    }

    touchStartHandler(e: TouchEvent): void {
    }

}