import {drawStar, FiveStarTool} from "@/lib/tools/shapes/stars/fiveStarTool";
import canvasState from "@/store/canvasState";

const angleCount = 4;
export class FourStarTool extends FiveStarTool {
    draw(x: number, y: number, w: number, h: number) {
        const img = new Image();
        img.src = this.saved;
        img.onload = () => {
            canvasState.bufferCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            canvasState.bufferCtx.drawImage(img, 0, 0);
            drawStar(canvasState.bufferCtx, x, y, w, h, angleCount, canvasState.isFill, canvasState.isStroke)
        }
    }

    static draw(ctx: CanvasRenderingContext2D, x: number, y: number, w: number,
                h: number, fillStyle: string, strokeStyle: string, strokeWidth: number, isFill: boolean, isStroke: boolean) {
        ctx.strokeStyle = strokeStyle;
        ctx.fillStyle = fillStyle;
        ctx.lineWidth = strokeWidth;
        drawStar(ctx, x + ctx.canvas.width/2, y, w, h, angleCount, isFill, isStroke)
    }
}

