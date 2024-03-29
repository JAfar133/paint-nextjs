import Shape from "@/lib/tools/shapes/Shape";
import userState from "@/store/userState";
import canvasState from "@/store/canvasState";
import settingState from "@/store/settingState";

export default class LineTool extends Shape {

    protected move(mouseX: number, mouseY: number) {
        if (this.mouseDown && this.canDraw) {
            const {scaledX, scaledY} = canvasState.getScaledPoint(mouseX, mouseY)
            this.width = scaledX;
            this.height = scaledY;

            this.draw(this.startX, this.startY, this.width, this.height)
        }
        document.onmousemove = null;
    }
    protected sendSocketDraw(){
        if(this.startX > -1 && this.startY > -1 && this.width !== -1){
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
                    lineCap: settingState.lineCap,
                    isStroke: canvasState.isStroke,
                    type: this.type,
                    x: this.startX - canvasState.bufferCanvas.width/2,
                    y: this.startY,
                    w: this.width - canvasState.bufferCanvas.width/2,
                    h: this.height,
                }}))
        }
    }
    protected draw(x: number, y: number, w: number, h: number) {
        canvasState.bufferCtx.clearRect(0, 0, canvasState.bufferCanvas.width, canvasState.bufferCanvas.height);
        canvasState.bufferCtx.drawImage(this.tempCanvas, 0, 0);
        canvasState.bufferCtx.globalAlpha = settingState.globalAlpha;
        drawLine(canvasState.bufferCtx, x, y, w, h)
    }
    static draw(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number,
                strokeStyle: string, strokeWidth: number, globalAlpha: number, lineCap: CanvasLineCap) {
        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = strokeWidth;
        ctx.globalAlpha = globalAlpha;
        ctx.lineCap = lineCap;
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