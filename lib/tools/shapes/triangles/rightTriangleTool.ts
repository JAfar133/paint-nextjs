import Triangle from "@/lib/tools/shapes/triangles/triangle";
import canvasState from "@/store/canvasState";
import userState from "@/store/userState";
import settingState from "@/store/settingState";

export default class RightTriangleTool extends Triangle {

    draw(x: number, y: number, x1: number, y1: number) {
        canvasState.bufferCtx.clearRect(0, 0, canvasState.bufferCanvas.width, canvasState.bufferCanvas.height);
        canvasState.bufferCtx.drawImage(this.tempCanvas, 0, 0);
        canvasState.bufferCtx.globalAlpha = settingState.globalAlpha;
        drawTriangle(canvasState.bufferCtx, x, y, x1, y1, canvasState.isFill, canvasState.isStroke);
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
                    globalAlpha: settingState.globalAlpha,
                    lineJoin: settingState.lineJoin,
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
    static draw(ctx: CanvasRenderingContext2D, x: number, y: number, x1: number, y1: number,
                fillStyle: string, strokeStyle: string, strokeWith: number, isFill: boolean,
                isStroke: boolean, globalAlpha: number, lineJoin: CanvasLineJoin) {
        ctx.strokeStyle = strokeStyle;
        ctx.fillStyle = fillStyle;
        ctx.lineWidth = strokeWith;
        ctx.globalAlpha = globalAlpha;
        ctx.lineJoin = lineJoin;
        drawTriangle(ctx, x + ctx.canvas.width/2, y, x1 + ctx.canvas.width/2, y1, isFill, isStroke);
    }
}

function drawTriangle(ctx: CanvasRenderingContext2D, x: number, y: number, x1: number, y1: number, isFill: boolean, isStroke: boolean) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x1, y1);
    ctx.lineTo(2*x-x1, y1);
    ctx.closePath();
    isFill && ctx.fill();
    isStroke && ctx.stroke();
    canvasState.draw();
}