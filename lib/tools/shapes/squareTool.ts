import Shape from "@/lib/tools/shapes/Shape";
import canvasState from "@/store/canvasState";
import settingState from "@/store/settingState";

export default class SquareTool extends Shape {
    protected move(mouseX: number, mouseY: number) {
        if (this.mouseDown && this.canDraw) {
            const {scaledX, scaledY} = canvasState.getScaledPoint(mouseX, mouseY)
            this.width = scaledX - this.startX;
            this.height = scaledY - this.startY;

            this.draw(this.startX, this.startY, this.width, this.height);
        }
        document.onmousemove = null;
    }

    protected draw(x: number, y: number, w: number, h: number) {
        canvasState.bufferCtx.clearRect(0, 0, canvasState.bufferCanvas.width, canvasState.bufferCanvas.height);
        canvasState.bufferCtx.drawImage(this.tempCanvas, 0, 0);
        canvasState.bufferCtx.globalAlpha = settingState.globalAlpha;
        drawRect(canvasState.bufferCtx, x, y, w, h, canvasState.isFill, canvasState.isStroke)
    }
    static draw(ctx: CanvasRenderingContext2D, x: number, y: number, w: number,
                h: number, fillStyle: string, strokeStyle: string,
                strokeWidth: number, isFill: boolean, isStroke: boolean, globalAlpha: number, lineJoin: CanvasLineJoin) {
        ctx.strokeStyle = strokeStyle;
        ctx.fillStyle = fillStyle;
        ctx.lineWidth = strokeWidth;
        ctx.globalAlpha = globalAlpha;
        ctx.lineJoin = lineJoin;
        drawRect(ctx, x + ctx.canvas.width/2, y, w, h, isFill, isStroke);
    }
}

function drawRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number,
                  h: number, isFill: boolean, isStroke: boolean) {
    ctx.beginPath();
    if(isFill && !isStroke) {
        w = w>=0 ? w+1 : w-1;
        h = h>=0 ? h+1 : h-1;
        if(ctx.lineWidth %2 !== 0){
            x = w>=0 ? x-0.5 : x+0.5;
            y = h>=0 ? y-0.5 : y+0.5;
        }
    }
    ctx.rect(x, y, w, h);
    isFill && ctx.fill();
    isStroke && ctx.stroke();
    canvasState.draw();
}