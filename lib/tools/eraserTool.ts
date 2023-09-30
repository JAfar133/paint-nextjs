import PencilTool from "@/lib/tools/pencilTool";
import canvasState from "@/store/canvasState";

export default class EraserTool extends PencilTool {
    static eraser(ctx: CanvasRenderingContext2D, x: number, y: number, strokeStyle: string, strokeWith: number) {
        ctx.strokeStyle = "white";
        ctx.lineWidth = strokeWith;
        ctx.lineTo(x + ctx.canvas.width/2, y);
        ctx.stroke();
        canvasState.clearOutside(ctx);
    }
    draw(x: number, y: number) {
        this.ctx.strokeStyle = "white";
        this.ctx.lineTo(x, y);
        this.ctx.stroke();
        canvasState.clearOutside(this.ctx);
    }
}