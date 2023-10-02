import Shape from "@/lib/tools/shapes/Shape";
import canvasState from "@/store/canvasState";

export default class EllipseTool extends Shape {

    width: number = -1;
    height: number = -1;

    mouseMoveHandler(e: MouseEvent) {
        if (this.mouseDown && this.canDraw) {
            let width = e.offsetX - this.startX;
            let height = e.offsetY - this.startY;
            this.width = Math.abs(width);
            this.height = Math.abs(height);
            this.draw(this.startX, this.startY, this.width, this.height);
        }
        document.onmousemove = null;
    }
    touchMoveHandler(e: TouchEvent) {
        if (this.mouseDown && this.canDraw) {
            const touch = e.touches[0];
            const x = touch.clientX - this.offsetLeft;
            const y = touch.clientY - this.offsetTop;
            let width = x - this.startX;
            let height = y - this.startY;
            this.width = Math.abs(width);
            this.height = Math.abs(height);
            this.draw(this.startX, this.startY, this.width, this.height);
        }
        document.onmousemove = null;
    }

    handleGlobalMouseMove(e: MouseEvent) {
        if (this.mouseDown && this.canDraw) {
            this.width = Math.abs(e.pageX - this.startX - this.offsetLeft);
            this.height = Math.abs(e.offsetY - this.startY - this.offsetTop);
            this.draw(this.startX, this.startY, this.width, this.height)
        }
    }

    draw(x: number, y: number, w: number, h: number) {
        const img = new Image();
        img.src = this.saved;
        img.onload = () => {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.drawImage(img, canvasState.canvasX, canvasState.canvasY);
            drawEllipse(this.ctx, x, y, w, h, canvasState.isFill, canvasState.isStroke);
        };
    }
    static draw(ctx: CanvasRenderingContext2D, x: number, y: number, w: number,
                h: number, fillStyle: string, strokeStyle: string, strokeWidth: number,
                isFill: boolean, isStroke: boolean) {
        ctx.strokeStyle = strokeStyle;
        ctx.fillStyle = fillStyle;
        ctx.lineWidth = strokeWidth;
        drawEllipse(ctx, x+ctx.canvas.width/2, y, w, h, isFill,isStroke)
    }
}

function drawEllipse(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, isFill: boolean, isStroke: boolean) {
    ctx.beginPath();
    ctx.ellipse(x, y, w, h, 0, 0, 2 * Math.PI);
    isFill && ctx.fill();
    isStroke && ctx.stroke();
    canvasState.clearOutside(ctx);
}
