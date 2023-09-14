import Tool from "@/lib/tools/tool";
import toolState, {ImageForEdit} from "@/store/toolState";
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
    tempCanvas: HTMLCanvasElement = document.createElement('canvas');
    tempCtx: CanvasRenderingContext2D | null = null;
    image: ImageForEdit;
    x1: number = 0;
    y1: number = 0;
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
                    isUpload: false,
                    angle: 0
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
                isUpload: false,
                angle: 0
            }
        }
        this.image = toolState.imageForEdit;
        this.tempCanvas.width = this.canvas.width;
        this.tempCanvas.height = this.canvas.height;
        this.tempCtx = this.tempCanvas.getContext('2d');

        canvasState.drawBorder();
    }

    mouseDownHandler(e: MouseEvent): void {
        const mouseX = e.clientX - this.canvas.offsetLeft;
        const mouseY = e.clientY - this.canvas.offsetTop;
            const centerX = this.image.imageX + this.image.img.width / 2;
            const centerY = this.image.imageY + this.image.img.height / 2;
            const dx = mouseX - centerX;
            const dy = mouseY - centerY;
            if (this.image.angle !== 0) {
                this.startAngle = Math.atan2(dy, dx) - this.image.angle;
            } else {
                this.startAngle = Math.atan2(dy, dx);
            }
            this.startX = mouseX;
            this.startY = mouseY;
            this.startImageX = this.image.imageX;
            this.startImageY = this.image.imageY;
            this.startWidth = this.image.img.width;
            this.startHeight = this.image.img.height;
            this.saved = this.canvas.toDataURL();
            const initDrag = () => {
                this.image.isResizing = true;
                this.mouseDown = true;
                this.image.offsetX = mouseX - this.image.imageX;
                this.image.offsetY = mouseY - this.image.imageY;
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
                this.image.isDragging = true;
                this.image.offsetX = mouseX - this.image.imageX;
                this.image.offsetY = mouseY - this.image.imageY;
                this.setCursor('cursor-grabbing');
                this.mouseDown = true;
            } else {
                this.image.isRotating = true;
                this.mouseDown = true;
                this.image.offsetX = mouseX - this.image.imageX;
                this.image.offsetY = mouseY - this.image.imageY;
                this.setCursor('cursor-alias');
            }
    }

    mouseUpHandler(e: MouseEvent) {
        super.mouseUpHandler(e);
        this.image.isDragging = false;

        if (this.image.isResizing) {
            this.image.isResizing = false;
        }
        if (this.image.isRotating) {
            this.image.isRotating = false;
        }
        this.mouseDown = false;
    }

    setCursor(cursor: cursorClasses) {
        cursors.forEach(c => {
            if (c === cursor) this.canvas.classList.add(c)
            else this.canvas.classList.remove(c)
        })
    }

    mouseMoveHandler(e: MouseEvent): void {
        const mouseX = e.clientX - this.canvas.offsetLeft;
        const mouseY = e.clientY - this.canvas.offsetTop;
            if (this.image.isResizing) {
                this.drugResize(mouseX, mouseY);
            } else if (this.image.isDragging) {
                this.drugImage(mouseX, mouseY)
            } else if (this.image.isRotating) {
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
                if (!this.image.isDragging) {
                    this.setCursor('cursor-grab');
                } else {
                    this.setCursor('cursor-grabbing');
                }
            } else {
                this.setCursor('cursor-alias');
            }

    }

    drugRotate(mouseX: number, mouseY: number) {
        const ctx = this.canvas.getContext('2d');
        if (ctx) {
            if (this.image.isRotating) {
                const centerX = this.image.imageX + this.image.img.width / 2;
                const centerY = this.image.imageY + this.image.img.height / 2;
                const dx = mouseX - centerX;
                const dy = mouseY - centerY;

                this.image.angle = Math.atan2(dy, dx) - this.startAngle;
                this.tempCanvas.width = this.canvas.width;
                this.tempCanvas.height = this.canvas.height;
                this.tempCtx = this.tempCanvas.getContext('2d');
                if (this.tempCtx) {
                    this.tempCtx.clearRect(0,0,this.tempCanvas.width, this.tempCanvas.height)
                    this.tempCtx.translate(centerX, centerY);
                    this.tempCtx.rotate(this.image.angle);
                    this.tempCtx.drawImage(
                        this.image.img,
                        -this.image.img.width / 2,
                        -this.image.img.height / 2,
                        this.image.img.width,
                        this.image.img.height);

                }

                ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

                const img = new Image()
                img.src = canvasState.savedCanvasWithoutImage;
                ctx.drawImage(img, 0, 0);
                ctx.drawImage(this.tempCanvas, 0, 0);

                canvasState.drawBorder();
            }
        }
    }


    drugResize(mouseX: number, mouseY: number) {
        const ctx = this.canvas.getContext('2d');
        if (ctx && this.image.isResizing) {
            let newWidth: number = 0, newHeight: number = 0, x = mouseX, y = mouseY;
            if (this.dragPoint === "leftTop") {
                newWidth = this.startX - mouseX + this.startWidth;
                newHeight = this.startY - mouseY + this.startHeight;
            } else if (this.dragPoint === "rightTop") {
                newWidth = this.startX - mouseX - this.startWidth;
                newHeight = this.startY - mouseY + this.startHeight;
            } else if (this.dragPoint === "rightBottom") {
                newWidth = this.startX - mouseX - this.startWidth;
                newHeight = this.startY - mouseY - this.startHeight;
            } else if (this.dragPoint === "leftBottom") {
                newWidth = this.startX - mouseX + this.startWidth;
                newHeight = this.startY - mouseY - this.startHeight;
            } else if (this.dragPoint === "top") {
                newWidth = this.startWidth;
                newHeight = this.startHeight + this.startY - mouseY;
                x = this.startImageX;
                y = mouseY;
            } else if (this.dragPoint === "bottom") {
                newWidth = this.startWidth;
                newHeight = -(this.startHeight + mouseY - this.startY);
                x = this.startImageX;
                y = mouseY;
            } else if (this.dragPoint === "right") {
                newWidth = -(this.startWidth + mouseX - this.startX);
                newHeight = this.startHeight;
                x = mouseX;
                y = this.startImageY;
            } else if (this.dragPoint === "left") {
                newWidth = this.startWidth + this.startX - mouseX;
                newHeight = this.startHeight;
                x = mouseX;
                y = this.startImageY;
            }
            this.tempCanvas.width = this.canvas.width;
            this.tempCanvas.height = this.canvas.height;
            this.tempCtx = this.tempCanvas.getContext('2d');
            if (this.tempCtx) {
                this.rotateIfNeed();
                this.tempCtx.drawImage(
                    this.image.img,
                    x,
                    y,
                    newWidth,
                    newHeight
                );
            }
            ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

            const img = new Image()
            img.src = canvasState.savedCanvasWithoutImage;
            ctx.drawImage(img, 0, 0);
            ctx.drawImage(this.tempCanvas, 0, 0);

            this.image.img.width = Math.abs(newWidth);
            this.image.img.height = Math.abs(newHeight);
            this.image.imageX = newWidth < 0 ? x - Math.abs(newWidth) : x;
            this.image.imageY = newHeight < 0 ? y - Math.abs(newHeight) : y;

            canvasState.drawBorder();
        }
    }


    drugImage(mouseX: number, mouseY: number) {
        let ctx = this.canvas.getContext('2d')
        if (ctx && this.image.isDragging) {

            this.tempCanvas.width = this.canvas.width;
            this.tempCanvas.height = this.canvas.height;
            this.tempCtx = this.tempCanvas.getContext('2d');
            if (this.tempCtx) {
                this.rotateIfNeed();
                this.image.imageX = mouseX - this.image.offsetX;
                this.image.imageY = mouseY - this.image.offsetY;
                this.tempCtx.drawImage(this.image.img,
                    this.image.imageX,
                    this.image.imageY,
                    this.image.img.width,
                    this.image.img.height);

                ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

                const img = new Image()
                img.src = canvasState.savedCanvasWithoutImage;
                ctx.drawImage(img, 0, 0);
                ctx.drawImage(this.tempCanvas, 0, 0);
            }

            canvasState.drawBorder();
        }
    }
    rotateIfNeed(){
        if(this.tempCtx){
            this.tempCtx.clearRect(0, 0, this.tempCanvas.width, this.tempCanvas.height);
            if (this.image.angle !== 0) {
                const centerX = this.image.imageX + this.image.img.width / 2;
                const centerY = this.image.imageY + this.image.img.height / 2;
                this.tempCtx.translate(centerX, centerY);
                this.tempCtx.rotate(this.image.angle);
                this.tempCtx.translate(-centerX, -centerY);
            }
        }

    }
    isMouseOnImage(mouseX: number, mouseY: number) {
        return mouseX >= this.image.imageX &&
            mouseX <= this.image.imageX + this.image.img.width &&
            mouseY >= this.image.imageY &&
            mouseY <= this.image.imageY + this.image.img.height
    }

    isMouseOnResizingLeftTop(mouseX: number, mouseY: number) {
            return Math.abs(mouseX - this.image.imageX) <= 5 &&
                Math.abs(mouseY - this.image.imageY) <= 5
    }


    isMouseOnResizingRightTop(mouseX: number, mouseY: number) {
        return Math.abs(mouseX - this.image.imageX - this.image.img.width) <= 5 &&
            Math.abs(mouseY - this.image.imageY) <= 5
    }

    isMouseOnResizingRightBottom(mouseX: number, mouseY: number) {
        return Math.abs(mouseX - this.image.imageX - this.image.img.width) <= 5 &&
            Math.abs(mouseY - this.image.imageY - this.image.img.height) <= 5
    }

    isMouseOnResizingLeftBottom(mouseX: number, mouseY: number) {
        return Math.abs(mouseX - this.image.imageX) <= 5 &&
            Math.abs(mouseY - this.image.imageY - this.image.img.height) <= 5
    }

    isMouseOnResizingLeftSide(mouseX: number, mouseY: number) {
            const centerX = this.image.imageX + this.image.img.width / 2;
            const centerY = this.image.imageY + this.image.img.height / 2;
            return Math.abs(mouseX - (centerX - this.image.img.width/2)) <= 5 &&
                Math.abs(mouseY - this.image.imageY - this.image.img.height / 2) <= this.image.img.height / 2
    }

    isMouseOnResizingRightSide(mouseX: number, mouseY: number) {
        return Math.abs(mouseX - this.image.imageX - this.image.img.width) <= 5 &&
            Math.abs(mouseY - this.image.imageY - this.image.img.height / 2) <= this.image.img.height / 2
    }

    isMouseOnResizingTopSide(mouseX: number, mouseY: number) {
        return Math.abs(mouseX - this.image.imageX - this.image.img.width / 2) <= this.image.img.width / 2 &&
            Math.abs(mouseY - this.image.imageY) <= 5
    }

    isMouseOnResizingBottomSide(mouseX: number, mouseY: number) {
        return Math.abs(mouseX - this.image.imageX - this.image.img.width / 2) <= this.image.img.width / 2 &&
            Math.abs(mouseY - this.image.imageY - this.image.img.height) <= 5
    }

    touchEndHandler(e: TouchEvent): void {
    }

    touchMoveHandler(e: TouchEvent): void {
    }

    touchStartHandler(e: TouchEvent): void {
    }

}