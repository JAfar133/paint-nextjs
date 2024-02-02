import PencilTool from "@/lib/tools/pencilTool";
import canvasState from "@/store/canvasState";
import userState from "@/store/userState";
import settingState from "@/store/settingState";
import Tool from "@/lib/tools/tool";

export default class EraserTool extends Tool {
    static eraser(ctx: CanvasRenderingContext2D, x: number, y: number, strokeStyle: string, strokeWith: number) {
        ctx.strokeStyle = "white";
        ctx.lineWidth = strokeWith;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        drawLine(ctx, x + ctx.canvas.width/2, y);
    }
    up(mouseX: number, mouseY: number) {
        this.mouseDown = false;
        this.sendSocketFinish();
    }

    down(mouseX: number, mouseY: number) {
        if(this.canDraw && canvasState.bufferCtx){
            this.mouseDown = true;
            const {scaledX, scaledY} = canvasState.getScaledPoint(mouseX, mouseY)
            canvasState.bufferCtx.beginPath();
            canvasState.bufferCtx.moveTo(scaledX, scaledY);
            this.draw(scaledX, scaledY);
        }
    }

    move(mouseX: number, mouseY: number) {
        if (this.mouseDown && this.canDraw) {
            const {scaledX, scaledY} = canvasState.getScaledPoint(mouseX, mouseY)
            this.draw(scaledX, scaledY);
        }
        document.onmousemove = null;
    }

    sendSocketDraw(x: number, y: number) {
        this.socket.send(JSON.stringify({
            method: 'draw',
            id: this.id,
            username: userState.user?.username,
            figure: {
                strokeWidth: canvasState.bufferCtx.lineWidth,
                strokeStyle: canvasState.bufferCtx.strokeStyle,
                globalAlpha: settingState.globalAlpha,
                type: this.type,
                x: x - canvasState.bufferCanvas.width/2,
                y: y
            }
        }));
    }

    draw(x: number, y: number) {
        this.sendSocketDraw(x,y);
        canvasState.bufferCtx.lineCap = "round";
        canvasState.bufferCtx.lineJoin = "round";
        canvasState.bufferCtx.strokeStyle = "white";
        drawLine(canvasState.bufferCtx, x, y);
    }
}

function drawLine(ctx: CanvasRenderingContext2D, x: number, y: number) {
    ctx.lineTo(x, y);
    ctx.stroke();
    canvasState.draw();
}