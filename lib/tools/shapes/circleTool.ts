import Shape from "@/lib/tools/shapes/Shape";

export default class CircleTool extends Shape {

    radius: number = -1;
    mouseUpHandler(e: MouseEvent) {
        this.mouseDown = false;
        if(this.startX > -1 && this.startY > -1 && this.radius > -1) {
            this.socket.send(JSON.stringify({
                method: 'draw',
                id: this.id,
                figure: {
                    fillStyle: this.ctx.fillStyle,
                    strokeStyle: this.ctx.strokeStyle,
                    strokeWidth: this.ctx.lineWidth,
                    type: this.type,
                    x: this.startX,
                    y: this.startY,
                    r: this.radius,
                }
            }))
        }
    }
    mouseMoveHandler(e: MouseEvent) {
        if (this.mouseDown) {
            let width = e.offsetX - this.startX;
            let height = e.offsetY - this.startY;
            this.radius = Math.sqrt(width**2 + height**2)
            this.draw(this.startX, this.startY, this.radius)
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

            this.radius = Math.sqrt(width**2 + height**2)
            this.draw(this.startX, this.startY, this.radius)
        }
    }

    draw(x: number, y: number, r: number) {
        const img = new Image();
        img.src = this.saved;
        img.onload = () => {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.drawImage(img, 0, 0);
            drawCircle(this.ctx, x, y, r);
        }
    }
    static draw(ctx: CanvasRenderingContext2D, x: number, y: number, r: number,
                fillStyle: string, strokeStyle: string, strokeWith: number) {
        ctx.strokeStyle = strokeStyle;
        ctx.fillStyle = fillStyle;
        ctx.lineWidth = strokeWith;
        drawCircle(ctx, x, y, r)
    }
}

function drawCircle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2*Math.PI)
    ctx.fill();
    ctx.stroke();
}