import Shape from "@/lib/tools/shapes/Shape";

export default class SquareTool extends Shape {

    mouseMoveHandler(e: MouseEvent) {
        if (this.mouseDown) {

            this.width = e.offsetX - this.startX;
            this.height = e.offsetY - this.startY;

            this.draw(this.startX, this.startY, this.width, this.height);
        }
        document.onmousemove = null;
    }
    handleGlobalMouseMove(e: MouseEvent) {
        if (this.mouseDown) {

            this.width = e.offsetX - this.startX - this.offsetLeft;
            if ((e.pageY < (this.offsetTop + this.canvas.height)) && e.pageY > this.offsetTop) {
                this.height = e.offsetY - this.startY;
            }
            else if(e.pageY < this.offsetTop) {
                this.height = e.pageY - this.startY - this.offsetTop;
            }
            else {
                this.width = e.pageX - this.startX - this.offsetLeft;
                this.height = e.pageY - this.startY - this.offsetTop;
            }

            this.draw(this.startX, this.startY, this.width, this.height);
        }
    }
    draw(x: number, y: number, w: number, h: number) {
        const img = new Image();
        img.src = this.saved;
        img.onload = () => {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.drawImage(img, 0, 0);
            this.ctx.beginPath();
            drawRect(this.ctx,x,y,w,h);
        }
    }

    static draw(ctx: CanvasRenderingContext2D, x: number, y: number, w: number,
                h: number, fillStyle: string, strokeStyle: string, strokeWidth: number) {
        ctx.strokeStyle = strokeStyle;
        ctx.fillStyle = fillStyle;
        ctx.lineWidth = strokeWidth;
        drawRect(ctx,x,y,w,h);
    }
}
function drawRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number,
                         h: number,) {
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.fill();
    ctx.stroke();
}