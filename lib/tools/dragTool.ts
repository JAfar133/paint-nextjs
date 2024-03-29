import Tool from "@/lib/tools/tool";
import toolState, {ImageForEdit} from "@/store/toolState";
import canvasState, {cursorClass} from "@/store/canvasState";
import {Point} from "@/lib/tools/shapes/arcTool";
import {canvasSize, ToolName} from "@/lib/utils";

type resizePoint = "leftTop" | "leftBottom" | "rightTop" | "rightBottom" | "right" | "left" | "top" | "bottom"
interface ImageCenter {
    centerX: number,
    centerY: number
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
    image: ImageForEdit;
    imageCanvas: HTMLCanvasElement;
    imageCtx: CanvasRenderingContext2D;
    imageCenter: ImageCenter = {centerX: 0, centerY: 0}
    imageXY: Point = {x: 0, y: 0}

    constructor(canvas: HTMLCanvasElement, socket: WebSocket, id: string | string[], type: ToolName) {
        super(canvas, socket, id, type);
        this.imageCanvas = document.createElement('canvas')
        this.imageCtx = this.imageCanvas.getContext('2d')!;
        this.imageCanvas.width = canvasSize.width;
        this.imageCanvas.height = canvasSize.height;
        this.imageCtx.drawImage(canvasState.bufferCanvas,0,0);

        canvasState.deleteBorder();
        const imgOnload = () => {
            canvasState.bufferCtx.clearRect(0, 0, canvasState.bufferCanvas.width, canvasState.bufferCanvas.height);
            canvasState.savedCtxWithoutImage?.drawImage(canvasState.bufferCanvas, 0, 0);
            canvasState.bufferCtx.drawImage(this.imageCanvas, 0, 0);
            canvasState.draw()
        }
        if (toolState.imageForEdit) {
            if (!toolState.imageForEdit.isUpload) {
                imgOnload();
                const img = new Image();
                img.src = this.imageCanvas.toDataURL();
                toolState.imageForEdit.img = img;
            } else {
                if(toolState.imageForEdit.img){
                    setTimeout(()=>{
                        if(toolState.imageForEdit){
                            this.imageCanvas.width = toolState.imageForEdit.img.width;
                            this.imageCanvas.height = toolState.imageForEdit.img.height;
                            this.imageCtx.clearRect(0,0,this.imageCanvas.width, this.imageCanvas.height)
                            this.imageCtx.drawImage(toolState.imageForEdit.img, 0, 0);
                        }
                    },100)

                }
                canvasState.savedCtxWithoutImage?.drawImage(canvasState.bufferCanvas, 0, 0);
            }
        } else {
            imgOnload();
        }
        //@ts-ignore
        this.image = toolState.imageForEdit;
        this.tempCanvas = document.createElement('canvas')
        this.tempCanvas.width = canvasState.bufferCanvas.width;
        this.tempCanvas.height = canvasState.bufferCanvas.height;
        this.tempCtx = this.tempCanvas.getContext('2d')!;

        canvasState.drawBorder();
    }

