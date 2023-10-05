import LineTool from "@/lib/tools/shapes/lineTool";
import canvasState from "@/store/canvasState";
import settingState from "@/store/settingState";


export default class ArrowTool extends LineTool {
    draw(x: number, y: number, w: number, h: number) {
        canvasState.bufferCtx.clearRect(0, 0, canvasState.bufferCanvas.width, canvasState.bufferCanvas.height);
        canvasState.bufferCtx.drawImage(this.tempCanvas, 0, 0);
        canvasState.bufferCtx.fillStyle = canvasState.bufferCtx.strokeStyle;
        canvasState.bufferCtx.globalAlpha = settingState.globalAlpha;
        drawArrow(canvasState.bufferCtx, x, y, w, h)
    }
    static draw(ctx: CanvasRenderingContext2D, x: number, y: number, w: number,
                h: number, strokeStyle: string, strokeWidth: number, globalAlpha: number, lineCap: CanvasLineCap) {
        ctx.lineCap = lineCap;
        ctx.strokeStyle = strokeStyle;
        ctx.fillStyle = ctx.strokeStyle;
        ctx.lineWidth = strokeWidth;
        ctx.globalAlpha = globalAlpha;
        drawArrow(ctx, x+ctx.canvas.width/2, y, w+ctx.canvas.width/2, h)
    }
}

function drawArrow(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(w, h);
    ctx.stroke();

    const arrowHeadSize = 10;
    const angle = Math.atan2(h - y, w - x);
    const x2 = w - arrowHeadSize * Math.cos(angle - Math.PI / 6);
    const y2 = h - arrowHeadSize * Math.sin(angle - Math.PI / 6);
    const x3 = w - arrowHeadSize * Math.cos(angle + Math.PI / 6);
    const y3 = h - arrowHeadSize * Math.sin(angle + Math.PI / 6);

    ctx.beginPath();
    ctx.moveTo(w, h);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x3, y3);
    ctx.closePath();
    ctx.fill()
    ctx.stroke();
    canvasState.draw();
}