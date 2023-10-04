import Shape from "@/lib/tools/shapes/Shape";
import userState from "@/store/userState";
import canvasState from "@/store/canvasState";

export default class LineTool extends Shape {

    mouseMoveHandler(e: MouseEvent) {
        if (this.mouseDown && this.canDraw) {
            const {scaledX, scaledY} = this.getScaledPoint(e.offsetX, e.offsetY, canvasState.canvasX, canvasState.canvasY, canvasState.scale)
            this.width = scaledX;
            this.height = scaledY;

            this.draw(this.startX, this.startY, this.width, this.height)
        }
        document.onmousemove = null;
    }
    touchMoveHandler(e: TouchEvent) {
        if (this.mouseDown && this.canDraw) {
            const touch = e.touches[0];
            this.width = touch.clientX - this.offsetLeft;
            this.height = touch.clientY - this.offsetTop;
            this.draw(this.startX, this.startY, this.width, this.height)
        }
        document.ontouchmove = null;
    }

    handleGlobalMouseMove(e: MouseEvent) {
        if (this.mouseDown && this.canDraw) {

            this.width = e.pageX - this.offsetLeft;
            this.height = e.pageY - this.offsetTop;

            this.draw(this.startX, this.startY, this.width, this.height)
        }
    }
    sendSocketDraw(){
        if(this.startX > -1 && this.startY > -1 && this.width !== -1){
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
                    x: this.startX - canvasState.bufferCanvas.width/2,
                    y: this.startY,
                    w: this.width - canvasState.bufferCanvas.width/2,
                    h: this.height,
                }}))
        }
    }
    draw(x: number, y: number, w: number, h: number) {
        const img = new Image();
        img.src = this.saved;
        img.onload = () => {
            canvasState.bufferCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            canvasState.bufferCtx.drawImage(img, 0, 0);
            drawLine(canvasState.bufferCtx, x, y, w, h)
        }
    }
    static draw(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, strokeStyle: string, strokeWidth: number) {
        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = strokeWidth;
        drawLine(ctx, x+ctx.canvas.width/2, y, w + ctx.canvas.width/2, h)
    }
}

function drawLine(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(w, h);
    ctx.stroke();
    ctx.beginPath();
    canvasState.draw();
}