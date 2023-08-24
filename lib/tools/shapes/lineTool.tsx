import Shape from "@/lib/tools/shapes/Shape";

export default class LineTool extends Shape {

    mouseMoveHandler(e: MouseEvent) {
        if (this.mouseDown) {
            this.width = e.offsetX;
            this.height = e.offsetY;

            this.draw(this.startX, this.startY, this.width, this.height)
        }
        document.onmousemove = null;
    }
    handleGlobalMouseMove(e: MouseEvent) {
        if (this.mouseDown) {

            if ((e.pageY < (this.offsetTop + this.canvas.height)) && e.pageY > this.offsetTop) {
                this.width = e.offsetX - this.offsetLeft;
                this.height = e.offsetY;
            }
            else if(e.pageY < this.offsetTop) {
                this.width = e.offsetX - this.offsetLeft;
                this.height = e.offsetY - this.offsetTop;
            }
            else {
                this.width = e.pageX - this.offsetLeft;
                this.height = e.pageY - this.offsetTop;
            }

            this.draw(this.startX, this.startY, this.width, this.height)
        }
    }

    draw(x: number, y: number, w: number, h: number) {
        const img = new Image();
        img.src = this.saved;
        img.onload = () => {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.drawImage(img, 0, 0);
            drawLine(this.ctx, x, y, w, h)
        }
    }
    static draw(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, strokeStyle: string, strokeWidth: number) {
        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = strokeWidth;
        drawLine(ctx, x, y, w, h)
    }
}

function drawLine(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(w, h);
    ctx.stroke();
    ctx.beginPath()
}