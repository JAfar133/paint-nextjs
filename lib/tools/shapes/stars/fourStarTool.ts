import {drawStar, FiveStarTool} from "@/lib/tools/shapes/stars/fiveStarTool";
import canvasState from "@/store/canvasState";

const angleCount = 4;
export class FourStarTool extends FiveStarTool {
    draw(x: number, y: number, w: number, h: number) {
        const img = new Image();
        img.src = this.saved;
        img.onload = () => {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.drawImage(img, 0, 0);
            drawStar(this.ctx, x, y, w, h, angleCount, canvasState.isFill, canvasState.isStroke)
        }
    }

    static draw(ctx: CanvasRenderingContext2D, x: number, y: number, w: number,
                h: number, fillStyle: string, strokeStyle: string, strokeWidth: number, isFill: boolean, isStroke: boolean) {
        ctx.strokeStyle = strokeStyle;
        ctx.fillStyle = fillStyle;
        ctx.lineWidth = strokeWidth;
        drawStar(ctx, x, y, w, h, angleCount, isFill, isStroke)
    }
}

