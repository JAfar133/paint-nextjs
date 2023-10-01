import SquareTool from "@/lib/tools/shapes/squareTool";
import canvasState from "@/store/canvasState";

export class ShitTool extends SquareTool {
    draw(x: number, y: number, w: number, h: number) {
        const img = new Image();
        img.src = this.saved;
        img.onload = () => {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.drawImage(img, canvasState.canvasX, canvasState.canvasY);
            drawSheet(this.ctx, x, y, w, h, canvasState.isFill, canvasState.isStroke)
        }
    }

    static draw(ctx: CanvasRenderingContext2D, x: number, y: number, w: number,
                h: number, fillStyle: string, strokeStyle: string, strokeWidth: number, isFill: boolean, isStroke: boolean) {
        ctx.strokeStyle = strokeStyle;
        ctx.fillStyle = fillStyle;
        ctx.lineWidth = strokeWidth;
        drawSheet(ctx, x+ctx.canvas.width/2, y, w, h, isFill, isStroke)
    }
}

function drawSheet(ctx: CanvasRenderingContext2D, x0: number, y0: number, w: number, h: number, isFill: boolean, isStroke: boolean) {
    const numPoints = 5;
    const angleIncrement = (Math.PI * 2) / numPoints;

    const centerX = x0 + w / 2;
    const centerY = y0 + h / 2;
    const rotation = Math.PI / 10;

    ctx.beginPath();

    for (let i = 0; i < numPoints * 2; i++) {
        const radius = (i % 2 === 0) ? w / 2 : h / 2;
        const angle = angleIncrement * i + rotation;

        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;

        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }

    ctx.closePath();
    isFill && ctx.fill()
    isStroke && ctx.stroke();
    canvasState.clearOutside(ctx);
}