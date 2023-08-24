import Shape from "@/lib/tools/shapes/Shape";

export default class EllipseTool extends Shape {

    width: number = -1;
    height: number = -1;

    mouseMoveHandler(e: MouseEvent) {
        if (this.mouseDown) {
            let width = e.offsetX - this.startX;
            let height = e.offsetY - this.startY;
            this.width = Math.abs(width);
            this.height = Math.abs(height);
            this.draw(this.startX, this.startY, this.width, this.height);
        }
        document.onmousemove = null;
    }

    handleGlobalMouseMove(e: MouseEvent) {
        if (this.mouseDown) {
            let width;
            let height;

            if (e.pageY < this.offsetTop){
                width = e.pageX - this.startX - this.offsetLeft;
                height = e.offsetY - this.startY - this.offsetTop;
            } else {
                width = e.pageX - this.startX - this.offsetLeft;
                height = e.offsetY - this.startY;
            }
            this.width = Math.abs(width);
            this.height = Math.abs(height);
            this.draw(this.startX, this.startY, this.width, this.height)
        }
    }

    draw(x: number, y: number, w: number, h: number) {
        const img = new Image();
        img.src = this.saved;
        img.onload = () => {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.drawImage(img, 0, 0);
            drawEllipse(this.ctx, x, y, w, h);
        };
    }
    static draw(ctx: CanvasRenderingContext2D, x: number, y: number, w: number,
                h: number, fillStyle: string, strokeStyle: string, strokeWidth: number) {
        ctx.strokeStyle = strokeStyle;
        ctx.fillStyle = fillStyle;
        ctx.lineWidth = strokeWidth;
        drawEllipse(ctx, x, y, w, h)
    }
}

function drawEllipse(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    ctx.beginPath();
    ctx.ellipse(x, y, w, h, 0, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
}
