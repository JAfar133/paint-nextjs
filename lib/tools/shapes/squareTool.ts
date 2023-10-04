import Shape from "@/lib/tools/shapes/Shape";
import canvasState from "@/store/canvasState";

export default class SquareTool extends Shape {

    mouseMoveHandler(e: MouseEvent) {
        if (this.mouseDown && this.canDraw) {
            const {scaledX, scaledY} = this.getScaledPoint(e.offsetX, e.offsetY, canvasState.canvasX, canvasState.canvasY, canvasState.scale)
            this.width = scaledX - this.startX;
            this.height = scaledY - this.startY;

            this.draw(this.startX, this.startY, this.width, this.height);
        }
        document.onmousemove = null;
    }

    handleGlobalMouseMove(e: MouseEvent) {
        if (this.mouseDown && this.canDraw) {

            this.width = e.offsetX - this.startX - this.offsetLeft;
            if ((e.pageY < (this.offsetTop + this.canvas.height)) && e.pageY > this.offsetTop) {
                this.height = e.offsetY - this.startY;
            } else if (e.pageY < this.offsetTop) {
                this.height = e.pageY - this.startY - this.offsetTop;
            } else {
                this.width = e.pageX - this.startX - this.offsetLeft;
                this.height = e.pageY - this.startY - this.offsetTop;
            }

            this.draw(this.startX, this.startY, this.width, this.height);
        }
    }

    draw(x: number, y: number, w: number, h: number) {
        const img = new Image();
        img.src = this.saved;
        img.onload = () => {
            canvasState.bufferCtx.clearRect(0, 0, canvasState.bufferCanvas.width, canvasState.bufferCanvas.height);
            canvasState.bufferCtx.drawImage(img, 0, 0);
            canvasState.bufferCtx.beginPath();
            drawRect(canvasState.bufferCtx, x, y, w, h, canvasState.isFill, canvasState.isStroke);
        }
    }

    static draw(ctx: CanvasRenderingContext2D, x: number, y: number, w: number,
                h: number, fillStyle: string, strokeStyle: string, strokeWidth: number, isFill: boolean, isStroke: boolean) {
        ctx.strokeStyle = strokeStyle;
        ctx.fillStyle = fillStyle;
        ctx.lineWidth = strokeWidth;
        drawRect(ctx, x + ctx.canvas.width/2, y, w, h, isFill, isStroke);
    }
}

function drawRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number,
                  h: number, isFill: boolean, isStroke: boolean) {
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    isFill && ctx.fill();
    isStroke && ctx.stroke();
    canvasState.draw();
}