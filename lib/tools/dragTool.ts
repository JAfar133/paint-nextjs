import Tool from "@/lib/tools/tool";
import toolState, {ImageForEdit} from "@/store/toolState";
import canvasState, {cursorClass} from "@/store/canvasState";
import {Point} from "@/lib/tools/shapes/arcTool";

type resizePoint = "leftTop" | "leftBottom" | "rightTop" | "rightBottom" | "right" | "left" | "top" | "bottom"

interface ImageSidePoint {
    leftTop: Point,
    leftBottom: Point,
    rightTop: Point,
    rightBottom: Point,
    center: Point
}

export default class DragTool extends Tool {

    startX: number = 0;
    startY: number = 0;
    startImageX: number = 0;
    startImageY: number = 0;
    startWidth: number = 0;
    startHeight: number = 0;
    resizePoint: resizePoint = 'leftTop';
    startAngle: number = 0;
    tempCanvas: HTMLCanvasElement = document.createElement('canvas');
    tempCtx: CanvasRenderingContext2D | null = null;
    image: ImageForEdit;
    imageSidePoints: ImageSidePoint;

    constructor(canvas: HTMLCanvasElement, socket: WebSocket, id: string | string[], type: string) {
        super(canvas, socket, id, type);
        const img = new Image();
        img.src = canvasState.getDataUrlCanvas(canvas);
        canvasState.deleteBorder();
        const imgOnload = () => {
            img.onload = () => {
                this.ctx.clearRect(0, 0, canvas.width, canvas.height);
                canvasState.savedCanvasWithoutImage = canvasState.getDataUrlCanvas(canvas);
                this.ctx.drawImage(img, canvasState.canvasX, canvasState.canvasY)
            }
        }
        if (toolState.imageForEdit) {
            if (!toolState.imageForEdit.isUpload) {
                imgOnload();
                toolState.imageForEdit.img = img;
            } else {
                canvasState.savedCanvasWithoutImage = canvasState.getDataUrlCanvas(canvas);
            }
        } else {
            imgOnload();
        }
        //@ts-ignore
        this.image = toolState.imageForEdit;
        this.tempCanvas.width = this.canvas.width;
        this.tempCanvas.height = this.canvas.height;
        this.tempCtx = this.tempCanvas.getContext('2d');
        this.imageSidePoints = {
            leftTop: {x: this.image.imageX, y: this.image.imageY},
            leftBottom: {x: this.image.imageX, y: this.image.imageY + this.image.img.height},
            rightTop: {x: this.image.imageX + this.image.img.width, y: this.image.imageY},
            rightBottom: {x: this.image.imageX + this.image.img.width, y: this.image.imageY + this.image.img.height},
            center: {x: this.image.imageX + this.image.img.width / 2, y: this.image.imageY + this.image.img.height / 2}
        }

        canvasState.drawBorder();
    }

