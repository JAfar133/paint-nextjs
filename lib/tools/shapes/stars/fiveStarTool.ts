import SquareTool from "@/lib/tools/shapes/squareTool";

const angleCount = 5;
export class FiveStarTool extends SquareTool {


    draw(x: number, y: number, w: number, h: number) {
        const img = new Image();
        img.src = this.saved;
        img.onload = () => {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.drawImage(img, 0, 0);
            drawStar(this.ctx, x, y, w, h, angleCount)
        }
    }

    static draw(ctx: CanvasRenderingContext2D, x: number, y: number, w: number,
                h: number, fillStyle: string, strokeStyle: string, strokeWidth: number) {
        ctx.strokeStyle = strokeStyle;
        ctx.fillStyle = fillStyle;
        ctx.lineWidth = strokeWidth;
        drawStar(ctx, x, y, w, h, angleCount)
    }
}

export function drawStar(ctx: CanvasRenderingContext2D, x0: number, y0: number, w: number, h: number, angleCount: number) {
    ctx.beginPath();
    const xCenter = x0 + w / 2;
    const yCenter = y0 + h / 2;
    const outerRadius = Math.min(w, h) / 2;
    const innerRadius = outerRadius * 0.382; // Подобранный коэффициент для внутреннего радиуса

    for (let i = 0; i < angleCount; i++) {
        const angle = Math.PI * 2 * i / angleCount - Math.PI / 2; // Один угол пропущен

        const outerX = xCenter + outerRadius * Math.cos(angle);
        const outerY = yCenter + outerRadius * Math.sin(angle);

        const innerAngle = angle + Math.PI / angleCount; // Угол для внутренней точки
        const innerX = xCenter + innerRadius * Math.cos(innerAngle);
        const innerY = yCenter + innerRadius * Math.sin(innerAngle);

        if (i === 0) {
            ctx.moveTo(outerX, outerY);
        } else {
            ctx.lineTo(outerX, outerY);
        }

        ctx.lineTo(innerX, innerY); // Соединяем с внутренней точкой
    }

    ctx.closePath();
    ctx.fill()
    ctx.stroke();
}