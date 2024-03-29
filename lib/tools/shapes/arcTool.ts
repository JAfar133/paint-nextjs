import Tool from "@/lib/tools/tool";
import userState from "@/store/userState";
import canvasState from "@/store/canvasState";
import settingState from "@/store/settingState";
import ToolState from "@/store/toolState";

export interface Point {
    x: number;
    y: number;
}

export default class ArcTool extends Tool {
    private startPoint: Point | null = null;
    private controlPoint: Point | null = null;
    private endPoint: Point | null = null;

    protected down(mouseX: number, mouseY: number) {
        this.mouseDown = true;
        // canvasState.bufferCtx.beginPath();
        const {scaledX, scaledY} = canvasState.getScaledPoint(mouseX, mouseY)
        if(!this.startPoint){
            this.tempCtx.drawImage(canvasState.bufferCanvas, 0, 0);
            this.startPoint = {x: scaledX, y: scaledY}
        } else if(!this.endPoint){
            this.endPoint = {x: scaledX, y: scaledY}
        }
    }
    protected move(mouseX: number, mouseY: number) {
        const {scaledX, scaledY} = canvasState.getScaledPoint(mouseX, mouseY)
        if(this.startPoint && !this.controlPoint ){
            canvasState.bufferCtx.clearRect(0, 0, canvasState.bufferCanvas.width, canvasState.bufferCanvas.height);
            canvasState.bufferCtx.drawImage(this.tempCanvas, 0, 0);
            canvasState.bufferCtx.globalAlpha = settingState.globalAlpha;
            drawLine(canvasState.bufferCtx, this.startPoint.x, this.startPoint.y, scaledX, scaledY)
        }else if(this.endPoint && this.startPoint && this.controlPoint){
            this.endPoint = {x: scaledX,y: scaledY};
            canvasState.bufferCtx.clearRect(0, 0, canvasState.bufferCanvas.width, canvasState.bufferCanvas.height);
            canvasState.bufferCtx.drawImage(this.tempCanvas, 0, 0);
            canvasState.bufferCtx.globalAlpha = settingState.globalAlpha;
            drawCurve(canvasState.bufferCtx, this.startPoint, this.controlPoint, this.endPoint)
        }
        document.onmousemove = null;
    }
    protected up(mouseX: number, mouseY: number) {
        const {scaledX, scaledY} = canvasState.getScaledPoint(mouseX, mouseY)
        if(!this.controlPoint){
            this.controlPoint = {x: scaledX, y: scaledY};
        }
        else {
            this.sendWebSocket();
            this.tempCtx.clearRect(0,0, this.tempCanvas.width, this.tempCanvas.height);
        }
        this.mouseDown = false;
    }
    protected sendWebSocket(){
        if(this.startPoint && this.controlPoint && this.endPoint){
            this.startPoint.x = this.startPoint.x - canvasState.bufferCanvas.width/2
            this.controlPoint.x = this.controlPoint.x - canvasState.bufferCanvas.width/2
            this.endPoint.x = this.endPoint.x - canvasState.bufferCanvas.width/2
            this.socket.send(JSON.stringify({
                method: 'draw',
                id: this.id,
                username: userState.user?.username,
                figure: {
                    strokeStyle: canvasState.bufferCtx.strokeStyle,
                    strokeWidth: canvasState.bufferCtx.lineWidth,
                    globalAlpha: settingState.globalAlpha,
                    lineCap: settingState.lineCap,
                    type: this.type,
                    startPoint: this.startPoint,
                    controlPoint: this.controlPoint,
                    endPoint: this.endPoint,
                }
            }));
            this.startPoint = null;
            this.endPoint = null;
            this.controlPoint = null;
        }
    }
    static draw(ctx: CanvasRenderingContext2D, startPoint: Point, endPoint: Point, controlPoint: Point,
                strokeStyle: string, strokeWith: number, globalAlpha: number, lineCap: CanvasLineCap) {
        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = strokeWith;
        ctx.lineCap = lineCap;
        ctx.globalAlpha = globalAlpha;
        startPoint.x = startPoint.x + canvasState.bufferCanvas.width/2
        controlPoint.x = controlPoint.x + canvasState.bufferCanvas.width/2
        endPoint.x = endPoint.x + canvasState.bufferCanvas.width/2
        drawCurve(ctx, startPoint, controlPoint,endPoint)
    }

}
function drawCurve(ctx: CanvasRenderingContext2D, startPoint: Point, endPoint: Point, controlPoint: Point){
    ctx.beginPath();
    ctx.moveTo(startPoint.x, startPoint.y);
    ctx.bezierCurveTo(
        controlPoint.x, controlPoint.y,
        controlPoint.x, controlPoint.y,
        endPoint.x, endPoint.y
    );
    ctx.stroke();
    canvasState.draw();
}
function drawLine(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(w, h);
    ctx.stroke();
    ctx.beginPath();
    canvasState.draw();
}