    mouseDownHandler(e: MouseEvent): void {
        const mouseX = e.offsetX;
        const mouseY = e.offsetY;
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
        this.saved = canvasState.getDataUrlCanvas();
        const mouseResizePosition: resizePoint | null = this.getMouseResizePosition(mouseX, mouseY);
        if (mouseResizePosition) {
            this.resizePoint = mouseResizePosition;
            this.image.isResizing = true;
            this.mouseDown = true;
            this.image.offsetX = mouseX - this.image.imageX;
            this.image.offsetY = mouseY - this.image.imageY;
        } else if (this.isMouseOnImage(mouseX, mouseY)) {
            this.image.isDragging = true;
            this.image.offsetX = mouseX - this.image.imageX;
            this.image.offsetY = mouseY - this.image.imageY;
            canvasState.setCursor('cursor-grabbing');
            this.mouseDown = true;
        } else {
            this.image.isRotating = true;
            this.mouseDown = true;
            this.image.offsetX = mouseX - this.image.imageX;
            this.image.offsetY = mouseY - this.image.imageY;
            canvasState.setCursor('cursor-alias');
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
        canvasState.sendDataUrl(canvasState.getDataUrlCanvas());
    }

    mouseMoveHandler(e: MouseEvent): void {
        const mouseX = e.offsetX;
        const mouseY = e.offsetY;
        if (this.image.isResizing) {
            this.drugResize(mouseX, mouseY);
        } else if (this.image.isDragging) {
            this.drugImage(mouseX, mouseY)
        } else if (this.image.isRotating) {
            this.drugRotate(mouseX, mouseY)
        }
        const cursor = this.getMouseMoveCursor(mouseX, mouseY);
        canvasState.setCursor(cursor);
    }

    drugRotate(mouseX: number, mouseY: number) {
        const ctx = this.canvas.getContext('2d');
        if (ctx) {
            if (this.image.isRotating) {
                const {centerX, centerY} = getImageCenter(this.image);
                const dx = mouseX - centerX;
                const dy = mouseY - centerY;

                this.image.angle = Math.atan2(dy, dx) - this.startAngle;
                this.tempCanvas.width = this.canvas.width;
                this.tempCanvas.height = this.canvas.height;
                this.tempCtx = this.tempCanvas.getContext('2d');
                if (this.tempCtx) {
                    this.tempCtx.clearRect(0, 0, this.tempCanvas.width, this.tempCanvas.height)
                    this.tempCtx.translate(centerX, centerY);
                    this.tempCtx.rotate(this.image.angle);
                    this.tempCtx.drawImage(
                        this.image.img,
                        -this.image.img.width / 2,
                        -this.image.img.height / 2,
                        this.image.img.width,
                        this.image.img.height);

                }

                const img = new Image()
                img.src = canvasState.savedCanvasWithoutImage;
                img.onload = ()=>{
                    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
                    ctx.drawImage(img, canvasState.canvasX, canvasState.canvasY);
                    ctx.drawImage(this.tempCanvas, 0, 0);
                    canvasState.clearOutside(ctx);
                }

                canvasState.drawBorder();
            }
        }
    }

    drugResize(mouseX: number, mouseY: number) {
        const ctx = this.canvas.getContext('2d');
        if (ctx && this.image.isResizing) {
            const {centerX, centerY} = getImageCenter(this.image);
            const mousePoint = getNewPointPosition(mouseX, mouseY, centerX, centerY, -this.image.angle)
            const startImageXYPoint = getNewPointPosition(this.startImageX, this.startImageY, centerX, centerY, -this.image.angle)
            const startXYPoint = getNewPointPosition(this.startX, this.startY, centerX, centerY, -this.image.angle)
            const {newWidth, newHeight, newX, newY} = calculateNewSize(
                startImageXYPoint.x,
                startImageXYPoint.y,
                this.startWidth,
                this.startHeight,
                startXYPoint.x,
                startXYPoint.y,
                mousePoint.x,
                mousePoint.y,
                this.resizePoint
            );

            this.tempCanvas.width = this.canvas.width;
            this.tempCanvas.height = this.canvas.height;
            this.tempCtx = this.tempCanvas.getContext('2d');
            if (this.tempCtx) {
                drawResizedImage(this.tempCtx, this.ctx, this.canvas, this.tempCanvas, this.image, newX, newY, newWidth, newHeight)
            }
            this.image.img.width = Math.abs(newWidth);
            this.image.img.height = Math.abs(newHeight);

            const x1 = newWidth < 0 ? newX + newWidth : newX;
            const y1 = newHeight < 0 ? newY + newHeight : newY;

            let xm = this.image.imageX;
            let ym = this.image.imageY;


            const {x, y} = getNewPointPosition(
                x1, y1, xm, ym, this.image.angle
            )
            this.image.imageX = x;
            this.image.imageY = y;

            canvasState.drawBorder();
        }
    }

    drugImage(mouseX: number, mouseY: number) {
        const ctx = this.canvas.getContext('2d')
        if (ctx && this.image.isDragging) {
            this.tempCanvas.width = this.canvas.width;
            this.tempCanvas.height = this.canvas.height;
            this.tempCtx = this.tempCanvas.getContext('2d');
            if (this.tempCtx) {
                rotateIfNeed(this.tempCanvas, this.image);
                this.image.imageX = mouseX - this.image.offsetX;
                this.image.imageY = mouseY - this.image.offsetY;
                this.tempCtx.drawImage(this.image.img,
                    this.image.imageX,
                    this.image.imageY,
                    this.image.img.width,
                    this.image.img.height);


                const img = new Image()
                img.src = canvasState.savedCanvasWithoutImage;
                img.onload = () => {
                    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
                    ctx.drawImage(img, canvasState.canvasX, canvasState.canvasY);
                    ctx.drawImage(this.tempCanvas, 0, 0);
                    canvasState.clearOutside(ctx);
                }
            }

            canvasState.drawBorder();
        }
    }

    isMouseOnImage(mouseX: number, mouseY: number) {
        const {centerX, centerY} = getImageCenter(this.image);
        const {x, y} = getNewPointPosition(mouseX, mouseY, centerX, centerY, this.image.angle);

        return x >= this.image.imageX &&
            x <= this.image.imageX + this.image.img.width &&
            y >= this.image.imageY &&
            y <= this.image.imageY + this.image.img.height
    }

    isMouseOnResizingLeftTop(mouseX: number, mouseY: number) {
        const {centerX, centerY} = getImageCenter(this.image);
        const {x, y} = getNewPointPosition(this.image.imageX, this.image.imageY, centerX, centerY, this.image.angle)
        return Math.abs(mouseX - x) <= 5 &&
            Math.abs(mouseY - y) <= 5
    }

    isMouseOnResizingRightTop(mouseX: number, mouseY: number) {
        const {centerX, centerY} = getImageCenter(this.image);
        const {x, y} = getNewPointPosition(
            this.image.imageX + this.image.img.width,
            this.image.imageY,
            centerX, centerY, this.image.angle)
        return Math.abs(mouseX - x) <= 5 &&
            Math.abs(mouseY - y) <= 5
    }

    isMouseOnResizingRightBottom(mouseX: number, mouseY: number) {
        const {centerX, centerY} = getImageCenter(this.image);
        const {x, y} = getNewPointPosition(
            this.image.imageX + this.image.img.width,
            this.image.imageY + this.image.img.height,
            centerX, centerY, this.image.angle)
        return Math.abs(mouseX - x) <= 5 &&
            Math.abs(mouseY - y) <= 5
    }

    isMouseOnResizingLeftBottom(mouseX: number, mouseY: number) {
        const {centerX, centerY} = getImageCenter(this.image);
        const {x, y} = getNewPointPosition(
            this.image.imageX,
            this.image.imageY + this.image.img.height,
            centerX, centerY, this.image.angle)
        return Math.abs(mouseX - x) <= 5 &&
            Math.abs(mouseY - y) <= 5
    }

    isMouseOnResizingLeftSide(mouseX: number, mouseY: number) {
        const {centerX, centerY} = getImageCenter(this.image);
        const {x, y} = getNewPointPosition(mouseX, mouseY, centerX, centerY, -this.image.angle)

        return Math.abs(x - this.image.imageX) <= 5 &&
            Math.abs(y - this.image.imageY - this.image.img.height / 2) <= this.image.img.height / 2
    }

    isMouseOnResizingRightSide(mouseX: number, mouseY: number) {
        const {centerX, centerY} = getImageCenter(this.image);
        const {x, y} = getNewPointPosition(mouseX, mouseY, centerX, centerY, -this.image.angle)

        return Math.abs(x - this.image.imageX - this.image.img.width) <= 5 &&
            Math.abs(y - this.image.imageY - this.image.img.height / 2) <= this.image.img.height / 2
    }

    isMouseOnResizingTopSide(mouseX: number, mouseY: number) {
        const {centerX, centerY} = getImageCenter(this.image);
        const {x, y} = getNewPointPosition(mouseX, mouseY, centerX, centerY, -this.image.angle)

        return Math.abs(x - this.image.imageX - this.image.img.width / 2) <= this.image.img.width / 2 &&
            Math.abs(y - this.image.imageY) <= 5
    }

    isMouseOnResizingBottomSide(mouseX: number, mouseY: number) {
        const {centerX, centerY} = getImageCenter(this.image);
        const {x, y} = getNewPointPosition(mouseX, mouseY, centerX, centerY, -this.image.angle)

        return Math.abs(x - this.image.imageX - this.image.img.width / 2) <= this.image.img.width / 2 &&
            Math.abs(y - this.image.imageY - this.image.img.height) <= 5
    }

    getMouseResizePosition(mouseX: number, mouseY: number): resizePoint | null {
        if (this.isMouseOnResizingLeftTop(mouseX, mouseY)) return "leftTop";
        else if (this.isMouseOnResizingLeftBottom(mouseX, mouseY)) return "leftBottom";
        else if (this.isMouseOnResizingRightTop(mouseX, mouseY)) return "rightTop";
        else if (this.isMouseOnResizingRightBottom(mouseX, mouseY)) return "rightBottom";
        else if (this.isMouseOnResizingTopSide(mouseX, mouseY)) return "top";
        else if (this.isMouseOnResizingRightSide(mouseX, mouseY)) return "right";
        else if (this.isMouseOnResizingBottomSide(mouseX, mouseY)) return "bottom";
        else if (this.isMouseOnResizingLeftSide(mouseX, mouseY)) return "left";
        else return null
    }

    getMouseMoveCursor(mouseX: number, mouseY: number): cursorClass {
        let angle = this.image.angle * 180 / Math.PI;
        if (angle > 360) angle %= 360;
        if (this.isMouseOnResizingLeftTop(mouseX, mouseY) || this.isMouseOnResizingRightBottom(mouseX, mouseY)) {
            if (Math.abs(Math.abs(angle) - 45) <= 20 || Math.abs(Math.abs(angle) - 225) <= 20) {
                return 'cursor-ns-resize';
            }
            if (Math.abs(Math.abs(angle) - 90) <= 20 || Math.abs(Math.abs(angle) - 270) <= 20) {
                return 'cursor-nesw-resize';
            }
            if (Math.abs(Math.abs(angle) - 135) <= 20 || Math.abs(Math.abs(angle) - 315) <= 20) {
                return 'cursor-ew-resize';
            }
            return 'cursor-nwse-resize';
        } else if (this.isMouseOnResizingRightTop(mouseX, mouseY) || this.isMouseOnResizingLeftBottom(mouseX, mouseY)) {
            if (Math.abs(Math.abs(angle) - 45) <= 20 || Math.abs(Math.abs(angle) - 225) <= 20) {
                return 'cursor-ew-resize';
            }
            if (Math.abs(Math.abs(angle) - 90) <= 20 || Math.abs(Math.abs(angle) - 270) <= 20) {
                return 'cursor-nwse-resize';
            }
            if (Math.abs(Math.abs(angle) - 135) <= 20 || Math.abs(Math.abs(angle) - 315) <= 20) {
                return 'cursor-ns-resize';
            }
            return 'cursor-nesw-resize';
        } else if (this.isMouseOnResizingLeftSide(mouseX, mouseY) || this.isMouseOnResizingRightSide(mouseX, mouseY)) {
            if (Math.abs(Math.abs(angle) - 45) <= 20 || Math.abs(Math.abs(angle) - 225) <= 20) {
                return 'cursor-nwse-resize';
            }
            if (Math.abs(Math.abs(angle) - 90) <= 20 || Math.abs(Math.abs(angle) - 270) <= 20) {
                return 'cursor-ns-resize';
            }
            return 'cursor-ew-resize';
        } else if (this.isMouseOnResizingTopSide(mouseX, mouseY) || this.isMouseOnResizingBottomSide(mouseX, mouseY)) {
            if (Math.abs(Math.abs(angle) - 45) <= 20 || Math.abs(Math.abs(angle) - 225) <= 20) {
                return 'cursor-nesw-resize';
            }
            if (Math.abs(Math.abs(angle) - 90) <= 20 || Math.abs(Math.abs(angle) - 270) <= 20) {
                return 'cursor-ew-resize';
            }
            return 'cursor-ns-resize';
        } else if (this.isMouseOnImage(mouseX, mouseY)) {
            return this.image.isDragging ? 'cursor-grabbing' : 'cursor-grab';
        } else {
            return 'cursor-alias';
        }
    }
    touchEndHandler(e: TouchEvent): void {
    }

    touchMoveHandler(e: TouchEvent): void {
    }

    touchStartHandler(e: TouchEvent): void {
    }

}

export function getImageCenter(image: ImageForEdit) {
    const centerX = image.imageX + image.img.width / 2;
    const centerY = image.imageY + image.img.height / 2;

    return {centerX, centerY}
}

export function getNewPointPosition(x: number, y: number, xm: number, ym: number, angle: number): Point {
    const cos = Math.cos,
        sin = Math.sin,
        xr = (x - xm) * cos(angle) - (y - ym) * sin(angle) + xm,
        yr = (x - xm) * sin(angle) + (y - ym) * cos(angle) + ym;

    return {x: xr, y: yr};
}

function calculateNewSize(
    startImageX: number, startImageY: number,
    startWidth: number, startHeight: number, startX: number, startY: number,
    mouseX: number, mouseY: number, resizePoint: resizePoint) {
    let newWidth = startWidth;
    let newHeight = startHeight;
    let newX = mouseX;
    let newY = mouseY;

    switch (resizePoint) {
        case "leftTop":
            newWidth = startX - mouseX + startWidth;
            newHeight = startY - mouseY + startHeight;
            break;
        case "rightTop":
            newWidth = startX - mouseX - startWidth;
            newHeight = startY - mouseY + startHeight;
            break;
        case "rightBottom":
            newWidth = startX - mouseX - startWidth;
            newHeight = startY - mouseY - startHeight;
            break;
        case "leftBottom":
            newWidth = startX - mouseX + startWidth;
            newHeight = startY - mouseY - startHeight;
            break;
        case "top":
            newWidth = startWidth;
            newHeight = startHeight + startY - mouseY;
            newX = startImageX;
            newY = mouseY;
            break;
        case "bottom":
            newWidth = startWidth;
            newHeight = -(startHeight + mouseY - startY);
            newX = startImageX;
            newY = mouseY;
            break;
        case "right":
            newWidth = -(startWidth + mouseX - startX);
            newHeight = startHeight;
            newX = mouseX;
            newY = startImageY;
            break;
        case "left":
            newWidth = startWidth + startX - mouseX;
            newHeight = startHeight;
            newX = mouseX;
            newY = startImageY;
            break;
    }
    return {newWidth, newHeight, newX, newY};


}

function drawResizedImage(tempCtx: CanvasRenderingContext2D, ctx: CanvasRenderingContext2D,
                          canvas: HTMLCanvasElement, tempCanvas: HTMLCanvasElement, image: ImageForEdit, x: number, y: number,
                          newWidth: number, newHeight: number) {
    if (tempCtx) {
        rotateIfNeed(tempCanvas, image);
        tempCtx.drawImage(
            image.img,
            x,
            y,
            newWidth,
            newHeight
        );
        canvasState.clearOutside(ctx);
    }

    const img = new Image()
    img.src = canvasState.savedCanvasWithoutImage;
    img.onload = ()=>{
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, canvasState.canvasX, canvasState.canvasY);
        ctx.drawImage(tempCanvas, 0, 0);
        canvasState.clearOutside(ctx);
    }

}

function rotateIfNeed(tempCanvas: HTMLCanvasElement, image: ImageForEdit) {
    const tempCtx = tempCanvas.getContext('2d');
    if (tempCtx) {
        tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
        if (image.angle !== 0) {
            const {centerX, centerY} = getImageCenter(image);
            tempCtx.translate(centerX, centerY);
            tempCtx.rotate(image.angle);
            tempCtx.translate(-centerX, -centerY);
        }
    }
}