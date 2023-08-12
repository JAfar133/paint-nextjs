import SquareTool from "@/lib/tools/shapes/squareTool";

export class ShitTool extends SquareTool {
    draw(x: number, y: number, w: number, h: number) {
        const img = new Image();
        img.src = this.saved;
        img.onload = () => {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.drawImage(img, 0, 0);
            drawSheet(this.ctx, x, y, w, h)
        }
    }

    static draw(ctx: CanvasRenderingContext2D, x: number, y: number, w: number,
                h: number, fillStyle: string, strokeStyle: string, strokeWidth: number) {
        ctx.strokeStyle = strokeStyle;
        ctx.fillStyle = fillStyle;
        ctx.lineWidth = strokeWidth;
        drawSheet(ctx, x, y, w, h)
    }
}

function drawSheet(ctx: CanvasRenderingContext2D, x0: number, y0: number, w: number, h: number) {
    const numPoints = 5;
    const angleIncrement = (Math.PI * 2) / numPoints;

    const centerX = x0 + w / 2;
    const centerY = y0 + h / 2;
    const rotation = Math.PI / 10; // Угол наклона звезды

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
    ctx.fill()
    ctx.stroke();
}