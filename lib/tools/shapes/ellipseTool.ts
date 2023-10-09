import Shape from "@/lib/tools/shapes/Shape";
import canvasState from "@/store/canvasState";
import settingState from "@/store/settingState";

export default class EllipseTool extends Shape {

    protected mouseMoveHandler(e: MouseEvent) {
        if (this.mouseDown && this.canDraw) {
            const {scaledX, scaledY} = canvasState.getScaledPoint(e.offsetX, e.offsetY)
            let width = scaledX - this.startX;
            let height = scaledY - this.startY;
            this.width = Math.abs(width);
            this.height = Math.abs(height);
            this.draw(this.startX, this.startY, this.width, this.height);
        }
        document.onmousemove = null;
    }
    protected touchMoveHandler(e: TouchEvent) {
        if (this.mouseDown && this.canDraw) {
            const touch = e.touches[0];
            const x = touch.clientX - this.offsetLeft;
            const y = touch.clientY - this.offsetTop;
            let width = x - this.startX;
            let height = y - this.startY;
            this.width = Math.abs(width);
            this.height = Math.abs(height);
            this.draw(this.startX, this.startY, this.width, this.height);
        }
        document.onmousemove = null;
    }

    protected handleGlobalMouseMove(e: MouseEvent) {
        if (this.mouseDown && this.canDraw) {
            this.width = Math.abs(e.pageX - this.startX - this.offsetLeft);
            this.height = Math.abs(e.offsetY - this.startY - this.offsetTop);
            this.draw(this.startX, this.startY, this.width, this.height)
        }
    }

    protected draw(x: number, y: number, w: number, h: number) {
        canvasState.bufferCtx.clearRect(0, 0, canvasState.bufferCanvas.width, canvasState.bufferCanvas.height);
        canvasState.bufferCtx.drawImage(this.tempCanvas, 0, 0);
        canvasState.bufferCtx.globalAlpha = settingState.globalAlpha;
        drawEllipse(canvasState.bufferCtx, x, y, w, h, canvasState.isFill, canvasState.isStroke);
    }
    static draw(ctx: CanvasRenderingContext2D, x: number, y: number, w: number,
                h: number, fillStyle: string, strokeStyle: string, strokeWidth: number,
                isFill: boolean, isStroke: boolean, globalAlpha: number, lineJoin: CanvasLineJoin) {
        ctx.strokeStyle = strokeStyle;
        ctx.fillStyle = fillStyle;
        ctx.lineWidth = strokeWidth;
        ctx.globalAlpha = globalAlpha;
        ctx.lineJoin = lineJoin;
        drawEllipse(ctx, x+ctx.canvas.width/2, y, w, h, isFill,isStroke)
    }
}

function drawEllipse(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, isFill: boolean, isStroke: boolean) {
    ctx.beginPath();
    ctx.ellipse(x, y, w, h, 0, 0, 2 * Math.PI);
    isFill && ctx.fill();
    isStroke && ctx.stroke();
    canvasState.draw();
}