    protected down(mX: number, mY: number) {
        const {scaledX, scaledY} = canvasState.getScaledPoint(mX, mY)
        const mouseX = scaledX;
        const mouseY = scaledY;
        this.imageCenter = this.getImageCenter(this.image)
        const dx = mouseX - this.imageCenter.centerX;
        const dy = mouseY - this.imageCenter.centerY;
        if (this.image.angle !== 0) {
            this.startAngle = Math.atan2(dy, dx) - this.image.angle;
        } else {
            this.startAngle = Math.atan2(dy, dx);
        }
        this.startX = mouseX;
        this.startY = mouseY;
        const {x, y} = this.getNewPointPosition(this.image.imageX, this.image.imageY, this.imageCenter.centerX,this.imageCenter.centerY, this.image.angle)
        this.startImageX = x;
        this.startImageY = y;
        this.startWidth = this.image.img.width;
        this.startHeight = this.image.img.height;
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

    protected up(mX: number, mY: number) {
        this.image.isDragging = false;

        if (this.image.isResizing) {
            this.image.isResizing = false;
        }
        if (this.image.isRotating) {
            this.image.isRotating = false;
        }
        this.mouseDown = false;
        canvasState.sendDataUrl(canvasState.bufferCanvas.toDataURL());
    }

    protected move(mX: number, mY: number): void {
        const {scaledX, scaledY} = canvasState.getScaledPoint(mX, mY)
        const mouseX = scaledX;
        const mouseY = scaledY;
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

    private drugRotate(mouseX: number, mouseY: number) {
        if (this.image.isRotating) {
            this.imageCenter = this.getImageCenter(this.image);
            const dx = mouseX - this.imageCenter.centerX;
            const dy = mouseY - this.imageCenter.centerY;
            this.image.angle = Math.atan2(dy, dx) - this.startAngle;
            if (this.tempCtx) {
                this.tempCtx.save();
                this.tempCtx.clearRect(0, 0, this.tempCanvas.width, this.tempCanvas.height)
                this.tempCtx.translate(this.imageCenter.centerX, this.imageCenter.centerY);
                this.tempCtx.rotate(this.image.angle);
                this.tempCtx.drawImage(
                    this.imageCanvas,
                    -this.image.img.width / 2,
                    -this.image.img.height / 2,
                    this.image.img.width,
                    this.image.img.height);
                this.tempCtx.restore();

            }
            if(canvasState.savedCanvasWithoutImage){
                canvasState.bufferCtx.clearRect(0, 0, canvasState.bufferCanvas.width, canvasState.bufferCanvas.height)
                canvasState.bufferCtx.drawImage(canvasState.savedCanvasWithoutImage, 0, 0);
                canvasState.bufferCtx.drawImage(this.tempCanvas, 0, 0);
                canvasState.draw();
            }

        }
    }

    private drugResize(mouseX: number, mouseY: number) {
        if (this.image.isResizing) {
            this.imageCenter = this.getImageCenter(this.image);
            const startImageXYPoint = this.getNewPointPosition(this.startImageX, this.startImageY, this.imageCenter.centerX, this.imageCenter.centerY, -this.image.angle)
            const mousePoint = this.getNewPointPosition(mouseX, mouseY, this.imageCenter.centerX, this.imageCenter.centerY, -this.image.angle)
            this.imageXY = this.getNewPointPosition(this.startX, this.startY, this.imageCenter.centerX, this.imageCenter.centerY, -this.image.angle)
            const {newWidth, newHeight, newX, newY} = this.calculateNewSize(
                startImageXYPoint.x,
                startImageXYPoint.y,
                this.startWidth,
                this.startHeight,
                this.imageXY.x,
                this.imageXY.y,
                mousePoint.x,
                mousePoint.y,
                this.resizePoint
            );

            if (this.tempCtx) {
                this.tempCtx.save();
                this.rotateIfNeed(this.tempCanvas, this.tempCtx, this.image);
                this.tempCtx.drawImage(
                    this.imageCanvas,
                    newX,
                    newY,
                    newWidth,
                    newHeight
                );
                this.tempCtx.restore();
            }
            this.image.img.width = Math.abs(newWidth);
            this.image.img.height = Math.abs(newHeight);
            const x1 = newWidth < 0 ? newX + newWidth : newX;
            const y1 = newHeight < 0 ? newY + newHeight : newY;
            let xm = this.image.imageX;
            let ym = this.image.imageY;


            let {x, y} = this.getNewPointPosition(
                x1, y1, xm, ym, this.image.angle
            )
            this.image.imageX = x;
            this.image.imageY = y;
            if(canvasState.savedCanvasWithoutImage){
                canvasState.bufferCtx.clearRect(0, 0, canvasState.bufferCanvas.width, canvasState.bufferCanvas.height)
                canvasState.bufferCtx.drawImage(canvasState.savedCanvasWithoutImage, 0, 0);
                canvasState.bufferCtx.drawImage(this.tempCanvas, 0, 0);
                canvasState.draw();
            }
        }
    }

    private drugImage(mouseX: number, mouseY: number) {
        if (this.image.isDragging) {
            if (this.tempCtx) {
                this.tempCtx.save();

                this.image.imageX = mouseX - this.image.offsetX;
                this.image.imageY = mouseY - this.image.offsetY;
                this.rotateIfNeed(this.tempCanvas, this.tempCtx, this.image);
                this.tempCtx.drawImage(
                    this.imageCanvas,
                    this.image.imageX,
                    this.image.imageY,
                    this.image.img.width,
                    this.image.img.height);
                this.tempCtx.restore();
                if(canvasState.savedCanvasWithoutImage){
                    canvasState.bufferCtx.clearRect(0, 0, canvasState.bufferCanvas.width, canvasState.bufferCanvas.height);
                    canvasState.bufferCtx.drawImage(canvasState.savedCanvasWithoutImage, 0, 0);
                    canvasState.bufferCtx.drawImage(this.tempCanvas, 0, 0);
                    canvasState.draw();
                }

            }
        }
    }

    private isMouseOnImage(mouseX: number, mouseY: number) {
        const mouse = this.getNewPointPosition(mouseX, mouseY, this.imageCenter.centerX, this.imageCenter.centerY, -this.image.angle);
        const image = {x: this.image.imageX, y: this.image.imageY}
        return mouse.x >= image.x &&
            mouse.x <= image.x + this.image.img.width &&
            mouse.y >= image.y &&
            mouse.y <= image.y + this.image.img.height
    }

    resizeConst = 15
    private isMouseOnResizingLeftTop(mouseX: number, mouseY: number) {
        const {x, y} = this.getNewPointPosition(this.image.imageX, this.image.imageY, this.imageCenter.centerX, this.imageCenter.centerY, this.image.angle)
        return Math.abs(mouseX - x) <= Math.min(Math.max(this.image.img.width*0.03/canvasState.scale,2), this.resizeConst) &&
            Math.abs(mouseY - y) <= Math.min(Math.max(this.image.img.height*0.03/canvasState.scale,2), this.resizeConst)
    }

    private isMouseOnResizingRightTop(mouseX: number, mouseY: number) {
        const {x, y} = this.getNewPointPosition(
            this.image.imageX + this.image.img.width,
            this.image.imageY,
            this.imageCenter.centerX, this.imageCenter.centerY, this.image.angle)
        return Math.abs(mouseX - x) <= this.resizeConst/canvasState.scale &&
            Math.abs(mouseY - y) <= this.resizeConst/canvasState.scale
    }

    private isMouseOnResizingRightBottom(mouseX: number, mouseY: number) {
        const {x, y} = this.getNewPointPosition(
            this.image.imageX + this.image.img.width,
            this.image.imageY + this.image.img.height,
            this.imageCenter.centerX, this.imageCenter.centerY, this.image.angle)
        return Math.abs(mouseX - x) <= this.resizeConst/canvasState.scale &&
            Math.abs(mouseY - y) <= this.resizeConst/canvasState.scale
    }

    private isMouseOnResizingLeftBottom(mouseX: number, mouseY: number) {
        const {x, y} = this.getNewPointPosition(
            this.image.imageX,
            this.image.imageY + this.image.img.height,
            this.imageCenter.centerX, this.imageCenter.centerY, this.image.angle)
        return Math.abs(mouseX - x) <= this.resizeConst &&
            Math.abs(mouseY - y) <= this.resizeConst
    }

    private isMouseOnResizingLeftSide(mouseX: number, mouseY: number) {
        const {x, y} = this.getNewPointPosition(mouseX, mouseY, this.imageCenter.centerX, this.imageCenter.centerY, -this.image.angle)

        return Math.abs(x - this.image.imageX) <= this.resizeConst &&
            Math.abs(y - this.image.imageY - this.image.img.height / 2) <= this.image.img.height / 2
    }

    private isMouseOnResizingRightSide(mouseX: number, mouseY: number) {
        const {x, y} = this.getNewPointPosition(mouseX, mouseY, this.imageCenter.centerX, this.imageCenter.centerY, -this.image.angle)

        return Math.abs(x - this.image.imageX - this.image.img.width) <= this.resizeConst &&
            Math.abs(y - this.image.imageY - this.image.img.height / 2) <= this.image.img.height / 2
    }

    private isMouseOnResizingTopSide(mouseX: number, mouseY: number) {
        const {x, y} = this.getNewPointPosition(mouseX, mouseY, this.imageCenter.centerX, this.imageCenter.centerY, -this.image.angle)

        return Math.abs(x - this.image.imageX - this.image.img.width / 2) <= this.image.img.width / 2 &&
            Math.abs(y - this.image.imageY) <= this.resizeConst
    }

    private isMouseOnResizingBottomSide(mouseX: number, mouseY: number) {
        const {x, y} = this.getNewPointPosition(mouseX, mouseY, this.imageCenter.centerX, this.imageCenter.centerY, -this.image.angle)

        return Math.abs(x - this.image.imageX - this.image.img.width / 2) <= this.image.img.width / 2 &&
            Math.abs(y - this.image.imageY - this.image.img.height) <= this.resizeConst
    }

    private getMouseResizePosition(mouseX: number, mouseY: number): resizePoint | null {
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

    private getMouseMoveCursor(mouseX: number, mouseY: number): cursorClass {
        let angle = this.image.angle * 180 / Math.PI;
        if (angle < 0) {
            angle += 360;
        }

        const roundedAngle = Math.round(angle / 45) * 45;

        if (this.isMouseOnResizingLeftTop(mouseX, mouseY) || this.isMouseOnResizingRightBottom(mouseX, mouseY)) {
            if (roundedAngle === 45 || roundedAngle === 225) {
                return 'cursor-ns-resize';
            } else if (roundedAngle === 90 || roundedAngle === 270) {
                return 'cursor-nesw-resize';
            } else if (roundedAngle === 135 || roundedAngle === 315) {
                return 'cursor-ew-resize';
            } else {
                return 'cursor-nwse-resize';
            }
        } else if (this.isMouseOnResizingRightTop(mouseX, mouseY) || this.isMouseOnResizingLeftBottom(mouseX, mouseY)) {
            if (roundedAngle === 45 || roundedAngle === 225) {
                return 'cursor-ew-resize';
            } else if (roundedAngle === 90 || roundedAngle === 270) {
                return 'cursor-nwse-resize';
            } else if (roundedAngle === 135 || roundedAngle === 315) {
                return 'cursor-ns-resize';
            } else {
                return 'cursor-nesw-resize';
            }
        } else if (this.isMouseOnResizingLeftSide(mouseX, mouseY) || this.isMouseOnResizingRightSide(mouseX, mouseY)) {
            if (roundedAngle === 45 || roundedAngle === 225) {
                return 'cursor-nwse-resize';
            } else if (roundedAngle === 90 || roundedAngle === 270) {
                return 'cursor-ns-resize';
            } else if (roundedAngle === 135 || roundedAngle === 315) {
                return 'cursor-nesw-resize';
            } else {
                return 'cursor-ew-resize';
            }
        } else if (this.isMouseOnResizingTopSide(mouseX, mouseY) || this.isMouseOnResizingBottomSide(mouseX, mouseY)) {
            if (roundedAngle === 45 || roundedAngle === 225) {
                return 'cursor-nesw-resize';
            } else if (roundedAngle === 90 || roundedAngle === 270) {
                return 'cursor-ew-resize';
            } else if (roundedAngle === 135 || roundedAngle === 315) {
                return 'cursor-nwse-resize';
            } else {
                return 'cursor-ns-resize';
            }
        } else if (this.isMouseOnImage(mouseX, mouseY)) {
            return this.image.isDragging ? 'cursor-grabbing' : 'cursor-grab';
        } else {
            return 'cursor-alias';
        }
    }
    private getImageCenter(image: ImageForEdit):ImageCenter {
        const centerX = image.imageX + image.img.width / 2;
        const centerY = image.imageY + image.img.height / 2;

        return {centerX, centerY}
    }
    private getNewPointPosition(x: number, y: number, xm: number, ym: number, angle: number): Point {
        if(angle === 1) return  {x, y}
        const cos = Math.cos,
            sin = Math.sin,
            xr = (x - xm) * cos(angle) - (y - ym) * sin(angle) + xm,
            yr = (x - xm) * sin(angle) + (y - ym) * cos(angle) + ym;

        return {x: xr, y: yr};
    }
    private calculateNewSize(
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

    private rotateIfNeed(tempCanvas: HTMLCanvasElement, tempCtx: CanvasRenderingContext2D, image: ImageForEdit) {
        tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
        if (image.angle !== 0) {
            this.imageCenter = this.getImageCenter(image);
            tempCtx.translate(this.imageCenter.centerX, this.imageCenter.centerY);
            tempCtx.rotate(image.angle);
            tempCtx.translate(-this.imageCenter.centerX, -this.imageCenter.centerY);
        }
    }
}
