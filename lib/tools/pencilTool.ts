import Tool from "@/lib/tools/tool";
import userState from "@/store/userState";
import canvasState from "@/store/canvasState";
import settingState from "@/store/settingState";

export default class PencilTool extends Tool {

    mouseUpHandler(e: MouseEvent) {
        this.mouseDown = false;
        this.sendSocketFinish();

    }

    mouseDownHandler(e: MouseEvent) {
        if(this.canDraw && canvasState.bufferCtx){
            this.mouseDown = true;
            const {scaledX, scaledY} = this.getScaledPoint(e.offsetX, e.offsetY, canvasState.canvasX, canvasState.canvasY, canvasState.scale)
            canvasState.bufferCtx.beginPath();
            canvasState.bufferCtx.moveTo(scaledX, scaledY);
        }
    }

    mouseMoveHandler(e: MouseEvent) {
        if (this.mouseDown && this.canDraw) {
            const {scaledX, scaledY} = this.getScaledPoint(e.offsetX, e.offsetY, canvasState.canvasX, canvasState.canvasY, canvasState.scale)
            this.sendSocketDraw(scaledX, scaledY);
            this.draw(scaledX, scaledY);
        }
        document.onmousemove = null;
    }

    handleGlobalMouseMove(e: MouseEvent) {
        if (this.mouseDown && this.canDraw) {
            let x;
            let y;
            if ((e.pageY < (this.offsetTop + this.canvas.height)) && e.pageY > this.offsetTop) {
                x = e.offsetX - this.offsetLeft;
                y = e.offsetY;
            } else if (e.pageY < this.offsetTop) {
                x = e.offsetX - this.offsetLeft;
                y = e.offsetY - this.offsetTop;
            } else {
                x = e.offsetX - this.offsetLeft;
                y = e.offsetY + this.offsetTop;
            }
            this.sendSocketDraw(x, y);
            this.draw(x, y)
        }
    }

    touchMoveHandler(e: TouchEvent) {
        if (this.mouseDown && this.canDraw) {
            const touch = e.touches[0];
            const x = touch.clientX - this.offsetLeft;
            const y = touch.clientY - this.offsetTop;
            this.sendSocketDraw(x, y);
            this.draw(x, y);
        }
        e.preventDefault();
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


    touchStartHandler(e: TouchEvent) {
        const touch = e.touches[0];
        const x = touch.clientX - this.offsetLeft;
        const y = touch.clientY - this.offsetTop;
        this.mouseDown = true;
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        e.preventDefault();
    }

    touchEndHandler(e: TouchEvent) {
        this.mouseDown = false;
        this.sendSocketFinish();
        e.preventDefault();
    }


    static draw(ctx: CanvasRenderingContext2D, x: number, y: number, strokeStyle: string, strokeWidth: number, globalAlpha: number) {
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = strokeWidth;
        ctx.globalAlpha = globalAlpha;
        console.log("draw pencil")
        drawLine(ctx, x+ctx.canvas.width/2, y)
    }

    draw(x: number, y: number) {
        canvasState.bufferCtx.lineCap = "round";
        canvasState.bufferCtx.lineJoin = "round";
        canvasState.bufferCtx.globalAlpha = settingState.globalAlpha;
        drawLine(canvasState.bufferCtx, x, y);
    }
}

export function drawLine(ctx: CanvasRenderingContext2D, x: number, y: number) {
    ctx.lineTo(x, y);
    ctx.stroke();
    canvasState.draw();
}