import PencilTool, {drawLine} from "@/lib/tools/pencilTool";
import canvasState from "@/store/canvasState";

export default class EraserTool extends PencilTool {
    static eraser(ctx: CanvasRenderingContext2D, x: number, y: number, strokeStyle: string, strokeWith: number) {
        ctx.strokeStyle = "white";
        ctx.lineWidth = strokeWith;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        drawLine(ctx, x + ctx.canvas.width/2, y);
    }
    draw(x: number, y: number) {
        canvasState.bufferCtx.lineCap = "round";
        canvasState.bufferCtx.lineJoin = "round";
        canvasState.bufferCtx.strokeStyle = "white";
        drawLine(canvasState.bufferCtx, x, y);
    }
}