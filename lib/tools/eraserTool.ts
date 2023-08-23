import PencilTool from "@/lib/tools/pencilTool";

export default class EraserTool extends PencilTool {
    static eraser(ctx: CanvasRenderingContext2D, x: number, y: number, strokeStyle: string, strokeWith: number) {
        ctx.strokeStyle = "white";
        ctx.lineWidth = strokeWith;
        ctx.lineTo(x, y);
        ctx.stroke();
    }
    draw(x: number, y: number) {
        this.ctx.strokeStyle = "white";
        this.ctx.lineTo(x, y);
        this.ctx.stroke();
    }
}