import Shape from "@/lib/tools/shapes/Shape";
import userState from "@/store/userState";
import canvasState from "@/store/canvasState";

export default class CircleTool extends Shape {

    radius: number = -1;

    mouseUpHandler(e: MouseEvent) {
        super.mouseUpHandler(e)
        this.sendSocketDraw();
    }

    touchEndHandler(e: TouchEvent) {
        super.touchEndHandler(e);
        this.sendSocketDraw();
    }

    touchMoveHandler(e: TouchEvent) {
        if (this.mouseDown) {
            const touch = e.touches[0];
            const x = touch.clientX - this.offsetLeft;
            const y = touch.clientY - this.offsetTop;
            let width = x - this.startX;
            let height = y - this.startY;
            this.radius = Math.sqrt(width ** 2 + height ** 2)
            this.draw(this.startX, this.startY, this.radius)
        }
        document.onmousemove = null;
    }

    sendSocketDraw() {
        if (this.startX !== -1 && this.startY !== -1 && this.radius !== -1) {
            this.socket.send(JSON.stringify({
                method: 'draw',
                id: this.id,
                username: userState.user?.username,
                figure: {
                    fillStyle: this.ctx.fillStyle,
                    strokeStyle: this.ctx.strokeStyle,
                    strokeWidth: this.ctx.lineWidth,
                    isFill: canvasState.isFill,
                    isStroke: canvasState.isStroke,
                    type: this.type,
                    x: this.startX - this.canvas.width/2,
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
            this.radius = Math.sqrt(width ** 2 + height ** 2)
            this.draw(this.startX, this.startY, this.radius)
        }
        document.onmousemove = null;
    }

    handleGlobalMouseMove(e: MouseEvent) {
        if (this.mouseDown) {
            let width;
            let height;
            if (e.pageY < this.offsetTop) {
                width = e.pageX - this.startX - this.offsetLeft;
                height = e.offsetY - this.startY - this.offsetTop;
            } else {
                width = e.pageX - this.startX - this.offsetLeft;
                height = e.offsetY - this.startY;
            }

            this.radius = Math.sqrt(width ** 2 + height ** 2)
            this.draw(this.startX, this.startY, this.radius)
        }
    }

    draw(x: number, y: number, r: number) {
        const img = new Image();
        img.src = this.saved;
        img.onload = () => {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.drawImage(img, canvasState.canvasX, canvasState.canvasY);
            drawCircle(this.ctx, x, y, r, canvasState.isFill, canvasState.isStroke);
        }
    }

    static draw(ctx: CanvasRenderingContext2D, x: number, y: number, r: number,
                fillStyle: string, strokeStyle: string, strokeWith: number, isFill: boolean, isStroke: boolean) {
        ctx.strokeStyle = strokeStyle;
        ctx.fillStyle = fillStyle;
        ctx.lineWidth = strokeWith;
        drawCircle(ctx, x+ctx.canvas.width/2, y, r, isFill, isStroke)
    }
}

function drawCircle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, isFill: boolean, isStroke: boolean) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2 * Math.PI)
    isFill && ctx.fill();
    isStroke && ctx.stroke();
    canvasState.clearOutside(ctx);
}