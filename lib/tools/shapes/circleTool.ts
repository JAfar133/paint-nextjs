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
        if (this.mouseDown && this.canDraw) {
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
                    fillStyle: canvasState.bufferCtx.fillStyle,
                    strokeStyle: canvasState.bufferCtx.strokeStyle,
                    strokeWidth: canvasState.bufferCtx.lineWidth,
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
        if (this.mouseDown && this.canDraw) {
            const {scaledX, scaledY} = this.getScaledPoint(e.offsetX, e.offsetY, canvasState.canvasX, canvasState.canvasY, canvasState.scale)
            let width = scaledX - this.startX;
            let height = scaledY - this.startY;
            this.radius = Math.sqrt(width ** 2 + height ** 2)
            this.draw(this.startX, this.startY, this.radius)
        }
        document.onmousemove = null;
    }

    handleGlobalMouseMove(e: MouseEvent) {
        if (this.mouseDown && this.canDraw) {
            const width = e.pageX - this.startX - this.offsetLeft;
            const height = e.offsetY - this.startY - this.offsetTop;

            this.radius = Math.sqrt(width ** 2 + height ** 2)
            this.draw(this.startX, this.startY, this.radius)
        }
    }

    draw(x: number, y: number, r: number) {
        const img = new Image();
        img.src = this.saved;
        img.onload = () => {
            canvasState.bufferCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            canvasState.bufferCtx.drawImage(img, 0, 0);
            drawCircle(canvasState.bufferCtx, x, y, r, canvasState.isFill, canvasState.isStroke);
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
    canvasState.draw();
}