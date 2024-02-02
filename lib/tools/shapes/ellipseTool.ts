import Shape from "@/lib/tools/shapes/Shape";
import canvasState from "@/store/canvasState";
import settingState from "@/store/settingState";

export default class EllipseTool extends Shape {

    protected move(mouseX: number, mouseY: number) {
        if (this.mouseDown && this.canDraw) {
            const {scaledX, scaledY} = canvasState.getScaledPoint(mouseX, mouseY)
            let width = scaledX - this.startX;
            let height = scaledY - this.startY;
            this.width = Math.abs(width);
            this.height = Math.abs(height);
            this.draw(this.startX, this.startY, this.width, this.height);
        }
        document.onmousemove = null;
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
