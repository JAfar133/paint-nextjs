import Shape from "@/lib/tools/shapes/Shape";
import userState from "@/store/userState";
import canvasState from "@/store/canvasState";
import settingState from "@/store/settingState";

export default class CircleTool extends Shape {

    private radius: number = -1;

    protected touchMoveHandler(e: TouchEvent) {
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

    protected sendSocketDraw() {
        if (this.startX !== -1 && this.startY !== -1 && this.radius !== -1) {
            this.socket.send(JSON.stringify({
                method: 'draw',
                id: this.id,
                username: userState.user?.username,
                figure: {
                    fillStyle: canvasState.bufferCtx.fillStyle,
                    strokeStyle: canvasState.bufferCtx.strokeStyle,
                    strokeWidth: canvasState.bufferCtx.lineWidth,
                    globalAlpha: settingState.globalAlpha,
                    isFill: canvasState.isFill,
                    isStroke: canvasState.isStroke,
                    lineJoin: settingState.lineJoin,
                    type: this.type,
                    x: this.startX - canvasState.bufferCanvas.width/2,
                    y: this.startY,
                    r: this.radius,
                }
            }))
        }
    }

    protected mouseMoveHandler(e: MouseEvent) {
        if (this.mouseDown && this.canDraw) {
            const {scaledX, scaledY} = this.getScaledPoint(e.offsetX, e.offsetY, canvasState.canvasX, canvasState.canvasY, canvasState.scale)
            let width = scaledX - this.startX;
            let height = scaledY - this.startY;
            this.radius = Math.sqrt(width ** 2 + height ** 2)
            this.draw(this.startX, this.startY, this.radius)
        }
        document.onmousemove = null;
    }

    protected handleGlobalMouseMove(e: MouseEvent) {
        if (this.mouseDown && this.canDraw) {
            const width = e.pageX - this.startX - this.offsetLeft;
            const height = e.offsetY - this.startY - this.offsetTop;

            this.radius = Math.sqrt(width ** 2 + height ** 2)
            this.draw(this.startX, this.startY, this.radius)
        }
    }

    protected draw(x: number, y: number, r: number) {
        canvasState.bufferCtx.clearRect(0, 0, canvasState.bufferCanvas.width, canvasState.bufferCanvas.height);
        canvasState.bufferCtx.drawImage(this.tempCanvas, 0, 0);
        canvasState.bufferCtx.globalAlpha = settingState.globalAlpha;
        drawCircle(canvasState.bufferCtx, x, y, r, canvasState.isFill, canvasState.isStroke);
        canvasState.draw();
    }

    static draw(ctx: CanvasRenderingContext2D, x: number, y: number, r: number,
                fillStyle: string, strokeStyle: string, strokeWith: number,
                isFill: boolean, isStroke: boolean, globalAlpha: number, lineJoin: CanvasLineJoin) {
        ctx.strokeStyle = strokeStyle;
        ctx.fillStyle = fillStyle;
        ctx.lineWidth = strokeWith;
        ctx.globalAlpha = globalAlpha;
        ctx.lineJoin = lineJoin;
        drawCircle(ctx, x + canvasState.bufferCanvas.width/2, y, r, isFill, isStroke);
        canvasState.draw();
    }
}

function drawCircle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, isFill: boolean, isStroke: boolean) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2 * Math.PI)
    isFill && ctx.fill();
    isStroke && ctx.stroke();
}