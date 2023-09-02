import Triangle from "@/lib/tools/shapes/triangles/triangle";
import canvasState from "@/store/canvasState";

export default class StraightTriangleTool extends Triangle {
    draw(x: number, y: number, x1: number, y1: number) {

        const img = new Image();
        img.src = this.saved;
        img.onload = () => {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.drawImage(img, 0, 0);
            drawTriangle(this.ctx, x, y, x1, y1, canvasState.isFill, canvasState.isStroke);
        }
    }
    static draw(ctx: CanvasRenderingContext2D, x: number, y: number, x1: number, y1: number,
                fillStyle: string, strokeStyle: string, strokeWith: number, isFill: boolean, isStroke: boolean) {
        ctx.strokeStyle = strokeStyle;
        ctx.fillStyle = fillStyle;
        ctx.lineWidth = strokeWith;
        drawTriangle(ctx, x, y, x1, y1, isFill, isStroke)
    }
}

function drawTriangle(ctx: CanvasRenderingContext2D, x: number, y: number, x1: number, y1: number, isFill: boolean, isStroke: boolean) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x1, y1);
    ctx.lineTo(x, y1);
    ctx.closePath();
    isFill && ctx.fill();
    isStroke && ctx.stroke();
}