import {drawStar, FiveStarTool} from "@/lib/tools/shapes/stars/fiveStarTool";
import canvasState from "@/store/canvasState";
import settingState from "@/store/settingState";

const angleCount = 4;
export class FourStarTool extends FiveStarTool {
    protected draw(x: number, y: number, w: number, h: number) {
        canvasState.bufferCtx.clearRect(0, 0, canvasState.bufferCanvas.width, canvasState.bufferCanvas.height);
        canvasState.bufferCtx.drawImage(this.tempCanvas, 0, 0);
        canvasState.bufferCtx.globalAlpha = settingState.globalAlpha;
        canvasState.bufferCtx.lineJoin = settingState.lineJoin;
        drawStar(canvasState.bufferCtx, x, y, w, h, angleCount, canvasState.isFill, canvasState.isStroke)
    }

    static draw(ctx: CanvasRenderingContext2D, x: number, y: number, w: number,
                h: number, fillStyle: string, strokeStyle: string,
                strokeWidth: number, isFill: boolean, isStroke: boolean, globalAlpha: number, lineJoin: CanvasLineJoin) {
        ctx.strokeStyle = strokeStyle;
        ctx.fillStyle = fillStyle;
        ctx.lineWidth = strokeWidth;
        ctx.globalAlpha = globalAlpha;
        ctx.lineJoin = lineJoin;
        drawStar(ctx, x + ctx.canvas.width/2, y, w, h, angleCount, isFill, isStroke)
    }
}

