import LineTool from "@/lib/tools/shapes/lineTool";


export default class ArrowTool extends LineTool {
    draw(x: number, y: number, w: number, h: number) {
        const img = new Image();
        img.src = this.saved;
        img.onload = () => {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.drawImage(img, 0, 0);
            this.ctx.fillStyle = this.ctx.strokeStyle;
            drawArrow(this.ctx, x, y, w, h)

        }
    }
    static draw(ctx: CanvasRenderingContext2D, x: number, y: number, w: number,
                h: number, strokeStyle: string, strokeWidth: number) {
        ctx.strokeStyle = strokeStyle;
        ctx.fillStyle = ctx.strokeStyle;
        ctx.lineWidth = strokeWidth;
        drawArrow(ctx, x, y, w, h)
    }
}

function drawArrow(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(w, h);
    ctx.stroke();

    const arrowHeadSize = 10;
    const angle = Math.atan2(h - y, w - x);
    const x2 = w - arrowHeadSize * Math.cos(angle - Math.PI / 6);
    const y2 = h - arrowHeadSize * Math.sin(angle - Math.PI / 6);
    const x3 = w - arrowHeadSize * Math.cos(angle + Math.PI / 6);
    const y3 = h - arrowHeadSize * Math.sin(angle + Math.PI / 6);

    ctx.beginPath();
    ctx.moveTo(w, h);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x3, y3);
    ctx.closePath();
    ctx.fill()
    ctx.stroke();
}